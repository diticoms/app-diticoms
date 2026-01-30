
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');

// 1. Tạo thư mục dist nếu chưa có
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('✅ Đã tạo thư mục dist/');
}

// 2. Danh sách các file và thư mục cần copy vào bản build
const itemsToCopy = [
    'index.html',
    'index.tsx',
    'App.tsx',
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
        try {
            if (fs.lstatSync(src).isDirectory()) {
                // Copy thư mục (Yêu cầu Node.js 16.7.0+)
                fs.cpSync(src, dest, { recursive: true });
            } else {
                // Copy file
                fs.copyFileSync(src, dest);
            }
        } catch (err) {
            console.error(`❌ Lỗi khi copy ${item}:`, err.message);
        }
    }
});

// 3. Copy file CNAME từ public/ vào gốc dist/
if (fs.existsSync(publicDir)) {
    const publicFiles = fs.readdirSync(publicDir);
    publicFiles.forEach(file => {
        fs.copyFileSync(path.join(publicDir, file), path.join(distDir, file));
    });
    console.log('✅ Đã bảo toàn Domain (CNAME) từ thư mục public/');
}

console.log('🚀 Build hoàn tất thành công!');
