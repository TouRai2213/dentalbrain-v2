import React from 'react';
import { MedicalRecord } from '../../types/patient';
import { CheckCircle, Clock } from 'lucide-react';

interface MedicalRecordsProps {
  records: MedicalRecord[];
}

export function MedicalRecords({ records }: MedicalRecordsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Medical Record</h2>
          <div className="flex space-x-2">
            <button className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg">
              Medical
            </button>
            <button className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">
              Cosmetic
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-start justify-between p-4 border border-gray-100 rounded-lg"
            >
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  {record.status === 'done' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-500">{record.date}</div>
                  <div className="font-medium mt-1">{record.treatment}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {record.condition}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {record.dentist}
                  </div>
                  {record.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      {record.notes}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  record.status === 'done'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {record.status === 'done' ? 'Done' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}