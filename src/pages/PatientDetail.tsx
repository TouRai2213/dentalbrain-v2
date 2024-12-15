import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PatientHeader } from '../components/patient/PatientHeader';
import { PatientTabs } from '../components/patient/PatientTabs';
import { TreatmentHistory } from '../components/patient/TreatmentHistory';
import { ExaminationMenu } from '../components/patient/ExaminationMenu';
import { ImageGrid } from '../components/ImageGrid';
import { SubChart } from '../components/patient/SubChart';
import { useImages } from '../context/ImageContext';
import { Patient } from '../types/patient';

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { images, setImages } = useImages();
  const [activeTab, setActiveTab] = useState('examination');
  const [notes, setNotes] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/patients/${id}`);
        if (!response.ok) {
          throw new Error('Patient not found');
        }
        const data = await response.json();
        setPatient(data);
      } catch (error) {
        console.error('Error fetching patient:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!patient) {
    return <div>Patient not found</div>;
  }

  const handleImageUpload = (index: number, file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setImages(prev => {
      const newImages = [...prev];
      newImages[index] = imageUrl;
      return newImages;
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'examination':
        return <ExaminationMenu />;
      case 'history':
        return <TreatmentHistory />;
      case 'gallery':
        return <ImageGrid />;
      case 'subchart':
        return <SubChart />;
      default:
        return null;
    }
  };

  return (
    <div>
      <PatientHeader patient={patient} />
      
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200 px-6">
              <PatientTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>

        {activeTab === 'history' && (
          <div className="w-80">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">患者メモ</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-48 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="患者に関するメモを入力..."
              />
              <div className="mt-4 flex justify-end">
                <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}