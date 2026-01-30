
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
                fs.cpSync(src, dest, { recursive: true });
            } else {
                fs.copyFileSync(src, dest);
            }
        } catch (err) {
            console.error(`❌ Lỗi khi copy ${item}:`, err.message);
        }
    }
});

// 3. Bảo toàn CNAME cho GitHub Pages
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}
const cnamePath = path.join(publicDir, 'CNAME');
if (!fs.existsSync(cnamePath)) {
    fs.writeFileSync(cnamePath, 'service.diticoms.vn');
}

const publicFiles = fs.readdirSync(publicDir);
publicFiles.forEach(file => {
    fs.copyFileSync(path.join(publicDir, file), path.join(distDir, file));
});

console.log('🚀 Build hoàn tất thành công!');
