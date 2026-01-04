import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Trophy, Move3d, Sparkles, Zap, ArrowDown, Edit2, Check, X, Wallet, Trash2, RotateCw, ChevronUp } from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';

// --- CONFIGURATION ---
const FEED_COST = 5;
const XP_PER_FEED = 25;
const XP_BASE_REQ = 100;
const CUBIE_SIZE = 36; 
const DROP_ZONE_RADIUS = 100;

const CUBE_COLORS = {
    top: '#ffffff',    // White
    bottom: '#fbbf24', // Yellow
    front: '#22c55e',  // Green
    back: '#3b82f6',   // Blue
    left: '#f97316',   // Orange
    right: '#ef4444'   // Red
};

// Size Thresholds
const getCubletStage = (level) => {
    if (level === 0) return { size: 1, stageName: "Cublet Egg" };
    if (level < 8) return { size: 2, stageName: "Rookie Cube" };  
    if (level < 27) return { size: 3, stageName: "Speed Cube" };  
    return { size: 4, stageName: "Master Cube" };                 
};

// Generate a random valid 90-degree rotation
const generatePieceRotation = (seed) => {
    const axes = [0, 90, 180, 270];
    const r1 = (seed * 9301 + 49297) % 233280;
    const r2 = (seed * 1231 + 4566) % 233280;
    const r3 = (seed * 888 + 999) % 233280;
    return {
        rotateX: axes[r1 % 4],
        rotateY: axes[r2 % 4],
        rotateZ: axes[r3 % 4]
    };
};

export default function Cublet({ isDarkMode, wallet, setWallet }) {
    const [view, setView] = useState('main'); 
    const [cubletData, setCubletData] = useLocalStorage('cublet_data_v5', {
        name: 'Cubie',
        level: 0, xp: 0, totalFed: 0
    });
    
    // VISUAL & ANIMATION STATE
    const [visualLevel, setVisualLevel] = useState(cubletData.level);
    const [evolutionPhase, setEvolutionPhase] = useState('idle'); // 'idle' | 'ready-to-solve' | 'solving' | 'ready-to-upgrade'
    
    // UI STATE
    const [isEating, setIsEating] = useState(false);
    const [levelUpType, setLevelUpType] = useState(null); 
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState("");
    
    // FOOD STATE
    const [hasFoodItem, setHasFoodItem] = useState(false);
    const [isDraggingFood, setIsDraggingFood] = useState(false);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 }); 
    const [isHoveringMouth, setIsHoveringMouth] = useState(false);
    const [feedMultiplier, setFeedMultiplier] = useState(1);
    
    const containerRef = useRef(null); 

    const stageInfo = getCubletStage(visualLevel);
    const xpRequired = XP_BASE_REQ * Math.ceil((cubletData.level + 1) * 1.2);
    const progressPercent = Math.min(100, (cubletData.xp / xpRequired) * 100);
    const piecesColored = cubletData.level; 

    // --- RESET ---
    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset your Cublet?")) {
            setCubletData({ name: 'Cubie', level: 0, xp: 0, totalFed: 0 });
            setVisualLevel(0);
            setEvolutionPhase('idle');
            setWallet(prev => ({ ...prev, cubes: 100 })); 
        }
    };

    // --- SCRAMBLE MAP ---
    const scrambleMap = useMemo(() => {
        const map = {};
        const size = stageInfo.size;
        let id = 0;
        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    map[`${x}-${y}-${z}`] = generatePieceRotation(id + (visualLevel * 100));
                    id++;
                }
            }
        }
        return map;
    }, [visualLevel, stageInfo.size]);

    // --- NAME EDITING ---
    const startEditing = () => {
        setTempName(cubletData.name);
        setIsEditingName(true);
    };
    
    const saveName = () => {
        if (tempName.trim()) {
            setCubletData(prev => ({ ...prev, name: tempName.trim() }));
        }
        setIsEditingName(false);
    };

    // --- MAIN ACTION HANDLER (Feed / Solve / Upgrade) ---
    const handleMainAction = () => {
        // 1. If Normal Phase -> Dispense Food
        if (evolutionPhase === 'idle') {
            const totalCost = FEED_COST * feedMultiplier;
            if (wallet.cubes < totalCost) return;
            if (hasFoodItem) return; 
            setWallet(prev => ({ ...prev, cubes: prev.cubes - totalCost }));
            setHasFoodItem(true);
            return;
        }

        // 2. If Ready to Solve -> Start Solving Animation
        if (evolutionPhase === 'ready-to-solve') {
            setEvolutionPhase('solving');
            setTimeout(() => {
                setEvolutionPhase('ready-to-upgrade');
            }, 2500); // Wait for solve animation
            return;
        }

        // 3. If Ready to Upgrade -> Trigger Size Increase
        if (evolutionPhase === 'ready-to-upgrade') {
            setVisualLevel(prev => prev + 1); // This bumps the visual size
            setEvolutionPhase('idle'); // Reset to scrambling state
            setLevelUpType(null);
            return;
        }
    };

    // --- DRAG LOGIC ---
    const startDrag = (e) => {
        if (evolutionPhase !== 'idle') return; // Disable drag during evolution
        e.preventDefault(); 
        setIsDraggingFood(true);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setDragPos({ x: clientX, y: clientY });
    };

    useEffect(() => {
        if (!isDraggingFood) return;

        const handleMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setDragPos({ x: clientX, y: clientY });

            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = (rect.top + rect.height / 2) - 30; 
                const dist = Math.hypot(clientX - centerX, clientY - centerY);
                setIsHoveringMouth(dist < DROP_ZONE_RADIUS);
            }
        };

        const handleUp = () => {
            setIsDraggingFood(false);
            if (isHoveringMouth) consumeFood(); 
            setIsHoveringMouth(false);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDraggingFood, isHoveringMouth]);


    const consumeFood = () => {
        setIsEating(true);     
        setHasFoodItem(false); 
        setTimeout(() => setIsEating(false), 800);

        setCubletData(prev => {
            let xpGained = XP_PER_FEED * feedMultiplier;
            let newXp = prev.xp + xpGained;
            let newLevel = prev.level;
            
            if (newXp >= xpRequired) {
                newXp = newXp - xpRequired;
                newLevel += 1; // Real level goes up
                
                const oldStage = getCubletStage(prev.level);
                const newStage = getCubletStage(newLevel);
                
                // If this level up causes a size change...
                if (newStage.size > oldStage.size) {
                    // Enter Evolution Flow
                    // We DO NOT update visualLevel yet. We wait for user interaction.
                    setEvolutionPhase('ready-to-solve');
                    setLevelUpType('evolve'); // shows "SOLVE ME" text or similar
                } else {
                    // Standard Level Up (just pieces unlocking)
                    setVisualLevel(newLevel); 
                    triggerLevelUpEffect('piece');
                }
            } else {
                setVisualLevel(newLevel); 
            }
            
            return { ...prev, xp: newXp, level: newLevel, totalFed: prev.totalFed + feedMultiplier };
        });
    };

    const triggerLevelUpEffect = (type) => {
        setLevelUpType(type);
        setTimeout(() => setLevelUpType(null), 2500);
    };

    // Helper to determine button text/state
    const getMainButtonProps = () => {
        switch(evolutionPhase) {
            case 'ready-to-solve':
                return { 
                    text: "Solve Cube", 
                    icon: <RotateCw size={20} />, 
                    color: "bg-green-500 hover:bg-green-400 text-white" 
                };
            case 'solving':
                return { 
                    text: "Solving...", 
                    icon: <RotateCw size={20} className="animate-spin" />, 
                    color: "bg-green-600 text-white cursor-wait",
                    disabled: true
                };
            case 'ready-to-upgrade':
                return { 
                    text: "Upgrade Size", 
                    icon: <ChevronUp size={20} />, 
                    color: "bg-purple-600 hover:bg-purple-500 text-white" 
                };
            default: // idle
                return { 
                    text: hasFoodItem ? "Feed!" : "Dispense", 
                    icon: <ArrowDown size={20} />, 
                    color: (wallet.cubes < (FEED_COST * feedMultiplier) || hasFoodItem) 
                        ? 'bg-gray-500 opacity-50 cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-400'
                };
        }
    };

    const btnProps = getMainButtonProps();

    return (
        <div className={`w-full h-full flex flex-col ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} select-none`}>
            
            {isDraggingFood && (
                <FoodDraggable x={dragPos.x} y={dragPos.y} multiplier={feedMultiplier} />
            )}

            {/* HEADER */}
            <div className="flex justify-between items-center p-6 pb-2 shrink-0">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Companion</h1>
                    <div className="flex items-center gap-2 text-xs font-medium opacity-60 mt-1">
                        <Wallet size={12} />
                        <span>{wallet.cubes.toLocaleString()} Cubes</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleReset}
                        className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-500 hover:bg-red-200'}`}
                        title="Reset Cublet"
                    >
                        <Trash2 size={16} />
                    </button>

                    <div className={`flex p-1 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <button onClick={() => setView('main')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${view === 'main' ? (isDarkMode ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : 'text-gray-500'}`}>Cublet</button>
                        <button onClick={() => setView('achievements')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${view === 'achievements' ? (isDarkMode ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : 'text-gray-500'}`}>Trophies</button>
                    </div>
                </div>
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {view === 'main' && (
                        <motion.div 
                            key="main" 
                            initial={{ opacity: 0, x: -20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: 20 }} 
                            className="w-full h-full flex flex-col items-center justify-start pt-2 pb-6 relative overflow-y-auto"
                        >
                            <AnimatePresence>
                                {levelUpType === 'piece' && (
                                    <motion.div initial={{ opacity: 0, y: 50, scale: 0.5 }} animate={{ opacity: 1, y: -100, scale: 1 }} exit={{ opacity: 0, y: -150 }} className="absolute z-50 pointer-events-none bg-yellow-400 text-yellow-900 font-black px-4 py-2 rounded-xl shadow-xl flex items-center gap-2" style={{ top: '40%' }}>
                                        <Sparkles size={20} /> <span>PIECE UNLOCKED!</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* NAME */}
                            <div className="flex justify-center items-center mb-2 w-full max-w-xs mx-auto h-10 shrink-0">
                                {isEditingName ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <input 
                                            autoFocus type="text" value={tempName} 
                                            onChange={(e) => setTempName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveName()}
                                            className={`w-full max-w-[200px] bg-transparent border-b-2 text-center text-2xl font-bold outline-none ${isDarkMode ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                                        />
                                        <button onClick={saveName} className="p-1 text-green-500 hover:bg-green-500/10 rounded"><Check size={20} /></button>
                                        <button onClick={() => setIsEditingName(false)} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><X size={20} /></button>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <h2 className="text-3xl font-bold text-center">{cubletData.name}</h2>
                                        <button 
                                            onClick={startEditing}
                                            className={`absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-200 text-gray-400'}`}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className={`inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${evolutionPhase !== 'idle' ? 'bg-yellow-400 text-yellow-900' : (isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600')}`}>
                                {evolutionPhase === 'solving' ? (
                                    <span className="animate-pulse">SOLVING...</span>
                                ) : evolutionPhase === 'ready-to-solve' ? (
                                    <span>READY TO SOLVE</span>
                                ) : evolutionPhase === 'ready-to-upgrade' ? (
                                    <span>READY TO EVOLVE</span>
                                ) : (
                                    <>
                                        <span>Lvl {visualLevel}</span>
                                        <span>•</span>
                                        <span>{stageInfo.stageName}</span>
                                    </>
                                )}
                            </div>

                            {/* AVATAR */}
                            <div className="mb-4 relative w-full flex justify-center h-[240px] shrink-0 items-center">
                                <CubletAvatar 
                                    containerRef={containerRef}
                                    stageInfo={stageInfo}
                                    isEating={isEating}
                                    // Solved if we are solving OR waiting to upgrade
                                    isSolving={evolutionPhase === 'solving' || evolutionPhase === 'ready-to-upgrade'}
                                    isDraggingFood={isDraggingFood}
                                    hasFoodItem={hasFoodItem}
                                    piecesColored={piecesColored}
                                    scrambleMap={scrambleMap}
                                    isDarkMode={isDarkMode}
                                />
                                
                                {/* SPAWN ZONE - ONLY SHOW IF IDLE */}
                                <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center h-14 z-50 pointer-events-auto">
                                    <AnimatePresence mode="wait">
                                        {evolutionPhase === 'idle' && hasFoodItem && !isDraggingFood ? (
                                            <motion.div
                                                initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }}
                                                className="cursor-grab active:cursor-grabbing select-none"
                                                onMouseDown={startDrag} onTouchStart={startDrag} onDragStart={(e) => e.preventDefault()} 
                                            >
                                                <div className="relative w-10 h-10 animate-bounce" style={{ transform: `scale(${1 + (feedMultiplier * 0.05)})` }}>
                                                    <div className="absolute inset-0 bg-blue-500 rounded-lg shadow-lg border border-blue-300 transform rotate-12" />
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold bg-white text-blue-600 px-2 py-0.5 rounded shadow whitespace-nowrap">
                                                        {feedMultiplier > 1 ? `${feedMultiplier}x` : 'Drag'}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : evolutionPhase === 'idle' && !isDraggingFood ? (
                                            <motion.div 
                                                initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
                                                className="text-xs font-medium flex items-center gap-1 pointer-events-none select-none"
                                            >
                                                <Move3d size={14} />
                                                <span>Drag Cube to Rotate</span>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>

                                {isEating && evolutionPhase === 'idle' && (
                                    <motion.div initial={{ opacity: 1, y: 0, scale: 0.8 }} animate={{ opacity: 0, y: -60, scale: 1.2 }} className={`absolute top-10 font-black text-2xl text-blue-500 z-50 drop-shadow-lg pointer-events-none`}>
                                        +{XP_PER_FEED * feedMultiplier} XP
                                    </motion.div>
                                )}
                            </div>

                            {/* PROGRESS */}
                            <div className="w-full max-w-xs px-4 mb-6 select-none shrink-0">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1.5">
                                    <span>Progress</span>
                                    <span>{Math.floor(cubletData.xp)} / {xpRequired} XP</span>
                                </div>
                                <div className={`h-3 w-full rounded-full overflow-hidden p-0.5 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                    <motion.div className="h-full rounded-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ type: 'spring', bounce: 0, duration: 0.5 }} />
                                </div>
                            </div>

                            {/* CONTROLS */}
                            <div className="flex flex-col items-center gap-3 shrink-0">
                                {/* MULTIPLIER (Only show when idle) */}
                                {evolutionPhase === 'idle' && (
                                    <div className={`flex items-center gap-1 p-1 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                        {[1, 5, 10].map(amount => (
                                            <button
                                                key={amount}
                                                onClick={() => setFeedMultiplier(amount)}
                                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${feedMultiplier === amount ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                            >
                                                {amount}x
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* MAIN ACTION BUTTON */}
                                <button
                                    onClick={handleMainAction}
                                    disabled={btnProps.disabled || (evolutionPhase === 'idle' && (wallet.cubes < (FEED_COST * feedMultiplier) || hasFoodItem))} 
                                    className={`group relative px-10 py-3 rounded-xl font-bold text-base shadow-xl transition-all active:scale-95 active:shadow-sm ${btnProps.color} ${btnProps.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="flex items-center gap-2">
                                        {btnProps.icon}
                                        {btnProps.text}
                                    </span>
                                    {/* Cost Badge (Idle only) */}
                                    {evolutionPhase === 'idle' && !hasFoodItem && (
                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md ring-2 ring-white dark:ring-gray-900 select-none">-{FEED_COST * feedMultiplier}</div>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                    {view === 'achievements' && (
                        <motion.div key="achievements" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-300'}`}><Trophy size={48} /></div>
                            <h3 className="text-xl font-bold mb-2">Achievements Locked</h3>
                            <p className="text-gray-500 max-w-sm">Continue leveling up your Cublet to unlock the achievement hall.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// --- EXTRACTED COMPONENT ---
const CubletAvatar = ({ containerRef, stageInfo, isEating, isSolving, isDraggingFood, hasFoodItem, piecesColored, scrambleMap, isDarkMode }) => {
    const { size } = stageInfo;
    const containerSize = size * CUBIE_SIZE;
    const faceDepth = (size * CUBIE_SIZE) / 2;

    const rotateX = useMotionValue(-20);
    const rotateY = useMotionValue(30);
    const rotateXSpring = useSpring(rotateX, { stiffness: 120, damping: 20 });
    const rotateYSpring = useSpring(rotateY, { stiffness: 120, damping: 20 });

    const [isRotating, setIsRotating] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const handlePointerDown = (e) => {
        if (isDraggingFood) return; 
        setIsRotating(true);
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e) => {
        if (!isRotating) return;
        e.preventDefault();
        const deltaX = e.clientX - lastPos.current.x;
        const deltaY = e.clientY - lastPos.current.y;
        rotateY.set(rotateY.get() + deltaX * 0.5); 
        rotateX.set(rotateX.get() - deltaY * 0.5);
        lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const cubies = [];
    let count = 0;
    for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const isUnlocked = count < piecesColored; 
                const rotation = scrambleMap[`${x}-${y}-${z}`] || {rotateX:0, rotateY:0, rotateZ:0};
                cubies.push(
                    <Cubie 
                        key={`${x}-${y}-${z}`} x={x} y={y} z={z} size={size} 
                        isUnlocked={isUnlocked} isDarkMode={isDarkMode}
                        rotation={rotation}
                        isSolving={isSolving}
                    />
                );
                count++;
            }
        }
    }

    const isHappyMode = hasFoodItem || isDraggingFood || isEating;
    const faceState = isHappyMode ? 'happy' : 'idle';

    return (
        <div 
            ref={containerRef}
            className="relative flex items-center justify-center touch-none"
            style={{ 
                perspective: '1000px', width: '260px', height: '260px',
                cursor: isRotating ? 'grabbing' : 'grab' 
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setIsRotating(false)}
            onPointerLeave={() => setIsRotating(false)}
        >
            <motion.div 
                animate={
                    isSolving ? { scale: [1, 1.1, 1], rotateY: [0, 360, 0] } :
                    isEating ? { rotateZ: [0, -5, 5, -2, 2, 0], scale: [1, 1.15, 1] } : 
                    { y: [0, -10, 0] } 
                }
                transition={
                    isSolving ? { duration: 2.5, ease: "easeInOut" } :
                    isEating ? { duration: 0.6, ease: "backOut" } :
                    { duration: 4, repeat: Infinity, ease: "easeInOut" }
                }
                className="relative transition-transform duration-200"
                style={{ 
                    width: containerSize, height: containerSize,
                    transformStyle: 'preserve-3d',
                    rotateX: rotateXSpring, rotateY: rotateYSpring
                }}
            >
                {cubies}
                
                {/* FACE - Hidden during solve to emphasize mechanical action */}
                {!isSolving && (
                    <div 
                        className="absolute flex flex-col items-center justify-center z-50 pointer-events-none origin-center"
                        style={{
                            transform: `translateZ(${faceDepth + 10}px) scale(${size === 1 ? 0.35 : 1})`, 
                            left: '50%', top: '50%', width: '100px', height: '60px',
                            marginLeft: '-50px', marginTop: '-30px',
                            backfaceVisibility: 'hidden'
                        }}
                    >
                        <div className="flex gap-4 mb-2">
                            <Eye isHappy={faceState === 'happy'} />
                            <Eye isHappy={faceState === 'happy'} />
                        </div>
                        <Mouth isHappy={faceState === 'happy'} />
                    </div>
                )}
            </motion.div>
        </div>
    );
};

// --- DRAGGABLE FOOD ---
const FoodDraggable = ({ x, y, multiplier }) => {
    if (typeof document === 'undefined') return null;
    const scale = 1 + (multiplier * 0.05);

    return createPortal(
        <div 
            className="fixed z-[9999] pointer-events-none select-none" 
            style={{ 
                top: 0, left: 0,
                transform: `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0) scale(${scale})`,
                width: '30px', height: '30px'
            }}
            onDragStart={(e) => e.preventDefault()}
        >
            <motion.div
                animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%' }}
            >
                {[0, 90, 180, 270].map(deg => (
                    <div key={deg} className="absolute w-full h-full bg-blue-500/90 border border-blue-200 shadow-[0_0_10px_blue]" style={{ transform: `rotateY(${deg}deg) translateZ(15px)` }} />
                ))}
                <div className="absolute w-full h-full bg-blue-500/90 border border-blue-200" style={{ transform: 'rotateX(90deg) translateZ(15px)' }} />
                <div className="absolute w-full h-full bg-blue-500/90 border border-blue-200" style={{ transform: 'rotateX(-90deg) translateZ(15px)' }} />
            </motion.div>
        </div>,
        document.body
    );
};

// --- MOUTH ---
const Mouth = ({ isHappy }) => {
    return (
        <motion.div
            className="bg-black rounded-full overflow-hidden border-2 border-gray-900/20"
            animate={isHappy ? { width: 24, height: 24, borderRadius: '50%', backgroundColor: '#000' } : { width: 10, height: 5, borderRadius: 20, backgroundColor: '#374151' }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
    );
};

// --- EYE ---
const Eye = ({ isHappy }) => {
    return (
        <div className="relative w-8 h-8 bg-white rounded-full overflow-hidden shadow-sm border-2 border-gray-900 flex items-center justify-center">
            <AnimatePresence>
                {isHappy ? (
                    <motion.div key="happy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 translate-y-1"><path d="M 4 14 Q 12 4 20 14" /></svg>
                    </motion.div>
                ) : (
                    <motion.div key="normal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 bg-gray-900 rounded-full relative"><div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-90" /></div>
                        <motion.div className="absolute top-0 left-0 w-full bg-gray-900 z-10" initial={{ height: "0%" }} animate={{ height: ["0%", "100%", "0%", "0%", "0%"] }} transition={{ duration: 3.5, times: [0, 0.05, 0.1, 0.15, 1], repeat: Infinity }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- CUBIE (Standard) ---
const Cubie = ({ x, y, z, size, isUnlocked, isDarkMode, rotation, isSolving }) => {
    const offset = (size * CUBIE_SIZE) / 2 - (CUBIE_SIZE / 2);
    const xPos = x * CUBIE_SIZE - offset;
    const yPos = y * CUBIE_SIZE - offset;
    const zPos = z * CUBIE_SIZE - offset;
    
    const greyFill = isDarkMode ? '#4b5563' : '#d1d5db'; 
    const internalBlack = '#1a1a1a'; 

    const getFaceColor = (faceType) => {
        if (!isUnlocked) return greyFill; 
        switch (faceType) {
            case 'top': return CUBE_COLORS.top;
            case 'bottom': return CUBE_COLORS.bottom;
            case 'front': return CUBE_COLORS.front;
            case 'back': return CUBE_COLORS.back;
            case 'right': return CUBE_COLORS.right;
            case 'left': return CUBE_COLORS.left;
            default: return internalBlack;
        }
    };

    const faceStyle = (faceType, transform) => {
        const color = getFaceColor(faceType);
        
        // FIX: Ensure GREY pieces also get borders so they don't look like a merged blob
        const isInternal = color === internalBlack;
        
        return {
            position: 'absolute', width: `${CUBIE_SIZE}px`, height: `${CUBIE_SIZE}px`,
            boxSizing: 'border-box', borderRadius: '6px', 
            // Apply border if NOT internal (shows for both Colored and Grey)
            border: `2px solid ${isInternal ? 'transparent' : (isDarkMode ? '#000' : 'rgba(0,0,0,0.15)')}`, 
            backgroundColor: color,
            boxShadow: !isInternal ? 'inset 0 0 8px rgba(0,0,0,0.15)' : 'none',
            transform: transform, backfaceVisibility: 'hidden', 
        };
    };
    
    const halfSize = CUBIE_SIZE / 2;

    const animateState = isSolving 
        ? { rotateX: 0, rotateY: 0, rotateZ: 0 } 
        : { rotateX: rotation.rotateX, rotateY: rotation.rotateY, rotateZ: rotation.rotateZ };

    return (
        <motion.div
            initial={false} 
            animate={animateState}
            transition={{ duration: isSolving ? 2.0 : 0, ease: "easeInOut" }}
            style={{
                position: 'absolute', top: '50%', left: '50%',
                width: `${CUBIE_SIZE}px`, height: `${CUBIE_SIZE}px`,
                transformStyle: 'preserve-3d',
                x: xPos, y: -yPos, z: zPos, scale: 0.96,
                marginTop: `-${CUBIE_SIZE / 2}px`, marginLeft: `-${CUBIE_SIZE / 2}px`,
            }}
        >
            <div style={faceStyle('front',  `translateZ(${halfSize}px)`)} />
            <div style={faceStyle('back',   `rotateY(180deg) translateZ(${halfSize}px)`)} />
            <div style={faceStyle('right',  `rotateY(90deg) translateZ(${halfSize}px)`)} />
            <div style={faceStyle('left',   `rotateY(-90deg) translateZ(${halfSize}px)`)} />
            <div style={faceStyle('top',    `rotateX(90deg) translateZ(${halfSize}px)`)} />
            <div style={faceStyle('bottom', `rotateX(-90deg) translateZ(${halfSize}px)`)} />
        </motion.div>
    );
};