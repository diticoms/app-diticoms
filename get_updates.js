const token = "8702934106:AAFoFg1faL9lImWpvkN7wMnQHihDvvhv6ro";

async function getUpdates() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
getUpdates();
