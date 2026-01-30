
const fs = require('fs');
const path = require('path');

// Đường dẫn đến file logo gốc của bạn
const sourceLogo = path.join(__dirname, 'logo.png');

const folders = [
    'assets',
    'public'
];

// Tạo các thư mục nếu chưa có
folders.forEach(f => {
    const dir = path.join(__dirname, f);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Đã tạo thư mục: ${f}`);
    }
});

if (fs.existsSync(sourceLogo)) {
    console.log('🔍 Đã tìm thấy logo thương hiệu tại thư mục gốc.');
    
    try {
        // 1. Sao chép vào public để hiển thị trên Web (Manifest/Apple Icon)
        fs.copyFileSync(sourceLogo, path.join(__dirname, 'public/logo.png'));
        
        // 2. Sao chép vào assets để Capacitor Assets tạo Icon/Splash cho APK
        fs.copyFileSync(sourceLogo, path.join(__dirname, 'assets/logo.png'));
        
        // Tạm thời dùng chính logo làm màn hình Splash (Capacitor sẽ tự căn giữa)
        fs.copyFileSync(sourceLogo, path.join(__dirname, 'assets/splash.png'));
        
        console.log('✅ Đã đồng bộ logo thương hiệu vào các thư mục assets/ và public/');
    } catch (err) {
        console.error('❌ Lỗi khi sao chép logo:', err.message);
    }
} else {
    console.error('❌ KHÔNG TÌM THẤY file logo.png ở thư mục gốc!');
    console.log('💡 Vui lòng đảm bảo bạn đã đặt file ảnh tên là "logo.png" vào thư mục dự án.');
}

console.log('💡 Bây giờ bạn có thể chạy: npm run generate:icons');
