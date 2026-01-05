import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { CUBIE_SIZE, CUBE_COLORS } from './CubletUtils';

// --- CONFIG: Solve Sequence ---
const SOLVE_SEQUENCE = [
    { axis: 'y', layer: 'top', angle: 90 },    
    { axis: 'x', layer: 'right', angle: 90 },  
    { axis: 'z', layer: 'front', angle: 90 },  
    { axis: 'y', layer: 'top', angle: -90 }, 
    { axis: 'x', layer: 'right', angle: -90 }, 
    { axis: 'z', layer: 'front', angle: -90 }, 
    { axis: 'x', layer: 'right', angle: 90 },  
    { axis: 'y', layer: 'top', angle: 90 },    
]; 

// --- MOUTH & EYE ---
const Mouth = ({ isHappy }) => (
    <motion.div className="flex items-center justify-center overflow-hidden" animate={isHappy ? { width: 24, height: 24, borderRadius: '50%', backgroundColor: '#ff6b6b' } : { width: 10, height: 5, borderRadius: 20, backgroundColor: '#ff6b6b' }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
        <motion.div className="rounded-full" style={{ backgroundColor: '#fca5a5' }} animate={isHappy ? { width: 20, height: 20, opacity: 1 } : { width: 0, height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
    </motion.div>
);

const Eye = ({ isHappy }) => (
    <div className="relative w-8 h-8 bg-white rounded-full overflow-hidden shadow-sm border-2 border-gray-900 flex items-center justify-center">
        <AnimatePresence>
            {isHappy ? (
                <motion.div key="happy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 translate-y-1"><path d="M 4 14 Q 12 4 20 14" /></svg></motion.div>
            ) : (
                <motion.div key="normal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 bg-gray-900 rounded-full relative"><div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-90" /></div><motion.div className="absolute top-0 left-0 w-full bg-gray-900 z-10" initial={{ height: "0%" }} animate={{ height: ["0%", "100%", "0%", "0%", "0%"] }} transition={{ duration: 3.5, times: [0, 0.05, 0.1, 0.15, 1], repeat: Infinity }} /></motion.div>
            )}
        </AnimatePresence>
    </div>
);

// --- CUBIE COMPONENT ---
const Cubie = ({ currentPos, size, isUnlocked, isDarkMode, isInRotator }) => {
    const offset = (size * CUBIE_SIZE) / 2 - (CUBIE_SIZE / 2);
    // Grid Position
    const xPos = currentPos.x * CUBIE_SIZE - offset;
    const yPos = currentPos.y * CUBIE_SIZE - offset;
    const zPos = currentPos.z * CUBIE_SIZE - offset;
    
    // Core colors - darkened slightly for better depth perception
    const greyFill = isDarkMode ? '#374151' : '#9ca3af'; 
    const internalBlack = isDarkMode ? '#050505' : '#111827'; 

    const getFaceColor = (faceType) => {
        if (!isUnlocked) return greyFill; 
        return CUBE_COLORS[faceType];
    };

    const faceStyle = (faceType, transform, isInner = false) => {
        const color = isInner ? internalBlack : getFaceColor(faceType);
        return {
            position: 'absolute', 
            width: `${CUBIE_SIZE}px`, 
            height: `${CUBIE_SIZE}px`,
            boxSizing: 'border-box', 
            borderRadius: '6px', 
            // Inner core has no border to keep it smooth and solid
            border: isInner ? 'none' : `2px solid ${isDarkMode ? '#000' : 'rgba(0,0,0,0.15)'}`, 
            backgroundColor: color,
            // Outer faces get depth shadow, Inner faces get nothing
            boxShadow: (!isInner && isUnlocked) ? 'inset 0 0 8px rgba(0,0,0,0.15)' : 'none',
            transform: transform, 
            // CRITICAL: Inner faces must be visible from behind to block light through cracks
            backfaceVisibility: isInner ? 'visible' : 'hidden', 
        };
    };
    
    const halfSize = CUBIE_SIZE / 2;
    // TIGHT FIT: Reduced gap from 1px to 0.5px. 
    // This is small enough to look solid, but large enough to prevent z-fighting flicker.
    const innerHalfSize = halfSize - 0.25; 

    // Wrapper Logic
    const wrapperStyle = {
        position: 'absolute', width: `${CUBIE_SIZE}px`, height: `${CUBIE_SIZE}px`,
        transformStyle: 'preserve-3d',
        transform: isInRotator 
            ? `translate3d(${xPos}px, ${-yPos}px, ${zPos}px) ${currentPos.transform}`
            : `translate3d(${xPos}px, ${-yPos}px, ${zPos}px) ${currentPos.transform}`,
    };

    if (!isInRotator) {
        wrapperStyle.top = '50%'; wrapperStyle.left = '50%';
        wrapperStyle.marginTop = `-${halfSize}px`; wrapperStyle.marginLeft = `-${halfSize}px`;
    } else {
        wrapperStyle.top = `calc(50% - ${halfSize}px)`;
        wrapperStyle.left = `calc(50% - ${halfSize}px)`;
        wrapperStyle.margin = 0;
    }

    return (
        <div style={wrapperStyle}>
            {/* 1. INNER CORE (The Filler) */}
            {/* Rendered first so it sits behind the transparent parts of the outer shell if any */}
            <div style={faceStyle('front',  `translateZ(${innerHalfSize}px)`, true)} />
            <div style={faceStyle('back',   `rotateY(180deg) translateZ(${innerHalfSize}px)`, true)} />
            <div style={faceStyle('right',  `rotateY(90deg) translateZ(${innerHalfSize}px)`, true)} />
            <div style={faceStyle('left',   `rotateY(-90deg) translateZ(${innerHalfSize}px)`, true)} />
            <div style={faceStyle('top',    `rotateX(90deg) translateZ(${innerHalfSize}px)`, true)} />
            <div style={faceStyle('bottom', `rotateX(-90deg) translateZ(${innerHalfSize}px)`, true)} />

            {/* 2. OUTER FACES (The Plastic) */}
            <div style={faceStyle('front',  `translateZ(${halfSize}px)`)} />
            <div style={faceStyle('back',   `rotateY(180deg) translateZ(${halfSize}px)`)} />
            <div style={faceStyle('right',  `rotateY(90deg) translateZ(${halfSize}px)`)} />
            <div style={faceStyle('left',   `rotateY(-90deg) translateZ(${halfSize}px)`)} />
            <div style={faceStyle('top',    `rotateX(90deg) translateZ(${halfSize}px)`)} />
            <div style={faceStyle('bottom', `rotateX(-90deg) translateZ(${halfSize}px)`)} />
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function CubletAvatar({ containerRef, stageInfo, isEating, isSolving, isDraggingFood, hasFoodItem, piecesColored, isDarkMode }) {
    const { size } = stageInfo;
    const containerSize = size * CUBIE_SIZE;
    const faceDepth = (size * CUBIE_SIZE) / 2;

    const rotateX = useMotionValue(-20);
    const rotateY = useMotionValue(30);
    const rotateXSpring = useSpring(rotateX, { mass: 1.5, stiffness: 40, damping: 25 });
    const rotateYSpring = useSpring(rotateY, { mass: 1.5, stiffness: 40, damping: 25 });
    const [isRotating, setIsRotating] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const [pieces, setPieces] = useState({});
    const [solveStep, setSolveStep] = useState(0);
    const [isAnimatingMove, setIsAnimatingMove] = useState(false);

    // --- HELPER: Is piece in layer? ---
    const isPieceInLayer = useCallback((p, layer) => {
        if (layer === 'top' && p.y === size - 1) return true;
        if (layer === 'bottom' && p.y === 0) return true;
        if (layer === 'right' && p.x === size - 1) return true;
        if (layer === 'left' && p.x === 0) return true;
        if (layer === 'front' && p.z === size - 1) return true;
        if (layer === 'back' && p.z === 0) return true;
        return false;
    }, [size]);

    // --- HELPER: Apply Move (Accumulate Transform + Update Grid) ---
    const applyMoveMath = useCallback((gridMap, move) => {
        const { axis, layer, angle } = move;
        const newMap = { ...gridMap };
        const center = (size - 1) / 2;
        const rad = angle * (Math.PI / 180);
        const s = Math.sin(rad), c = Math.cos(rad);

        Object.keys(newMap).forEach(id => {
            const p = { ...newMap[id] };
            if (!isPieceInLayer(p, layer)) return;

            // 1. Update Grid Coordinates
            const relX = p.x - center, relY = p.y - center, relZ = p.z - center;
            let newX=relX, newY=relY, newZ=relZ;

            if (axis === 'y') { 
                newX = relX * c + relZ * s; newZ = -relX * s + relZ * c; 
            } else if (axis === 'x') {
                newY = relY * c - relZ * s; newZ = relY * s + relZ * c;
            } else if (axis === 'z') {
                newX = relX * c - relY * s; newY = relX * s + relY * c;
            }
            p.x = Math.round(newX + center);
            p.y = Math.round(newY + center);
            p.z = Math.round(newZ + center);

            // 2. Accumulate Rotation String
            // We PREPEND the new global rotation. 
            const newTransform = `rotate${axis.toUpperCase()}(${angle}deg) ${p.transform}`;
            p.transform = newTransform;

            newMap[id] = p;
        });
        return newMap;
    }, [size, isPieceInLayer]);

    // 1. INITIALIZE (On Mount / Size Change)
    useEffect(() => {
        let initialMap = {};
        for(let z=0; z<size; z++) {
            for(let y=0; y<size; y++) {
                for(let x=0; x<size; x++) {
                    const id = `${x}-${y}-${z}`;
                    initialMap[id] = { x, y, z, transform: "" };
                }
            }
        }
        // Scramble by reversing solve sequence
        [...SOLVE_SEQUENCE].reverse().forEach(move => {
            initialMap = applyMoveMath(initialMap, { ...move, angle: -move.angle });
        });
        setPieces(initialMap);
        setSolveStep(0);
        setIsAnimatingMove(false);
    }, [size, applyMoveMath]);

    // 2. SOLVE CONTROLLER
    useEffect(() => {
        if (isSolving && !isAnimatingMove && solveStep < SOLVE_SEQUENCE.length) {
            setIsAnimatingMove(true);
        } else if (!isSolving && solveStep > 0) {
            setSolveStep(0);
            setIsAnimatingMove(false);
        }
    }, [isSolving, isAnimatingMove, solveStep]);

    // 3. ANIMATION COMPLETE HANDLER
    const handleMoveComplete = () => {
        const currentMove = SOLVE_SEQUENCE[solveStep];
        setPieces(prev => applyMoveMath(prev, currentMove));
        setSolveStep(prev => prev + 1);
        setIsAnimatingMove(false);
    };

    // --- EVENTS & ANIMATION ---
    const handlePointerDown = (e) => { if (isDraggingFood) return; e.preventDefault(); setIsRotating(true); lastPos.current = { x: e.clientX, y: e.clientY }; };
    const handlePointerMove = (e) => { if (!isRotating) return; e.preventDefault(); const deltaX = e.clientX - lastPos.current.x; const deltaY = e.clientY - lastPos.current.y; rotateY.set(rotateY.get() + deltaX * 0.5); rotateX.set(rotateX.get() - deltaY * 0.5); lastPos.current = { x: e.clientX, y: e.clientY }; };
    const isInteracting = isDraggingFood || isRotating;
    const getAnimationState = () => {
        if (isEating) return { rotateZ: [0, -5, 5, -2, 2, 0], scale: [1, 1.15, 1] };
        if (isInteracting || isSolving) return { y: 0, rotateZ: 0, scale: 1 };
        return { y: [0, 0, 0, 0, 0, 0, -4, 0], rotateZ: [0, 0, 0, 0, 0, 0, 2, -2, 0] };
    };
    const getTransitionState = () => {
        if (isEating) return { duration: 0.6, ease: "backOut" };
        if (isInteracting || isSolving) return { duration: 0.4, ease: "easeOut" };
        return { duration: 7, repeat: Infinity, ease: "easeInOut" };
    };

    // --- RENDER PREP ---
    const isHappyMode = hasFoodItem || isDraggingFood || isEating;
    const faceState = isHappyMode ? 'happy' : 'idle';
    const currentMove = isSolving && solveStep < SOLVE_SEQUENCE.length ? SOLVE_SEQUENCE[solveStep] : null;
    const staticPieces = [];
    const rotatingPieces = [];
    
    // Sort logic for clean unlocking animation
    const sortedKeys = Object.keys(pieces).sort((a, b) => {
        const [x1, y1, z1] = a.split('-').map(Number);
        const [x2, y2, z2] = b.split('-').map(Number);
        const val1 = y1 * 100 + z1 * 10 + x1; 
        const val2 = y2 * 100 + z2 * 10 + x2;
        return val1 - val2;
    });

    sortedKeys.forEach((id, idx) => {
        const pos = pieces[id];
        const isUnlocked = idx < piecesColored;
        const cubieElement = <Cubie key={id} currentPos={pos} size={size} isUnlocked={isUnlocked} isDarkMode={isDarkMode} isInRotator={isAnimatingMove && currentMove && isPieceInLayer(pos, currentMove.layer)} />;
        
        if (isAnimatingMove && currentMove && isPieceInLayer(pos, currentMove.layer)) {
            rotatingPieces.push(cubieElement);
        } else {
            staticPieces.push(cubieElement);
        }
    });

    const rotatorAnimate = {};
    if (isAnimatingMove && currentMove) {
        if(currentMove.axis === 'x') rotatorAnimate.rotateX = currentMove.angle;
        if(currentMove.axis === 'y') rotatorAnimate.rotateY = currentMove.angle;
        if(currentMove.axis === 'z') rotatorAnimate.rotateZ = currentMove.angle;
    }

    return (
        <div ref={containerRef} className="relative flex items-center justify-center select-none" style={{ perspective: '1000px', width: '260px', height: '260px', cursor: isRotating ? 'grabbing' : 'grab', touchAction: 'none' }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={() => setIsRotating(false)} onPointerLeave={() => setIsRotating(false)}>
            <motion.div animate={getAnimationState()} transition={getTransitionState()} style={{ width: containerSize, height: containerSize, transformStyle: 'preserve-3d', rotateX: rotateXSpring, rotateY: rotateYSpring }} className="relative transition-transform duration-200">
                {staticPieces}
                {isAnimatingMove && currentMove && (
                    <motion.div
                        key={`rotator-${solveStep}`}
                        initial={{ rotateX: 0, rotateY: 0, rotateZ: 0 }}
                        animate={rotatorAnimate}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        onAnimationComplete={handleMoveComplete}
                        style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, transformStyle: 'preserve-3d' }}
                    >
                        {rotatingPieces}
                    </motion.div>
                )}
                {!isSolving && (
                    <div className="absolute flex flex-col items-center justify-center z-50 pointer-events-none origin-center" style={{ transform: `translateZ(${faceDepth + 10}px) scale(${size === 1 ? 0.35 : 1})`, left: '50%', top: '50%', width: '100px', height: '60px', marginLeft: '-50px', marginTop: '-30px', backfaceVisibility: 'hidden' }}>
                        <div className="flex gap-4 mb-2"><Eye isHappy={faceState === 'happy'} /><Eye isHappy={faceState === 'happy'} /></div><Mouth isHappy={faceState === 'happy'} />
                    </div>
                )}
            </motion.div>
        </div>
    );
};