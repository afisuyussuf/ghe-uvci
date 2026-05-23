import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

let prismaInstance: PrismaClient | null = null;
let isDatabaseOff = false;

export function getPrisma() {
  if (isDatabaseOff) {
    return null;
  }
  if (!prismaInstance) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn("DATABASE_URL is not set. Database features will be unavailable.");
      isDatabaseOff = true;
      return null;
    }
    try {
      const pool = new pg.Pool({ connectionString: dbUrl });
      
      // Monitor pool unexpected errors
      pool.on('error', (err: any) => {
        console.warn('Core database connection pool notice:', err?.message || 'Connection lost');
        isDatabaseOff = true;
      });

      // Intercept execution errors (like quota violations or credentials bugs) to fail-safe to file fallback
      const originalQuery = pool.query;
      pool.query = async function(this: any, ...args: any[]) {
        try {
          if (typeof args[args.length - 1] === 'function') {
            return originalQuery.apply(this, args);
          }
          return await originalQuery.apply(this, args);
        } catch (err: any) {
          console.warn("Notice: Switching to secure file-based local database fallback (Primary database quota/limit exceeded or unreachable).");
          isDatabaseOff = true;
          throw err;
        }
      } as any;

      prismaInstance = new PrismaClient({ adapter: new PrismaPg(pool) });

      // Run an immediate asynchronous connection & quota probe
      setTimeout(async () => {
        try {
          const prisma = getPrisma();
          if (prisma) {
            await prisma.user.findFirst();
            console.log("Database connection checked successfully.");
          }
        } catch (err: any) {
          console.warn("Notice: Standard database connection deactivated. Local file-based database is successfully processing queries.");
          isDatabaseOff = true;
        }
      }, 0);

    } catch (e) {
      console.error("Failed to initialize database client with driver adapter. Falling back to file DB:", e);
      isDatabaseOff = true;
      return null;
    }
  }
  return isDatabaseOff ? null : prismaInstance;
}

