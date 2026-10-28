// Import Multer middleware for handling multipart/form-data (file uploads)
import multer from "multer";
// Import path module to handle and transform file paths
import path from "path";
// Import file system module to interact with the file system (check/create directories)
import fs from "fs";

// Define the target upload directory path and automatically create the 'uploads' folder if it does not exist
const uploadDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure disk storage engine for multer to specify destination and unique filenames
const storage = multer.diskStorage({
  // Define destination folder where uploaded files will be stored
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  // Generate a unique filename using timestamp and random number to prevent overwriting
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `file-${uniqueSuffix}${ext}`);
  },
});

// Define a file filter function to allow only image mime types
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Check if the uploaded file is an image
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    // Reject non-image files with an error
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Create and export the configured multer upload instance with storage, filter, and file size limits (max 5MB)
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maximum 5MB
});