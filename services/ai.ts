
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Khởi tạo Gemini AI Assistant
 * Lưu ý: process.env.API_KEY được hệ thống tự động cung cấp.
 */
const getAiInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Chẩn đoán lỗi kỹ thuật và đề xuất linh kiện
 */
export const diagnoseServiceAction = async (content: string) => {
  if (!content || content.length < 5) {
    throw new Error("Mô tả quá ngắn để AI có thể chẩn đoán.");
  }

  const ai = getAiInstance();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Khách hàng báo lỗi: "${content}". Hãy phân tích lỗi kỹ thuật này và đề xuất các dịch vụ hoặc linh kiện thay thế kèm đơn giá phù hợp tại thị trường Việt Nam hiện nay.`,
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
                desc: { type: Type.STRING, description: "Tên linh kiện hoặc dịch vụ đề xuất" },
                qty: { type: Type.NUMBER, description: "Số lượng" },
                price: { type: Type.NUMBER, description: "Đơn giá dự kiến (VNĐ)" }
              },
              required: ["desc", "qty", "price"]
            }
          }
        },
        required: ["suggestions"]
      },
      systemInstruction: "Bạn là một chuyên gia sửa chữa máy tính và thiết bị điện tử của Diticoms. Bạn chỉ trả về dữ liệu dưới dạng JSON để hệ thống tự động điền vào hóa đơn."
    }
  });

  try {
    // Truy cập trực tiếp thuộc tính .text (không phải phương thức)
    const jsonStr = response.text || "{}";
    const result = JSON.parse(jsonStr);
    return result.suggestions || [];
  } catch (e) {
    console.error("Lỗi phân tích JSON từ AI:", e);
    return [];
  }
};

/**
 * Trợ lý Chat: Tìm kiếm, lọc và thống kê dữ liệu
 */
export const queryServiceData = async (userQuery: string, services: any[]) => {
  const ai = getAiInstance();

  // Tối ưu hóa dữ liệu ngữ cảnh gửi lên AI
  const contextData = services.map(s => ({
    khach_hang: s.customerName,
    ngay: s.created_at?.split('T')[0],
    trang_thai: s.status,
    ky_thuat: s.technician,
    doanh_thu: Number(s.revenue || 0),
    noi_dung: s.content
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Câu hỏi từ quản lý: "${userQuery}"\n\nDữ liệu phiếu dịch vụ hiện có: ${JSON.stringify(contextData.slice(0, 50))}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: { type: Type.STRING, description: "Câu trả lời phân tích hoặc thống kê" },
          filterUpdate: {
            type: Type.OBJECT,
            properties: {
              searchTerm: { type: Type.STRING, description: "Từ khóa cần tìm nếu người dùng yêu cầu lọc" },
              status: { type: Type.STRING, description: "Trạng thái cần lọc" },
              viewAll: { type: Type.BOOLEAN, description: "Bật chế độ xem tất cả nếu cần" }
            }
          }
        },
        required: ["answer"]
      },
      systemInstruction: "Bạn là trợ lý dữ liệu thông minh của Diticoms. Bạn giúp nhân viên thống kê doanh thu, tìm kiếm khách hàng hoặc lọc trạng thái công việc. Trả lời ngắn gọn, chuyên nghiệp."
    }
  });

  try {
    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (e) {
    return { answer: "Xin lỗi, tôi gặp trục trặc khi truy xuất dữ liệu." };
  }
};
