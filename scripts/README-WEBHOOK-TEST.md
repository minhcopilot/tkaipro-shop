# 🧪 Тестирование SePay Webhook

Скрипты для тестирования webhook SePay на localhost.

## 📋 Требования

- Запущенный сервер разработки: `npm run dev` (localhost:3000)
- Переменная окружения `SEPAY_API_KEY` в `.env` (опционально, по умолчанию используется тестовый ключ)

## 🚀 Использование

### Вариант 1: TypeScript скрипт (рекомендуется)

```bash
# базовый тест с дефолтными значениями
npm run test:webhook

# тест с конкретным номером заказа
npm run test:webhook ORD12345678ABC

# тест с номером заказа и суммой
npm run test:webhook ORD12345678ABC 49000

# или напрямую через bun
bun scripts/test-sepay-webhook.ts ORD12345678ABC 49000
```

### Вариант 2: Bash скрипт (Linux/Mac/Git Bash)

```bash
# базовый тест
./scripts/test-sepay-webhook.sh

# тест с конкретным номером заказа
./scripts/test-sepay-webhook.sh ORD12345678ABC

# тест с номером заказа и суммой
./scripts/test-sepay-webhook.sh ORD12345678ABC 49000
```

### Вариант 3: Curl (универсальный)

```bash
curl --location 'http://localhost:3000/api/webhooks/sepay' \
--header 'Content-Type: application/json' \
--header 'Authorization: Apikey Q7UVOV8ISWC6I9LIAJLDS5KQTVBZXHAZ0D4ZLVWES5QEGRMGRFG43SONTLDKNAB8' \
--data '{
  "gateway": "MB Bank",
  "transactionDate": "2025-01-23 16:40:18",
  "accountNumber": "171120023333",
  "subAccount": null,
  "code": "TEST123",
  "content": "12345678ABC",
  "transferType": "in",
  "description": "Test chuyen khoan",
  "transferAmount": 49000,
  "referenceCode": "4906",
  "accumulated": 0,
  "id": 18415068
}'
```

## 📝 Параметры

- **orderNumber** (опционально): номер заказа для тестирования. По умолчанию: `ORD12345678TEST`
- **amount** (опционально): сумма платежа в VND. По умолчанию: `49000`

## 🔍 Что проверяется

1. ✅ Авторизация через API Key
2. ✅ Валидация payload webhook
3. ✅ Поиск заказа по содержимому транзакции
4. ✅ Обновление статуса оплаты
5. ✅ Логирование всех этапов обработки

## 📊 Пример вывода

```
🚀 Testing SePay Webhook
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 URL: http://localhost:3000/api/webhooks/sepay
🔑 API Key: Q7UVOV8ISWC6I9LIAJLDS5KQTVBZXHAZ0D4ZLVWES5QEGRMGRFG43SONTLDKNAB8...
📦 Order Number: ORD12345678ABC
💰 Amount: 49,000₫
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📤 Sending webhook payload:
{
  "gateway": "MB Bank",
  "transactionDate": "2025-01-23 16:40:18",
  ...
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 Response Status: 200 OK
📥 Response Body:
{
  "success": true
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Webhook test successful!
```

## 🐛 Отладка

Если тест не проходит, проверьте:

1. **Сервер запущен**: `npm run dev`
2. **Правильный URL**: по умолчанию `http://localhost:3000/api/webhooks/sepay`
3. **API Key**: проверьте переменную `SEPAY_API_KEY` в `.env`
4. **Логи сервера**: смотрите консоль где запущен `npm run dev` для детальных логов
5. **Заказ существует**: убедитесь, что заказ с указанным номером существует в БД

## 📌 Примечания

- Скрипт автоматически генерирует уникальные `code`, `referenceCode` и `id` для каждой транзакции
- Формат содержимого транзакции: `"{ORDER_NUMBER_BARE}"` (без префикса `ORD`)
- Для тестирования с реальным заказом используйте существующий `orderNumber` из базы данных

