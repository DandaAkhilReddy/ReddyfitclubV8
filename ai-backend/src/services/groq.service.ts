// Groq Service - Ultra-fast LLM inference
import Groq from 'groq-sdk';
import { GroqChatMessage } from '../types';

class GroqService {
  private client: Groq;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }

    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  /**
   * Generate chat completion using Groq's ultra-fast inference
   */
  async chat(
    messages: GroqChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: options?.model || 'llama-3.1-8b-instant', // Super fast & cheap
        messages: messages as any,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
        stream: options?.stream || false,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq API Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Analyze meal image using Groq's vision capabilities
   * NOTE: As of 2025, Groq may not have vision API yet
   * We'll use GPT-4 Vision or fallback to text description
   */
  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    // Placeholder for vision API
    // For now, we'll expect user to provide description or use GPT-4 Vision

    const messages: GroqChatMessage[] = [
      {
        role: 'system',
        content: 'You are an expert nutritionist. Analyze meal descriptions and provide detailed nutritional information.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    return this.chat(messages);
  }

  /**
   * Generate structured JSON response (for nutrition data, workout plans)
   */
  async generateStructuredResponse<T>(
    systemPrompt: string,
    userPrompt: string,
    schema?: string
  ): Promise<T> {
    const messages: GroqChatMessage[] = [
      {
        role: 'system',
        content: `${systemPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. ${schema || ''}`,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    const response = await this.chat(messages, { temperature: 0.5 });

    try {
      // Extract JSON from response (in case model adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      return JSON.parse(response) as T;
    } catch (error) {
      console.error('Failed to parse JSON response:', response);
      throw new Error('Invalid JSON response from AI');
    }
  }

  /**
   * Get embedding for text (for RAG search)
   * NOTE: Groq doesn't provide embeddings, use OpenAI instead
   */
  // See pinecone.service.ts for embedding implementation
}

export default new GroqService();
