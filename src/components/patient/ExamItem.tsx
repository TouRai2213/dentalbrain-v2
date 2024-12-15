import React from 'react';
import { ExamItemType } from './types';

interface ExamItemProps {
  item: ExamItemType;
}

export function ExamItem({ item }: ExamItemProps) {
  const handleClick = () => {
    // TODO: Implement exam item click handler
    console.log(`Starting exam: ${item.name}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-between group"
    >
      <span className="text-gray-700 group-hover:text-gray-900">
        {item.name}
      </span>
      <span className="text-sm text-gray-400 group-hover:text-gray-600">
        開始 →
      </span>
    </button>
  );
}