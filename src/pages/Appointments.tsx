import React, { useState } from 'react';
import { Calendar } from '../components/appointments/Calendar';
import { DoctorSchedule } from '../components/appointments/DoctorSchedule';
import { AppointmentModal } from '../components/appointments/AppointmentModal';
import { DoctorFilter } from '../components/appointments/DoctorFilter';

export function Appointments() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);

  return (
    <div className="bg-gray-50 rounded-lg">
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Left sidebar - Calendar */}
        <div className="w-80 border-r border-gray-200 p-6 bg-white rounded-l-lg">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
          <div className="mt-6">
            <DoctorFilter
              selectedDoctor={selectedDoctor}
              onDoctorSelect={setSelectedDoctor}
            />
          </div>
        </div>

        {/* Main content - Schedule */}
        <div className="flex-1 overflow-y-auto bg-white rounded-r-lg">
          <DoctorSchedule
            date={selectedDate}
            onSlotClick={() => setIsModalOpen(true)}
            selectedDoctor={selectedDoctor}
          />
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
}