
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
        'jspdf',
        'xlsx',
        '@google/genai',
        'react-markdown'
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
const publicLogoPng = path.join(__dirname, 'public', 'logo.png');
const publicLogoSvg = path.join(__dirname, 'public', 'logo.svg');
const destRootLogoPng = path.join(distDir, 'logo.png');
const destRootLogoSvg = path.join(distDir, 'logo.svg');
const destPublicLogoPng = path.join(distPublicDir, 'logo.png');

// Phục hồi logo.png nếu bị mất
if (!fs.existsSync(publicLogoPng)) {
    const LOGO_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADJ0lEQVR4nO2az2sTQRTHP7vZbJNNo0mTrYpW8SJeFfGkFfGgeOtf4EUPXvTiXfGuePCuePFf4EUPHjx4UPGieNBK8SJeREUrWpOmTZumbbLZbGZ8D0I3ySab7O7Mzs78fGBYmJn3mXm/vPdmZ96UUkpYmBAszEwoDPCmMMAr8H8BvAJP7UADGAn07u2V2K616+M6uG4V7K6C3ZWyf8HuvXre2/UfAt4CH4Bv9f09Bf+I9Y6Y2AnvO2IDnInF3vHeV6m0A34CP1n9M6FvX0x8V2ycAn8L/OQG+MB9v09E7/Xf2/fPgn9Z/YvGfxY+YvC98AnDpyT8zOAr4XfCpxS+E77rY7O6r6XGZxW+Fv5Z+Gvht8Kvhd8IvzX4jY8vXz++fP1wFvx18K8NfuPjr4S/En5NfA1+6eN79fE9/vj66+evmY8ZfO3jS+Xz6PNo87fA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8/wH8D7Hh7OqXWv8OAAAAAElFTkSuQmCC";
    if (!fs.existsSync(path.join(__dirname, 'public'))) {
        fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
    }
    fs.writeFileSync(publicLogoPng, Buffer.from(LOGO_BASE64, 'base64'));
    console.log('✅ Đã phục hồi logo.png từ dữ liệu dự phòng');
}

// Copy logo.png
if (fs.existsSync(publicLogoPng)) {
    fs.copyFileSync(publicLogoPng, destRootLogoPng);
    fs.copyFileSync(publicLogoPng, destPublicLogoPng);
    console.log('🖼️ Đã copy logo.png vào root và public/');
}

// Copy logo.svg
if (fs.existsSync(publicLogoSvg)) {
    fs.copyFileSync(publicLogoSvg, destRootLogoSvg);
    console.log('🖼️ Đã copy logo.svg vào root dist/');
}

// 5. CNAME cho Web Domain
fs.writeFileSync(path.join(distDir, 'CNAME'), 'service.diticoms.vn');

console.log('✨ Build Web hoàn tất thành công!');
