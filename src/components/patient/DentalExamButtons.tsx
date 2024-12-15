import React from 'react';
import {
  CircleDot,
  Ruler,
  Droplets,
  Brush,
  Move,
  ArrowDownToLine,
  GitFork,
  ClipboardList,
  FileCheck,
  Pencil
} from 'lucide-react';

interface ExamButton {
  id: string;
  name: string;
  icon: React.ElementType;
  url?: string;
}

const topButtons: ExamButton[] = [
  { id: 'questionnaire', name: '問診', icon: ClipboardList },
  { id: 'diagnosis', name: '診断結果', icon: FileCheck },
];

const examButtons: ExamButton[] = [
  { id: 'cavity', name: 'ムシ歯', icon: CircleDot },
  { id: 'pocket', name: 'ポケットN（G）', icon: Ruler },
  { id: 'saliva', name: 'Saliva', icon: Droplets },
  { id: 'plaque', name: 'プラーク', icon: Brush },
  { id: 'mobility', name: '動揺度', icon: Move },
  { id: 'recession', name: 'リセッション', icon: ArrowDownToLine },
  { id: 'furcation', name: '分岐部病変', icon: GitFork },
  { id: 'dip', name: 'DIP矯正', icon: Pencil, url: 'https://ceph-real.1st-j.com/' },
];

export function DentalExamButtons() {
  const handleExamClick = (exam: ExamButton) => {
    if (exam.url) {
      window.open(exam.url, '_blank');
    } else {
      console.log(`Starting exam: ${exam.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top row buttons */}
      <div className="flex gap-4">
        {topButtons.map((exam) => {
          const Icon = exam.icon;
          return (
            <button
              key={exam.id}
              onClick={() => handleExamClick(exam)}
              className="flex-1 flex items-center justify-center space-x-2 p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <Icon className="w-5 h-5 text-teal-600" />
              <span className="text-gray-700">{exam.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main grid buttons */}
      <div className="grid grid-cols-3 gap-4">
        {examButtons.map((exam) => {
          const Icon = exam.icon;
          return (
            <button
              key={exam.id}
              onClick={() => handleExamClick(exam)}
              className="flex items-center justify-center space-x-2 p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <Icon className="w-5 h-5 text-teal-600" />
              <span className="text-gray-700">{exam.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}