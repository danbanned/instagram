import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig, Client } from '@neondatabase/serverless';
import * as ws from 'ws';

// Required for Neon in Node
neonConfig.webSocketConstructor = ws;

const client = new Client({
  connectionString: process.env.DATABASE_URL!,
});

export default {
  adapter: new PrismaNeon(client),
};
