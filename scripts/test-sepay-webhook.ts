#!/usr/bin/env bun

/**
 * script test webhook sepay localhost
 * usage:
 *   bun scripts/test-sepay-webhook.ts [paymentMemo|orderNumber] [amount]
 *
 * Nếu tham số 1 là ORD... sẽ fallback strip ORD (legacy).
 * Khuyến nghị truyền paymentMemo từ đơn mới (vd "Bao ban bua nay x7k2m9p").
 */

const API_KEY = process.env.SEPAY_API_KEY || "Q7UVOV8ISWC6I9LIAJLDS5KQTVBZXHAZ0D4ZLVWES5QEGRMGRFG43SONTLDKNAB8";
const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://localhost:3000/api/webhooks/sepay";

const arg1 = process.argv[2] || "ORD12345678TEST";
const amount = parseInt(process.argv[3] || "49000", 10);

// Legacy: nếu truyền ORD... thì strip prefix; nếu truyền paymentMemo thì dùng nguyên
const transferContent = /^ORD/i.test(arg1)
  ? arg1.replace(/^ORD/i, "")
  : arg1;
const orderNumber = /^ORD/i.test(arg1) ? arg1 : "(paymentMemo mode)";

const webhookPayload = {
  gateway: "TP Bank",
  transactionDate: new Date().toISOString().replace("T", " ").substring(0, 19),
  accountNumber: "00003209087",
  subAccount: null,
  code: `TEST${Date.now()}`,
  content: transferContent,
  transferType: "in",
  description: `Test chuyen khoan ${orderNumber}`,
  transferAmount: amount,
  referenceCode: String(Math.floor(Math.random() * 10000)),
  accumulated: 0,
  id: Math.floor(Math.random() * 10000000)
};

console.log("Testing SePay Webhook");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`URL: ${WEBHOOK_URL}`);
console.log(`API Key: ${API_KEY.substring(0, 20)}...`);
console.log(`Order / memo arg: ${arg1}`);
console.log(`Transfer content sent: ${transferContent}`);
console.log(`Amount: ${amount.toLocaleString('vi-VN')} VND`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("\nSending webhook payload:");
console.log(JSON.stringify(webhookPayload, null, 2));
console.log("\n");

try {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Apikey ${API_KEY}`
    },
    body: JSON.stringify(webhookPayload)
  });

  const responseText = await response.text();
  let responseData;
  
  try {
    responseData = JSON.parse(responseText);
  } catch {
    responseData = responseText;
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Response Status: ${response.status} ${response.statusText}`);
  console.log(`Response Body:`);
  console.log(JSON.stringify(responseData, null, 2));
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  if (response.ok) {
    console.log("\nWebhook test successful!");
  } else {
    console.log("\nWebhook test failed!");
    process.exit(1);
  }
} catch (error) {
  console.error("\nError sending webhook:");
  console.error(error);
  process.exit(1);
}
