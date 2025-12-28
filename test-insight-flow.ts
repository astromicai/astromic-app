
// Mock environment
process.env.GEMINI_API_KEY = "test_key"; // We won't actually call Gemini if we mock it or fail before

import { calculateVedicChart } from './api/vedic-engine.js';

async function testInsightGeneration() {
    console.log("Starting Test...");
    try {
        const userData = {
            name: "Test User",
            birthDate: "1975-08-23",
            birthTime: "08:30 PM",
            birthPlace: "Dharapuram",
            latitude: 10.73,
            longitude: 77.52,
            system: "Indian Vedic",
        };

        console.log("Input Data:", userData);

        if (userData.latitude && userData.longitude && userData.system === 'Indian Vedic') {
            console.log("Calling Vedic Engine...");
            const chart = calculateVedicChart(userData.birthDate, userData.birthTime, userData.latitude, userData.longitude);
            console.log("Calculated Chart:", JSON.stringify(chart, null, 2));
        } else {
            console.log("Skipping Vedic Engine (Condition not met)");
        }

    } catch (error) {
        console.error("FATAL ERROR:", error);
    }
}

testInsightGeneration();
