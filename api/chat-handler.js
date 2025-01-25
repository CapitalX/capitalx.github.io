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

  const { action } = req.body;
  console.log("Received action:", action); // Debug log

  try {
    // Validate request
    if (!action) {
      throw new Error("No action specified");
    }

    // Log environment variables (without exposing sensitive data)
    console.log("Environment check:", {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      nodeEnv: process.env.NODE_ENV,
    });

    // Initialize Supabase client with error handling
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: { persistSession: false },
      }
    );

    // Test connection and handle different actions
    switch (action) {
      case "initialize":
        console.log("Attempting Supabase connection..."); // Debug log

        try {
          // Test connection with more detailed error handling
          const { data, error } = await supabase
            .from("documents")
            .select("count")
            .limit(1);

          if (error) {
            console.error("Supabase connection error:", error);
            throw error;
          }

          console.log("Supabase connection successful:", {
            hasData: !!data,
            timestamp: new Date().toISOString(),
          });

          return res.status(200).json({
            status: "connected",
            message: "Chat system initialized successfully",
            debug: {
              hasData: !!data,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (dbError) {
          console.error("Database connection failed:", dbError);
          throw new Error(`Database connection failed: ${dbError.message}`);
        }

      case "chat":
        return res.status(200).json({
          message: "Chat endpoint ready",
          response: "Hello! I'm a test response. The chat system is working!",
          timestamp: new Date().toISOString(),
        });

      default:
        console.warn("Invalid action received:", action);
        return res.status(400).json({
          message: "Invalid action",
          received: action,
        });
    }
  } catch (error) {
    console.error("Handler error details:", {
      message: error.message,
      stack: error.stack,
      action: action,
      timestamp: new Date().toISOString(),
    });

    return res.status(500).json({
      message: "Error processing request",
      error:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              type: error.name,
              action: action,
              timestamp: new Date().toISOString(),
            }
          : "Server error",
    });
  }
}
