require("dotenv").config();
const mongoose = require("mongoose");

console.log("URI Loaded:", process.env.MONGO_URI ? "YES" : "NO");

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected Successfully!");
    process.exit(0);
  } catch (err) {
    console.error("FULL ERROR:");
    console.error(err);
    process.exit(1);
  }
}

test();