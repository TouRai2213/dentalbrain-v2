import React from 'react';
import { DentalExamButtons } from './DentalExamButtons';
import { ExamCategories } from './ExamCategories';

export function ExaminationMenu() {
  return (
    <div className="space-y-8">
      <DentalExamButtons />
      <ExamCategories />
    </div>
  );
}