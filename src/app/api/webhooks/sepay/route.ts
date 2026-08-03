import { NextRequest, NextResponse } from "next/server";
import { 
  createSepayTransaction, 
  findOrderByPaymentToken,
  findOrderByTransactionContent, 
  markTransactionAsProcessed,
  updatePaymentStatus,
  getOrderByNumber,
  syncOrderItemsProductType,
} from "~/lib/queries/orders";
import { autoAssignCredentials } from "~/lib/queries/credentials";
import {
  creditTopupBalance,
  findTopupByPaymentToken,
  findTopupByTransactionContent,
} from "~/lib/queries/wallet";
import {
  sendAdminOrderNotification,
  sendWalletTopupSuccessEmail,
} from "~/lib/email-service";
import { sendOrderCredentialsEmail } from "~/lib/fulfillment/send-order-credentials-email";
import { getUserById } from "~/lib/queries/users";
import { isActiveBankAccountNumber } from "~/lib/queries/bank-accounts";

export async function POST(request: NextRequest) {
  try {
    // xác thực API Key từ SePay (theo tài liệu: Authorization: Apikey YOUR_KEY)
    // SECURITY: SEPAY_API_KEY bắt buộc — không skip auth khi unset/empty.
    const authHeader = request.headers.get('authorization');
    const expectedApiKey = process.env.SEPAY_API_KEY?.trim();

    console.log("SePay webhook - Authorization check:", {
      hasHeader: !!authHeader,
      headerPrefix: authHeader?.substring(0, 10),
      hasExpectedKey: !!expectedApiKey,
    });

    if (!expectedApiKey) {
      console.error("SEPAY_API_KEY is unset — rejecting webhook");
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Apikey ')) {
      console.error("Missing or invalid Authorization header");
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace('Apikey ', '');
    if (apiKey !== expectedApiKey) {
      console.error(
        "Invalid API Key - received:",
        apiKey.substring(0, 10) + "...",
        "expected:",
        expectedApiKey.substring(0, 10) + "...",
      );
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // lấy dữ liệu từ SePay webhook
    const webhookData = await request.json() as any;

    console.log("SePay webhook received - full payload:", JSON.stringify(webhookData, null, 2));

    // validate webhook data
    if (!webhookData || typeof webhookData !== 'object') {
      console.error("Invalid webhook data");
      return NextResponse.json(
        { success: false, message: 'Invalid data' },
        { status: 400 }
      );
    }

    // extract data from webhook payload
    const {
      gateway,
      transactionDate,
      accountNumber,
      subAccount,
      transferType,
      transferAmount,
      accumulated,
      code,
      content,
      referenceCode,
      description
    } = webhookData;

    console.log("SePay webhook - extracted fields:", {
      transferType,
      transferAmount,
      content,
      referenceCode,
      description,
      accountNumber
    });

    // chỉ xử lý giao dịch tiền vào
    if (transferType !== "in") {
      console.log("Ignoring outgoing transaction");
      return NextResponse.json({ success: true });
    }

    // Chỉ nhận tiền vào STK thuộc pool bank_account active.
    // KienLongBank/SePay: STK thật thường nằm ở `subAccount`, `accountNumber`
    // có thể là VA/mã ảo — phải check cả hai.
    // Không khớp → 200 + note (tránh SePay retry spam); log rõ cho admin.
    const bankCheck = await isActiveBankAccountNumber(
      typeof accountNumber === "string" ? accountNumber : null,
      typeof subAccount === "string" ? subAccount : null,
    );
    if (bankCheck.hasActiveBanks && !bankCheck.matched) {
      console.warn(
        "SePay webhook ignored — neither accountNumber nor subAccount in active bank_accounts pool:",
        {
          accountNumber,
          subAccount,
          content,
          transferAmount,
          referenceCode,
        },
      );
      return NextResponse.json({
        success: true,
        note: "ignored: accountNumber/subAccount not in active bank pool",
      });
    }
    if (bankCheck.matchedNumber) {
      console.log(
        "SePay webhook bank pool matched:",
        bankCheck.matchedNumber,
        { accountNumber, subAccount },
      );
    }

    // kiểm tra nội dung chuyển khoản
    if (!content || typeof content !== 'string') {
      console.error("Missing or invalid content field in webhook:", { content, webhookData });
      return NextResponse.json(
        { success: false, message: 'Missing content field' },
        { status: 400 }
      );
    }

    // tạo transaction record
    const transaction = await createSepayTransaction(webhookData);
    if (!transaction) {
      console.error("Failed to create transaction record");
      return NextResponse.json(
        { success: false, message: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    console.log("SePay transaction created:", transaction.id);

    // Branch 1: topup — token match trước, legacy TOP... sau
    let topup = await findTopupByPaymentToken(content);
    if (!topup) {
      topup = await findTopupByTransactionContent(content);
    }
    if (topup) {
      console.log(
        `Found matching topup ${topup.id} (user=${topup.userId}, amount=${topup.amount} ${topup.currency})`,
      );
      if (topup.amount > transferAmount) {
        console.warn(
          `Topup ${topup.id}: amount mismatch — expected ${topup.amount}, received ${transferAmount}, skip credit (user can resend remaining or admin handle).`,
        );
        await markTransactionAsProcessed(transaction.id);
        return NextResponse.json({
          success: true,
          note: "topup amount underpaid",
        });
      }
      const credit = await creditTopupBalance({
        topupId: topup.id,
        sepayTransactionId: transaction.id,
      });
      await markTransactionAsProcessed(transaction.id);

      if (credit) {
        try {
          const owner = await getUserById(topup.userId);
          if (owner?.email) {
            await sendWalletTopupSuccessEmail({
              customerEmail: owner.email,
              customerName: owner.name ?? owner.email,
              amount: credit.transaction.amount,
              currency: credit.transaction.currency as "vnd" | "usd",
              balanceAfter: credit.transaction.balanceAfter,
              paidAt: credit.topup.paidAt ?? new Date(),
            });
          }
        } catch (e) {
          console.error("Failed to send wallet topup email:", e);
        }
      }
      return NextResponse.json({ success: true, kind: "topup" });
    }

    // Branch 2: order — token match trước, legacy ORD... sau
    let order = await findOrderByPaymentToken(content);
    if (!order) {
      order = await findOrderByTransactionContent(content);
    }
    
    if (!order) {
      console.log("No matching order found for transaction content:", content);
      console.log("Transaction saved but no order matched");
      // transaction được lưu nhưng không match với đơn hàng nào
      return NextResponse.json({ success: true });
    }

    console.log(`Found matching order: ${order.orderNumber}`, {
      orderId: order.id,
      currentPaymentStatus: order.paymentStatus,
      currentStatus: order.status,
      orderTotal: order.total
    });

    // kiểm tra xem đơn hàng đã được thanh toán chưa
    if (order.paymentStatus === 'paid') {
      console.log(`Order ${order.orderNumber} already paid, skipping duplicate payment`);
      // đánh dấu transaction đã được xử lý (có thể là retry từ SePay)
      await markTransactionAsProcessed(transaction.id);
      return NextResponse.json({ success: true, message: 'Order already paid' });
    }

    // kiểm tra số tiền có khớp không
    const expectedAmount = order.total;
    const receivedAmount = transferAmount;

    console.log("Amount check:", {
      expected: expectedAmount,
      received: receivedAmount,
      match: receivedAmount >= expectedAmount
    });

    if (receivedAmount < expectedAmount) {
      console.log(`Amount mismatch - Expected: ${expectedAmount}, Received: ${receivedAmount}`);
      // có thể thông báo cho admin về trường hợp này
      return NextResponse.json({ success: true });
    }

    // cập nhật trạng thái thanh toán
    console.log(`Updating payment status for order ${order.orderNumber}...`);
    const updatedOrder = await updatePaymentStatus(
      order.id,
      'paid',
      {
        transactionId: transaction.id,
        reference: referenceCode,
      }
    );

    if (!updatedOrder) {
      console.error("Failed to update payment status for order:", order.orderNumber);
      return NextResponse.json(
        { success: false, message: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    console.log(`Payment status updated successfully for order ${order.orderNumber}`, {
      newPaymentStatus: updatedOrder.paymentStatus,
      newStatus: updatedOrder.status
    });

    // đánh dấu transaction đã được xử lý
    await markTransactionAsProcessed(transaction.id);

    console.log(`Payment confirmed for order ${order.orderNumber}`);

    // defensive: refresh productType từ db trước khi quyết định nhánh auto-fulfill
    // tránh case admin đổi productType sau khi order tạo mà snapshot cũ vẫn còn
    const syncedOrder = await syncOrderItemsProductType(updatedOrder);
    const finalOrder = syncedOrder ?? updatedOrder;

    // đơn hàng có credentials: tự động cấp tài khoản từ kho
    try {
      const credentialsAssigned = await autoAssignCredentials(order.id);
      if (credentialsAssigned) {
        console.log(`Credentials automatically assigned to order ${order.orderNumber}`);
      } else {
        console.warn(`Could not assign credentials to order ${order.orderNumber} - may need manual processing`);
      }
    } catch (error) {
      console.error(`Error assigning credentials to order ${order.orderNumber}:`, error);
    }

    // gửi email thông báo admin về đơn hàng mới
    try {
      await sendAdminOrderNotification({
        orderNumber: finalOrder.orderNumber,
        customerName: finalOrder.customerName,
        customerEmail: finalOrder.customerEmail,
        customerPhone: finalOrder.customerPhone || undefined,
        total: finalOrder.total,
        paymentMethod: finalOrder.paymentMethod,
        items: finalOrder.items,
        paidAt: new Date()
      });
      console.log(`Admin notification sent for order ${finalOrder.orderNumber}`);
    } catch (error) {
      console.error(`Failed to send admin notification for order ${finalOrder.orderNumber}:`, error);
    }

    // gửi email xác nhận đơn hàng và thông tin tài khoản cho khách hàng
    try {
      const fulfilledOrder = await getOrderByNumber(order.orderNumber);

      if (fulfilledOrder && fulfilledOrder.assignedCredentials) {
        const result = await sendOrderCredentialsEmail({
          orderId: fulfilledOrder.id,
          orderNumber: fulfilledOrder.orderNumber,
          customerName: fulfilledOrder.customerName,
          customerEmail: fulfilledOrder.customerEmail,
          customerPhone: fulfilledOrder.customerPhone || undefined,
          total: fulfilledOrder.total,
          paymentMethod: fulfilledOrder.paymentMethod,
          items: fulfilledOrder.items,
          assignedCredentials: fulfilledOrder.assignedCredentials,
          paidAt: new Date(),
          locale: fulfilledOrder.locale ?? undefined,
        });
        if (result.sent) {
          console.log(`Customer confirmation email sent for order ${order.orderNumber}`);
        } else {
          console.warn(
            `Customer confirmation skipped for order ${order.orderNumber}: ${result.reason}`,
            result.missingEmails,
          );
        }
      } else {
        console.warn(`No credentials assigned yet for order ${order.orderNumber}, skipping customer email`);
      }
    } catch (error) {
      console.error(`Failed to send customer confirmation for order ${order.orderNumber}:`, error);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error processing SePay webhook:", error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// handle preflight for CORS if needed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 