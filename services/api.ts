
export async function callSheetAPI(url: string, action: string, data: any = {}) {
  try {
    const payload = { ...data, action };
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Standard for simple GAS web apps without explicit CORS headers
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    
    // Since 'no-cors' mode returns an opaque response, 
    // real implementations usually use standard CORS-enabled backends or JSONP.
    // For this demonstration and to match common GAS patterns, 
    // we'll attempt a regular fetch but handle the no-cors limitation.
    // If the user's GAS script is set to allow CORS (which the provided one should), we can use:
    
    const corsResponse = await fetch(url + (url.includes('?') ? '&' : '?') + new URLSearchParams({ action }), {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return await corsResponse.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
