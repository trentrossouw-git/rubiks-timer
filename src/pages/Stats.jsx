import React from 'react';

export default function Stats({ isDarkMode }) {
    return (
        <div className={`w-full h-full flex flex-col items-center justify-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <h1 className="text-2xl font-bold mb-2">Statistics</h1>
            <p className="text-sm opacity-60">Coming Soon: Charts, Graphs & History</p>
        </div>
    );
}