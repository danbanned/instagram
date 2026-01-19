// prisma.config.js

//📁 What each file is responsible for
//✅ prisma.config.js — KEEP THIS

//Purpose: Prisma CLI configuration
//Used by: prisma generate, prisma migrate, prisma db push

//✔ Defines datasource URL
//✔ Defines Neon adapter
//✔ Never imported by app code
//✔ Never creates PrismaClient
//✔ Runs only during CLI commands
//❌ This file is not runtime code.

import "dotenv/config"

import { defineConfig } from "prisma/config"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neon } from "@neondatabase/serverless"
console.log("DATABASE_URL:", process.env.DATABASE_URL)
console.log("kjhgfdsasdfguioiuytreswedtyuiuytreswertyui:", process.env.DATABASE_URL)


export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },

  client: {
    adapter: new PrismaNeon(
      neon(process.env.DATABASE_URL)
    ),
  },
})
