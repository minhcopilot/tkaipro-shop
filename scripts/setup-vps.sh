#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# setup-vps.sh — dựng shop TKAIPro trên VPS đang chạy sẵn cursor-pro-shop.
#
# Chạy MỘT LẦN, trên server, sau khi đã có tên miền trỏ về IP VPS.
#
#   DOMAIN=tkaipro.shop bash /app/tkaipro-shop/scripts/setup-vps.sh
#
# Việc script làm:
#   1. Tạo database + user Postgres riêng trong container `postgres` dùng chung
#   2. Cài rate-limit zone riêng cho shop này vào nginx
#   3. Sinh nginx server block cho domain, bật site, reload nginx
#   4. Xin chứng chỉ SSL bằng certbot
#   5. Cài cron nhắc hạn subscription
#
# An toàn khi chạy lại: mọi bước đều kiểm tra tồn tại trước khi tạo. Script
# KHÔNG đụng tới cấu hình của cursor-pro-shop / figma-shop.
#
# Bỏ qua bước SSL (khi DNS chưa kịp trỏ): SKIP_CERTBOT=1
# ----------------------------------------------------------------------------
set -euo pipefail

DOMAIN="${DOMAIN:-}"
APP_DIR="${APP_DIR:-/app/tkaipro-shop}"
APP_PORT="${APP_PORT:-3003}"
PG_CONTAINER="${PG_CONTAINER:-postgres}"
DB_NAME="${DB_NAME:-tkaipro}"
DB_USER="${DB_USER:-tkaipro_app}"
SKIP_CERTBOT="${SKIP_CERTBOT:-0}"

if [[ -z "$DOMAIN" ]]; then
  echo "ERROR: thiếu DOMAIN. Ví dụ: DOMAIN=tkaipro.shop bash $0"
  exit 1
fi

echo "=============================================="
echo " Domain    : ${DOMAIN}"
echo " App dir   : ${APP_DIR}"
echo " Cổng nội bộ: 127.0.0.1:${APP_PORT}"
echo " Database  : ${DB_NAME} (user ${DB_USER})"
echo "=============================================="
echo

# ---------------------------------------------------------------- 1. Database
echo "[1/5] Database"

if ! docker ps --format '{{.Names}}' | grep -qx "${PG_CONTAINER}"; then
  echo "  LỖI: không thấy container Postgres tên '${PG_CONTAINER}' đang chạy."
  echo "  Đang chạy: $(docker ps --format '{{.Names}}' | tr '\n' ' ')"
  exit 1
fi

psql_root() { docker exec -i "${PG_CONTAINER}" psql -U postgres -tAc "$1"; }

ENV_FILE="${APP_DIR}/.env"
DB_EXISTS="$(psql_root "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'")"
ENV_HAS_URL=0
if [[ -f "$ENV_FILE" ]] && grep -qE '^DATABASE_URL="postgres://[^:]+:[^@"]+@' "$ENV_FILE"; then
  ENV_HAS_URL=1
fi

if [[ "$DB_EXISTS" == "1" && "$ENV_HAS_URL" == "1" ]]; then
  echo "  database ${DB_NAME} và DATABASE_URL trong .env đã có, bỏ qua"
  DB_PASSWORD=""
else
  # Mật khẩu chỉ tồn tại trong lần chạy này. Ghi thẳng vào .env chứ không chỉ in
  # ra màn hình: nếu script chết ở bước sau (certbot chẳng hạn) mà mật khẩu mới
  # chỉ nằm trên stdout thì coi như mất, phải reset lại từ đầu.
  DB_PASSWORD="$(openssl rand -hex 24)"

  if [[ "$DB_EXISTS" == "1" ]]; then
    psql_root "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}'" >/dev/null
    echo "  database ${DB_NAME} đã có — đã đặt lại mật khẩu cho ${DB_USER}"
  else
    psql_root "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}'" >/dev/null
    psql_root "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}" >/dev/null
    echo "  đã tạo database ${DB_NAME} + user ${DB_USER}"
  fi

  # Cần cho Postgres 15+: schema public mặc định không cho user thường tạo bảng.
  docker exec -i "${PG_CONTAINER}" psql -U postgres -d "${DB_NAME}" \
    -c "GRANT ALL ON SCHEMA public TO ${DB_USER}" >/dev/null

  DB_URL="postgres://${DB_USER}:${DB_PASSWORD}@${PG_CONTAINER}:5432/${DB_NAME}"
  [[ -f "$ENV_FILE" ]] || cp "${APP_DIR}/.env.example" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  if grep -q '^DATABASE_URL=' "$ENV_FILE"; then
    sed -i "s#^DATABASE_URL=.*#DATABASE_URL=\"${DB_URL}\"#" "$ENV_FILE"
  else
    echo "DATABASE_URL=\"${DB_URL}\"" >> "$ENV_FILE"
  fi
  echo "  đã ghi DATABASE_URL vào ${ENV_FILE}"
fi

# ------------------------------------------------------- 2. nginx rate limit
echo "[2/5] nginx rate-limit zone"

SEC_SRC="${APP_DIR}/deploy/nginx-tkaipro-shop-security.conf"
SEC_DST="/etc/nginx/conf.d/tkaipro-shop-security.conf"
if [[ -f "$SEC_DST" ]]; then
  echo "  ${SEC_DST} đã có, bỏ qua"
else
  cp "$SEC_SRC" "$SEC_DST"
  echo "  đã cài ${SEC_DST}"
fi

# ------------------------------------------------------------- 3. nginx site
echo "[3/5] nginx site"

SITE_AVAIL="/etc/nginx/sites-available/${DOMAIN}"
SITE_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

if [[ -f "$SITE_AVAIL" ]]; then
  echo "  ${SITE_AVAIL} đã có, bỏ qua (sửa tay nếu cần)"
else
  sed -e "s/__DOMAIN__/${DOMAIN}/g" -e "s/__PORT__/${APP_PORT}/g" \
    "${APP_DIR}/deploy/nginx-site.conf.template" > "$SITE_AVAIL"
  echo "  đã tạo ${SITE_AVAIL}"
fi

[[ -L "$SITE_ENABLED" ]] || ln -s "$SITE_AVAIL" "$SITE_ENABLED"

# `nginx -t` trước khi reload: cấu hình sai mà reload là chết cả shop Cursor.
if ! nginx -t; then
  echo "  LỖI: nginx -t thất bại. KHÔNG reload. Sửa cấu hình rồi chạy lại."
  exit 1
fi
systemctl reload nginx
echo "  nginx đã reload"

# ------------------------------------------------------------------- 4. SSL
echo "[4/5] SSL"

if [[ "$SKIP_CERTBOT" == "1" ]]; then
  echo "  bỏ qua theo yêu cầu (SKIP_CERTBOT=1)"
elif certbot certificates 2>/dev/null | grep -q "Certificate Name: ${DOMAIN}$"; then
  echo "  đã có chứng chỉ cho ${DOMAIN}, bỏ qua"
else
  RESOLVED="$(getent hosts "${DOMAIN}" | awk '{print $1}' | head -1 || true)"
  SERVER_IP="$(curl -s --max-time 10 https://api.ipify.org || true)"

  # Domain sau Cloudflare proxy phân giải ra IP Cloudflare (v4 HOẶC v6), không
  # phải IP VPS — bình thường, không phải cấu hình sai. Nhận diện qua header
  # `server: cloudflare` thay vì so khớp dải IP, vì cách đó đúng cho cả v4 lẫn
  # v6 và không phải tải danh sách dải về.
  BEHIND_CDN=0
  if curl -sI --max-time 10 "http://${DOMAIN}" 2>/dev/null \
      | grep -qi '^server:.*cloudflare'; then
    BEHIND_CDN=1
  fi

  if [[ -z "$RESOLVED" ]]; then
    echo "  CẢNH BÁO: ${DOMAIN} chưa phân giải được. Certbot sẽ fail."
    echo "  Đợi DNS lan rồi chạy lại, hoặc dùng SKIP_CERTBOT=1."
    exit 1
  elif [[ "$BEHIND_CDN" == "1" ]]; then
    echo "  ${DOMAIN} → ${RESOLVED} (Cloudflare proxy). Thử xin cert…"
    echo "  Nếu fail: tạm tắt proxy (đám mây xám) ở Cloudflare, chạy lại, rồi bật lại."
  elif [[ -n "$SERVER_IP" && "$RESOLVED" != "$SERVER_IP" ]]; then
    echo "  CẢNH BÁO: ${DOMAIN} đang trỏ về ${RESOLVED}, không phải ${SERVER_IP}."
    echo "  Certbot sẽ fail. Sửa DNS rồi chạy lại, hoặc dùng SKIP_CERTBOT=1."
    exit 1
  fi
  certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos \
    --register-unsafely-without-email --redirect
  echo "  đã cấp chứng chỉ"
fi

# ------------------------------------------------------------------- 5. cron
echo "[5/5] cron"

MARKER="# tkaipro-shop: cron (managed by setup-vps.sh)"
if crontab -l 2>/dev/null | grep -qF "$MARKER"; then
  echo "  cron đã có, bỏ qua"
elif [[ -f "${APP_DIR}/.env" ]] && grep -q '^CRON_SECRET=' "${APP_DIR}/.env"; then
  SECRET="$(grep '^CRON_SECRET=' "${APP_DIR}/.env" | cut -d= -f2- | tr -d '"'"'"' ')"
  if [[ -n "$SECRET" ]]; then
    TMP_CRON="$(mktemp)"
    (crontab -l 2>/dev/null || true) > "$TMP_CRON"
    cat >> "$TMP_CRON" <<EOF
${MARKER}
0 2 * * * curl -fsS -X POST -H 'Authorization: Bearer ${SECRET}' 'https://${DOMAIN}/api/cron/send-subscription-reminders' >> /var/log/tkaipro-shop-cron.log 2>&1
*/5 * * * * curl -fsS -X POST -H 'Authorization: Bearer ${SECRET}' 'https://${DOMAIN}/api/cron/expire-wallet-topups' >> /var/log/tkaipro-shop-cron.log 2>&1
${MARKER}-end
EOF
    crontab "$TMP_CRON"
    rm -f "$TMP_CRON"
    echo "  đã cài cron nhắc hạn (02:00) + hết hạn nạp ví (mỗi 5 phút)"
  else
    echo "  CRON_SECRET rỗng trong .env — bỏ qua, chạy lại sau khi điền"
  fi
else
  echo "  chưa có .env hoặc thiếu CRON_SECRET — bỏ qua, chạy lại sau khi điền"
fi

echo
echo "=============================================="
echo "Xong phần hạ tầng."
echo
if [[ -n "${DB_PASSWORD}" ]]; then
  echo "DATABASE_URL đã được ghi sẵn vào ${APP_DIR}/.env (chmod 600)."
  echo "Mật khẩu không in ra đây; xem bằng: grep DATABASE_URL ${APP_DIR}/.env"
  echo
fi
echo "Bước tiếp theo:"
echo "  1. Điền nốt các biến còn lại trong ${APP_DIR}/.env"
echo "     (AUTH_SECRET, BETTER_AUTH_SECRET, CRON_SECRET, CREDENTIAL_ENC_KEY,"
echo "      SEPAY_API_KEY, BREVO_API_KEY, BREVO_EMAIL)"
echo "  2. cd ${APP_DIR} && npx drizzle-kit push   (tạo bảng)"
echo "  3. bash ${APP_DIR}/scripts/deploy.sh       (build + chạy)"
echo "=============================================="
