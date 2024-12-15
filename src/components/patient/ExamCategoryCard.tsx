import React from 'react';
import { ExamCategory } from './types';
import { ExamItem } from './ExamItem';

interface ExamCategoryCardProps {
  category: ExamCategory;
}

export function ExamCategoryCard({ category }: ExamCategoryCardProps) {
  const Icon = category.icon;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold">{category.title}</h3>
      </div>
      <div className="space-y-3">
        {category.items.map((item) => (
          <ExamItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}