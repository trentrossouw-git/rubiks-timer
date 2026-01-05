// src/pages/cublet/Cublet.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Move3d, Sparkles, ArrowDown, Edit2, Check, X, Wallet, Trash2, RotateCw, ChevronUp } from 'lucide-react';

// Adjusted path: Go up two levels (../..) to get out of pages/cublet to find hooks
import useLocalStorage from '../../hooks/useLocalStorage';

import CubletAvatar from './CubletAvatar';
import FoodDraggable from './FoodDraggable';
import { FEED_COST, XP_PER_FEED, XP_BASE_REQ, DROP_ZONE_RADIUS, getCubletStage, generatePieceRotation } from './CubletUtils';

export default function Cublet({ isDarkMode, wallet, setWallet }) {
    const [view, setView] = useState('main'); 
    const [cubletData, setCubletData] = useLocalStorage('cublet_data_v5', {
        name: 'Cubie',
        level: 0, xp: 0, totalFed: 0
    });
    
    // VISUAL & ANIMATION STATE
    const [visualLevel, setVisualLevel] = useState(cubletData.level);
    const [evolutionPhase, setEvolutionPhase] = useState('idle'); 
    
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

    // --- MAIN ACTION HANDLER ---
    const handleMainAction = () => {
        if (evolutionPhase === 'idle') {
            const totalCost = FEED_COST * feedMultiplier;
            if (wallet.cubes < totalCost) return;
            if (hasFoodItem) return; 
            setWallet(prev => ({ ...prev, cubes: prev.cubes - totalCost }));
            setHasFoodItem(true);
            return;
        }

        if (evolutionPhase === 'ready-to-solve') {
            setEvolutionPhase('solving');
            setTimeout(() => {
                setEvolutionPhase('ready-to-upgrade');
            }, 2500); 
            return;
        }

        if (evolutionPhase === 'ready-to-upgrade') {
            setVisualLevel(prev => prev + 1); 
            setEvolutionPhase('idle'); 
            setLevelUpType(null);
            return;
        }
    };

    // --- DRAG LOGIC ---
    const startDrag = (e) => {
        if (evolutionPhase !== 'idle') return; 
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
                newLevel += 1; 
                
                const oldStage = getCubletStage(prev.level);
                const newStage = getCubletStage(newLevel);
                
                if (newStage.size > oldStage.size) {
                    setEvolutionPhase('ready-to-solve');
                    setLevelUpType('evolve'); 
                } else {
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

    const getMainButtonProps = () => {
        switch(evolutionPhase) {
            case 'ready-to-solve':
                return { text: "Solve Cube", icon: <RotateCw size={20} />, color: "bg-green-500 hover:bg-green-400 text-white" };
            case 'solving':
                return { text: "Solving...", icon: <RotateCw size={20} className="animate-spin" />, color: "bg-green-600 text-white cursor-wait", disabled: true };
            case 'ready-to-upgrade':
                return { text: "Upgrade Size", icon: <ChevronUp size={20} />, color: "bg-purple-600 hover:bg-purple-500 text-white" };
            default: 
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