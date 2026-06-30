export const TELEGRAM_BOT_TOKEN = "8702934106:AAFoFg1faL9lImWpvkN7wMnQHihDvvhv6ro";
export const TELEGRAM_GROUP_ID = "-5396399705"; 

// You can add technician mappings here when they provide them
// e.g., { "Hiếu": "123456789" }
export const TECHNICIAN_TELEGRAM_MAP: Record<string, string> = {
  // placeholder
};

export const sendTelegramMessage = async (chatId: string, text: string) => {
  if (!chatId || !TELEGRAM_BOT_TOKEN) return false;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML' // Allow bold/italic in message
      })
    });
    const data = await response.json();
    if (!data.ok) {
      console.error("Telegram API Error:", data);
      
      // Try supergroup ID if normal group ID fails
      if (data.error_code === 400 && data.description.includes('chat not found')) {
        if (!chatId.startsWith('-')) {
          return sendTelegramMessage('-' + chatId, text);
        } else if (!chatId.startsWith('-100')) {
          return sendTelegramMessage('-100' + chatId.replace('-', ''), text);
        }
      }
    }
    return data.ok;
  } catch (error) {
    console.error("Failed to send Telegram message", error);
    return false;
  }
};

export const notifyNewTicket = async (ticketData: any, isUpdate = false) => {
  const { customer_name, phone, address, content, technician, ticket_number, status, revenue } = ticketData;
  
  const title = isUpdate ? `📝 CẬP NHẬT PHIẾU DỊCH VỤ` : `🚨 KHÁCH HÀNG MỚI`;
  
  const message = `
<b>${title}</b>
<b>Mã phiếu:</b> ${ticket_number || 'N/A'}
<b>Khách hàng:</b> ${customer_name || 'N/A'}
<b>SĐT:</b> ${phone || 'N/A'}
<b>Địa chỉ:</b> ${address || 'N/A'}
<b>Trạng thái:</b> ${status || 'N/A'}
<b>Nội dung:</b> ${content || 'N/A'}
<b>Kỹ thuật viên:</b> ${technician || 'Chưa phân công'}
<b>Doanh thu:</b> ${revenue ? revenue.toLocaleString('vi-VN') + ' đ' : '0 đ'}
`;

  // 1. Send to Group
  await sendTelegramMessage(TELEGRAM_GROUP_ID, message);
  
  // 2. Send to specific technician(s) if assigned
  if (technician) {
    const techList = technician.split(', ');
    for (const tech of techList) {
      const techChatId = TECHNICIAN_TELEGRAM_MAP[tech];
      if (techChatId) {
        await sendTelegramMessage(techChatId, `🔔 <b>BẠN CÓ CÔNG VIỆC MỚI</b>\n${message}`);
      }
    }
  }
};
