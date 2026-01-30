
#!/bin/bash

# Diticoms Auto Deploy Script

echo "--- Bắt đầu quy trình cập nhật Diticoms App ---"

# 1. Chạy Build
echo "Step 1: Building and injecting CNAME configuration..."
npm run build

# 2. Tăng version tự động
npm run version-up

# 3. Git Operations
echo "Step 2: Adding changes..."
git add .

# Nhận tin nhắn commit từ người dùng hoặc dùng mặc định
read -p "Nhập nội dung ghi chú cập nhật (Enter để dùng mặc định): " msg
if [ -z "$msg" ]; then
    msg="Update: Hệ thống đồng bộ (Bảo trì domain service.diticoms.vn)"
fi

echo "Step 3: Committing with message: $msg"
git commit -m "$msg"

echo "Step 4: Pulling latest changes from GitHub to avoid conflicts..."
git pull --rebase origin main

echo "Step 5: Pushing to GitHub..."
git push origin main

echo "--- Đã cập nhật thành công lên GitHub và bảo toàn domain ---"
