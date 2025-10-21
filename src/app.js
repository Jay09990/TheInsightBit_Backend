import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import "./config/passport.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import verificationRoutes from "./routes/verification.routes.js";


const app = express();

// ✅ Read CORS_ORIGIN from environment variable
const corsOrigin = process.env.CORS_ORIGIN || "*";

// ✅ Configure CORS properly
const corsOptions = {
  origin: function (origin, callback) {
    if (corsOrigin === "*") return callback(null, true);
    const allowedOrigins = corsOrigin.split(",").map(o => o.trim());
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(passport.initialize());

// ✅ API Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/verification", verificationRoutes);

// ✅ Health Check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    cors: corsOrigin,
  });
});

export { app };
