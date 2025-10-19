import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// ✅ Read CORS_ORIGIN from environment variable
const corsOrigin = process.env.CORS_ORIGIN || "*";

// console.log("🌐 CORS_ORIGIN:", corsOrigin);

// ✅ CORS configuration that respects environment variable
const corsOptions = {
  origin: function (origin, callback) {
    // If CORS_ORIGIN is "*", allow all origins
    if (corsOrigin === "*") {
      // console.log("✅ CORS: Allowing all origins (wildcard)");
      return callback(null, true);
    }

    // Parse allowed origins from comma-separated string
    const allowedOrigins = corsOrigin.split(",").map(o => o.trim());
    
    // console.log("📋 Allowed origins:", allowedOrigins);
    // console.log("📍 Request origin:", origin);

    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) {
      // console.log("✅ CORS: Allowing request with no origin");
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      // console.log("✅ CORS: Origin allowed:", origin);
      return callback(null, true);
    } else {
      // console.error("❌ CORS: Blocked origin:", origin);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    }
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

// ✅ Logging middleware (optional, but helpful for debugging)
// app.use((req, res, next) => {
//   // console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'}`);
//   next();
// });

// importing routes
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import commentRoutes from "./routes/comment.routes.js";

// route declarations
app.use("/api/v1/users", userRouter);
app.use("/api/v1/post", postRouter);
app.use("/api/v1/comments", commentRoutes);

// ✅ Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server is running",
    cors: corsOrigin 
  });
});

export { app };