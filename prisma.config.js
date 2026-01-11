// prisma.config.js
import "dotenv/config"

import { defineConfig } from "prisma/config"
import { PrismaNeon } from "@prisma/adapter-neon"
import { neon } from "@neondatabase/serverless"
console.log("DATABASE_URL:", process.env.DATABASE_URL)


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
