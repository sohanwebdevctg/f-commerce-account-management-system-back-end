// Load environment variables from .env file
import "dotenv/config";

// Import Prisma configuration helper and environment utility
import { defineConfig, env } from "prisma/config";

// Export the main Prisma configuration object
export default defineConfig({
  // Path to the Prisma database schema file
  schema: "prisma/schema.prisma",

  // Configuration for database migrations directory
  migrations: {
    path: "prisma/migrations",
  },

  // Database connection configuration using environment variables
  datasource: {
    url: env("DATABASE_URL"),
  },
});