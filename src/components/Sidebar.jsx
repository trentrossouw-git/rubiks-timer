import React from 'react';
import { Timer, BarChart2, Ghost, Settings, ChevronLeft, ChevronRight, User } from 'lucide-react';

export default function Sidebar({ 
    activeView, 
    setView, 
    themeColor, 
    isDarkMode, 
    isCollapsed, 
    toggleCollapse,
    navHotkeys,
    profileName,
    profileImage
}) {
    
    const formatKey = (code) => {
        if (!code) return '';
        return code.replace('Digit', '').replace('Key', '');
    };

    const getIconStyle = (viewName) => {
        const isActive = activeView === viewName;
        // CHANGED: Removed 'focus-visible:ring-2 focus-visible:ring-gray-400'
        // Added 'focus:outline-none' just to be safe
        const baseClass = "flex items-center gap-4 p-3 rounded-xl transition-all duration-300 relative group cursor-pointer overflow-hidden outline-none focus:outline-none";
        
        if (isActive) {
            return `${baseClass} bg-${themeColor}-500/20 text-${themeColor}-500 shadow-[0_0_15px_rgba(var(--color-${themeColor}-500),0.2)]`;
        }
        return `${baseClass} ${isDarkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-400 hover:text-gray-600 hover:bg-black/5'}`;
    };

    const navItems = [
        { id: 'timer', icon: Timer, label: 'Timer', hotkey: navHotkeys?.timer },
        { id: 'stats', icon: BarChart2, label: 'Stats', hotkey: navHotkeys?.stats },
        { id: 'cublet', icon: Ghost, label: 'Cublet', hotkey: navHotkeys?.cublet },
        { id: 'settings', icon: Settings, label: 'Settings', hotkey: navHotkeys?.settings },
    ];

    return (
        <div 
            className={`h-screen flex flex-col py-6 z-50 border-r backdrop-blur-md transition-all duration-300 ease-in-out
            ${isDarkMode ? 'bg-[#0f1115]/90 border-white/5' : 'bg-white/90 border-black/5'}
            ${isCollapsed ? 'w-20 items-center' : 'w-64 px-4'}
            `}
        >
            
            {/* PROFILE SECTION */}
            <div className={`mb-8 flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center mb-10' : 'px-2 gap-3 mb-8'}`}>
                
                {/* Avatar */}
                <div className={`w-10 h-10 shrink-0 rounded-full overflow-hidden shadow-lg border-2 ${isDarkMode ? 'border-gray-800' : 'border-white'} relative`}>
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br from-${themeColor}-500 to-${themeColor}-700 flex items-center justify-center`}>
                            <User size={18} className="text-white/80" />
                        </div>
                    )}
                </div>
                
                {/* Profile Name */}
                <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    <span className={`font-bold text-sm truncate max-w-[140px] ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {profileName || 'Guest'}
                    </span>
                </div>
            </div>

            {/* Navigation Items */}
            <div className="flex flex-col gap-2 w-full">
                {navItems.map((item) => (
                    <button 
                        key={item.id} 
                        onClick={() => setView(item.id)} 
                        className={getIconStyle(item.id)}
                        title={isCollapsed ? item.label : ''}
                    >
                        <item.icon size={22} className="shrink-0" />
                        <span className={`text-sm font-bold tracking-wide whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                            {item.label}
                        </span>
                        {item.hotkey && (
                            <span className={`absolute right-2 bottom-2 text-[10px] font-mono opacity-50 border px-1 rounded transition-all duration-300
                                ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-100'}
                                ${isCollapsed ? 'scale-75 translate-y-1 translate-x-1' : ''}
                            `}>
                                {formatKey(item.hotkey)}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Bottom Section */}
            <div className="mt-auto flex flex-col gap-2 w-full">
                <div className={`h-px w-full my-2 ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`} />

                <button 
                    onClick={toggleCollapse}
                    tabIndex="-1" 
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors outline-none focus:outline-none ${isDarkMode ? 'text-gray-600 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-black hover:bg-black/5'}`}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>
        </div>
    );
}