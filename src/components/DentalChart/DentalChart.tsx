import React from 'react';
import { Tooth } from './Tooth';

export function DentalChart() {
  const radius = 120;
  const centerX = 200;
  const centerY = 200;

  // Generate tooth positions
  const generateTeethPositions = (isUpper: boolean) => {
    const teeth = [];
    const startAngle = isUpper ? 180 : 0;
    const angleStep = 180 / 8;

    for (let i = 8; i >= 1; i--) {
      const angle = (startAngle + (8 - i) * angleStep) * (Math.PI / 180);
      teeth.push({
        number: i,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        rotation: isUpper ? angle * (180 / Math.PI) - 90 : angle * (180 / Math.PI) + 90
      });
    }
    return teeth;
  };

  const upperRightTeeth = generateTeethPositions(true);
  const upperLeftTeeth = generateTeethPositions(true).map(tooth => ({
    ...tooth,
    x: centerX - (tooth.x - centerX)
  }));
  const lowerRightTeeth = generateTeethPositions(false);
  const lowerLeftTeeth = generateTeethPositions(false).map(tooth => ({
    ...tooth,
    x: centerX - (tooth.x - centerX)
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">歯列チャート</h3>
      <svg width="400" height="400" viewBox="0 0 400 400" className="mx-auto">
        {/* Center lines */}
        <line x1="200" y1="80" x2="200" y2="320" stroke="red" strokeWidth="1" />
        <line x1="80" y1="200" x2="320" y2="200" stroke="red" strokeWidth="1" />
        
        {/* Labels */}
        <text x="320" y="160" className="text-sm" fill="red">右側(うえく)</text>
        <text x="40" y="160" className="text-sm" fill="red">左側(さえく)</text>
        <text x="220" y="180" className="text-sm">上顎</text>
        <text x="220" y="240" className="text-sm">下顎</text>

        {/* Teeth */}
        {upperRightTeeth.map(tooth => (
          <Tooth key={`upper-right-${tooth.number}`} {...tooth} />
        ))}
        {upperLeftTeeth.map(tooth => (
          <Tooth key={`upper-left-${tooth.number}`} {...tooth} />
        ))}
        {lowerRightTeeth.map(tooth => (
          <Tooth key={`lower-right-${tooth.number}`} {...tooth} />
        ))}
        {lowerLeftTeeth.map(tooth => (
          <Tooth key={`lower-left-${tooth.number}`} {...tooth} />
        ))}
      </svg>
    </div>
  );
}