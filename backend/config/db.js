import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const dbConnect = () => {
    mongoose.connect(process.env.MONGODB_URL).then(console.log(`Db connected successfully`))
        .catch(err => {
            console.log(`Db connection error: ${err}`);
            // process.exit(1);
        });
};