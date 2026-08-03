import { 
  getExpiredSubscriptions, 
  markSubscriptionsAsExpired,
  getSubscriptionsExpiringSoon 
} from "../src/lib/queries/subscriptions";

/**
 * Script để kiểm tra và xử lý subscriptions hết hạn
 * Có thể chạy như cron job hàng ngày
 */
async function checkAndProcessExpiredSubscriptions() {
  console.log("🔍 Bắt đầu kiểm tra subscriptions hết hạn...");
  
  try {
    // Lấy danh sách subscriptions đã hết hạn
    const expiredSubscriptions = await getExpiredSubscriptions();
    console.log(`📊 Tìm thấy ${expiredSubscriptions.length} subscriptions đã hết hạn`);

    if (expiredSubscriptions.length > 0) {
      // Đánh dấu là expired và trả credentials về pool
      const expiredIds = expiredSubscriptions.map(sub => sub.id);
      const success = await markSubscriptionsAsExpired(expiredIds);
      
      if (success) {
        console.log(`✅ Đã xử lý ${expiredSubscriptions.length} subscriptions hết hạn`);
        
        // Log chi tiết
        expiredSubscriptions.forEach(sub => {
          console.log(`   - ${sub.productName}: ${sub.username} (${sub.customerEmail}) - Hết hạn: ${sub.expiresAt}`);
        });
      } else {
        console.error("❌ Không thể xử lý subscriptions hết hạn");
      }
    }

    // Kiểm tra subscriptions sắp hết hạn (7 ngày)
    const expiringSoon = await getSubscriptionsExpiringSoon(7);
    console.log(`⚠️  Có ${expiringSoon.length} subscriptions sắp hết hạn trong 7 ngày tới`);
    
    if (expiringSoon.length > 0) {
      console.log("📋 Danh sách subscriptions sắp hết hạn:");
      expiringSoon.forEach(sub => {
        const daysLeft = Math.ceil((sub.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        console.log(`   - ${sub.productName}: ${sub.username} (${sub.customerEmail}) - Còn ${daysLeft} ngày`);
      });
    }

    console.log("✨ Hoàn thành kiểm tra subscriptions");
    
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra subscriptions:", error);
    process.exit(1);
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  checkAndProcessExpiredSubscriptions()
    .then(() => {
      console.log("🎉 Script hoàn thành thành công");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script thất bại:", error);
      process.exit(1);
    });
}

export { checkAndProcessExpiredSubscriptions }; 