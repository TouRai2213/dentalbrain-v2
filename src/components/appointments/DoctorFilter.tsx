import React from 'react';
import { Users } from 'lucide-react';

interface DoctorFilterProps {
  selectedDoctor: string | null;
  onDoctorSelect: (doctorId: string | null) => void;
}

const doctors = [
  { id: '1', name: '佐藤 医師' },
  { id: '2', name: '田中 医師' },
  { id: '3', name: '山本 医師' },
];

export function DoctorFilter({ selectedDoctor, onDoctorSelect }: DoctorFilterProps) {
  return (
    <div>
      <div className="flex items-center space-x-2 mb-3">
        <Users className="w-5 h-5 text-gray-500" />
        <h3 className="font-medium">担当医フィルター</h3>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => onDoctorSelect(null)}
          className={`w-full px-3 py-2 rounded-lg text-left ${
            !selectedDoctor
              ? 'bg-teal-50 text-teal-600'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          全ての医師
        </button>
        {doctors.map((doctor) => (
          <button
            key={doctor.id}
            onClick={() => onDoctorSelect(doctor.id)}
            className={`w-full px-3 py-2 rounded-lg text-left ${
              selectedDoctor === doctor.id
                ? 'bg-teal-50 text-teal-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {doctor.name}
          </button>
        ))}
      </div>
    </div>
  );
}