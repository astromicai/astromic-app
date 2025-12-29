import React from 'react';
import { InsightData } from '../../types';

interface ChartProps {
    data: InsightData;
}

const SouthIndianChart: React.FC<ChartProps> = ({ data }) => {
    // Mapping of Sign Name to Grid Position (1-12 usually)
    // Grid Layout:
    // Pi(12) Ar(1)  Ta(2)  Ge(3)
    // Aq(11)              Cn(4)
    // Cp(10)              Le(5)
    // Sg(9)  Sc(8)  Li(7)  Vi(6)

    // Returns array of planets/points in a specific sign
    const getPointsInSign = (signName: string) => {
        const points = [];

        // Check Ascendant
        const ascSign = data.technicalDetails?.find(d => d.label.includes('Ascendant') || d.label.includes('Lagnam'))?.value;
        if (ascSign?.includes(signName)) points.push("Asc");

        // Check Planets
        data.chartData?.planets.forEach(p => {
            if (p.sign.includes(signName)) {
                // Shorten names: Sun->Su, Moon->Mo, Mars->Ma, Mercury->Me, Jupiter->Ju, Venus->Ve, Saturn->Sa, Rahu->Ra, Ketu->Ke
                const short = p.name.substring(0, 2);
                points.push(short);
            }
        });

        return points;
    };

    const renderCell = (sign: string, label: string) => {
        const points = getPointsInSign(sign);
        return (
            <div className="relative border border-white/20 p-1 min-h-[80px] flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                <span className="absolute top-1 left-1 text-[10px] text-white/30 uppercase">{label}</span>
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                    {points.map((pt, i) => (
                        <span key={i} className={`text-xs font-bold ${pt === 'Asc' ? 'text-red-400' : 'text-primary'}`}>
                            {pt}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-md mx-auto aspect-square border-2 border-primary/30 bg-black/40 rounded-lg overflow-hidden grid grid-cols-4 grid-rows-4 text-white select-none">
            {/* Row 1 */}
            {renderCell("Pisces", "Pisces")}
            {renderCell("Aries", "Aries")}
            {renderCell("Taurus", "Taurus")}
            {renderCell("Gemini", "Gemini")}

            {/* Row 2 */}
            {renderCell("Aquarius", "Aquarius")}
            <div className="col-span-2 row-span-2 border border-white/10 flex items-center justify-center relative bg-center bg-no-repeat bg-contain" style={{ backgroundImage: 'url(/assets/mandala-bg.png)' }}>
                <div className="text-center opacity-50">
                    <span className="block text-sm font-bold tracking-widest text-primary">SOUTH</span>
                    <span className="text-[10px] uppercase">Indian Style</span>
                </div>
            </div>
            {renderCell("Cancer", "Cancer")}

            {/* Row 3 */}
            {renderCell("Capricorn", "Capricorn")}
            {/* Middle is spanned */}
            {renderCell("Leo", "Leo")}

            {/* Row 4 */}
            {renderCell("Sagittarius", "Sagittarius")}
            {renderCell("Scorpio", "Scorpio")}
            {renderCell("Libra", "Libra")}
            {renderCell("Virgo", "Virgo")}
        </div>
    );
};

export default SouthIndianChart;
