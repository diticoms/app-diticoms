
const fs = require('fs');
const path = require('path');

// Dữ liệu logo PNG Base64 (Đây là mẫu logo Diticoms xanh trắng đã render sẵn)
const LOGO_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADJ0lEQVR4nO2az2sTQRTHP7vZbJNNo0mTrYpW8SJeFfGkFfGgeOtf4EUPXvTiXfGuePCuePFf4EUPHjx4UPGieNBK8SJeREUrWpOmTZumbbLZbGZ8D0I3ySab7O7Mzs78fGBYmJn3mXm/vPdmZ96UUkpYmBAszEwoDPCmMMAr8H8BvAJP7UADGAn07u2V2K616+M6uG4V7K6C3ZWyf8HuvXre2/UfAt4CH4Bv9f09Bf+I9Y6Y2AnvO2IDnInF3vHeV6m0A34CP1n9M6FvX0x8V2ycAn8L/OQG+MB9v09E7/Xf2/fPgn9Z/YvGfxY+YvC98AnDpyT8zOAr4XfCpxS+E77rY7O6r6XGZxW+Fv5Z+Gvht8Kvhd8IvzX4jY8vXz++fP1wFvx18K8NfuPjr4S/En5NfA1+6eN79fE9/vj66+evmY8ZfO3jS+Xz6PNo87fA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8p8D/BPynwP8C/KfA/wL8/wH8D7Hh7OqXWv8OAAAAAElFTkSuQmCC";

const folders = [
    'assets',
    'assets/logo',
    'assets/icon',
    'assets/splash',
    'public'
];

folders.forEach(f => {
    const dir = path.join(__dirname, f);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created: ${f}`);
    }
});

const buffer = Buffer.from(LOGO_BASE64, 'base64');

// Tạo các file ảnh cho app
fs.writeFileSync(path.join(__dirname, 'logo.png'), buffer);
fs.writeFileSync(path.join(__dirname, 'public/logo.png'), buffer);
fs.writeFileSync(path.join(__dirname, 'assets/icon.png'), buffer);
fs.writeFileSync(path.join(__dirname, 'assets/logo/logo.png'), buffer);
// Splash screen thường cần kích thước lớn hơn, nhưng ở đây dùng chung logo làm demo
fs.writeFileSync(path.join(__dirname, 'assets/splash.png'), buffer);

console.log('✅ Generated app assets (logo.png, icon.png, splash.png)');
