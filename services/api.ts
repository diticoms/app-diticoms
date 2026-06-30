import { collection, getDocs, doc, setDoc, deleteDoc, query, where, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function callSheetAPI(url: string, action: string, data: any = {}, retryCount = 0): Promise<any> {
  try {
    let result: any = null;
    
    if (action === 'read') {
      const querySnapshot = await getDocs(collection(db, "services"));
      let services: any[] = [];
      querySnapshot.forEach((doc) => {
        services.push(doc.data());
      });
      
      // Auto-migrate from Google Sheet if Firebase is empty
      if (services.length === 0) {
        console.log("Firebase is empty. Migrating from Google Sheet...");
        services = await callGoogleSheet(url, 'read', data);
        if (Array.isArray(services) && services.length > 0) {
          for (const t of services) {
            if (t.id) await setDoc(doc(db, "services", String(t.id)), t);
          }
        }
      }
      result = services;
    } else if (action === 'create' || action === 'update') {
      const docRef = doc(db, "services", String(data.id));
      await setDoc(docRef, data);
      result = { status: action === 'create' ? 'success' : 'updated', id: data.id };
    } else if (action === 'delete') {
      await deleteDoc(doc(db, "services", String(data.id)));
      result = { status: 'deleted', id: data.id };
    } else if (action === 'login') {
      const querySnapshot = await getDocs(query(collection(db, "users"), where("username", "==", data.username), where("password", "==", data.password)));
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        result = { status: 'success', user: userData };
      } else {
        // Fallback to Google Sheet (auto-migrate user)
        result = await callGoogleSheet(url, 'login', data);
        if (result && result.status === 'success' && result.user) {
          const userDoc = doc(db, "users", data.username);
          await setDoc(userDoc, { ...result.user, password: data.password });
        }
      }
    } else if (action === 'read_settings') {
      const docRef = doc(db, "config", "settings");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        result = docSnap.data();
      } else {
        result = await callGoogleSheet(url, 'read_settings', data);
        if (result && Object.keys(result).length > 0) {
          await setDoc(docRef, result);
        }
      }
    } else if (action === 'save_settings') {
      const docRef = doc(db, "config", "settings");
      await setDoc(docRef, data, { merge: true });
      result = { status: 'success' };
    } else if (action === 'read_pricelist') {
      const querySnapshot = await getDocs(collection(db, "pricelist"));
      let list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data());
      });
      if (list.length === 0) {
        list = await callGoogleSheet(url, 'read_pricelist', data);
        if (Array.isArray(list) && list.length > 0) {
          for (const item of list) {
             await setDoc(doc(db, "pricelist", item.name), item);
          }
        }
      }
      result = list;
    }

    // --- DUAL WRITE (GHI NGẦM VÀO GOOGLE SHEET) ---
    // Chỉ đồng bộ các thao tác thay đổi dữ liệu
    if (['create', 'update', 'delete', 'save_settings'].includes(action)) {
      // Gọi fetch API chạy ngầm không cần await để không block giao diện
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...data, action })
      }).catch(err => console.error("Lỗi đồng bộ ngầm Google Sheet:", err));
    }

    if (result) return result;

    return await callGoogleSheet(url, action, data);
  } catch (error: any) {
    console.error("Firebase Error:", error);
    // Fallback toàn bộ về Google Sheet nếu Firebase lỗi
    return callGoogleSheet(url, action, data);
  }
}

// Hàm kết nối Google Sheet cũ được giữ lại để Fallback & Migration
async function callGoogleSheet(url: string, action: string, data: any = {}, retryCount = 0): Promise<any> {
  const MAX_RETRIES = 1;
  const TIMEOUT = 20000;

  if (!url || !url.startsWith('http')) {
    throw new Error("Cấu hình URL Server không hợp lệ.");
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...data, action }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    if (!text) throw new Error("Server phản hồi rỗng.");

    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error: any) {
    if (retryCount < MAX_RETRIES && (error.name === 'AbortError' || error.message.includes('HTTP'))) {
      return callGoogleSheet(url, action, data, retryCount + 1);
    }
    throw error;
  }
}
