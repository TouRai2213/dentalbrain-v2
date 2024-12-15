import React from 'react';
import { X } from 'lucide-react';
import { PatientForm } from './PatientForm';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewPatientModal({ isOpen, onClose }: NewPatientModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">新規患者</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <PatientForm onClose={onClose} />
      </div>
    </div>
  );
}