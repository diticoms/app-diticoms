
#!/bin/bash

# Diticoms Auto Deploy Script (Web & Mobile Prep)

echo "--- Bắt đầu quy trình cập nhật Diticoms ---"

# 1. Khởi tạo assets
echo "Step 1: Preparing assets..."
node generate-assets.js

# 2. Chạy Build Web
echo "Step 2: Building distribution..."
node build.js

# 3. Tăng version tự động
npm run version-up

# 4. Git Operations
echo "Step 3: Committing changes..."
git add .

read -p "Nhập nội dung ghi chú cập nhật: " msg
if [ -z "$msg" ]; then
    msg="Update: Cập nhật hệ thống (Web & Mobile Config)"
fi

git commit -m "$msg"

echo "Step 4: Pushing to main..."
git push origin main

echo "--- Hoàn tất! Nếu build APK, hãy chạy: npm run android:build ---"
