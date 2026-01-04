import React from 'react';
import { Ghost } from 'lucide-react';

export default function Cublet({ isDarkMode, themeColor }) {
    return (
        <div className={`w-full h-full flex flex-col items-center justify-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className={`p-6 rounded-full bg-${themeColor}-500/10 mb-4 animate-bounce`}>
                <Ghost size={48} className={`text-${themeColor}-500`} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Cublet Companion</h1>
            <p className="text-sm opacity-60">Coming Soon: Feed, Evolve & Customize</p>
        </div>
    );
}