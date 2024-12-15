import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface DoctorScheduleProps {
  date: Date;
  onSlotClick: () => void;
  selectedDoctor: string | null;
}

// Mock data for doctors and their schedules
const doctors = [
  { id: '1', name: '佐藤 医師' },
  { id: '2', name: '田中 医師' },
  { id: '3', name: '山本 医師' },
];

const timeSlots = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9;
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour}:${minute}`;
});

export function DoctorSchedule({ date, onSlotClick, selectedDoctor }: DoctorScheduleProps) {
  const filteredDoctors = selectedDoctor
    ? doctors.filter(d => d.id === selectedDoctor)
    : doctors;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">
        {format(date, 'yyyy年 M月 d日（E）', { locale: ja })}の予約状況
      </h2>

      <div className="relative">
        {/* Time labels */}
        <div className="absolute top-0 left-0 w-20 bg-white">
          {timeSlots.map((time) => (
            <div key={time} className="h-16 border-b border-gray-100 flex items-center justify-center">
              <span className="text-sm text-gray-500">{time}</span>
            </div>
          ))}
        </div>

        {/* Schedule grid */}
        <div className="ml-20 grid" style={{ gridTemplateColumns: `repeat(${filteredDoctors.length}, minmax(0, 1fr))` }}>
          {/* Doctor headers */}
          <div className="col-span-full grid" style={{ gridTemplateColumns: `repeat(${filteredDoctors.length}, minmax(0, 1fr))` }}>
            {filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="h-16 border-b border-l border-gray-200 flex items-center justify-center bg-white">
                <span className="font-medium">{doctor.name}</span>
              </div>
            ))}
          </div>

          {/* Time slots */}
          {timeSlots.map((time) => (
            <React.Fragment key={time}>
              {filteredDoctors.map((doctor) => (
                <button
                  key={`${doctor.id}-${time}`}
                  onClick={onSlotClick}
                  className="h-16 border-b border-l border-gray-200 bg-white hover:bg-gray-50 transition-colors relative group"
                >
                  <div className="absolute inset-1 rounded border-2 border-dashed border-gray-200 group-hover:border-teal-200 flex items-center justify-center">
                    <span className="text-sm text-gray-400 group-hover:text-teal-600">
                      予約可能
                    </span>
                  </div>
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}