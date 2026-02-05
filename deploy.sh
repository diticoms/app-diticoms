
#!/bin/bash

# Diticoms Auto Deploy Script for GitHub Pages (Web Only)

echo "--- Bắt đầu quy trình cập nhật Diticoms Web App ---"

# 1. Chạy Build
echo "Step 1: Building distribution..."
node build.js

# 2. Tăng version tự động
npm run version-up

# 3. Git Operations
echo "Step 2: Adding changes..."
git add .

# Nhận tin nhắn commit từ người dùng hoặc dùng mặc định
read -p "Nhập nội dung ghi chú cập nhật: " msg
if [ -z "$msg" ]; then
    msg="Update: Cập nhật hệ thống Web (Triển khai qua gh-pages)"
fi

echo "Step 3: Committing with message: $msg"
git commit -m "$msg"

echo "Step 4: Pushing to main..."
git push origin main

echo "--- Đã đẩy mã nguồn lên main. Vui lòng đợi GitHub Action hoàn tất deploy ---"
echo "--- URL: https://service.diticoms.vn ---"
