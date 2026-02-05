
const fs = require('fs');
const path = require('path');

// Đường dẫn file logo gốc nằm trong thư mục public theo yêu cầu của người dùng
const sourceLogo = path.join(__dirname, 'public', 'logo.png');

const folders = [
    'assets',
    'public',
    'dist'
];

// Tạo các thư mục cần thiết nếu chưa có
folders.forEach(f => {
    const dir = path.join(__dirname, f);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Đã tạo thư mục: ${f}`);
    }
});

if (fs.existsSync(sourceLogo)) {
    console.log(`🔍 Tìm thấy logo tại: ${sourceLogo}`);
    console.log('🚀 Đang khởi tạo tài nguyên cho Mobile từ public/logo.png...');
    
    try {
        // 1. Đảm bảo có bản sao ở gốc để các script khác (như build.js) hoạt động ổn định
        fs.copyFileSync(sourceLogo, path.join(__dirname, 'logo.png'));

        // 2. Tạo tài nguyên trong thư mục assets/ phục vụ cho npx @capacitor/assets
        // Capacitor Assets yêu cầu icon.png và splash.png (hoặc logo.png)
        fs.copyFileSync(sourceLogo, path.join(__dirname, 'assets/logo.png'));
        fs.copyFileSync(sourceLogo, path.join(__dirname, 'assets/icon.png'));
        fs.copyFileSync(sourceLogo, path.join(__dirname, 'assets/splash.png'));
        
        // 3. Dự phòng cho thư mục dist để hiển thị trên web ngay lập tức
        fs.copyFileSync(sourceLogo, path.join(__dirname, 'dist/logo.png'));
        
        console.log('✅ Đã chuẩn bị xong thư mục assets/ với Icon và Splash.');
        console.log('💡 Bước tiếp theo: Chạy "npm run assets:generate" để tự động tạo các kích thước cho Android/iOS.');
    } catch (err) {
        console.error('❌ Lỗi khi xử lý tài nguyên:', err.message);
    }
} else {
    console.error('❌ KHÔNG TÌM THẤY file: public/logo.png');
    console.log('💡 Vui lòng kiểm tra xem file logo.png đã nằm trong thư mục public chưa.');
}
