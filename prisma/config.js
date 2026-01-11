import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig, Client } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

export const adapter = new PrismaNeon(client);
