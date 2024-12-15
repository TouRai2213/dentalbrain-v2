import React from 'react';
import { Patient } from '../../types/patient';
import { Calendar, Clock, Tag } from 'lucide-react';

interface PatientHeaderProps {
  patient: Patient;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-2xl text-gray-600">{patient.name[0]}</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold">{patient.name}</h1>
            <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>カルテ番号: {patient.id}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>最終来院: {patient.lastUpdate}</span>
              </div>
              <div className="flex items-center">
                <Tag className="w-4 h-4 mr-1" />
                <span>症状: {patient.diagnosis}</span>
              </div>
              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {patient.status}
              </span>
            </div>
          </div>
        </div>

        <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
          予約作成
        </button>
      </div>
    </div>
  );
}