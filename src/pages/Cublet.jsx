import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Trophy, Cookie, Move3d } from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';

// --- CONFIGURATION ---
const FEED_COST = 5;
const XP_PER_FEED = 25;
const XP_BASE_REQ = 100;
const CUBIE_SIZE = 40; // px

// Standard Rubik's Color Palette
const CUBE_COLORS = {
    top: '#ffffff',    // White
    bottom: '#fbbf24', // Yellow
    front: '#22c55e',  // Green
    back: '#3b82f6',   // Blue
    left: '#f97316',   // Orange
    right: '#ef4444'   // Red
};

const getCubletStage = (level) => {
    if (level === 0) return { size: 1, stageName: "Cublet Egg" };
    if (level === 1) return { size: 1, stageName: "Baby Cublet" };
    if (level <= 8) return { size: 2, stageName: "Rookie Cube" };
    if (level <= 27) return { size: 3, stageName: "Speed Cube" };
    return { size: 4, stageName: "Master Cube" };
};

export default function Cublet({ isDarkMode, wallet, setWallet }) {
    const [view, setView] = useState('main'); 
    const [cubletData, setCubletData] = useLocalStorage('cublet_data_v2', {
        name: 'Cubie',
        level: 0, 
        xp: 0,
        totalFed: 0
    });
    const [isFeeding, setIsFeeding] = useState(false);

    const stageInfo = getCubletStage(cubletData.level);
    const xpRequired = XP_BASE_REQ * Math.ceil((cubletData.level + 1) * 1.2);
    const progressPercent = Math.min(100, (cubletData.xp / xpRequired) * 100);
    const piecesColored = cubletData.level;

    const handleFeed = () => {
        if (wallet.cubes < FEED_COST) return;

        setIsFeeding(true);
        setTimeout(() => setIsFeeding(false), 200);

        setWallet(prev => ({ ...prev, cubes: prev.cubes - FEED_COST }));

        setCubletData(prev => {
            let newXp = prev.xp + XP_PER_FEED;
            let newLevel = prev.level;
            
            if (newXp >= xpRequired) {
                newXp = newXp - xpRequired;
                newLevel += 1;
            }

            return { ...prev, xp: newXp, level: newLevel, totalFed: prev.totalFed + 1 };
        });
    };

    // --- INTERACTIVE 3D AVATAR ---
    const CubletAvatar = () => {
        const { size } = stageInfo;
        const containerSize = size * CUBIE_SIZE;

        // --- ROTATION STATE ---
        // We use motion values instead of React state for 60fps performance without re-renders
        const rotateX = useMotionValue(-20);
        const rotateY = useMotionValue(30);
        
        // Add springs for momentum/physics
        const rotateXSpring = useSpring(rotateX, { stiffness: 120, damping: 20 });
        const rotateYSpring = useSpring(rotateY, { stiffness: 120, damping: 20 });

        const [isDragging, setIsDragging] = useState(false);
        const lastPos = useRef({ x: 0, y: 0 });

        const handlePointerDown = (e) => {
            setIsDragging(true);
            lastPos.current = { x: e.clientX, y: e.clientY };
        };

        const handlePointerMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const deltaX = e.clientX - lastPos.current.x;
            const deltaY = e.clientY - lastPos.current.y;

            // Invert deltaY for natural feel (drag up = rotate up)
            rotateY.set(rotateY.get() + deltaX * 0.5); 
            rotateX.set(rotateX.get() - deltaY * 0.5);

            lastPos.current = { x: e.clientX, y: e.clientY };
        };

        const handlePointerUp = () => {
            setIsDragging(false);
        };

        // Re-generate grid based on level
        const cubies = [];
        let count = 0;
        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const isUnlocked = count < piecesColored; 
                    cubies.push(
                        <Cubie 
                            key={`${x}-${y}-${z}`} x={x} y={y} z={z} size={size} 
                            isUnlocked={isUnlocked} isDarkMode={isDarkMode}
                        />
                    );
                    count++;
                }
            }
        }

        return (
            <div 
                className="relative flex items-center justify-center touch-none"
                style={{ 
                    perspective: '1000px', 
                    width: '300px', 
                    height: '300px',
                    cursor: isDragging ? 'grabbing' : 'grab' 
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <motion.div 
                    // Float animation on Y axis only (position), rotation is handled by drag
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    
                    className={`relative transition-transform duration-200 ${isFeeding ? 'scale-110' : 'scale-100'}`}
                    style={{ 
                        width: containerSize, 
                        height: containerSize,
                        transformStyle: 'preserve-3d',
                        rotateX: rotateXSpring,
                        rotateY: rotateYSpring
                    }}
                >
                    {cubies}
                    
                    {/* Eyes - Attached to the front face cluster */}
                    <div 
                        className="absolute flex gap-3 z-50 pointer-events-none"
                        style={{
                            transform: `translateZ(${containerSize / 2 + 1}px)`, 
                            left: '50%', top: '50%', marginLeft: '-18px', marginTop: '-8px' 
                        }}
                    >
                        <Eye isFeeding={isFeeding} />
                        <Eye isFeeding={isFeeding} />
                    </div>
                </motion.div>

                {/* Interaction Hint */}
                <div className={`absolute bottom-0 text-xs font-medium flex items-center gap-1 pointer-events-none transition-opacity duration-300 ${isDragging ? 'opacity-0' : 'opacity-40'}`}>
                    <Move3d size={14} />
                    <span>Drag to Rotate</span>
                </div>
            </div>
        );
    };

    return (
        <div className={`w-full h-full flex flex-col ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            <div className="flex justify-between items-center p-8 pb-0">
                <h1 className="text-2xl font-bold tracking-tight">Companion</h1>
                <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <button onClick={() => setView('main')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'main' ? (isDarkMode ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : 'text-gray-500'}`}>Cublet</button>
                    <button onClick={() => setView('achievements')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'achievements' ? (isDarkMode ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : 'text-gray-500'}`}>Trophies</button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {view === 'main' && (
                        <motion.div key="main" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-full h-full flex flex-col items-center justify-center pb-20">
                            
                            <div className="text-center mb-4 select-none">
                                <h2 className="text-3xl font-bold mb-2">{cubletData.name}</h2>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                                    <span>Lvl {cubletData.level}</span>
                                    <span>•</span>
                                    <span>{piecesColored} / {Math.pow(stageInfo.size, 3)} Pieces</span>
                                </div>
                            </div>

                            {/* Avatar Container */}
                            <div className="mb-12 relative w-full flex justify-center h-[320px] items-center">
                                <CubletAvatar />
                                {isFeeding && (
                                    <motion.div initial={{ opacity: 1, y: 0, scale: 0.8 }} animate={{ opacity: 0, y: -60, scale: 1.2 }} className={`absolute top-10 font-black text-2xl text-blue-500 z-50 drop-shadow-lg pointer-events-none`}>
                                        +{XP_PER_FEED} XP
                                    </motion.div>
                                )}
                            </div>

                            <div className="w-full max-w-md px-8 mb-8 select-none">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-50 mb-2">
                                    <span>Progress to Lvl {cubletData.level + 1}</span>
                                    <span>{Math.floor(cubletData.xp)} / {xpRequired} XP</span>
                                </div>
                                <div className={`h-4 w-full rounded-full overflow-hidden p-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                    <motion.div className="h-full rounded-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ type: 'spring', bounce: 0, duration: 0.5 }} />
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <button onClick={handleFeed} disabled={wallet.cubes < FEED_COST} className={`group relative px-12 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 active:shadow-sm bg-blue-500 text-white hover:bg-blue-400`}>
                                    <span className="flex items-center gap-2"><Cookie size={24} /> Feed Cublet</span>
                                    <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md ring-2 ring-white dark:ring-gray-900 select-none">-{FEED_COST} 🧊</div>
                                </button>
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Wallet: {wallet.cubes || 0} Cubes</p>
                            </div>
                        </motion.div>
                    )}

                    {view === 'achievements' && (
                        <motion.div key="achievements" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-300'}`}>
                                <Trophy size={48} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Achievements Locked</h3>
                            <p className="text-gray-500 max-w-sm">Continue leveling up your Cublet to unlock the achievement hall.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

const Eye = ({ isFeeding }) => (
    <motion.div 
        className="w-4 h-4 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-sm border-2 border-gray-900"
        animate={isFeeding ? { scaleY: [1, 0.1, 1], transition: { duration: 0.2 } } : { scaleY: [1, 0.1, 1] }}
        transition={{ repeat: Infinity, duration: 4, repeatDelay: 3 }}
    >
        <div className="w-2 h-2 bg-gray-900 rounded-full translate-x-0.5" />
    </motion.div>
);

// --- 3D Cubie Component ---
const Cubie = ({ x, y, z, size, isUnlocked, isDarkMode }) => {
    // Center offset calculations
    const offset = (size * CUBIE_SIZE) / 2 - (CUBIE_SIZE / 2);
    const xPos = x * CUBIE_SIZE - offset;
    const yPos = y * CUBIE_SIZE - offset;
    const zPos = z * CUBIE_SIZE - offset;

    // Visual Config
    const greyFill = isDarkMode ? '#4b5563' : '#d1d5db'; 
    const greyBorder = isDarkMode ? '#1f2937' : '#9ca3af';

    const getFaceColor = (faceType) => {
        if (!isUnlocked) return greyFill;

        switch (faceType) {
            case 'top': return y === size - 1 ? CUBE_COLORS.top : '#000';
            case 'bottom': return y === 0 ? CUBE_COLORS.bottom : '#000';
            case 'front': return z === size - 1 ? CUBE_COLORS.front : '#000';
            case 'back': return z === 0 ? CUBE_COLORS.back : '#000';
            case 'right': return x === size - 1 ? CUBE_COLORS.right : '#000';
            case 'left': return x === 0 ? CUBE_COLORS.left : '#000';
            default: return '#000';
        }
    };

    const faceStyle = (faceType, transform) => ({
        position: 'absolute',
        width: `${CUBIE_SIZE}px`,
        height: `${CUBIE_SIZE}px`,
        boxSizing: 'border-box',
        border: `1px solid ${isUnlocked ? '#000' : greyBorder}`, 
        backgroundColor: getFaceColor(faceType),
        transform: transform,
    });
    
    const halfSize = CUBIE_SIZE / 2;

    return (
        <div
            style={{
                position: 'absolute',
                width: `${CUBIE_SIZE}px`,
                height: `${CUBIE_SIZE}px`,
                transformStyle: 'preserve-3d',
                transform: `translateX(${xPos}px) translateY(${-yPos}px) translateZ(${zPos}px)`,
            }}
        >
            <div style={faceStyle('front',  `translateZ(${halfSize}px)`)} />
            <div style={faceStyle('back',   `rotateY(180deg) translateZ(${halfSize}px)`)} />
            <div style={faceStyle('right',  `rotateY(90deg) translateZ(${halfSize}px)`)} />
            <div style={faceStyle('left',   `rotateY(-90deg) translateZ(${halfSize}px)`)} />
            <div style={faceStyle('top',    `rotateX(90deg) translateZ(${halfSize}px)`)} />
            <div style={faceStyle('bottom', `rotateX(-90deg) translateZ(${halfSize}px)`)} />
        </div>
    );
};