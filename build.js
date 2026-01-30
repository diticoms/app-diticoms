
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const assetsDir = path.join(__dirname, 'assets');

// 1. Dọn dẹp dist cũ
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('🧹 Đã dọn dẹp thư mục dist/');
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Các file và thư mục mã nguồn cần copy
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

// 3. Copy thư mục assets vào dist (Dành cho web truy cập ảnh)
if (fs.existsSync(assetsDir)) {
    fs.cpSync(assetsDir, path.join(distDir, 'assets'), { recursive: true });
    console.log('📦 Đã copy thư mục assets/');
}

// 4. Bảo toàn CNAME và các file trong public
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

console.log('🚀 Build hoàn tất - Sẵn sàng cho Capacitor!');
