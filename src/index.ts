import dotenv from 'dotenv';
dotenv.config();
import app from './app'
import prisma from './prisma';

// server port
const PORT = process.env.PORT || 3000;

// Database Connection & Server Start Function
const startServer = async():Promise<void> => {
  try{

    // prisma connection here
    await prisma.$connect();
    // database connection message here
  console.log("Database Connected Successfully!");

  // server listening port run here
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  }catch(error: any){
    // database error message here
    console.log(error.message);
    console.log('DataBase Error');
    // prisma disconnect here
    await prisma.$disconnect();
    process.exit(1);
  }
}

// call the function
startServer();