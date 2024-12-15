import React from 'react';
import { FileText, Activity, Camera, Stethoscope } from 'lucide-react';
import { ExamCategory } from './types';
import { ExamCategoryCard } from './ExamCategoryCard';

const examCategories: ExamCategory[] = [
  {
    id: 'basic',
    title: '基本検査',
    icon: FileText,
    items: [
      { id: 'vital', name: 'バイタル' },
      { id: 'blood-pressure', name: '血圧' },
      { id: 'weight', name: '体重' }
    ]
  },
  {
    id: 'dental',
    title: '歯科検査',
    icon: Stethoscope,
    items: [
      { id: 'cavity', name: '虫歯検査' },
      { id: 'periodontal', name: '歯周病検査' },
      { id: 'bite', name: '咬合検査' }
    ]
  },
  {
    id: 'imaging',
    title: '画像検査',
    icon: Camera,
    items: [
      { id: 'xray', name: 'レントゲン' },
      { id: 'ct', name: 'CT' },
      { id: 'photo', name: '口腔内写真' }
    ]
  },
  {
    id: 'special',
    title: '特殊検査',
    icon: Activity,
    items: [
      { id: 'tmj', name: '顎関節検査' },
      { id: 'muscle', name: '筋機能検査' },
      { id: 'sleep', name: '睡眠時無呼吸検査' }
    ]
  }
];

export function ExamCategories() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {examCategories.map((category) => (
        <ExamCategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}