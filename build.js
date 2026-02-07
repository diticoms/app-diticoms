
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist');
const distPublicDir = path.join(distDir, 'public');

console.log('🚀 Bắt đầu quy trình build Web Production...');

// 1. Dọn dẹp dist cũ
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(distPublicDir, { recursive: true });

// 2. Biên dịch index.tsx sang index.js bằng esbuild
try {
    console.log('📦 Đang đóng gói mã nguồn Web (Bundling)...');
    
    // Quan trọng: Phải liệt kê đầy đủ các thư viện và sub-paths trong --external 
    // để esbuild không cố gắng tìm kiếm chúng trong node_modules địa phương.
    const externals = [
        'react',
        'react/*',
        'react-dom',
        'react-dom/*',
        'lucide-react',
        'html2canvas',
        'xlsx',
        '@google/genai'
    ].map(lib => `--external:${lib}`).join(' ');

    const command = `npx esbuild index.tsx --bundle --minify --format=esm --outfile=dist/index.js --loader:.tsx=tsx --loader:.ts=ts ${externals}`;
    
    execSync(command);
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

// 4. Xử lý Logo và thư mục Public
const publicLogo = path.join(__dirname, 'public', 'logo.png');
const destPublicLogo = path.join(distPublicDir, 'logo.png');
const destRootLogo = path.join(distDir, 'logo.png');

if (fs.existsSync(publicLogo)) {
    fs.copyFileSync(publicLogo, destPublicLogo);
    fs.copyFileSync(publicLogo, destRootLogo);
    console.log('🖼️ Đã copy logo vào dist/public/logo.png và dist/logo.png');
}

// 5. CNAME cho Web Domain
fs.writeFileSync(path.join(distDir, 'CNAME'), 'service.diticoms.vn');

console.log('✨ Build Web hoàn tất thành công!');
