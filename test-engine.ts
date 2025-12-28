
import Astronomy from 'astronomy-engine';

try {
    console.log("Testing Vedic Engine Debug...");
    const date = new Date();
    const observer = new Astronomy.Observer(10, 77, 0);
    const eq = Astronomy.Equator("Sun", date, observer, false, true);
    console.log("Equator Result Keys:", Object.keys(eq));
    console.log("Vector:", eq.vec);

    // Try Ecliptic
    console.log("Trying Ecliptic(eq)...");
    try {
        const ecl = Astronomy.Ecliptic(eq.vec);
        console.log("Ecliptic Result:", ecl);
    } catch (e) { console.log("Ecliptic(vec) Failed:", e.message); }

} catch (error) {
    console.error("Crash:", error);
}
