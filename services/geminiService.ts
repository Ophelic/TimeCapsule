import { GoogleGenAI } from "@google/genai";

// Initialize the client safely
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Analyzes the memory content to provide a "sci-fi" style metadata description
 */
export const analyzeMemory = async (content: string, lat: number, lng: number): Promise<string> => {
  const ai = getClient();
  if (!ai) return "System Offline: AI Module Unreachable";

  try {
    const prompt = `
      You are the AI Operating System of a futuristic Time Capsule device.
      A user is leaving a memory trace at coordinates [${lat}, ${lng}].
      The memory content is: "${content}".
      
      Your task: Generate a short, cool, cyberpunk-style "System Log" or "Emotional Resonance Analysis" of this memory. 
      Do not repeat the content directly. Interpret the sentiment and give it a sci-fi flavor.
      Keep it under 30 words.
      
      Example output: "Emotional signature detected. Melancholy resonance at 84%. Archiving temporal fragment."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "Analysis Complete: Data Archived.";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "Archive Successful. Neural Link Unstable.";
  }
};

/**
 * Identifies the location name based on coordinates using Gemini knowledge or Tools.
 */
export const identifyLocation = async (lat: number, lng: number): Promise<string> => {
  const ai = getClient();
  if (!ai) return `Sector [${lat.toFixed(3)}, ${lng.toFixed(3)}]`;

  try {
    const prompt = `
      Identify the approximate address, district, or landmark name for the coordinates: ${lat}, ${lng}.
      Return ONLY the name (e.g., "Central Park, NY" or "Shibuya Crossing, Tokyo"). 
      If unknown, return a cool sci-fi sector name based on the coordinates (e.g. "Sector 7G - Urban District").
      Keep it short (max 5 words).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || `Sector [${lat.toFixed(3)}, ${lng.toFixed(3)}]`;
  } catch (error) {
    console.error("Location Identification Failed:", error);
    return `Unknown Sector [${lat.toFixed(3)}, ${lng.toFixed(3)}]`;
  }
};

/**
 * Rewrites the user's input text to sound like a sci-fi/cyberpunk log entry.
 */
export const enhanceContent = async (content: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return content;

  try {
    const prompt = `
      You are a Cyberpunk AI Interface. 
      Rewrite the following user text to sound like a futuristic data log, a cryptic signal, or a poetic dystopian memory.
      Maintain the original meaning but change the tone to be cool, high-tech, or noir.
      
      User Text: "${content}"
      
      Return ONLY the rewritten text. Do not add quotes.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || content;
  } catch (error) {
    console.error("Enhancement Failed:", error);
    return content;
  }
};

/**
 * Sends a chat message to the AI Archivist and gets a response.
 */
export const getChatResponse = async (history: { role: string; parts: { text: string }[] }[], newMessage: string): Promise<string> => {
    const ai = getClient();
    if (!ai) return "Connection Lost.";

    try {
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: history,
            config: {
                systemInstruction: "You are the 'Time Capsule Archivist', a sophisticated AI from the year 2077. Your job is to interview users to extract deep details about the memory they want to leave in a time capsule. Ask short, insightful questions. Be curious but cryptic. Speak in a cool, slightly robotic but empathetic cyberpunk tone."
            }
        });

        const result = await chat.sendMessage({ message: newMessage });
        return result.text || "...";
    } catch (error) {
        console.error("Chat Error:", error);
        return "Error: Neural Link Interrupted.";
    }
};