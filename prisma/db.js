import { PrismaClient } from '@prisma/client';
import { adapter } from './config.js';

export const prisma = new PrismaClient({
  adapter,
});

