import React from 'react';
import { ChartPlanet } from '../../types';

const NatalChartWheel: React.FC<{ planets: ChartPlanet[] }> = ({ planets = [] }) => {
    const size = 320;
    const center = size / 2;
    const radius = center - 20;
    const innerRadius = radius - 40;
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const getCoordinates = (deg: number, r: number) => {
        const angle = (deg - 90) * (Math.PI / 180);
        return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 w-full">
            <div className="relative group w-full max-w-[320px] aspect-square">
                <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full drop-shadow-[0_0_15px_rgba(242,13,185,0.2)]">
                    <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    {signs.map((sign, i) => {
                        const startAngle = i * 30;
                        const endAngle = (i + 1) * 30;
                        const start = getCoordinates(startAngle, radius);
                        const innerStart = getCoordinates(startAngle, innerRadius);
                        const innerEnd = getCoordinates(endAngle, innerRadius);
                        return (
                            <g key={sign}>
                                <line x1={innerStart.x} y1={innerStart.y} x2={start.x} y2={start.y} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <path d={`M ${innerStart.x} ${innerStart.y} A ${innerRadius} ${innerRadius} 0 0 1 ${innerEnd.x} ${innerEnd.y}`} fill="none" stroke="rgba(242,13,185,0.2)" strokeWidth="1" />
                            </g>
                        );
                    })}
                    {planets.map((planet, i) => {
                        const pos = getCoordinates(planet.degree, innerRadius - 20);
                        const labelPos = getCoordinates(planet.degree, innerRadius - 45);
                        return (
                            <g key={i} className="cursor-help transition-all duration-300 hover:scale-110">
                                <title>{planet.name}: {planet.degree}° {planet.sign}</title>
                                <line x1={center} y1={center} x2={pos.x} y2={pos.y} stroke="rgba(204,13,242,0.1)" strokeWidth="1" strokeDasharray="4 2" />
                                <circle cx={pos.x} cy={pos.y} r="8" fill="#f20db9" className="animate-pulse-slow" />
                                <text x={labelPos.x} y={labelPos.y} textAnchor="middle" alignmentBaseline="middle" fill="white" fontSize="10" className="font-bold pointer-events-none">{planet.name.substring(0, 2)}</text>
                            </g>
                        );
                    })}
                    <circle cx={center} cy={center} r="4" fill="white" opacity="0.5" />
                </svg>
            </div>
        </div>
    );
};

export default NatalChartWheel;
