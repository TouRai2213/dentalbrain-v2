import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface ImageData {
  id: string;
  url: string;
  uploadTime: string;
  annotations?: any[];
}

const SPECIAL_BOXES = [
  'ラテラルセファロ',
  'PAセファロ',
  'オルソバン'
];

export function ImageGallery() {
  const { id } = useParams<{ id: string }>();
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, [id]);

  const fetchImages = async () => {
    try {
      console.log('Fetching images at:', new Date().toISOString());
      console.log('For patient ID:', id);
      const response = await fetch(`http://localhost:3001/api/patients/${id}/images`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received images:', data);
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSingleUpload = (index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await handleUpload([file]);
      }
    };
    input.click();
  };

  const handleBatchUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      try {
        // 首先发送到图像预测服务器
        const formData = new FormData();
        formData.append('file', file);
        const predictionResponse = await fetch('https://panorama.dentalbrain.app/predict', {
          method: 'POST',
          body: formData,
        });

        if (predictionResponse.ok) {
          const predictionResult = await predictionResponse.json();
          // TODO: 保存预测结果
          console.log('Prediction result:', predictionResult);
          
          // 刷新图像列表
          await fetchImages();
        }
      } catch (error) {
        console.error('Error during image prediction:', error);
      }
    }
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between mb-6">
        <button
          onClick={handleBatchUpload}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center"
        >
          <Upload className="w-4 h-4 mr-2" />
          一括アップロード
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleUpload(Array.from(e.target.files))}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {images.length === 0 && (
          <div className="col-span-3 text-center text-gray-500">
            画像がありません
          </div>
        )}
        {images.map((image) => {
          console.log('Rendering image:', image);
          return (
            <div key={image.id} className="relative aspect-square bg-white rounded-lg shadow overflow-hidden">
              <img
                src={image.url}
                alt="Patient"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', image.url);
                  e.currentTarget.src = 'placeholder.jpg'; // 可选：添加占位图
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <span className="text-sm text-white font-medium">
                  {image.uploadTime}
                </span>
              </div>
            </div>
          );
        })}

        {/* 空的上传框 */}
        {SPECIAL_BOXES.map((label, index) => (
          <div
            key={`empty-${index}`}
            onClick={() => handleSingleUpload(index)}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-300"
          >
            <span className="text-sm text-gray-500">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
