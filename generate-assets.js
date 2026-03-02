
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

    const LOGO_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADJ0lEQVR4nO2az2sTQRTHP7vZbJNNo0mTrYpW8SJeFfGkFfGgeOtf4EUPXvTiXfGuePCuePFf4EUPHjx4UPGieNBK8SJeREUrWpOmTZumbbLZbGZ8D0I3ySab7O7Mzs78fGBYmJn3mXm/vPdmZ96UUkpYmBAszEwoDPCmMMAr8H8BvAJP7UADGAn07u2V2K616+M6uG4V7K6C3ZWyf8HuvXre2/UfAt4CH4Bv9f09Bf+I9Y6Y2AnvO2IDnInF3vHeV6m0A34CP1n9M6FvX0x8V2ycAn8L/OQG+MB9v09E7/Xf2/fPgn9Z/YvGfxY+YvC98AnDpyT8zOAr4XfCpxS+E77rY7O6r6XGZxW+Fv5Z+Gvht8Kvhd8IvzX4jY8vXz++fP1wFvx18K8NfuPjr4S/En5NfA1+6eN79fE9/vj66+evmY8ZfO3jS+Xz6PNo87fA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8/wH8D7Hh7OqXWv8OAAAAAElFTkSuQmCC";
    
    // Copy logo sang public để dùng cho Web
    if (fs.existsSync(path.join(assetsDir, 'logo.png'))) {
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
        fs.copyFileSync(path.join(assetsDir, 'logo.png'), path.join(publicDir, 'logo.png'));
        console.log('✅ Đã cập nhật logo.png vào thư mục public/');
    } else if (fs.existsSync(path.join(publicDir, 'logo.png'))) {
        // Nếu không có trong assets nhưng có trong public (vừa được build.js phục hồi)
        console.log('ℹ️ Sử dụng logo.png hiện có trong public/');
    } else {
        // Phục hồi khẩn cấp
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
        fs.writeFileSync(path.join(publicDir, 'logo.png'), Buffer.from(LOGO_BASE64, 'base64'));
        console.log('✅ Đã phục hồi logo.png khẩn cấp');
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
