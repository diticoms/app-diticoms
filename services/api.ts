export async function callSheetAPI(url: string, action: string, data: any = {}) {
  try {
    const payload = { ...data, action };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Lỗi kết nối Server: ${response.status}`);
    }

    const text = await response.text();
    try {
      // Thử parse JSON, nếu server trả về chuỗi bẩn thì lọc bớt
      return JSON.parse(text);
    } catch (e) {
      console.warn("Phản hồi không phải JSON, thử parse lại...");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw new Error("Dữ liệu Server trả về không hợp lệ.");
    }
  } catch (error) {
    console.error("Chi tiết lỗi API:", error);
    throw error;
  }
}