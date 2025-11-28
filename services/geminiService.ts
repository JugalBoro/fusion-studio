import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ContentMode, GeneratedContent } from "../types";
import { decodeBase64, decodeAudioData } from "./audioUtils";

const API_KEY = process.env.API_KEY || '';

// Initialize client
// Note: In a real app, handle missing API key gracefully in UI
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Step 1: Generate the Text Content and Image Prompt
 */
export const generateTextContent = async (
  prompt: string, 
  mode: ContentMode
): Promise<GeneratedContent> => {
  
  const systemInstruction = `You are an expert creative assistant specializing in ${mode}. 
  Your goal is to generate a concise, high-quality piece of content based on the user's input.
  You must also create a highly descriptive, artistic image prompt that represents the content visually.
  
  Return the response in JSON format with the following schema:
  - title: A catchy title.
  - body: The main content (approx 100-150 words).
  - imagePrompt: A detailed physical description for an image generation model (no text in image, focus on style, lighting, and composition).`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          body: { type: Type.STRING },
          imagePrompt: { type: Type.STRING }
        },
        required: ["title", "body", "imagePrompt"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No text generated");
  
  return JSON.parse(text) as GeneratedContent;
};

/**
 * Step 2: Generate the Image based on the prompt from Step 1
 */
export const generateCreativeImage = async (imagePrompt: string): Promise<string> => {
  // Using the efficient flash-image model for speed and quality balance
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: imagePrompt }]
    },
    config: {
      // Generating a square image for the card
      // Note: gemini-2.5-flash-image doesn't strictly support aspectRatio config in all environments yet 
      // via the config object in the same way as Imagen, but we pass the prompt to guide it.
    }
  });

  // Extract base64 image
  let base64Image = '';
  const parts = response.candidates?.[0]?.content?.parts;
  
  if (parts) {
    for (const part of parts) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }
  }

  if (!base64Image) {
    throw new Error("Failed to generate image");
  }

  return base64Image;
};

/**
 * Step 3: Generate Speech (TTS) from the body text
 */
export const generateNarration = async (text: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is usually a good neutral voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("Failed to generate audio");
  }

  const audioBytes = decodeBase64(base64Audio);
  return await decodeAudioData(audioBytes, audioContext, 24000, 1);
};