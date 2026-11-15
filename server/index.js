import express from "express";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "mock_token_for_development";

app.use(cors());
app.use(express.json());

// Persistent SQLite-like JSON storage file
const DB_FILE = path.join(__dirname, "gamyx_database.json");

function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch {
      // fallback
    }
  }
  return {
    users: {},
    scores: {},
    leaderboard: [
      { id: 1001, name: "Neo_Matrix", username: "neomatrix", level: 18, coins: 14200, score: 184 },
      { id: 1002, name: "CyberViper", username: "cyberviper", level: 15, coins: 9850, score: 142 },
      { id: 1003, name: "PixelQueen", username: "pixelqueen", level: 12, coins: 7420, score: 118 },
      { id: 1004, name: "ShadowNinja", username: "shadowninja", level: 9, coins: 4300, score: 86 },
      { id: 1005, name: "Astra_Gamer", username: "astragamer", level: 8, coins: 3800, score: 72 },
    ],
  };
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to persist database:", e);
  }
}

let db = loadDatabase();

/**
 * Validates Telegram WebApp initData HMAC-SHA256 signature
 */
function verifyTelegramWebAppData(initData, botToken) {
  if (!initData) return { valid: false, error: "Missing initData" };
  if (!botToken || botToken === "mock_token_for_development") {
    // Development mode bypass with parsed user
    try {
      const urlParams = new URLSearchParams(initData);
      const userStr = urlParams.get("user");
      const user = userStr ? JSON.parse(userStr) : null;
      return { valid: true, user, isDevMode: true };
    } catch {
      return { valid: false, error: "Failed to parse dev user data" };
    }
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) return { valid: false, error: "Missing hash parameter" };

    urlParams.delete("hash");

    // Sort key=value pairs alphabetically by key
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    if (calculatedHash !== hash) {
      return { valid: false, error: "Invalid signature" };
    }

    const userStr = urlParams.get("user");
    const user = userStr ? JSON.parse(userStr) : null;
    return { valid: true, user, authDate: urlParams.get("auth_date") };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Gamyx Telegram Mini App Server",
    timestamp: Date.now(),
  });
});

// Telegram Safe Authentication Endpoint
app.post("/api/auth/telegram", (req, res) => {
  const { initData } = req.body;

  if (!initData) {
    return res.status(400).json({ success: false, error: "No initData provided" });
  }

  const verification = verifyTelegramWebAppData(initData, BOT_TOKEN);

  if (!verification.valid) {
    return res.status(401).json({
      success: false,
      error: "Telegram data verification failed: " + verification.error,
    });
  }

  const tgUser = verification.user;
  if (!tgUser) {
    return res.status(400).json({ success: false, error: "No user found in initData" });
  }

  // Create or update in database
  if (!db.users[tgUser.id]) {
    db.users[tgUser.id] = {
      id: tgUser.id,
      name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
      username: tgUser.username || `user_${tgUser.id}`,
      coins: 250,
      level: 1,
      xp: 0,
      createdAt: Date.now(),
    };
    saveDatabase(db);
  }

  const userRecord = db.users[tgUser.id];

  return res.json({
    success: true,
    user: userRecord,
    verified: true,
    mode: verification.isDevMode ? "development" : "verified",
  });
});

// Leaderboard API
app.get("/api/leaderboard", (req, res) => {
  const { category = "level" } = req.query;

  let sorted = [...db.leaderboard];
  if (category === "coins") {
    sorted.sort((a, b) => b.coins - a.coins);
  } else if (category === "score") {
    sorted.sort((a, b) => b.score - a.score);
  } else {
    sorted.sort((a, b) => b.level - a.level);
  }

  res.json({ success: true, leaderboard: sorted });
});

// Score submission API
app.post("/api/score", (req, res) => {
  const { userId, gameId, score } = req.body;

  if (!userId || !gameId || typeof score !== "number") {
    return res.status(400).json({ success: false, error: "Invalid score payload" });
  }

  if (!db.scores[userId]) db.scores[userId] = {};
  const currentBest = db.scores[userId][gameId] || 0;

  if (score > currentBest) {
    db.scores[userId][gameId] = score;
    saveDatabase(db);
  }

  res.json({
    success: true,
    highScore: db.scores[userId][gameId],
    isNewHighScore: score > currentBest,
  });
});

// Serve frontend build if dist/ exists
const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🎮 Gamyx server running on http://127.0.0.1:${PORT}`);
});
