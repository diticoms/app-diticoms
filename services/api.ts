export async function callSheetAPI(url: string, action: string, data: any = {}) {
  try {
    const payload = { ...data, action };
    
    // Google Apps Script yêu cầu fetch thông thường để xử lý redirect (302) và trả về data.
    // 'no-cors' sẽ khiến kết quả trả về là 'opaque', không thể đọc được JSON.
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error details:", error);
    throw error;
  }
}