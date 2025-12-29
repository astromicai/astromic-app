import React, { useState } from 'react';
import { UserData, InsightData } from '../../types';
import SouthIndianChart from '../charts/SouthIndianChart';
import NorthIndianChart from '../charts/NorthIndianChart';

interface VedicProfileProps {
    userData: UserData;
    data: InsightData;
    onOpenChat: (p?: string) => void;
}

const VedicProfile: React.FC<VedicProfileProps> = ({ userData, data, onOpenChat }) => {
    const [chartType, setChartType] = useState<'south' | 'north'>('south');

    const nakshatra = data.technicalDetails?.find((d) => d.label.toLowerCase().includes('nakshatra'));
    const yoga = data.technicalDetails?.find((d) => d.label.toLowerCase().includes('yoga') || d.label.toLowerCase().includes('yogam'));
    const rashi = data.technicalDetails?.find((d) => d.label.toLowerCase().includes('rashi') || d.label.toLowerCase().includes('moon sign'));
    const remainingDetails = data.technicalDetails?.filter((d) => d !== nakshatra && d !== yoga && d !== rashi) || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Chart Visualization Section */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">analytics</span>
                        Janma Kundali
                    </h3>
                    <div className="flex bg-black/20 rounded-lg p-1">
                        <button
                            onClick={() => setChartType('south')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${chartType === 'south' ? 'bg-primary text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                        >
                            South
                        </button>
                        <button
                            onClick={() => setChartType('north')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${chartType === 'north' ? 'bg-primary text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
                        >
                            North
                        </button>
                    </div>
                </div>

                <div className="flex justify-center mb-4">
                    {chartType === 'south' ? (
                        <SouthIndianChart data={data} language={userData.language} />
                    ) : (
                        <NorthIndianChart data={data} />
                    )}
                </div>
                <p className="text-center text-xs text-white/30 italic">
                    *Positions calculated using Lahiri Ayanamsa
                </p>
            </div>

            <div className="flex flex-col items-center text-center">
                {data.sigilUrl && (
                    <div className="relative size-48 my-8 group">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-[30px] animate-pulse" />

                        {typeof data.sigilUrl === 'string' && data.sigilUrl.trim().startsWith('<svg') ? (
                            <div
                                className="relative size-full rounded-full border-2 border-primary/30 shadow-2xl transition-transform duration-700 group-hover:scale-110 bg-background-dark overflow-hidden p-4"
                                dangerouslySetInnerHTML={{ __html: data.sigilUrl }}
                            />
                        ) : (
                            <img src={data.sigilUrl} alt="Celestial Sigil" className="relative size-full rounded-full object-cover border-2 border-primary/30 shadow-2xl transition-transform duration-700 group-hover:scale-110" />
                        )}

                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-surface-dark border border-white/10 px-3 py-1 rounded-full shadow-lg">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-primary">Your Celestial Sigil</span>
                        </div>
                    </div>
                )}
                <p className="text-white/60 text-sm mb-6 leading-relaxed px-4">{data.summary}</p>
                <div className="w-full grid grid-cols-1 gap-3 mb-6">
                    {nakshatra && (
                        <div className="bg-gradient-to-r from-primary/20 to-transparent border border-primary/30 rounded-2xl p-4 flex items-center justify-between group hover:bg-primary/30 transition-all cursor-pointer" onClick={() => onOpenChat(`Explain the Nakshatra of ${nakshatra.value} in my chart.`)}>
                            <div className="flex items-center gap-3 text-left">
                                <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white"><span className="material-symbols-outlined">star</span></div>
                                <div><p className="text-[10px] font-bold uppercase tracking-widest text-primary">Nakshatra</p><p className="text-lg font-bold text-white">{nakshatra.value}</p></div>
                            </div>
                            <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-colors">chevron_right</span>
                        </div>
                    )}
                    {rashi && (
                        <div className="bg-gradient-to-r from-purple-500/20 to-transparent border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between group hover:bg-purple-500/30 transition-all cursor-pointer" onClick={() => onOpenChat(`What is the meaning of ${rashi.value} Rashi ? `)}>
                            <div className="flex items-center gap-3 text-left">
                                <div className="size-10 rounded-full bg-purple-500 flex items-center justify-center text-white"><span className="material-symbols-outlined">nightlight</span></div>
                                <div><p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Chandra Rashi</p><p className="text-lg font-bold text-white">{rashi.value}</p></div>
                            </div>
                            <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-colors">chevron_right</span>
                        </div>
                    )}
                    {yoga && (
                        <div className="bg-gradient-to-r from-indigo-500/20 to-transparent border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between group hover:bg-indigo-500/30 transition-all cursor-pointer" onClick={() => onOpenChat(`Tell me more about the ${yoga.value} Yogam in my profile.`)}>
                            <div className="flex items-center gap-3 text-left">
                                <div className="size-10 rounded-full bg-indigo-500 flex items-center justify-center text-white"><span className="material-symbols-outlined">join_inner</span></div>
                                <div><p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Yogam</p><p className="text-lg font-bold text-white">{yoga.value}</p></div>
                            </div>
                            <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-colors">chevron_right</span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                    {remainingDetails && remainingDetails.length > 0 ? remainingDetails.map((detail, i: number) => (
                        <button key={i} onClick={() => onOpenChat(`What is the significance of ${detail.label}: ${detail.value}?`)} className="flex flex-col p-4 rounded-3xl bg-surface-dark/60 border border-white/10 backdrop-blur-md text-left hover:border-primary transition-all shadow-md active:scale-95">
                            <span className="text-white/50 text-[10px] font-bold uppercase mb-1.5 tracking-wider truncate w-full">{detail.label}</span>
                            <h3 className="text-base text-white font-bold leading-snug">{detail.value}</h3>
                        </button>
                    )) : null}
                </div>
                {data.navamsaInsight && (
                    <div className="w-full bg-gradient-to-br from-card-surface to-background-dark border border-white/10 rounded-[2.5rem] p-6 shadow-xl text-left">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary">diversity_1</span>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">Navamsa (D9) Soul Insight</h4>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed font-medium mb-4 italic">"{data.navamsaInsight}"</p>
                        <button onClick={() => onOpenChat(`I want a deep dive into my Navamsa chart.You mentioned: ${data.navamsaInsight} `)} className="text-primary text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                            Explore soul purpose <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VedicProfile;
