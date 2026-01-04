import React, { useState, useEffect } from 'react';
import { X, Keyboard, Hand, Palette, Settings as SettingsIcon } from 'lucide-react';

// Define explicit classes for each color to ensure Tailwind generates them
const COLOR_VARIANTS = {
    indigo: {
        active: 'bg-indigo-500 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-105 ring-2 ring-indigo-500/20',
        inactive: 'bg-indigo-900/40 border-indigo-500/50 hover:bg-indigo-500/40 hover:border-indigo-400'
    },
    emerald: {
        active: 'bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105 ring-2 ring-emerald-500/20',
        inactive: 'bg-emerald-900/40 border-emerald-500/50 hover:bg-emerald-500/40 hover:border-emerald-400'
    },
    rose: {
        active: 'bg-rose-500 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-105 ring-2 ring-rose-500/20',
        inactive: 'bg-rose-900/40 border-rose-500/50 hover:bg-rose-500/40 hover:border-rose-400'
    },
    amber: {
        active: 'bg-amber-500 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105 ring-2 ring-amber-500/20',
        inactive: 'bg-amber-900/40 border-amber-500/50 hover:bg-amber-500/40 hover:border-amber-400'
    }
};

export default function Settings({ 
    onBack, 
    themeColor, 
    setThemeColor, 
    useInspection, 
    setUseInspection,
    inspectionHotkey,
    setInspectionHotkey
}) {
    const [isListening, setIsListening] = useState(false);

    // Handle keys: Recording hotkey OR closing settings with 'S'
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isListening) {
                e.preventDefault();
                if(e.code === "Space") { 
                    setIsListening(false);
                    return;
                }
                setInspectionHotkey(e.code);
                setIsListening(false);
                return;
            }

            // Close settings if 'S' or 'Escape' is pressed
            if (e.key.toLowerCase() === 's' || e.code === 'Escape') {
                onBack();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isListening, setInspectionHotkey, onBack]);

    const activeText = `text-${themeColor}-400`;
    
    // Explicit Glassy Switch Styles
    const getSwitchStyle = () => {
        if (!useInspection) return 'bg-gray-700';
        switch(themeColor) {
            case 'indigo': return 'bg-indigo-500/30 border border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]';
            case 'emerald': return 'bg-emerald-500/30 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
            case 'rose': return 'bg-rose-500/30 border border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
            case 'amber': return 'bg-amber-500/30 border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
            default: return 'bg-indigo-500/30 border border-indigo-500';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="w-full max-w-md bg-[#0f1115] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100 ring-1 ring-white/5">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#13161c]">
                    <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                        <SettingsIcon size={18} className={activeText} />
                        Preferences
                    </h2>
                    <button onClick={onBack} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">
                    
                    {/* Inspection Section */}
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-500 mb-3 border-b border-gray-700 pb-1 uppercase tracking-widest flex items-center gap-2">
                            <Hand size={12} /> WCA Inspection
                        </h3>
                        <div className="space-y-4">
                            <div 
                                onClick={() => setUseInspection(!useInspection)}
                                className="flex items-center justify-between bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 cursor-pointer hover:bg-gray-900 hover:border-gray-600 transition-all group"
                            >
                                <div>
                                    <span className="block text-sm font-medium text-gray-200 group-hover:text-white transition-colors">Enable Inspection</span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">15s countdown</span>
                                </div>
                                
                                {/* Animated Switch with Glass Effect */}
                                <div className={`w-11 h-6 rounded-full relative transition-all duration-300 ease-in-out ${getSwitchStyle()}`}>
                                    <div 
                                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${useInspection ? 'translate-x-5' : 'translate-x-0'}`}
                                    />
                                </div>
                            </div>

                            {useInspection && (
                                <div className="animate-in slide-in-from-top-2 duration-300 ease-out pl-1">
                                    <span className="block text-[10px] text-gray-500 mb-2 uppercase tracking-wider font-semibold">Start/Cancel Hotkey</span>
                                    <button 
                                        onClick={() => setIsListening(true)}
                                        className={`w-full flex items-center justify-between bg-gray-900 border text-sm py-3 px-4 rounded-xl transition-all cursor-pointer ${isListening ? `border-${themeColor}-500/50 ring-1 ring-${themeColor}-500/50 bg-${themeColor}-500/10 text-${themeColor}-200` : 'border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'}`}
                                    >
                                        <span className="font-mono font-medium">
                                            {isListening ? 'Press any key...' : (inspectionHotkey ? inspectionHotkey.replace('Key', '') : 'Not Set')}
                                        </span>
                                        <Keyboard size={16} className={isListening ? 'animate-pulse text-white' : 'text-gray-500'} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Theme Section */}
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-500 mb-3 border-b border-gray-700 pb-1 uppercase tracking-widest flex items-center gap-2">
                            <Palette size={12} /> Interface Theme
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                            {Object.keys(COLOR_VARIANTS).map(color => (
                                <button
                                    key={color}
                                    onClick={() => setThemeColor(color)}
                                    className={`h-10 rounded-lg border transition-all duration-300 ${
                                        themeColor === color 
                                        ? COLOR_VARIANTS[color].active
                                        : COLOR_VARIANTS[color].inactive
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}