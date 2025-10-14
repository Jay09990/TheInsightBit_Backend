import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())
app.use(express.static('public'))

app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    next();
});

// importing routes

import userRouter from "./routes/user.routes.js"
import postRouter from "./routes/post.routes.js"

//routes declaration

app.use("/api/v1/users", userRouter)
app.use("/api/v1/post",postRouter)

export { app }