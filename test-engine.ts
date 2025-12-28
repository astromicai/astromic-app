import { calculateVedicChart } from './api/vedic-engine.js';

try {
    console.log("Testing Vedic Engine Full...");
    const result = calculateVedicChart("1975-08-23", "08:30 PM", 10.73, 77.52);
    console.log("Success:", JSON.stringify(result, null, 2));
} catch (error) {
    console.error("Crash:", error);
}
