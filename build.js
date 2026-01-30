const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const assetsDir = path.join(__dirname, 'assets');

// 1. Dọn dẹp dist cũ
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Các file cần thiết cho ứng dụng chạy module trực tiếp
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
    'components',
    'services',
    'utils'
];

itemsToCopy.forEach(item => {
    const src = path.join(__dirname, item);
    const dest = path.join(distDir, item);

    if (fs.existsSync(src)) {
        if (fs.lstatSync(src).isDirectory()) {
            fs.cpSync(src, dest, { recursive: true });
        } else {
            fs.copyFileSync(src, dest);
        }
    }
});

// 3. Copy CNAME từ public nếu có, nếu không thì tạo mới
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
const cnamePath = path.join(publicDir, 'CNAME');
if (!fs.existsSync(cnamePath)) {
    fs.writeFileSync(cnamePath, 'service.diticoms.vn');
}
fs.copyFileSync(cnamePath, path.join(distDir, 'CNAME'));

// 4. Copy assets
if (fs.existsSync(assetsDir)) {
    fs.cpSync(assetsDir, path.join(distDir, 'assets'), { recursive: true });
}

console.log('✅ Build thành công vào thư mục dist/');