import React from 'react';
import { InsightData } from '../../types';

interface ChartProps {
    data: InsightData;
}

const NorthIndianChart: React.FC<ChartProps & { language?: string }> = ({ data, language = 'English' }) => {
    // North Indian Chart: Houses are FIXED. Signs move.
    // House 1 is always Top Center Diamond.
    // House order is Anti-Clockwise.

    const TRANSLATIONS: any = {
        'Tamil': {
            planets: {
                "Sun": "சூ", "Moon": "சந்", "Mars": "செ", "Mercury": "பு",
                "Jupiter": "குரு", "Venus": "சுக்", "Saturn": "சனி", "Rahu": "ரா", "Ketu": "கே", "Asc": "ல"
            }
        }
    };

    const getTranslatedPlanet = (planet: string) => {
        if (language === 'Tamil' && TRANSLATIONS['Tamil'].planets[planet]) {
            return TRANSLATIONS['Tamil'].planets[planet];
        }
        return planet.substring(0, 2);
    };

    // 1. Determine Ascendant Sign Name
    const ascSignName = data.rawChart?.ascendant?.sign || data.technicalDetails?.find(d => d.label.includes('Ascendant') || d.label.includes('Lagnam'))?.value || "Aries";

    const ZODIAC = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];

    // Find index of Ascendant sign (0-11)
    let ascIndex = ZODIAC.findIndex(z => ascSignName.includes(z));
    if (ascIndex === -1) ascIndex = 0; // Default Aries

    // Helper to get sign for a specific house (1-12)
    const getSignForHouse = (houseNum: number) => {
        const signIndex = (ascIndex + (houseNum - 1)) % 12;
        return ZODIAC[signIndex];
    };

    const getPointsInHouse = (houseNum: number) => {
        const signName = getSignForHouse(houseNum);
        const points = [];

        if (houseNum === 1) points.push(getTranslatedPlanet("Asc"));

        if (data.rawChart?.planets) {
            data.rawChart.planets.forEach(p => {
                if (p.sign === signName) {
                    points.push(getTranslatedPlanet(p.name));
                }
            });
        } else {
            data.chartData?.planets.forEach(p => {
                if (p.sign.includes(signName)) {
                    points.push(getTranslatedPlanet(p.name));
                }
            });
        }
        return { points, signIndex: (ascIndex + (houseNum - 1)) % 12 + 1 }; // 1-12 for display
    };

    // SVGs are easiest for the Diamond Layout
    // ViewBox 0 0 200 200
    // Center: 100,100
    // House 1: Top Diamond. Center (100, 50).
    // House 4: Left Diamond. Center (50, 100).
    // House 7: Bottom Diamond. Center (100, 150).
    // House 10: Right Diamond. Center (150, 100).

    // Triangles fill corners.

    const renderHouseContent = (houseNum: number, cx: number, cy: number) => {
        const { points, signIndex } = getPointsInHouse(houseNum);
        return (
            <g transform={`translate(${cx}, ${cy})`}>
                <text y="-10" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.3)" fontWeight="bold">{signIndex}</text>
                <text y="5" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
                    {points.slice(0, 2).join(' ')}
                </text>
                {points.length > 2 && (
                    <text y="14" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
                        {points.slice(2).join(' ')}
                    </text>
                )}
            </g>
        );
    };

    return (
        <div className="w-full max-w-md mx-auto aspect-square border-2 border-primary/30 bg-black/40 rounded-lg overflow-hidden relative select-none">
            <svg viewBox="0 0 200 200" className="w-full h-full stroke-white/20 stroke-1">
                {/* Main Cross */}
                <line x1="0" y1="0" x2="200" y2="200" />
                <line x1="200" y1="0" x2="0" y2="200" />

                {/* Diamonds Outline */}
                <line x1="100" y1="0" x2="200" y2="100" />
                <line x1="200" y1="100" x2="100" y2="200" />
                <line x1="100" y1="200" x2="0" y2="100" />
                <line x1="0" y1="100" x2="100" y2="0" />

                {/* House 1 (Top Center) */}
                {renderHouseContent(1, 100, 45)}

                {/* House 2 (Top Left - Inner) */}
                {renderHouseContent(2, 50, 25)}

                {/* House 3 (Left Top - Corner) */}
                {renderHouseContent(3, 25, 60)}

                {/* House 4 (Left Center) */}
                {renderHouseContent(4, 50, 100)}

                {/* House 5 (Left Bottom - Corner) */}
                {renderHouseContent(5, 25, 140)}

                {/* House 6 (Bottom Left - Inner) */}
                {renderHouseContent(6, 50, 175)}

                {/* House 7 (Bottom Center) */}
                {renderHouseContent(7, 100, 155)}

                {/* House 8 (Bottom Right - Inner) */}
                {renderHouseContent(8, 150, 175)}

                {/* House 9 (Right Bottom - Corner) */}
                {renderHouseContent(9, 175, 140)}

                {/* House 10 (Right Center) */}
                {renderHouseContent(10, 150, 100)}

                {/* House 11 (Right Top - Corner) */}
                {renderHouseContent(11, 175, 60)}

                {/* House 12 (Top Right - Inner) */}
                {renderHouseContent(12, 150, 25)}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase opacity-20 mt-32">North Indian</span>
            </div>
        </div>
    );
};

export default NorthIndianChart;
