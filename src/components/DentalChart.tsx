import React from 'react';

interface ToothProps {
  x: number;
  y: number;
  size: number;
  isUpper: boolean;
}

function Tooth({ x, y, size, isUpper }: ToothProps) {
  return (
    <rect
      x={x}
      y={y}
      width={size}
      height={size}
      stroke="black"
      strokeWidth="1"
      fill="white"
      className="hover:fill-gray-100 cursor-pointer"
    />
  );
}

export function DentalChart() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth - 32; // Subtract padding
        setChartDimensions({
          width,
          height: width * 0.4, // Maintain aspect ratio
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const toothSize = Math.min(chartDimensions.width / 16, chartDimensions.height / 4);
  const spacing = toothSize * 1.1;
  const startX = (chartDimensions.width - spacing * 15) / 2;
  const upperY = toothSize;
  const lowerY = toothSize * 2.5;

  const upperTeeth = Array.from({ length: 16 }, (_, i) => ({
    x: startX + i * spacing,
    y: upperY,
    size: toothSize,
  }));

  const lowerTeeth = Array.from({ length: 16 }, (_, i) => ({
    x: startX + i * spacing,
    y: lowerY,
    size: toothSize,
  }));

  return (
    <div ref={containerRef} className="bg-white p-4 rounded-lg shadow w-full">
      <h3 className="text-lg font-semibold mb-4">歯列チャート</h3>
      <svg 
        width={chartDimensions.width} 
        height={chartDimensions.height}
        className="mx-auto"
        style={{ minHeight: '120px' }}
      >
        {upperTeeth.map((tooth, i) => (
          <Tooth key={`upper-${i}`} {...tooth} isUpper={true} />
        ))}
        {lowerTeeth.map((tooth, i) => (
          <Tooth key={`lower-${i}`} {...tooth} isUpper={false} />
        ))}
      </svg>
    </div>
  );
}