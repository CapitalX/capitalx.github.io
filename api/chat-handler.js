import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { action } = req.body;
  console.log("Received action:", action); // Debug log

  try {
    // Log environment variables (without exposing sensitive data)
    console.log("Supabase URL exists:", !!process.env.SUPABASE_URL);
    console.log("Service key exists:", !!process.env.SUPABASE_SERVICE_KEY);

    // Initialize Supabase client with error handling
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Test connection and handle different actions
    switch (action) {
      case "initialize":
        console.log("Attempting Supabase connection..."); // Debug log

        // Test connection with more detailed error handling
        const { data, error } = await supabase
          .from("documents")
          .select("count")
          .limit(1);

        if (error) {
          console.error("Supabase connection error:", error); // Debug log
          throw new Error(`Database connection failed: ${error.message}`);
        }

        console.log("Supabase connection successful, data:", data); // Debug log
        return res.status(200).json({
          status: "connected",
          message: "Chat system initialized successfully",
          debug: {
            hasData: !!data,
            timestamp: new Date().toISOString(),
          },
        });

      case "chat":
        return res.status(200).json({
          message: "Chat endpoint ready",
          response: "Hello! I'm a test response. The chat system is working!",
          timestamp: new Date().toISOString(),
        });

      default:
        console.warn("Invalid action received:", action); // Debug log
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
    });

    // Send a more detailed error response
    return res.status(500).json({
      message: "Error processing request",
      error:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              type: error.name,
              action: action,
            }
          : "Server error",
      timestamp: new Date().toISOString(),
    });
  }
}
