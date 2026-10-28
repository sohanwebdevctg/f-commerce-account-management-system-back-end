// Load environment variables from .env file
import "dotenv/config";
// Import Prisma PostgreSQL adapter for database connectivity
import { PrismaPg } from "@prisma/adapter-pg";
// Import Prisma Client for database operations and query building
import { PrismaClient } from "@prisma/client";

// Retrieve the database connection string from environment variables
const connectionString = process.env.DATABASE_URL;

// Initialize the Prisma PostgreSQL adapter with the connection string
const adapter = new PrismaPg({ connectionString });
// Initialize the main Prisma Client instance using the adapter
const prisma = new PrismaClient({ adapter });

// Export the prisma instance for use across the application
export default prisma;