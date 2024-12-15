import React from 'react';

interface ToothProps {
  number: number;
  x: number;
  y: number;
  rotation: number;
}

export function Tooth({ number, x, y, rotation }: ToothProps) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      <path
        d="M0,-12 C-6,-12 -10,-6 -10,0 C-10,6 -6,12 0,12 C6,12 10,6 10,0 C10,-6 6,-12 0,-12"
        fill="white"
        stroke="black"
        strokeWidth="1"
        className="hover:fill-gray-100 cursor-pointer"
      />
      <text
        x="0"
        y="4"
        textAnchor="middle"
        fontSize="8"
        fill="black"
      >
        {number}
      </text>
    </g>
  );
}