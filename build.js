
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');

// 1. Tạo thư mục dist nếu chưa có
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('✅ Đã tạo thư mục dist/');
}

// 2. Danh sách các file và thư mục cần copy
const itemsToCopy = [
    'index.html',
    'index.tsx',
    'types.ts',
    'constants.ts',
    'metadata.json',
    'manifest.json',
    'logo.png',
    'version.json',
    'deploy.sh',
    'components',
    'services',
    'utils'
];

itemsToCopy.forEach(item => {
    const src = path.join(__dirname, item);
    const dest = path.join(distDir, item);

    if (fs.existsSync(src)) {
        if (fs.lstatSync(src).isDirectory()) {
            // Copy thư mục (Yêu cầu Node.js 16.7.0+)
            fs.cpSync(src, dest, { recursive: true });
        } else {
            // Copy file
            fs.copyFileSync(src, dest);
        }
    }
});

// 3. Xử lý đặc biệt cho thư mục public (Copy nội dung bên trong vào gốc dist)
if (fs.existsSync(publicDir)) {
    const publicFiles = fs.readdirSync(publicDir);
    publicFiles.forEach(file => {
        fs.copyFileSync(path.join(publicDir, file), path.join(distDir, file));
    });
    console.log('✅ Đã đồng bộ cấu hình Domain (CNAME) từ public/');
}

console.log('🚀 Build hoàn tất thành công!');
