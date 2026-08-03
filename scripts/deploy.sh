#!/usr/bin/env bash
# ----------------------------------------------------------------------------
# deploy.sh — deploy tkaipro-shop trên VPS.
#
#   ssh root@<vps> "bash /app/tkaipro-shop/scripts/deploy.sh"
#
# Dùng layer cache (Dockerfile đã tách stage `deps` nên đổi source vẫn rebuild
# đúng phần cần), gắn tag :previous để rollback được, và dọn rác sau mỗi lần
# deploy để đĩa không phình dần.
#
# Ép build sạch khi nghi cache hỏng:  NO_CACHE=1 bash scripts/deploy.sh
# ----------------------------------------------------------------------------
set -euo pipefail

APP_DIR="${APP_DIR:-/app/tkaipro-shop}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
IMAGE="${IMAGE:-tkaipro-shop-app}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3003/api/health}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"
NO_CACHE="${NO_CACHE:-0}"

cd "${APP_DIR}"

if [ ! -f .env ]; then
  echo "DỪNG: thiếu ${APP_DIR}/.env — copy từ .env.example rồi điền."
  exit 1
fi

echo "=== Disk trước khi deploy ==="
df -h / | tail -1

AVAIL_GB=$(df --output=avail -BG / | tail -1 | tr -dc '0-9')
if [ "${AVAIL_GB}" -lt 10 ]; then
  echo "DỪNG: chỉ còn ${AVAIL_GB}GB trống, build Next.js cần ~10GB."
  echo "Dọn trước:  /usr/local/bin/cursor-shop-docker-prune.sh"
  exit 1
fi

if [ -d .git ]; then
  echo
  echo "=== git pull ==="
  git pull --ff-only || echo "  (bỏ qua: không pull được, deploy code hiện tại)"
fi

echo
echo "=== Gắn tag :previous cho image hiện tại (để rollback) ==="
if docker image inspect "${IMAGE}:latest" >/dev/null 2>&1; then
  docker tag "${IMAGE}:latest" "${IMAGE}:previous"
  echo "  ${IMAGE}:latest → ${IMAGE}:previous"
else
  echo "  (chưa có image cũ, bỏ qua)"
fi

echo
echo "=== Build ==="
# --env-file .env để compose nội suy được ${NEXT_PUBLIC_*} trong build.args;
# nếu không, các biến đó thành rỗng và bundle mất tên miền/thương hiệu.
BUILD_ARGS=()
[ "${NO_CACHE}" = "1" ] && BUILD_ARGS+=(--no-cache)
docker-compose --env-file .env -f "${COMPOSE_FILE}" build "${BUILD_ARGS[@]}" app

echo
echo "=== Up ==="
docker-compose --env-file .env -f "${COMPOSE_FILE}" up -d app

echo
echo "=== Chờ app healthy (tối đa ${HEALTH_TIMEOUT}s) ==="
DEADLINE=$((SECONDS + HEALTH_TIMEOUT))
HEALTHY=0
while [ ${SECONDS} -lt ${DEADLINE} ]; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "${HEALTH_URL}" 2>/dev/null || echo 000)
  if [ "${CODE}" = "200" ]; then
    HEALTHY=1
    echo "  App trả 200 sau ${SECONDS}s"
    break
  fi
  sleep 3
done

if [ "${HEALTHY}" != "1" ]; then
  echo
  echo "LỖI: app không healthy. Log gần nhất:"
  docker-compose -f "${COMPOSE_FILE}" logs --tail=50 app
  echo
  echo "Rollback:"
  echo "  docker tag ${IMAGE}:previous ${IMAGE}:latest && docker-compose --env-file .env -f ${COMPOSE_FILE} up -d app"
  exit 1
fi

echo
echo "=== Dọn rác (image không tag + build cache cũ hơn 7 ngày) ==="
docker image prune -f
docker builder prune -af --filter "until=168h"

echo
echo "=== Disk sau khi deploy ==="
df -h / | tail -1
docker-compose -f "${COMPOSE_FILE}" ps app

echo
echo "Deploy xong."
