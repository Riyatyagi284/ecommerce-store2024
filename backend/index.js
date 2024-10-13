import express from 'express';
const app = express();

// Import routes
// import User from "./models/UserModel";
import Product from "./routes/ProductRoute.js";
// import {Cart} from "./routes/CartRoute.js";
// import {Payment} from "./routes/UserPaymentRoute.js";
// import {Contact} from "./routes/ContactRoute.js";

// Import configurations 
import {dbConnect} from "./config/db.js";
import {cloudinaryConnect} from "./config/cloudinary.js";

// Import middleware
import fileupload from "express-fileupload";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser"

// setting the port number

dotenv.config();
const PORT = process.env.PORT || 5000;

dbConnect();

// Middleware
app.use(express.json());
app.use(cookieParser());
// app.use(cors({
//     origin: "*",
//     // origin: "http://localhost:3000",
//     credentials: true,
//     // allowedHeaders: ["Content-Type", "Authorization"]
// }));
app.use(cors());
app.use(fileupload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    createParentPath: true,
    safeFileNames: true,
    preserveExtension: true,
    abortOnLimit: true, // Reject files larger than the specified limit
    fields: { limit: 100, extended: true }, // Limit the number of fields to 100 and accept extended field names
    fileSize: (req, file) => {
        if (file.size > 2 * 1024 * 1024) {
            return false; // Reject file if it exceeds 3MB
        }
    }, // Limit the size of each file to 50MB
    limits: { fileSize: 2 * 1024 * 1024 }, // Maximum file size is 2MB
}));

// cloudinaryConnect();

// Routes
// app.use("/api/v1/auth", User);
app.use("/api/v1/products", Product);
// app.use("/api/v1/cart", Cart);
// app.use("/api/v1/payment", Payment);
// app.use("/api/v1/contact", Contact);

// Testing the server methods

app.get('/', (req, res) => {
    return res.json({
        success: true,
        message: "Your server is up and running ...",
    });
});

// Starting the server here
app.listen(PORT, () => {
    console.log(`App is listening at ${PORT}`);
})