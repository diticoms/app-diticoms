export async function callSheetAPI(url: string, action: string, data: any = {}, retryCount = 0) {
  const MAX_RETRIES = 1;
  const TIMEOUT = 20000;

  if (!url || !url.startsWith('http')) {
    throw new Error("Cấu hình URL Server không hợp lệ.");
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT);

    console.debug(`[API] Gọi: ${action}`, data);

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

    // Ghi log để kiểm tra nội dung thực từ GAS
    console.debug(`[API Res] ${action}:`, text);

    try {
      return JSON.parse(text);
    } catch (e) {
      // Cố gắng tách JSON nếu GAS trả về kèm mã HTML/Log
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error("Phản hồi từ Server không đúng định dạng JSON.");
    }
  } catch (error: any) {
    console.error(`[API Err] ${action}:`, error);
    if (retryCount < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 1500));
      return callSheetAPI(url, action, data, retryCount + 1);
    }
    throw error;
  }
}