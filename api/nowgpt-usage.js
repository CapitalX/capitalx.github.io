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
    switch (action) {
      case "check":
        // First, clean up expired records
        await supabase
          .from("daily_usage")
          .delete()
          .lt(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          );

        const { data: usageData, error: usageError } = await supabase
          .from("daily_usage")
          .select("count, created_at")
          .eq("token", token || dailyToken)
          .single();

        // Strict today check
        const isToday = usageData?.created_at
          ? new Date(usageData.created_at).toDateString() ===
            new Date().toDateString()
          : false;

        if (usageError || !usageData || !isToday) {
          return res.status(200).json({
            remaining: 3,
            token: dailyToken,
          });
        }

        if (usageData.count >= 3) {
          return res.status(200).json({
            remaining: 0,
            token: dailyToken,
          });
        }

        return res.status(200).json({
          remaining: 3 - usageData.count,
          token: dailyToken,
        });

      case "increment":
        // First verify current count
        const { data: currentData } = await supabase
          .from("daily_usage")
          .select("count, created_at")
          .eq("token", token || dailyToken)
          .single();

        const currentIsToday = currentData?.created_at
          ? new Date(currentData.created_at).toDateString() ===
            new Date().toDateString()
          : false;

        const currentCount = currentIsToday ? currentData?.count || 0 : 0;

        if (currentCount >= 3) {
          return res.status(429).json({ message: "Daily limit exceeded" });
        }

        // Increment with new record if not today, or update existing
        const { error: incrementError } = await supabase
          .from("daily_usage")
          .upsert(
            {
              token: token || dailyToken,
              count: currentIsToday ? currentCount + 1 : 1,
              created_at: new Date().toISOString(),
              last_used: new Date().toISOString(),
            },
            {
              onConflict: "token",
              count: "count + 1",
            }
          );

        if (incrementError) throw incrementError;
        return res.status(200).json({ message: "Usage incremented" });

      default:
        return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
