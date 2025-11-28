export enum ContentMode {
  STORY = 'STORY',
  MARKETING = 'MARKETING',
  EDUCATION = 'EDUCATION'
}

export interface GeneratedContent {
  title: string;
  body: string;
  imagePrompt: string;
}

export interface GenerationResult {
  id: string;
  timestamp: number;
  mode: ContentMode;
  textData: GeneratedContent;
  imageData?: string; // Base64
  audioData?: AudioBuffer; // Decoded audio buffer
  status: 'generating_text' | 'generating_media' | 'completed' | 'error';
  error?: string;
}

export interface GeminiConfig {
  apiKey: string;
}