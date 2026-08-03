#!/bin/bash

# скрипt test webhook sepay localhost
# usage: ./scripts/test-sepay-webhook.sh [orderNumber] [amount]

API_KEY="${SEPAY_API_KEY:-Q7UVOV8ISWC6I9LIAJLDS5KQTVBZXHAZ0D4ZLVWES5QEGRMGRFG43SONTLDKNAB8}"
WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:3000/api/webhooks/sepay}"

ORDER_NUMBER="${1:-ORD12345678TEST}"
AMOUNT="${2:-49000}"
TRANSFER_CONTENT="${ORDER_NUMBER#ORD}"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
CODE="TEST$(date +%s)"
REFERENCE_CODE=$(shuf -i 1000-9999 -n 1)
TRANSACTION_ID=$(shuf -i 1000000-9999999 -n 1)

echo "🚀 Testing SePay Webhook"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 URL: $WEBHOOK_URL"
echo "🔑 API Key: ${API_KEY:0:20}..."
echo "📦 Order Number: $ORDER_NUMBER"
echo "💰 Amount: $AMOUNT₫"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PAYLOAD=$(cat <<EOF
{
  "gateway": "MB Bank",
  "transactionDate": "$TIMESTAMP",
  "accountNumber": "171120023333",
  "subAccount": null,
  "code": "$CODE",
  "content": "$TRANSFER_CONTENT",
  "transferType": "in",
  "description": "Test chuyen khoan cho don hang $ORDER_NUMBER",
  "transferAmount": $AMOUNT,
  "referenceCode": "$REFERENCE_CODE",
  "accumulated": 0,
  "id": $TRANSACTION_ID
}
EOF
)

echo "📤 Sending webhook payload:"
echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" \
  --location "$WEBHOOK_URL" \
  --header "Content-Type: application/json" \
  --header "Authorization: Apikey $API_KEY" \
  --data "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📥 Response Status: $HTTP_CODE"
echo "📥 Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo ""
  echo "✅ Webhook test successful!"
  exit 0
else
  echo ""
  echo "❌ Webhook test failed!"
  exit 1
fi

