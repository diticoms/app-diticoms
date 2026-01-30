
#!/bin/bash

# Diticoms Auto Deploy Script

echo "--- Bắt đầu quy trình cập nhật Diticoms App ---"

# 1. Chạy Build
echo "Step 1: Building..."
npm run build

# 2. Tăng version (tùy chọn)
# npm run version-up

# 3. Git Operations
echo "Step 2: Adding changes..."
git add .

# Nhận tin nhắn commit từ người dùng hoặc dùng mặc định
read -p "Nhập nội dung ghi chú cập nhật (Enter để bỏ qua): " msg
if [ -z "$msg" ]; then
    msg="Update: Cập nhật hệ thống định kỳ"
fi

echo "Step 3: Committing with message: $msg"
git commit -m "$msg"

echo "Step 4: Pushing to GitHub..."
git push origin main

echo "--- Cập nhật thành công lên service.diticoms.vn ---"
