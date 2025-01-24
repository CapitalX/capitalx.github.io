import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// Add initial startup log
console.log("API handler initializing...");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Log environment check
console.log("Environment check:", {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
});

function generateDailyToken(ip, secret) {
  const date = new Date().toISOString().split("T")[0];
  return createHash("sha256")
    .update(`${ip}-${date}-${secret}`)
    .digest("hex")
    .substring(0, 16);
}

export default async function handler(req, res) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress;

  const dailyToken = generateDailyToken(ip, process.env.TOKEN_SECRET);
  const { action, token } = req.body;

  // Log every incoming request
  console.log("=== New Request ===");
  console.log("Request URL:", req.url);
  console.log("Request Method:", req.method);
  console.log("Request Headers:", req.headers);
  console.log("Request Body:", req.body);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.log("Invalid method:", req.method);
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // First, ensure a record exists for today
    const { data: existingRecord, error: checkError } = await supabase
      .from("daily_usage")
      .select("count, created_at")
      .eq("token", token || dailyToken)
      .single();

    const isToday = existingRecord?.created_at
      ? new Date(existingRecord.created_at).toDateString() ===
        new Date().toDateString()
      : false;

    // If no record exists or it's not from today, create initial record
    if (!existingRecord || !isToday) {
      const { error: initError } = await supabase.from("daily_usage").upsert({
        token: token || dailyToken,
        count: 0,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
      });

      if (initError) {
        console.error("Error creating initial record:", initError);
        return res.status(500).json({ message: "Error initializing usage" });
      }
    }

    // Clean up expired records
    await supabase
      .from("daily_usage")
      .delete()
      .lt(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    switch (action) {
      case "check":
        const { data: usageData, error: usageError } = await supabase
          .from("daily_usage")
          .select("count, created_at")
          .eq("token", token || dailyToken)
          .single();

        if (usageError) {
          console.error("Usage check error:", usageError);
          return res.status(500).json({ message: "Error checking usage" });
        }

        return res.status(200).json({
          remaining: 3 - (usageData?.count || 0),
          token: token || dailyToken,
        });

      case "increment":
        // For increment, we'll now only handle this in the chat.js after streaming
        // This endpoint will be deprecated for increment action
        return res.status(400).json({
          message: "Increment should be handled after chat completion",
        });

      default:
        return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
