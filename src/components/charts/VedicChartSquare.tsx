import React from 'react';
import { ChartPlanet } from '../../types';

const VedicChartSquare: React.FC<{ planets: ChartPlanet[] }> = ({ planets = [] }) => {
    const size = 320;
    const strokeColor = "rgba(242, 13, 185, 0.4)";

    const houses = [
        { id: 1, path: `M 160 160 L 80 80 L 160 0 L 240 80 Z`, labelPos: { x: 160, y: 50 } },
        { id: 2, path: `M 80 80 L 0 0 L 160 0 Z`, labelPos: { x: 80, y: 25 } },
        { id: 3, path: `M 80 80 L 0 0 L 0 160 Z`, labelPos: { x: 30, y: 80 } },
        { id: 4, path: `M 160 160 L 80 80 L 0 160 L 80 240 Z`, labelPos: { x: 80, y: 160 } },
        { id: 5, path: `M 80 240 L 0 160 L 0 320 Z`, labelPos: { x: 30, y: 240 } },
        { id: 6, path: `M 80 240 L 0 320 L 160 320 Z`, labelPos: { x: 80, y: 295 } },
        { id: 7, path: `M 160 160 L 80 240 L 160 320 L 240 240 Z`, labelPos: { x: 160, y: 260 } },
        { id: 8, path: `M 240 240 L 160 320 L 320 320 Z`, labelPos: { x: 240, y: 295 } },
        { id: 9, path: `M 240 240 L 320 320 L 320 160 Z`, labelPos: { x: 290, y: 240 } },
        { id: 10, path: `M 160 160 L 240 240 L 320 160 L 240 80 Z`, labelPos: { x: 240, y: 160 } },
        { id: 11, path: `M 240 80 L 320 160 L 320 0 Z`, labelPos: { x: 290, y: 80 } },
        { id: 12, path: `M 240 80 L 320 0 L 160 0 Z`, labelPos: { x: 240, y: 25 } },
    ];

    const getHouseFromDegree = (degree: number) => {
        return Math.floor(degree / 30) + 1;
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 w-full">
            <div className="relative w-full max-w-[320px] aspect-square">
                <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full drop-shadow-[0_0_20px_rgba(242,13,185,0.15)]">
                    <rect x="0" y="0" width={size} height={size} fill="none" stroke={strokeColor} strokeWidth="2" />
                    <line x1="0" y1="0" x2={size} y2={size} stroke={strokeColor} strokeWidth="1" />
                    <line x1={size} y1="0" x2="0" y2={size} stroke={strokeColor} strokeWidth="1" />
                    <path d={`M ${size / 2} 0 L 0 ${size / 2} L ${size / 2} ${size} L ${size} ${size / 2} Z`} fill="none" stroke={strokeColor} strokeWidth="1" />
                    {houses.map((house) => {
                        const planetsInHouse = planets.filter(p => getHouseFromDegree(p.degree) === house.id);
                        return (
                            <g key={house.id}>
                                <text x={house.labelPos.x} y={house.labelPos.y} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="10" className="font-bold pointer-events-none">{house.id}</text>
                                {planetsInHouse.map((p, idx) => {
                                    const xOffset = (idx % 2 === 0 ? -12 : 12) * (idx > 1 ? 1.5 : 1);
                                    const yOffset = (idx < 2 ? 15 : 30);
                                    return (
                                        <g key={p.name + idx} className="cursor-help">
                                            <title>{p.name}: {p.degree}° in {p.sign}</title>
                                            <text x={house.labelPos.x + (planetsInHouse.length > 1 ? xOffset : 0)} y={house.labelPos.y + yOffset} textAnchor="middle" fill="#f20db9" fontSize="12" className="font-bold drop-shadow-md">{p.name.substring(0, 2)}</text>
                                        </g>
                                    );
                                })}
                            </g>
                        );
                    })}
                </svg>
                <div className="mt-4 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Janma Kundali</p>
                </div>
            </div>
        </div>
    );
};

export default VedicChartSquare;
