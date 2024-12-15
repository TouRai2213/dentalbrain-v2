import { LucideIcon } from 'lucide-react';

export interface ExamItemType {
  id: string;
  name: string;
}

export interface ExamCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  items: ExamItemType[];
}