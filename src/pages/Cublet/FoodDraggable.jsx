// src/pages/cublet/FoodDraggable.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

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

export default FoodDraggable;