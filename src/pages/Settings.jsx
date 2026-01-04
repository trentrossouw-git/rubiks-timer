import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, Hand, Palette, Timer, LayoutGrid, Sun, Moon, Eye, EyeOff, User, Upload } from 'lucide-react';

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
    holdDuration, setHoldDuration,
    navHotkeys, setNavHotkeys,
    profileName, setProfileName,
    profileImage, setProfileImage
}) {
    const [activeTab, setActiveTab] = useState('profile');
    const [listeningFor, setListeningFor] = useState(null); 
    const fileInputRef = useRef(null); // Ref for the hidden file input

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (listeningFor) {
                e.preventDefault();
                const code = e.code;
                if (listeningFor === 'inspection') setInspectionHotkey(code);
                else if (listeningFor === 'timer') setTimerHotkey(code);
                else if (listeningFor.startsWith('nav-')) {
                    const key = listeningFor.replace('nav-', '');
                    setNavHotkeys({ ...navHotkeys, [key]: code });
                }
                setListeningFor(null);
                return;
            }
            if (e.key.toLowerCase() === 's' || e.code === 'Escape') onBack();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [listeningFor, setInspectionHotkey, setTimerHotkey, setNavHotkeys, navHotkeys, onBack]);

    const activeText = `text-${themeColor}-500`;

    // Handle Image Upload logic
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result); // Save Base64 string to state
            };
            reader.readAsDataURL(file);
        }
    };

    // Components
    const NavTab = ({ id, icon: Icon, label }) => (
        <button onClick={() => setActiveTab(id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === id ? (isDarkMode ? `bg-white/5 text-${themeColor}-400` : `bg-black/5 text-${themeColor}-600`) : 'text-gray-500 hover:text-gray-900'}`}>
            <Icon size={18} /> {label}
        </button>
    );

    const HotkeyButton = ({ label, value, listenId }) => (
        <button 
            onClick={() => setListeningFor(listenId)}
            className={`w-full flex items-center justify-between border text-sm py-3 px-4 rounded-xl transition-all mb-3 ${listeningFor === listenId ? `border-${themeColor}-500 text-${themeColor}-500 bg-${themeColor}-500/10` : (isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50')}`}
        >
            <span className="font-medium">{label}</span>
            <div className="flex items-center gap-2 font-mono text-xs opacity-70">
                {listeningFor === listenId ? 'Press key...' : (value ? value.replace('Digit', '').replace('Key', '') : 'Unset')}
                <Keyboard size={14} />
            </div>
        </button>
    );

    return (
        <div className={`w-full max-w-4xl h-[600px] flex rounded-2xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-[#0f1115] border-gray-800' : 'bg-white border-gray-200'}`}>
            
            {/* SIDEBAR */}
            <div className={`w-64 border-r p-6 flex flex-col gap-2 ${isDarkMode ? 'bg-[#13161c] border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 pl-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Configuration</h2>
                <NavTab id="profile" icon={User} label="Profile" />
                <NavTab id="appearance" icon={Palette} label="Appearance" />
                <NavTab id="timer" icon={Timer} label="Timer & Input" />
                <NavTab id="navigation" icon={LayoutGrid} label="Navigation" />
            </div>

            {/* CONTENT */}
            <div className={`flex-1 p-10 overflow-y-auto ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                
                {/* PROFILE SETTINGS */}
                {activeTab === 'profile' && (
                     <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <section>
                            <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">Public Profile</h3>
                            
                            <div className="flex gap-6 items-start">
                                {/* Preview */}
                                <div className={`w-24 h-24 shrink-0 rounded-full overflow-hidden border-4 shadow-lg ${isDarkMode ? 'border-gray-800' : 'border-white'}`}>
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-700 flex items-center justify-center`}>
                                            <User size={32} className="text-white/80" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 space-y-4">
                                    {/* Name Input */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1 ml-1 opacity-60">Display Name</label>
                                        <input 
                                            type="text" 
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                            className={`w-full px-4 py-2 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-${themeColor}-500/50 ${isDarkMode ? 'border-gray-700 focus:border-transparent' : 'border-gray-300'}`}
                                            placeholder="Guest"
                                        />
                                    </div>
                                    
                                    {/* Image Upload Buttons */}
                                    <div>
                                        <label className="block text-xs font-bold mb-1 ml-1 opacity-60">Avatar Image</label>
                                        
                                        <div className="flex gap-2">
                                            {/* Hidden File Input */}
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                onChange={handleImageUpload}
                                                className="hidden" 
                                                accept="image/*"
                                            />
                                            
                                            {/* Trigger Button */}
                                            <button 
                                                onClick={() => fileInputRef.current.click()}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${isDarkMode ? 'border-gray-700 hover:bg-white/5' : 'border-gray-300 hover:bg-black/5'}`}
                                            >
                                                <Upload size={14} /> Upload File
                                            </button>
                                            
                                            {/* Remove Button */}
                                            {profileImage && (
                                                <button 
                                                    onClick={() => setProfileImage('')}
                                                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide text-red-500 hover:bg-red-500/10 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                     </div>
                )}

                {/* (Rest of the tabs remain exactly the same as previous step...) */}
                {/* APPEARANCE */}
                {activeTab === 'appearance' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        <section>
                            <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">Theme Color</h3>
                            <div className="grid grid-cols-4 gap-3">
                                {Object.keys(COLOR_VARIANTS).map(color => (
                                    <button key={color} onClick={() => setThemeColor(color)} className={`h-12 rounded-xl border-2 transition-all duration-200 ${themeColor === color ? COLOR_VARIANTS[color].active + ' scale-105 shadow-lg' : COLOR_VARIANTS[color].inactive + ' opacity-60 hover:opacity-100'}`} />
                                ))}
                            </div>
                        </section>
                        <section className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {isDarkMode ? <Moon size={20} className={activeText} /> : <Sun size={20} className="text-orange-400" />}
                                <div><span className="block text-sm font-medium">Dark Mode</span></div>
                            </div>
                            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${isDarkMode ? `bg-${themeColor}-500` : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </section>
                        <section className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {showVisualizer ? <Eye size={20} className={activeText} /> : <EyeOff size={20} className="text-gray-400" />}
                                <div><span className="block text-sm font-medium">3D Cube Visualizer</span></div>
                            </div>
                            <button onClick={() => setShowVisualizer(!showVisualizer)} className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${showVisualizer ? `bg-${themeColor}-500` : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')}`}>
                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${showVisualizer ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </section>
                    </div>
                )}

                {/* TIMER */}
                {activeTab === 'timer' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                         <section>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Hand size={20} className={useInspection ? activeText : 'text-gray-400'} />
                                    <div><span className="block text-sm font-medium">WCA Inspection</span></div>
                                </div>
                                <button onClick={() => setUseInspection(!useInspection)} className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${useInspection ? `bg-${themeColor}-500` : (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')}`}><div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${useInspection ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                            </div>
                            {useInspection && <HotkeyButton label="Inspection Start/Cancel" value={inspectionHotkey} listenId="inspection" />}
                        </section>
                        <hr className={isDarkMode ? 'border-gray-800' : 'border-gray-200'} />
                        <section>
                            <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">Controls</h3>
                            <HotkeyButton label="Start Timer Hotkey" value={timerHotkey} listenId="timer" />
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-sm font-medium">Hold Duration (ms)</span>
                                <div className={`w-24 rounded-xl border overflow-hidden ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                                    <input type="number" value={holdDuration} onChange={(e) => setHoldDuration(e.target.value)} className={`w-full h-10 px-3 text-center bg-transparent outline-none font-mono text-sm ${isDarkMode ? 'text-white' : 'text-black'}`} />
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* NAVIGATION */}
                {activeTab === 'navigation' && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <h3 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">Sidebar Shortcuts</h3>
                        <HotkeyButton label="Go to Timer" value={navHotkeys?.timer} listenId="nav-timer" />
                        <HotkeyButton label="Go to Stats" value={navHotkeys?.stats} listenId="nav-stats" />
                        <HotkeyButton label="Go to Cublet" value={navHotkeys?.cublet} listenId="nav-cublet" />
                        <HotkeyButton label="Go to Settings" value={navHotkeys?.settings} listenId="nav-settings" />
                    </div>
                )}
            </div>
        </div>
    );
}