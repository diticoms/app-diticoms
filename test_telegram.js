const token = "8702934106:AAFoFg1faL9lImWpvkN7wMnQHihDvvhv6ro";
let chatId = "-5721936702";

async function testTelegram() {
  try {
    console.log("Testing with Chat ID:", chatId);
    let response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: "Test message from System" })
    });
    let data = await response.json();
    console.log("Response 1:", data);

    if (!data.ok && data.error_code === 400 && data.description.includes('chat not found')) {
      chatId = "-100" + chatId.replace('-', '');
      console.log("Testing with Chat ID:", chatId);
      response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: "Test message from System with -100" })
      });
      data = await response.json();
      console.log("Response 2:", data);
    }
  } catch(e) {
    console.error(e);
  }
}
testTelegram();
