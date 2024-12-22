import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExcalidrawEditor } from '../components/ExcalidrawEditor';
import { API_BASE_URL } from '../config/api';

interface Patient {
  id: string;
  name: string;
  nameKana?: string;
  birthDate?: string;
  gender?: string;
  chartNumber: string;
}

export function SubChartEditor() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    // 从 URL 参数获取患者信息
    const searchParams = new URLSearchParams(window.location.search);
    const patientData = {
      id: id || '',
      name: searchParams.get('name') || '',
      nameKana: searchParams.get('nameKana') || '',
      chartNumber: searchParams.get('chartNumber') || '',
      birthDate: searchParams.get('birthDate') || '',
      gender: searchParams.get('gender') || ''
    };
    setPatient(patientData);
  }, [id]);

  return (
    <div className="w-screen h-screen">
      <ExcalidrawEditor
        imageUrl="/templates/subchart-template.png"
        initialElements={[]}
        onSave={(elements) => {
          console.log('Save elements:', elements);
          window.close();
        }}
        patient={patient}
      />
    </div>
  );
} 