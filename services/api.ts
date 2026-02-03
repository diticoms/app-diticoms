
export async function callSheetAPI(url: string, action: string, data: any = {}, retryCount = 0) {
  const MAX_RETRIES = 1;
  const TIMEOUT = 25000;

  if (!url || !url.startsWith('http')) {
    throw new Error("Cấu hình URL Server không hợp lệ.");
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...data, action }),
      signal: controller.signal
    });

    clearTimeout(id);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    if (!text) throw new Error("Server phản hồi rỗng.");

    try {
      // Thử parse trực tiếp trước
      return JSON.parse(text);
    } catch (e) {
      // Nếu thất bại, dùng Regex để trích xuất khối JSON chuẩn nhất
      // Loại bỏ các tiền tố như "OK", "Success" hoặc các ký tự rác xung quanh
      const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error("[API JSON Parse Error Raw]:", text);
          throw new Error("Dữ liệu từ Server bị lỗi cấu trúc JSON.");
        }
      }
      throw new Error("Không tìm thấy dữ liệu JSON hợp lệ trong phản hồi.");
    }
  } catch (error: any) {
    console.error(`[API Error] ${action}:`, error);
    if (retryCount < MAX_RETRIES && error.name === 'AbortError') {
      await new Promise(r => setTimeout(r, 1000));
      return callSheetAPI(url, action, data, retryCount + 1);
    }
    throw error;
  }
}
