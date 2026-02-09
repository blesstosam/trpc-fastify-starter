import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client'

// Load `.env` for plain Node/Fastify runtime.
process.loadEnvFile()

let globalPrisma: PrismaClient | null = null
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL. Set it in server/.env')
}

export const prisma = globalPrisma ?? (globalPrisma
  = new PrismaClient({
    log: ['error', 'warn'],
    adapter: new PrismaMariaDb(databaseUrl),
  }))
