const axios = require('axios');
require('dotenv').config();

async function testRest() {
    console.log("🚀 Testing Gemini via REST...");

    const apiKey = process.env.GEMINI_API_KEY;

    // ✅ SAFE MODEL (avoid 404)
    const model = "gemini-flash-latest";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const data = {
        contents: [
            {
                parts: [
                    { text: "Give one-line summary of AI" }
                ]
            }
        ]
    };

    try {
        const response = await axios.post(url, data, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("\n✅ SUCCESS:");
        console.log(response.data.candidates[0].content.parts[0].text);

    } catch (error) {
        console.error("\n❌ FAILED:");

        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

async function listAllowedModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await axios.get(url);

        console.log("\n📦 AVAILABLE MODELS:");
        response.data.models.forEach(m => {
            console.log("- " + m.name);
        });

    } catch (e) {
        console.error("❌ Could not list models");
    }
}

// RUN ONE AT A TIME
testRest();
listAllowedModels();