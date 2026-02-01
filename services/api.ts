export async function callSheetAPI(url: string, action: string, data: any = {}, retryCount = 0) {
  const MAX_RETRIES = 2;
  const TIMEOUT = 15000; // 15 seconds timeout

  try {
    const payload = { ...data, action };
    
    // Tạo controller để xử lý timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      else throw new Error("Dữ liệu Server không hợp lệ.");
    }

    // Nếu API trả về lỗi cụ thể từ Server, xử lý tại đây
    if (result.status === 'error' && result.error?.includes('Unauthorized')) {
        // Trường hợp token/phiên hết hạn (nếu có hệ thống token sau này)
        return result; 
    }

    return result;
  } catch (error: any) {
    console.error(`API Error (Action: ${action}, Attempt: ${retryCount + 1}):`, error);
    
    // Nếu là lỗi mạng hoặc timeout, thử lại nếu chưa quá giới hạn
    if ((error.name === 'AbortError' || error.message.includes('Network')) && retryCount < MAX_RETRIES) {
      await new Promise(res => setTimeout(res, 1000 * (retryCount + 1))); // Đợi tăng dần
      return callSheetAPI(url, action, data, retryCount + 1);
    }
    
    throw error;
  }
}