import React from 'react';
import { ArrowLeft, Palette, Check, Clock } from 'lucide-react';

const THEME_OPTIONS = [
    { id: 'indigo', color: 'bg-indigo-500', glass: 'bg-indigo-500/10 border-indigo-500/20' },
    { id: 'emerald', color: 'bg-emerald-500', glass: 'bg-emerald-500/10 border-emerald-500/20' },
    { id: 'rose', color: 'bg-rose-500', glass: 'bg-rose-500/10 border-rose-500/20' },
    { id: 'amber', color: 'bg-amber-500', glass: 'bg-amber-500/10 border-amber-500/20' },
];

export default function Settings({ onBack, themeColor, setThemeColor, useInspection, setUseInspection }) {
    const activeTheme = THEME_OPTIONS.find(t => t.id === themeColor) || THEME_OPTIONS[0];

    return (
        <div className="min-h-screen bg-[#0a0e13] text-gray-100 p-8 font-sans animate-in fade-in duration-300">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-full cursor-pointer transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                </div>

                <div className="space-y-12">
                    {/* Theme Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-6 text-gray-400">
                            <Palette size={18} />
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Accent Theme</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {THEME_OPTIONS.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => setThemeColor(theme.id)}
                                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all cursor-pointer backdrop-blur-md ${
                                        themeColor === theme.id 
                                        ? `${theme.glass} border-opacity-50 ring-1 ring-white/10 scale-105 shadow-[0_0_20px_rgba(0,0,0,0.3)]` 
                                        : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-full ${theme.color} shadow-lg`} />
                                    <span className={`text-xs font-semibold capitalize ${themeColor === theme.id ? 'text-white' : 'text-gray-500'}`}>{theme.id}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Inspection Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-6 text-gray-400">
                            <Clock size={18} />
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em]">Timer Behavior</h2>
                        </div>
                        <div 
                            onClick={() => setUseInspection(!useInspection)}
                            className={`flex items-center justify-between p-6 rounded-2xl border backdrop-blur-md cursor-pointer transition-all ${
                                useInspection ? activeTheme.glass : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                            }`}
                        >
                            <div>
                                <span className="block text-sm font-bold text-white">WCA Inspection</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">15 second countdown</span>
                            </div>
                            <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${useInspection ? 'bg-green-500' : 'bg-gray-700'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${useInspection ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="mt-16 flex justify-center">
                    <button onClick={onBack} className={`px-10 py-3 bg-gray-800 hover:bg-gray-700 text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all border border-gray-700 cursor-pointer`}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}