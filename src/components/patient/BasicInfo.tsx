import React from 'react';
import { Patient } from '../../types/patient';

interface BasicInfoProps {
  patient: Patient;
}

export function BasicInfo({ patient }: BasicInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-6">患者基本情報</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              患者ID
            </label>
            <div className="text-gray-900">{patient.id}</div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              氏名
            </label>
            <div className="text-gray-900">{patient.name}</div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              診断
            </label>
            <div className="text-gray-900">{patient.diagnosis}</div>
          </div>
        </div>
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最終来院日
            </label>
            <div className="text-gray-900">{patient.lastVisit}</div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              次回予約
            </label>
            <div className="text-gray-900">{patient.nextAppointment}</div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              治療状態
            </label>
            <div className="text-gray-900">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                {patient.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}