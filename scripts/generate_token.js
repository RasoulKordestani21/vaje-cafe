#!/usr/bin/env node
const crypto = require("crypto");

// Usage: node scripts/generate_token.js [token]
// If token not provided, a random one will be generated.

const secret = process.env.SERVER_TOKEN_SECRET;
console.log(process.env.SERVER_TOKEN_SECRET);
if (!secret) {
  console.error(
    "Please set SERVER_TOKEN_SECRET in your environment before running this script."
  );
  process.exit(1);
}

const provided = process.argv[2];
const token = provided || crypto.randomBytes(16).toString("hex");
const hash = crypto.createHmac("sha256", secret).update(token).digest("hex");

console.log("Raw token (keep secret):", token);
console.log("SERVER_TOKEN_HASH value (put this into your server env):", hash);

console.log("\nExample (.env)");
console.log("SERVER_TOKEN_SECRET=" + secret);
console.log("SERVER_TOKEN_HASH=" + hash);

// Note: keep the raw token secret. The server will validate by HMAC(token, secret) === SERVER_TOKEN_HASH
