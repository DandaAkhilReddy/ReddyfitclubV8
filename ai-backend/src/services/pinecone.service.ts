// Pinecone Service - Vector Database for RAG
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { FitnessKnowledge, PineconeMatch } from '../types';

class PineconeService {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private indexName: string;

  constructor() {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set');
    }

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // OpenAI for embeddings (cheap: $0.0001/1K tokens)
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    this.indexName = process.env.PINECONE_INDEX_NAME || 'reddyfit-fitness-knowledge';
  }

  /**
   * Get embedding vector for text query
   */
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small', // Cheap & fast
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('OpenAI Embedding Error:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Search fitness knowledge base using RAG
   */
  async searchKnowledge(
    query: string,
    options?: {
      topK?: number;
      filter?: Record<string, any>;
    }
  ): Promise<PineconeMatch[]> {
    try {
      const index = this.pinecone.Index(this.indexName);
      const queryEmbedding = await this.getEmbedding(query);

      const searchResults = await index.query({
        vector: queryEmbedding,
        topK: options?.topK || 5,
        includeMetadata: true,
        filter: options?.filter,
      });

      return searchResults.matches.map((match) => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata || {},
      }));
    } catch (error) {
      console.error('Pinecone Search Error:', error);
      return []; // Return empty results on error
    }
  }

  /**
   * Add new knowledge to vector database
   */
  async addKnowledge(knowledge: FitnessKnowledge[]): Promise<void> {
    try {
      const index = this.pinecone.Index(this.indexName);

      const vectors = await Promise.all(
        knowledge.map(async (item) => ({
          id: item.id,
          values: await this.getEmbedding(item.content),
          metadata: {
            type: item.type,
            content: item.content,
            ...item.metadata,
          },
        }))
      );

      await index.upsert(vectors);
      console.log(`Added ${vectors.length} items to Pinecone`);
    } catch (error) {
      console.error('Failed to add knowledge:', error);
      throw error;
    }
  }

  /**
   * Create Pinecone index (run once during setup)
   */
  async createIndex(): Promise<void> {
    try {
      const existingIndexes = await this.pinecone.listIndexes();
      const indexExists = existingIndexes.indexes?.some(
        (idx) => idx.name === this.indexName
      );

      if (!indexExists) {
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // text-embedding-3-small dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        });
        console.log(`Created Pinecone index: ${this.indexName}`);
      } else {
        console.log(`Index ${this.indexName} already exists`);
      }
    } catch (error) {
      console.error('Failed to create index:', error);
      throw error;
    }
  }

  /**
   * Get relevant context for RAG (formatted for LLM)
   */
  async getContext(query: string, topK: number = 5): Promise<string> {
    const matches = await this.searchKnowledge(query, { topK });

    if (matches.length === 0) {
      return 'No relevant knowledge found.';
    }

    const context = matches
      .map((match, idx) => {
        const content = match.metadata.content || '';
        const score = (match.score * 100).toFixed(1);
        return `[${idx + 1}] (Relevance: ${score}%)\n${content}`;
      })
      .join('\n\n---\n\n');

    return context;
  }
}

export default new PineconeService();
