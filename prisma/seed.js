import { PrismaClient } from '@prisma/client';
import { adapter } from './config.js';

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Starting database seed...');

  console.log('🧹 Clearing existing data...');
  await prisma.publishedImage.deleteMany();

  console.log('📸 Adding sample images...');

  const sampleImages = [
    {
      imageUrl: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=512&h=512&fit=crop',
      prompt: 'A vibrant rainbow gradient background',
      hearts: 12,
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=512&h=512&fit=crop',
      prompt: 'Futuristic cityscape at night with neon lights',
      hearts: 8,
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=512&h=512&fit=crop',
      prompt: 'Northern lights over snowy mountains',
      hearts: 15,
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1518834103326-6d6b46a82e1f?w=512&h=512&fit=crop',
      prompt: 'Abstract watercolor painting of a forest',
      hearts: 5,
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=512&h=512&fit=crop',
      prompt: 'Galaxy spiral in deep space',
      hearts: 21,
    },
  ];

  for (const image of sampleImages) {
    await prisma.publishedImage.create({ data: image });
  }

  const count = await prisma.publishedImage.count();
  console.log(`✅ Seeded ${count} images`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
