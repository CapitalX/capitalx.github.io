import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { action } = req.body;

  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Test connection and handle different actions
    switch (action) {
      case "initialize":
        // Test Supabase connection
        const { data, error } = await supabase
          .from("documents")
          .select("count")
          .limit(1);

        if (error) throw error;

        console.log("Supabase connection successful");
        return res.status(200).json({
          status: "connected",
          message: "Chat system initialized successfully",
        });

      case "chat":
        // We'll implement the chat logic here later
        return res.status(200).json({
          message: "Chat endpoint ready",
          // This is a placeholder - we'll implement real chat later
          response: "Hello! I'm a placeholder response. Real chat coming soon!",
        });

      default:
        return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({
      message: "Error processing request",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Server error",
    });
  }
}
