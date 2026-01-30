const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');

// 1. Dọn dẹp dist cũ
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Các file cần thiết
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
    'index.css', // Đảm bảo copy file này
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

// 3. CNAME
const cnamePath = path.join(__dirname, 'CNAME');
if (fs.existsSync(cnamePath)) {
    fs.copyFileSync(cnamePath, path.join(distDir, 'CNAME'));
} else {
    fs.writeFileSync(path.join(distDir, 'CNAME'), 'service.diticoms.vn');
}

console.log('✅ Build hoàn tất! Vui lòng đẩy thư mục dist/ lên server.');