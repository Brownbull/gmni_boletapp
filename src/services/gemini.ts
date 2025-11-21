import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/gemini';
import { cleanJson } from '../utils/json';
import { Transaction } from '../types/transaction';

export async function analyzeReceipt(
    images: string[],
    currency: string
): Promise<Transaction> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const imageParts = images.map(b64 => {
        const match = b64.match(/^data:(.+);base64,(.+)$/);
        return {
            inlineData: {
                mimeType: match ? match[1] : 'image/jpeg',
                data: match ? match[2] : b64
            }
        };
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const prompt = `Analyze receipt. Context: ${currency}. Today: ${todayStr}. Strict JSON output. Return 'total' and 'price' as INTEGERS (no dots/commas). Extract: merchant (store name), date (YYYY-MM-DD), total, category (one of: Supermarket, Restaurant, Bakery, Butcher, Bazaar, Veterinary, PetShop, Medical, Pharmacy, Technology, StreetVendor, Transport, Services, Other). Items: name, price, category (Fresh Food, Pantry, Drinks, Household, Personal Care, Pets, Electronics, Apparel, Other), subcategory. If multiple dates, choose closest to today.`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }, ...imageParts]
            }]
        })
    });

    const json = await res.json();
    if (!json.candidates) throw new Error("API Error");

    return JSON.parse(cleanJson(json.candidates[0].content.parts[0].text));
}
