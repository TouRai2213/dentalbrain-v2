import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { useParams } from 'react-router-dom';

interface SubChartItem {
  id: string;
  title: string;
  createdAt: string;
  elements?: ExcalidrawElement[];
}

interface SubChartProps {
  patientId: string;
  patientName: string;
  patientNameKana?: string;
  chartNumber: string;
  birthDate?: string;
  gender?: string;
}

export function SubChart({ 
  patientId,
  patientName,
  patientNameKana,
  chartNumber,
  birthDate,
  gender
}: SubChartProps) {
  const [items, setItems] = useState<SubChartItem[]>([]);

  const handleCreateNew = () => {
    const newItem: SubChartItem = {
      id: Date.now().toString(),
      title: `サブカルテ ${items.length + 1}`,
      createdAt: new Date().toISOString(),
      elements: []
    };
    setItems([...items, newItem]);
    
    const editorUrl = `/subchart-editor/${patientId}?name=${encodeURIComponent(patientName)}&nameKana=${encodeURIComponent(patientNameKana || '')}&chartNumber=${chartNumber}&birthDate=${birthDate || ''}&gender=${gender || ''}`;
    window.open(editorUrl, '_blank', 'width=1200,height=800');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {items.map(item => (
          <div 
            key={item.id}
            className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              const editorUrl = `/subchart-editor/${item.id}`;
              window.open(editorUrl, '_blank', 'width=1200,height=800');
            }}
          >
            <h3 className="font-medium mb-2">{item.title}</h3>
            <p className="text-sm text-gray-500">
              作成日：{new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}

        <button
          onClick={handleCreateNew}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 flex items-center justify-center"
        >
          <Plus className="w-6 h-6 text-gray-400" />
          <span className="ml-2">新規作成</span>
        </button>
      </div>
    </div>
  );
}