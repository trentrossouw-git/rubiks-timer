import React from 'react';
import { COLORS } from '../utils/constants';

const CubeVisualizer = ({ state }) => {
  const size = 160; 
  const stickerSize = size / 3; 
  const gap = 4;

  // We are just rendering the Front face (state.F)
  const renderFace = (face) => face.map((c, i) => (
    <rect 
        key={i} 
        x={(i % 3) * stickerSize + gap} 
        y={Math.floor(i / 3) * stickerSize + gap} 
        width={stickerSize - gap * 2} 
        height={stickerSize - gap * 2} 
        fill={COLORS[c]} 
        rx={6} ry={6} 
    />
  ));

  return (
    <div className="flex justify-center items-center py-4">
        <div className="bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-700/50">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {renderFace(state.F)}
            </svg>
        </div>
    </div>
  );
};

export default CubeVisualizer;