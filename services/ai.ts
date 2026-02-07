
import { GoogleGenAI, Type } from "@google/genai";

// Lấy API KEY an toàn. process.env.API_KEY được hệ thống tự động cung cấp khi deploy.
const getApiKey = () => {
  try {
    // Trong môi trường ESM trình duyệt, process.env thường được inject thông qua build tool hoặc script tag
    return (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';
  } catch (e) {
    return '';
  }
};

const apiKey = getApiKey();

// Hàm khởi tạo instance AI mới (tránh dùng biến static nếu key chưa sẵn sàng)
const getAiInstance = () => {
  const key = getApiKey();
  return new GoogleGenAI({ apiKey: key || 'dummy_key' });
};

export const diagnoseServiceAction = async (content: string) => {
  const currentKey = getApiKey();
  if (!currentKey) {
    throw new Error("Hệ thống AI chưa sẵn sàng (Thiếu API Key). Vui lòng kiểm tra lại cấu hình hoặc liên hệ admin.");
  }

  if (!content || content.length < 5) {
    throw new Error("Mô tả quá ngắn. Vui lòng nhập chi tiết lỗi để AI chẩn đoán chính xác hơn.");
  }

  const ai = getAiInstance();
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
      systemInstruction: "Bạn là trợ lý kỹ thuật thông minh của Diticoms. Chỉ trả về dữ liệu JSON để hệ thống tự động điền vào hóa đơn. Ngôn ngữ: Tiếng Việt."
    }
  });

  try {
    const jsonStr = response.text || "{}";
    const result = JSON.parse(jsonStr);
    return result.suggestions;
  } catch (e) {
    console.error("Lỗi xử lý phản hồi AI:", e);
    throw new Error("AI phản hồi không đúng định dạng. Vui lòng thử lại sau.");
  }
};
