import { calculateVedicChart } from './api/vedic-engine.js';

async function test() {
    console.log("Testing User Case: Aug 23 1975, 08:30 PM, Dharapuram");
    // Dharapuram: 10.7366° N, 77.5250° E
    try {
        const result = await calculateVedicChart(
            "1975-08-23",
            "20:30",
            10.7366,
            77.5250,
            "Asia/Kolkata"
        );
        console.log("Calculated Chart:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
