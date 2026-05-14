import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
  // Triggering reload for new schema fields (paymentMethod, returnReason)... (v4)
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }
  console.log("Initializing Prisma Client with Pool...");
  const pool = new Pool({
    connectionString,
    max: 30, // Increased for concurrent refresh cycles
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 60000,
    statement_timeout: 60000, // Prevent hanging queries
    ssl: connectionString.includes('neon.tech')
      ? {
        rejectUnauthorized: false,
      }
      : undefined
  });

  pool.on('connect', () => {
    // console.log('New client connected to pool');
  });

  pool.on('error', (err) => {
    console.error('❌ Prisma Pool Error:', err.message);
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
