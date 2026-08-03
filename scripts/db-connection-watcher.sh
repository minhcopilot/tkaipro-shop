#!/usr/bin/env bash
# =============================================================================
# DB CONNECTION WATCHER — alert khi co ket noi Postgres tu IP LA (-> Telegram)
# =============================================================================
# Sau khi da dong cong DB ra Internet, app ket noi qua docker network noi bo
# (mac dinh subnet 172.x). Bat ky ket noi 'connection authorized' nao tu IP
# NGOAI cac dai tin cay deu dang ngo -> gui canh bao admin.
#
# Yeu cau Postgres da bat log_connections=on (xem security-incident-runbook.sh).
#
# Env:
#   PG_CONTAINER  : ten container postgres (vd cursor-pro-shop-postgres-1)
#   TG_TOKEN      : Telegram bot token
#   TG_CHAT       : Telegram chat id
#   TRUSTED_CIDR_REGEX : regex IP tin cay duoc bo qua (mac dinh docker + localhost)
#
# Chay nen:
#   nohup bash scripts/db-connection-watcher.sh >/var/log/db-watcher.log 2>&1 &
# =============================================================================
set -uo pipefail

PG_CONTAINER="${PG_CONTAINER:?Can set PG_CONTAINER}"
TRUSTED_CIDR_REGEX="${TRUSTED_CIDR_REGEX:-^(172\.|10\.|127\.0\.0\.1|::1|localhost)}"

alert() {
  local msg="$1"
  echo "[db-watcher] ALERT: $msg"
  if [[ -n "${TG_TOKEN:-}" && -n "${TG_CHAT:-}" ]]; then
    curl -fsS "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
      -d "chat_id=${TG_CHAT}" \
      --data-urlencode "text=🛑 DB connection tu IP la: ${msg}" \
      >/dev/null 2>&1 || true
  fi
}

echo "[db-watcher] Bat dau theo doi log ket noi cua $PG_CONTAINER ..."
docker logs -f --since 1m "$PG_CONTAINER" 2>&1 | while read -r line; do
  # Postgres log dạng: "... connection authorized: user=... database=... host=1.2.3.4 ..."
  if echo "$line" | grep -qiE "connection (authorized|received)"; then
    ip="$(echo "$line" | grep -oE "host=[0-9a-fA-F.:]+" | head -n1 | cut -d= -f2)"
    [[ -z "$ip" ]] && continue
    if echo "$ip" | grep -qE "$TRUSTED_CIDR_REGEX"; then
      continue   # IP tin cay (docker/localhost) -> bo qua
    fi
    alert "host=$ip | $(echo "$line" | tail -c 200)"
  fi
done
