import React from 'react';
import { X, Clock, Calendar as CalendarIcon, User } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

export function AppointmentModal({ isOpen, onClose, selectedDate }: AppointmentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">新規予約</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <CalendarIcon className="w-5 h-5" />
              <span>{format(selectedDate, 'yyyy年 M月 d日（E）', { locale: ja })}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>14:30</span>
            </div>
          </div>

          <Select
            label="担当医"
            name="doctor"
            required
            options={[
              { value: '1', label: '佐藤 医師' },
              { value: '2', label: '田中 医師' },
              { value: '3', label: '山本 医師' },
            ]}
          />

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-500" />
              <h3 className="font-medium">患者情報</h3>
            </div>
            
            <Input
              label="患者ID"
              name="patientId"
              placeholder="患者IDを入力"
              required
            />

            <Input
              label="患者名"
              name="patientName"
              placeholder="患者名を入力"
              required
            />

            <Select
              label="診療内容"
              name="treatmentType"
              required
              options={[
                { value: 'regular', label: '定期検診' },
                { value: 'cleaning', label: 'クリーニング' },
                { value: 'treatment', label: '治療' },
                { value: 'emergency', label: '緊急' },
              ]}
            />

            <Input
              label="備考"
              name="notes"
              placeholder="備考を入力"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={onClose}>
            予約を確定
          </Button>
        </div>
      </div>
    </div>
  );
}