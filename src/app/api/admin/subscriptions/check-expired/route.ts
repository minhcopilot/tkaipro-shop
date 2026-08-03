import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/auth";
import { 
  getExpiredSubscriptions, 
  markSubscriptionsAsExpired,
  getSubscriptionsExpiringSoon 
} from "../../../../../lib/queries/subscriptions";

// Inline function to avoid import issues
async function checkAndProcessExpiredSubscriptions() {
  console.log("🔍 Bắt đầu kiểm tra subscriptions hết hạn...");
  
  try {
    const expiredSubscriptions = await getExpiredSubscriptions();
    console.log(`📊 Tìm thấy ${expiredSubscriptions.length} subscriptions đã hết hạn`);

    if (expiredSubscriptions.length > 0) {
      const expiredIds = expiredSubscriptions.map(sub => sub.id);
      const success = await markSubscriptionsAsExpired(expiredIds);
      
      if (success) {
        console.log(`✅ Đã xử lý ${expiredSubscriptions.length} subscriptions hết hạn`);
        expiredSubscriptions.forEach(sub => {
          console.log(`   - ${sub.productName}: ${sub.username} (${sub.customerEmail}) - Hết hạn: ${sub.expiresAt}`);
        });
      } else {
        console.error("❌ Không thể xử lý subscriptions hết hạn");
      }
    }

    const expiringSoon = await getSubscriptionsExpiringSoon(7);
    console.log(`⚠️  Có ${expiringSoon.length} subscriptions sắp hết hạn trong 7 ngày tới`);
    
    console.log("✨ Hoàn thành kiểm tra subscriptions");
    
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra subscriptions:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin session OR cron secret (same pattern as subscriptions/reminders)
    const { searchParams } = new URL(request.url);
    const cronSecret = searchParams.get("secret");
    if (!(cronSecret && cronSecret === process.env.CRON_SECRET)) {
      const user = await getCurrentUser();
      if (!user || user.role.toUpperCase() !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    console.log("🔄 Triggering expired subscriptions check via API...");
    
    // Chạy script check expired subscriptions
    await checkAndProcessExpiredSubscriptions();
    
    return NextResponse.json({ 
      success: true,
      message: "Successfully checked and processed expired subscriptions",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Failed to check expired subscriptions:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process expired subscriptions",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 