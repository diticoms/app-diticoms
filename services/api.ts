
export async function callSheetAPI(url: string, action: string, data: any = {}, retryCount = 0) {
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

    // Tối ưu hóa việc tìm khối JSON trong chuỗi phản hồi (phòng trường hợp Apps Script trả về rác)
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error: any) {
    if (retryCount < MAX_RETRIES && (error.name === 'AbortError' || error.message.includes('HTTP'))) {
      return callSheetAPI(url, action, data, retryCount + 1);
    }
    throw error;
  }
}
