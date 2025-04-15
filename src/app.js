import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const app = express();

app.use(cors({
    origin:CORS_ORIGIN,
    credentials:true
}))
app.use(express.json());
app.use(express.urlencoded({
    extended:true,
}))
//file and folder
app.use(express.static("public"))
//for cookies
app.use(cookieParser());

//routes import
import userRouter from './routes/user.routes.js'

app.use("/api/v1/users", userRouter)

export default app;