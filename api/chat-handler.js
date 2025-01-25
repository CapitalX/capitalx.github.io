import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Enable CORS for development
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // First, validate the request
    const { action } = req.body;
    if (!action) {
      return res.status(400).json({
        message: "No action specified",
        timestamp: new Date().toISOString(),
      });
    }

    // Environment variable check with detailed logging
    const envCheck = {
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
      hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_KEY),
      nodeEnv: process.env.NODE_ENV || "unknown",
    };

    console.log("Environment check:", envCheck);

    // Early return if environment variables are missing
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return res.status(503).json({
        message: "Service configuration incomplete",
        debug: envCheck,
        timestamp: new Date().toISOString(),
      });
    }

    // Initialize Supabase with more error handling
    let supabase;
    try {
      supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY,
        {
          auth: { persistSession: false },
        }
      );
    } catch (initError) {
      console.error("Supabase client initialization error:", initError);
      return res.status(500).json({
        message: "Failed to initialize database client",
        error:
          process.env.NODE_ENV === "development"
            ? initError.message
            : "Configuration error",
        timestamp: new Date().toISOString(),
      });
    }

    // Handle different actions
    switch (action) {
      case "initialize":
        try {
          // Simple connection test
          const { data, error } = await supabase
            .from("documents")
            .select("count")
            .limit(1);

          if (error) {
            console.error("Database query error:", error);
            return res.status(500).json({
              message: "Database connection failed",
              error:
                process.env.NODE_ENV === "development"
                  ? error.message
                  : "Database error",
              timestamp: new Date().toISOString(),
            });
          }

          return res.status(200).json({
            status: "connected",
            message: "Chat system initialized successfully",
            debug: {
              hasData: Boolean(data),
              timestamp: new Date().toISOString(),
            },
          });
        } catch (dbError) {
          console.error("Database operation failed:", dbError);
          return res.status(500).json({
            message: "Database operation failed",
            error:
              process.env.NODE_ENV === "development"
                ? dbError.message
                : "Database error",
            timestamp: new Date().toISOString(),
          });
        }

      case "chat":
        // Simple response for now
        return res.status(200).json({
          message: "Chat endpoint ready",
          response: "Hello! I'm a test response. The chat system is working!",
          timestamp: new Date().toISOString(),
        });

      default:
        return res.status(400).json({
          message: "Invalid action",
          received: action,
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error("Handler error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
      message: "Server error occurred",
      error:
        process.env.NODE_ENV === "development"
          ? { message: error.message, type: error.name }
          : "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
}
