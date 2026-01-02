import React from 'react';
import { COLORS } from '../utils/constants';

const CubeVisualizer = ({ state }) => {
  const size = 150; 
  const stickerSize = size/3; 
  const gap = 4;

  // We are just rendering the Front face (state.F)
  const renderFace = (face) => face.map((c, i) => (
    <rect 
        key={i} 
        x={(i%3)*stickerSize+gap} 
        y={Math.floor(i/3)*stickerSize+gap} 
        width={stickerSize-gap*2} 
        height={stickerSize-gap*2} 
        fill={COLORS[c]} 
        rx={4} ry={4} 
    />
  ));

  return (
    <div style={{ marginTop: '20px' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Draw a background for the face */}
            <rect width={size} height={size} fill="#333" rx={8} />
            {renderFace(state.F)}
        </svg>
    </div>
  );
};

export default CubeVisualizer;