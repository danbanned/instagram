import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use a fast, free-tier friendly model
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});

/**
 * Generate donor-related text safely
 * @param {string} prompt
 * @returns {Promise<{ success: boolean, text?: string, error?: string }>}
 */
export async function generateDonorText(prompt) {
  try {
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Prompt must be a non-empty string");
    }

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt.trim() }],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 500,
      },
    });

    const response = result.response;
    const text = response.text();

    return {
      success: true,
      text,
    };
  } catch (error) {
    console.error("Gemini generation error:", error);

    return {
      success: false,
      error: error.message || "Failed to generate text",
    };
  }
}
