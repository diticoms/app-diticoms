
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist');

console.log('🚀 Bắt đầu quy trình build Production...');

// 1. Dọn dẹp dist cũ
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Biên dịch index.tsx sang index.js bằng esbuild
try {
    console.log('📦 Đang đóng gói mã nguồn (Bundling)...');
    execSync('npx esbuild index.tsx --bundle --minify --format=esm --outfile=dist/index.js --loader:.tsx=tsx --loader:.ts=ts --external:react --external:react-dom --external:lucide-react --external:html2canvas --external:xlsx');
    console.log('✅ Đã tạo file dist/index.js');
} catch (err) {
    console.error('❌ Lỗi biên dịch esbuild:', err.message);
    process.exit(1);
}

// 3. Các file tĩnh cần copy
const itemsToCopy = [
    'index.html',
    'metadata.json',
    'manifest.json',
    'version.json',
    'index.css',
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

// 4. Xử lý Logo đặc biệt từ thư mục public
const publicLogo = path.join(__dirname, 'public', 'logo.png');
const rootLogo = path.join(__dirname, 'logo.png');
const destLogo = path.join(distDir, 'logo.png');

if (fs.existsSync(publicLogo)) {
    fs.copyFileSync(publicLogo, destLogo);
    console.log('🖼️ Đã copy logo từ public/logo.png vào dist');
} else if (fs.existsSync(rootLogo)) {
    fs.copyFileSync(rootLogo, destLogo);
    console.log('🖼️ Đã copy logo từ gốc vào dist');
}

// 5. CNAME
const cnamePath = path.join(__dirname, 'CNAME');
if (fs.existsSync(cnamePath)) {
    fs.copyFileSync(cnamePath, path.join(distDir, 'CNAME'));
} else {
    fs.writeFileSync(path.join(distDir, 'CNAME'), 'service.diticoms.vn');
}

console.log('✨ Build hoàn tất thành công!');
