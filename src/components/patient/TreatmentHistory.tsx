import React from 'react';
import { CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { useImages } from '../../context/ImageContext';

interface Treatment {
  id: string;
  date: string;
  type: string;
  description: string;
  status: 'completed' | 'scheduled';
  doctor: string;
  images?: number[]; // Array of image indices from the ImageContext
}

// Mock data with image indices
const treatments: Treatment[] = [
  {
    id: '1',
    date: '2024-03-15',
    type: 'スケーリング',
    description: '歯石除去と歯面清掃',
    status: 'completed',
    doctor: '佐藤 医師',
    images: [0, 1] // References to images in the ImageContext
  },
  {
    id: '2',
    date: '2024-04-01',
    type: '定期検診',
    description: '経過観察と予防処置',
    status: 'scheduled',
    doctor: '田中 医師',
    images: [2]
  }
];

export function TreatmentHistory() {
  const { images } = useImages();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">治療履歴</h2>
      <div className="space-y-4">
        {treatments.map((treatment) => (
          <div
            key={treatment.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="flex items-start justify-between p-4">
              <div className="flex items-start space-x-4">
                {treatment.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                ) : (
                  <Clock className="w-5 h-5 text-blue-500 mt-1" />
                )}
                <div>
                  <div className="font-medium">{treatment.type}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {treatment.description}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    担当: {treatment.doctor}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500">{treatment.date}</div>
            </div>

            {treatment.images && treatment.images.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  治療画像
                </div>
                <div className="flex space-x-3">
                  {treatment.images.map((imageIndex) => (
                    images[imageIndex] && (
                      <div
                        key={imageIndex}
                        className="relative group cursor-pointer"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-gray-200">
                          <img
                            src={images[imageIndex]!}
                            alt={`Treatment ${treatment.id} image ${imageIndex}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-lg" />
                      </div>
                    )
                  ))}
                  <button className="w-20 h-20 flex items-center justify-center border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}