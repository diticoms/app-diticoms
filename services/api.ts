
export async function callSheetAPI(url: string, action: string, data: any = {}, retryCount = 0) {
  const MAX_RETRIES = 1;
  const TIMEOUT = 20000;

  if (!url || !url.startsWith('http')) {
    throw new Error("Cấu hình URL Server không hợp lệ.");
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT);

    console.debug(`[API] Action: ${action}`, data);

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
      return JSON.parse(text);
    } catch (e) {
      // Xử lý trường hợp Script trả về JSON thô hoặc có ký tự thừa
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
      throw new Error("Phản hồi không phải JSON hợp lệ.");
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
