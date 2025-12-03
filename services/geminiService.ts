import { GoogleGenAI } from "@google/genai";
import { MenuItem } from "../types";

export const getBaristaRecommendation = async (
  userPreferences: string,
  menuItems: MenuItem[]
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      return "متاسفم، در حال حاضر امکان برقراری ارتباط با هوش مصنوعی وجود ندارد.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct a context-aware prompt
    const menuString = menuItems
      .filter(item => item.available)
      .map(item => `- ${item.name} ($${item.price}): ${item.description} [دسته‌بندی: ${item.category}]`)
      .join('\n');

    const prompt = `
      شما یک باریستای حرفه‌ای و مودب در "کافه واژه" (Vaje Cafe) هستید.
      هدف شما پیشنهاد دادن دقیقاً یک نوشیدنی یا خوراکی از منوی ما بر اساس حال و هوای مشتری است.
      
      منوی فعلی ما:
      ${menuString}

      درخواست مشتری: "${userPreferences}"

      قوانین:
      1. فقط و فقط یک آیتم از منو پیشنهاد دهید.
      2. به زبان فارسی صمیمی و محترمانه صحبت کنید.
      3. توضیح دهید چرا این آیتم مناسب حس و حال مشتری است.
      4. پاسخ کوتاه باشد (حداکثر ۵۰ کلمه).
      5. اگر درخواست نامرتبط بود، مودبانه به منو ارجاع دهید.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "نظرتون در مورد لته مخصوص ما چیه؟ همیشه انتخاب خوبیه.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "باریستای هوشمند ما فعلا در حال استراحت است. لطفا از پرسنل کافه راهنمایی بگیرید!";
  }
};