import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client'

// Loads the .env file into process.env
// 不会override env已存在的属性，dotenv会覆盖
process.loadEnvFile()

let globalPrisma: PrismaClient | null = null
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL. Set it in server/.env')
}
else {
  console.error(`init prisma for db: ${databaseUrl}`)
}

export const prisma = globalPrisma ?? (globalPrisma
  = new PrismaClient({
    log: ['error', 'warn'],
    adapter: new PrismaMariaDb(databaseUrl),
  }))
