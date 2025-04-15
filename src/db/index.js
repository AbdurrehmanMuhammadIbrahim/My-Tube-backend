import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";



const MONGO_URI = process.env.MONGO_URI

 const connectDB = async () => {
    try {
        await mongoose.connect(`${MONGO_URI}/${DB_NAME}`)
        console.log("Database connected successfully")
    } catch (error) {
        console.log("Database connection failed", error)
        process.exit(1)
    }

}


export default connectDB