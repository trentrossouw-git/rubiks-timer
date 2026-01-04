import React, { useState, useEffect } from 'react';
import { X, Keyboard, Hand, Palette, Timer, Monitor, Sun, Moon, Eye, EyeOff } from 'lucide-react';

const COLOR_VARIANTS = {
    indigo: { active: 'bg-indigo-500 border-indigo-400', inactive: 'bg-indigo-500/20 border-indigo-500/40' },
    emerald: { active: 'bg-emerald-500 border-emerald-400', inactive: 'bg-emerald-500/20 border-emerald-500/40' },
    rose: { active: 'bg-rose-500 border-rose-400', inactive: 'bg-rose-500/20 border-rose-500/40' },
    amber: { active: 'bg-amber-500 border-amber-400', inactive: 'bg-amber-500/20 border-amber-500/40' }
};

export default function Settings({ 
    onBack, 
    themeColor, setThemeColor,
    isDarkMode, setIsDarkMode,
    showVisualizer, setShowVisualizer,
    useInspection, setUseInspection,
    inspectionHotkey, setInspectionHotkey,
    timerHotkey, setTimerHotkey,
    holdDuration, setHoldDuration
}) {
    const [activeTab, setActiveTab] = useState('appearance');
    const [listeningFor, setListeningFor] = useState(null); // 'inspection' or 'timer' or null

    // Key Listener for Hotkeys
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (listeningFor) {
                e.preventDefault();
                const code = e.code;
                
                if (listeningFor === 'inspection') setInspectionHotkey(code);
                if (listeningFor === 'timer') setTimerHotkey(code);
                
                setListeningFor(null);
                return;
            }
            if (e.key.toLowerCase() === 's' || e.code === 'Escape') onBack();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [listeningFor, setInspectionHotkey, setTimerHotkey, onBack]);

    // Helpers
    const activeText = `text-${themeColor}-500`;
    const getSwitchStyle = (isActive) => {
        if (!isActive) return isDarkMode ? 'bg-gray-700' : 'bg-gray-300';
        return `bg-${themeColor}-500 shadow-[0_0_10px_rgba(var(--color-${themeColor}-500),0.4)]`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-2xl h-[500px] flex rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-[#0f1115] border-gray-800' : 'bg-white border-gray-200'}`}>
                
                {/* --- SIDEBAR --- */}
                <div className={`w-1/3 border-r p-4 flex flex-col gap-2 ${isDarkMode ? 'bg-[#13161c] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                    <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 pl-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Settings</h2>
                    
                    <button 
                        onClick={() => setActiveTab('appearance')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'appearance' 
                            ? (isDarkMode ? `bg-white/5 text-${themeColor}-400` : `bg-black/5 text-${themeColor}-600`) 
                            : (isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-black hover:bg-black/5')}`}
                    >
                        <Palette size={18} /> Appearance
                    </button>

                    <button 
                        onClick={() => setActiveTab('timer')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'timer' 
                            ? (isDarkMode ? `bg-white/5 text-${themeColor}-400` : `bg-black/5 text-${themeColor}-600`) 
                            : (isDarkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-black hover:bg-black/5')}`}
                    >
                        <Timer size={18} /> Timer
                    </button>
                    
                    <div className="mt-auto">
                         <button onClick={onBack} className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${isDarkMode ? 'border-gray-800 text-gray-500 hover:border-gray-700 hover:text-white' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-black'}`}>
                            Close (S)
                         </button>
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                <div className={`flex-1 p-8 overflow-y-auto ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    
                    {/* APPEARANCE TAB */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            {/* Color Picker */}
                            <section>
                                <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">Accent Color</h3>
                                <div className="grid grid-cols-4 gap-3">
                                    {Object.keys(COLOR_VARIANTS).map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setThemeColor(color)}
                                            className={`h-12 rounded-xl border-2 transition-all duration-200 ${
                                                themeColor === color 
                                                ? COLOR_VARIANTS[color].active + ' scale-105 shadow-lg'
                                                : COLOR_VARIANTS[color].inactive + ' hover:opacity-100 opacity-60'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </section>

                            {/* Dark/Light Mode */}
                            <section className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {isDarkMode ? <Moon size={20} className={activeText} /> : <Sun size={20} className="text-orange-400" />}
                                    <div>
                                        <span className="block text-sm font-medium">Dark Mode</span>
                                        <span className="text-[10px] text-gray-500 uppercase">Adjust interface brightness</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${isDarkMode ? `bg-${themeColor}-500` : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </section>

                            {/* Visualizer Toggle */}
                            <section className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {showVisualizer ? <Eye size={20} className={activeText} /> : <EyeOff size={20} className="text-gray-400" />}
                                    <div>
                                        <span className="block text-sm font-medium">3D Cube Visualizer</span>
                                        <span className="text-[10px] text-gray-500 uppercase">Show rendered cube state</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowVisualizer(!showVisualizer)}
                                    className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${showVisualizer ? `bg-${themeColor}-500` : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')}`}
                                >
                                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${showVisualizer ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </section>
                        </div>
                    )}

                    {/* TIMER TAB */}
                    {activeTab === 'timer' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            
                            {/* Inspection Toggle */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Hand size={20} className={useInspection ? activeText : 'text-gray-400'} />
                                        <div>
                                            <span className="block text-sm font-medium">WCA Inspection</span>
                                            <span className="text-[10px] text-gray-500 uppercase">15s countdown before solve</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setUseInspection(!useInspection)}
                                        className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${useInspection ? `bg-${themeColor}-500` : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${useInspection ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                
                                {useInspection && (
                                    <button 
                                        onClick={() => setListeningFor('inspection')}
                                        className={`w-full flex items-center justify-between border text-sm py-3 px-4 rounded-xl transition-all ${listeningFor === 'inspection' ? `border-${themeColor}-500 text-${themeColor}-500 bg-${themeColor}-500/10` : (isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50')}`}
                                    >
                                        <span className="font-medium">Inspection Hotkey</span>
                                        <div className="flex items-center gap-2 font-mono text-xs opacity-70">
                                            {listeningFor === 'inspection' ? 'Press key...' : inspectionHotkey.replace('Key', '')}
                                            <Keyboard size={14} />
                                        </div>
                                    </button>
                                )}
                            </section>

                            <hr className={isDarkMode ? 'border-gray-800' : 'border-gray-200'} />

                            {/* Timer Hotkey */}
                            <section>
                                <button 
                                    onClick={() => setListeningFor('timer')}
                                    className={`w-full flex items-center justify-between border text-sm py-3 px-4 rounded-xl transition-all mb-4 ${listeningFor === 'timer' ? `border-${themeColor}-500 text-${themeColor}-500 bg-${themeColor}-500/10` : (isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50')}`}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">Start Timer Hotkey</span>
                                        <span className="text-[10px] opacity-50 uppercase">Key to hold and release</span>
                                    </div>
                                    <div className="flex items-center gap-2 font-mono text-xs opacity-70">
                                        {listeningFor === 'timer' ? 'Press key...' : timerHotkey.replace('Key', '')}
                                        <Keyboard size={14} />
                                    </div>
                                </button>
                            </section>

                            {/* Hold Duration */}
                            <section className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Hold Duration (ms)</span>
                                    <span className="text-[10px] text-gray-500 uppercase">Time to hold before ready</span>
                                </div>
                                <div className={`relative w-24 rounded-xl border overflow-hidden ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                                    <input 
                                        type="number"
                                        value={holdDuration}
                                        onChange={(e) => setHoldDuration(e.target.value)}
                                        placeholder="550"
                                        className={`w-full h-10 px-3 text-center bg-transparent outline-none font-mono text-sm no-spinner ${isDarkMode ? 'text-white placeholder-gray-700' : 'text-black placeholder-gray-300'}`}
                                    />
                                </div>
                            </section>

                        </div>
                    )}
                </div>
            </div>
            
            {/* CSS to hide spinner arrows on number input */}
            <style jsx>{`
                .no-spinner::-webkit-inner-spin-button, 
                .no-spinner::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                .no-spinner { 
                    -moz-appearance: textfield; 
                }
            `}</style>
        </div>
    );
}