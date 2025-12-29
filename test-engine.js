"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vedic_engine_js_1 = require("./api/vedic-engine.js");
async function test() {
    console.log("Testing User Case: Aug 23 1975, 08:30 PM, Dharapuram");
    // Dharapuram: 10.7366° N, 77.5250° E
    try {
        const result = await (0, vedic_engine_js_1.calculateVedicChart)("1975-08-23", "20:30", 10.7366, 77.5250, "Asia/Kolkata");
        console.log("Calculated Chart:", JSON.stringify(result, null, 2));
    }
    catch (error) {
        console.error("Error:", error);
    }
}
test();
