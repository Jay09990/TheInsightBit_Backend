import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://the-insightbit.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (e.g. curl, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.error(`❌ Blocked by CORS: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(express.static("public"));

app.use((req, res, next) => {
  console.log("Request URL:", req.url);
  console.log("Request Method:", req.method);
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Origin:", req.headers.origin);
  next();
});

// importing routes
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import commentRoutes from "./routes/comment.routes.js";

// route declarations
app.use("/api/v1/users", userRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/comments", commentRoutes);

export { app };
