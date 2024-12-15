import React from 'react';
import { useImages } from '../context/ImageContext';
import { DentalChart } from '../components/DentalChart/DentalChart';

export function AlertDetection() {
  const { images } = useImages();
  const orthobanImage = images[2];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto">
        {/* Panorama Image */}
        {orthobanImage && (
          <div className="w-full bg-white shadow mb-6">
            <img
              src={orthobanImage}
              alt="Panorama"
              className="w-full h-auto object-contain max-h-[500px]"
            />
          </div>
        )}
        
        {/* Dental Chart */}
        <div className="max-w-xl mx-auto">
          <DentalChart />
        </div>
      </div>
    </div>
  );
}