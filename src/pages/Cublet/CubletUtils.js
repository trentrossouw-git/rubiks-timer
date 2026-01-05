// src/pages/cublet/CubletUtils.js

export const FEED_COST = 1;
export const XP_PER_FEED = 10000;
export const XP_BASE_REQ = 100;
export const CUBIE_SIZE = 36; 
export const DROP_ZONE_RADIUS = 100;

export const CUBE_COLORS = {
    top: '#ffffff',    // White
    bottom: '#fbbf24', // Yellow
    front: '#22c55e',  // Green
    back: '#3b82f6',   // Blue
    left: '#f97316',   // Orange
    right: '#ef4444'   // Red
};

// Size Thresholds
export const getCubletStage = (level) => {
    if (level === 0) return { size: 1, stageName: "Cublet Egg" };
    if (level < 8) return { size: 2, stageName: "Rookie Cube" };  
    if (level < 27) return { size: 3, stageName: "Speed Cube" };  
    return { size: 4, stageName: "Master Cube" };                 
};

// Generate a random valid 90-degree rotation
export const generatePieceRotation = (seed) => {
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