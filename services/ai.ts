
import { GoogleGenAI, Type } from "@google/genai";

// Lấy API KEY an toàn để tránh ReferenceError: process is not defined
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  } catch (e) {
    return '';
  }
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });

export const diagnoseServiceAction = async (content: string) => {
  if (!apiKey) {
    throw new Error("Hệ thống chưa cấu hình API Key cho AI. Vui lòng liên hệ quản trị viên.");
  }

  if (!content || content.length < 5) {
    throw new Error("Mô tả quá ngắn. Vui lòng nhập chi tiết lỗi để AI chẩn đoán chính xác hơn.");
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Khách hàng báo lỗi: "${content}". 
    Hãy đóng vai chuyên gia sửa chữa của Diticoms. Hãy phân tích lỗi và đề xuất các dịch vụ hoặc linh kiện thay thế cần thiết. 
    Lưu ý: Đơn giá (price) phải phù hợp với thị trường sửa chữa máy tính/điện tử tại Việt Nam.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                desc: { type: Type.STRING, description: "Tên linh kiện hoặc dịch vụ" },
                qty: { type: Type.NUMBER, description: "Số lượng" },
                price: { type: Type.NUMBER, description: "Đơn giá (VNĐ)" }
              },
              required: ["desc", "qty", "price"]
            }
          }
        },
        required: ["suggestions"]
      },
      systemInstruction: "Bạn là trợ lý kỹ thuật thông minh. Chỉ trả về dữ liệu JSON để hệ thống tự động điền vào hóa đơn. Ngôn ngữ: Tiếng Việt."
    }
  });

  try {
    const jsonStr = response.text || "{}";
    const result = JSON.parse(jsonStr);
    return result.suggestions;
  } catch (e) {
    console.error("Lỗi xử lý phản hồi AI:", e);
    throw new Error("AI phản hồi không đúng định dạng. Vui lòng thử lại.");
  }
};
