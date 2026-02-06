
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function generate() {
    console.log('🎨 Bắt đầu tạo tài nguyên hình ảnh...');
    
    const assetsDir = path.join(__dirname, 'assets');
    const publicDir = path.join(__dirname, 'public');
    
    if (!fs.existsSync(assetsDir)) {
        console.error('❌ Thư mục assets/ không tồn tại!');
        return;
    }

    // Copy logo sang public để dùng cho Web
    if (fs.existsSync(path.join(assetsDir, 'logo.png'))) {
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
        fs.copyFileSync(path.join(assetsDir, 'logo.png'), path.join(publicDir, 'logo.png'));
        console.log('✅ Đã cập nhật logo.png vào thư mục public/');
    }

    // Sử dụng Capacitor Assets để tạo icon/splash cho Android/iOS
    try {
        console.log('📦 Đang chạy npx @capacitor/assets generate...');
        // Lưu ý: Lệnh này yêu cầu các file icon.png, logo.png, splash.png có trong folder assets/
        // Nếu tên file splash là spflash.png, chúng ta sẽ đổi tên tạm thời
        if (fs.existsSync(path.join(assetsDir, 'spflash.png'))) {
             fs.copyFileSync(path.join(assetsDir, 'spflash.png'), path.join(assetsDir, 'splash.png'));
        }
        
        execSync('npx @capacitor/assets generate --android', { stdio: 'inherit' });
        console.log('✅ Đã tạo tài nguyên APK thành công!');
    } catch (err) {
        console.error('⚠️ Lỗi khi tạo icon APK: Có thể bạn chưa cài đặt Android Studio hoặc lệnh @capacitor/assets');
        console.log('💡 Gợi ý: Hãy đảm bảo folder assets/ có đầy đủ icon.png và splash.png');
    }
}

generate();
