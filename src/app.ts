import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import metaRoutes from "./routes/meta.routes";

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api", metaRoutes);

app.get("/", (req, res) => {
  res.send("Phonebecho Backend TS API is running.");
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("💥 ERROR:", err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  } else {
    // Production: Don't leak stack traces
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.isOperational ? err.message : "Something went very wrong!",
    });
  }
});

export default app;
