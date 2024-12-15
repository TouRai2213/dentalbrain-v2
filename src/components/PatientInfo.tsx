import React from 'react';

interface PatientInfoProps {
  name: string;
  age: number;
  gender: string;
  status: string;
}

export function PatientInfo({ name, age, gender, status }: PatientInfoProps) {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
        <span className="text-2xl text-gray-600">{name[0]}</span>
      </div>
      <div>
        <h2 className="text-xl font-semibold">{name}</h2>
        <div className="flex space-x-4 text-sm text-gray-600">
          <span>{age}歳</span>
          <span>{gender}</span>
          <span className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded-full text-xs">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}