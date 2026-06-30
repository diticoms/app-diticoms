import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from "firebase/firestore";
import fetch from "node-fetch";

// Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyAUdue23D-FLH9sb2IRAY7QDLEdltQfLww",
  authDomain: "diticoms-service.firebaseapp.com",
  projectId: "diticoms-service",
  storageBucket: "diticoms-service.firebasestorage.app",
  messagingSenderId: "678527445603",
  appId: "1:678527445603:web:c1b555937baf89ff536656"
};

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxQBir3GM059m0tqw246UyYFHbbEnlKcq01GfyRgJoPR3h6ZEffBymJIIiZl0hh2CCS/exec";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncData() {
  console.log("🚀 Bắt đầu quá trình đồng bộ toàn bộ dữ liệu từ Google Sheet sang Firebase...");

  try {
    // 1. Đồng bộ danh sách Phiếu
    console.log("📥 Đang tải danh sách Phiếu (Tickets)...");
    const resTickets = await fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'read' })
    });
    const textTickets = await resTickets.text();
    const jsonMatch = textTickets.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    const tickets = JSON.parse(jsonMatch ? jsonMatch[0] : textTickets);
    
    if (Array.isArray(tickets)) {
      let count = 0;
      for (const t of tickets) {
        if (t.id) {
          await setDoc(doc(db, "services", String(t.id)), t);
          count++;
        }
      }
      console.log(`✅ Đã đồng bộ thành công ${count} phiếu dịch vụ.`);
    }

    // 2. Đồng bộ Bảng giá
    console.log("📥 Đang tải Bảng giá (Pricelist)...");
    const resPrice = await fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'read_pricelist' })
    });
    const textPrice = await resPrice.text();
    const jsonMatchPrice = textPrice.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    const pricelist = JSON.parse(jsonMatchPrice ? jsonMatchPrice[0] : textPrice);
    
    if (Array.isArray(pricelist)) {
      let count = 0;
      for (const item of pricelist) {
        if (item.name) {
          const safeId = String(item.name).replace(/\//g, '-');
          await setDoc(doc(db, "pricelist", safeId), item);
          count++;
        }
      }
      console.log(`✅ Đã đồng bộ thành công ${count} dịch vụ trong bảng giá.`);
    }

    // 3. Đồng bộ Cấu hình
    console.log("📥 Đang tải Cấu hình hệ thống (Config)...");
    const resConfig = await fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'read_settings' })
    });
    const textConfig = await resConfig.text();
    const jsonMatchConfig = textConfig.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    const config = JSON.parse(jsonMatchConfig ? jsonMatchConfig[0] : textConfig);
    
    if (config && Object.keys(config).length > 0) {
      await setDoc(doc(db, "config", "settings"), config);
      console.log(`✅ Đã đồng bộ cấu hình thành công.`);
    }

    // 4. Đồng bộ Admin User (Mặc định)
    await setDoc(doc(db, "users", "admin"), {
      username: "admin",
      password: "123", // Thay bằng mật khẩu thật của bạn nếu cần
      name: "Administrator",
      role: "admin",
      associatedTech: ""
    });
    console.log("✅ Đã tạo/cập nhật tài khoản Admin.");

    console.log("🎉 ĐỒNG BỘ HOÀN TẤT!");
    process.exit(0);

  } catch (error) {
    console.error("❌ LỖI TRONG QUÁ TRÌNH ĐỒNG BỘ:", error);
    process.exit(1);
  }
}

syncData();
