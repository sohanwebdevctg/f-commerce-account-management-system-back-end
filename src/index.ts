// Load environment configuration from .env file
import dotenv from 'dotenv';
dotenv.config();

// Import express application instance
import app from './app'
// Import configured Prisma client instance
import prisma from './prisma';

// Define the port number for the server to listen on
const PORT = process.env.PORT || 3000;

// Database Connection & Server Start Function
const startServer = async():Promise<void> => {
  try{

    // Establish connection to the database using Prisma
    await prisma.$connect();
    // Log successful database connection message
  console.log("Database Connected Successfully!");

  // Start the Express server on the specified port
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  }catch(error: any){
    // Log the detailed error message if connection fails
    console.log(error.message);
    console.log('DataBase Error');
    // Disconnect Prisma client safely in case of a failure
    await prisma.$disconnect();
    // Terminate the process with a failure code
    process.exit(1);
  }
}

// Invoke the server startup function
startServer();