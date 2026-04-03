// backend/test-ai.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testConnection() {
  console.log("🔄 Initiating connection to Google AI Servers...");
  
  // Make sure your .env file has GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing from your .env file!");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    console.log("📡 Sending test prompt: 'Respond with exactly: API IS WORKING'...");
    const result = await model.generateContent("Respond with exactly: API IS WORKING");
    console.log("\n✅ SUCCESS! Received Response:");
    console.log("================================");
    console.log(result.response.text());
    console.log("================================");
  } catch (error) {
    console.error("\n❌ FATAL NETWORK ERROR:");
    console.error(error);
    console.log("\n💡 If this says 'fetch failed', your computer/network is blocking the connection to Google.");
  }
}

testConnection();