import React from 'react';

interface ToothProps {
  number: string;
  onClick: () => void;
  isSelected?: boolean;
}

function Tooth({ number, onClick, isSelected }: ToothProps) {
  return (
    <div
      onClick={onClick}
      className={`w-10 h-10 border border-gray-300 flex items-center justify-center cursor-pointer ${
        isSelected ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'
      }`}
    >
      {number}
    </div>
  );
}

export function DentalChart() {
  const [selectedTooth, setSelectedTooth] = React.useState<string | null>(null);

  const upperTeeth = Array.from({ length: 16 }, (_, i) => String(i + 1));
  const lowerTeeth = Array.from({ length: 16 }, (_, i) => String(i + 1));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">歯列チャート</h2>
      <div className="flex flex-col items-center">
        <div className="grid grid-cols-8 gap-1 mb-4">
          {upperTeeth.slice(0, 8).map((num) => (
            <Tooth
              key={`upper-right-${num}`}
              number={num}
              onClick={() => setSelectedTooth(`upper-right-${num}`)}
              isSelected={selectedTooth === `upper-right-${num}`}
            />
          ))}
          {upperTeeth.slice(8).map((num) => (
            <Tooth
              key={`upper-left-${num}`}
              number={num}
              onClick={() => setSelectedTooth(`upper-left-${num}`)}
              isSelected={selectedTooth === `upper-left-${num}`}
            />
          ))}
        </div>
        <div className="grid grid-cols-8 gap-1">
          {lowerTeeth.slice(0, 8).map((num) => (
            <Tooth
              key={`lower-right-${num}`}
              number={num}
              onClick={() => setSelectedTooth(`lower-right-${num}`)}
              isSelected={selectedTooth === `lower-right-${num}`}
            />
          ))}
          {lowerTeeth.slice(8).map((num) => (
            <Tooth
              key={`lower-left-${num}`}
              number={num}
              onClick={() => setSelectedTooth(`lower-left-${num}`)}
              isSelected={selectedTooth === `lower-left-${num}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}