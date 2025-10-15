// Seed Pinecone with fitness knowledge
import 'dotenv/config';
import pineconeService from '../services/pinecone.service';
import fitnessKnowledge from './fitness-knowledge.json';
import { FitnessKnowledge } from '../types';

async function seedDatabase() {
  try {
    console.log('🌱 Starting Pinecone seed process...\n');

    // Step 1: Create index if it doesn't exist
    console.log('📊 Step 1: Creating Pinecone index...');
    await pineconeService.createIndex();
    console.log('✅ Index ready\n');

    // Step 2: Wait for index to be ready (serverless indexes are instant, but add delay for safety)
    console.log('⏳ Waiting 10 seconds for index initialization...');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Step 3: Upload fitness knowledge
    console.log('📚 Step 3: Uploading fitness knowledge...');
    console.log(`Total items to upload: ${fitnessKnowledge.length}`);

    await pineconeService.addKnowledge(fitnessKnowledge as FitnessKnowledge[]);

    console.log('✅ Successfully uploaded all knowledge\n');

    // Step 4: Test search
    console.log('🔍 Step 4: Testing RAG search...');
    const testQueries = [
      'chest workout for beginners',
      'protein intake for muscle gain',
      'post workout meal',
    ];

    for (const query of testQueries) {
      console.log(`\nQuery: "${query}"`);
      const results = await pineconeService.searchKnowledge(query, { topK: 3 });

      results.forEach((result, idx) => {
        const content =
          result.metadata.content?.substring(0, 100) || 'No content';
        console.log(
          `  ${idx + 1}. Score: ${(result.score * 100).toFixed(1)}% - ${content}...`
        );
      });
    }

    console.log('\n✨ Seed complete! Your AI coach is ready.\n');
    console.log('Next steps:');
    console.log('1. Start the backend: npm run dev');
    console.log('2. Test the API endpoints');
    console.log('3. Integrate with React frontend\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seedDatabase();
