// Google Sheets integration with fallback to local storage
const SHEET_URL = process.env.VITE_GOOGLE_SHEETS_URL || 
  "https://script.google.com/macros/s/AKfycbyjc5rSdo_PPxmagclDzf-0BAsP9nckIcbOCsWj0jQnerbeK9wW38oSeOcVhbeBLmCe/exec";

export async function fetchFromGoogleSheets(action: string): Promise<any> {
  try {
    const response = await fetch(`${SHEET_URL}?action=${action}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Google Sheets fetch error:', error);
    throw error;
  }
}

export async function saveToGoogleSheets(action: string, data: any): Promise<any> {
  try {
    const response = await fetch(`${SHEET_URL}?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Google Sheets save error:', error);
    throw error;
  }
}
