import React from 'react';
import { MedicalRecord } from '../../types/patient';
import { CheckCircle, Clock } from 'lucide-react';

interface MedicalHistoryProps {
  records: MedicalRecord[];
}

export function MedicalHistory({ records }: MedicalHistoryProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">診療履歴</h2>
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                {record.status === 'done' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
                <div>
                  <div className="font-medium">{record.treatment}</div>
                  <div className="text-sm text-gray-500">
                    {record.condition} - Dr. {record.dentist}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">{record.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}