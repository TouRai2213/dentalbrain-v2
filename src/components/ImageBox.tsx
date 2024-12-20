import React, { useRef, useEffect } from 'react';
import { Loader2, Upload } from "lucide-react"; // 添加 Upload 图标
import { Box } from './ImageGrid';
import { DISEASE_TYPE_MAP, DISEASE_COLOR_MAP } from './ImageGrid';
import { convertToothNumber } from './ImageGrid';

interface ImageBoxProps {
  image: string | null;
  onUpload: (files: FileList) => void;
  isSpecial?: boolean;
  label?: string;
  isLoading?: boolean;
  annotations?: Box[] | string;
  originalImageUrl?: string | null;
  multiple?: boolean;  // 添加多文件上传支持
  clickable?: boolean;  // 添加新属性
}

export function ImageBox({ 
  onUpload, 
  image, 
  isSpecial, 
  label, 
  isLoading, 
  annotations = [], 
  originalImageUrl, 
  multiple,
  clickable = true  // 默认可点击
}: ImageBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 确保annotations是数组
  const annotationArray = typeof annotations === 'string' 
    ? JSON.parse(annotations) as Box[]  // 添加类型断言
    : (Array.isArray(annotations) ? annotations : []);

  // 移动到组件作用域
  const drawThumbnailAnnotations = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置 canvas 尺寸为图片的实际显示尺寸
    const rect = image.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // 计算缩放比例
    const scaleX = rect.width / image.naturalWidth;
    const scaleY = rect.height / image.naturalHeight;

    annotationArray.forEach(box => {
      if (!box.corners || box.corners.length < 3) return;

      const [[x1, y1], [_, y2], [x2, __]] = box.corners;
      const diseaseType = Array.isArray(box.disease_type) ? box.disease_type[0] : box.disease_type;
      const color = DISEASE_COLOR_MAP[diseaseType] || '#00ff00';

      // 应用缩放
      const scaledX = x1 * scaleX;
      const scaledY = y1 * scaleY;
      const scaledWidth = (x2 - x1) * scaleX;
      const scaledHeight = (y2 - y1) * scaleY;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
    });
  };

  // 修改 useEffect
  useEffect(() => {
    if (annotationArray.length > 0 && originalImageUrl) {
      const image = imageRef.current;
      if (!image) return;

      if (image.complete) {
        drawThumbnailAnnotations();
      } else {
        image.onload = drawThumbnailAnnotations;
      }

      const handleResize = () => {
        requestAnimationFrame(drawThumbnailAnnotations);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [annotationArray, originalImageUrl]);

  const handleClick = () => {
    if (clickable) {
      fileInputRef.current?.click();
    }
  };

  // 文件改变处理函数
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onUpload(files);
    }
  };

  // 添加图片加载处理函数
  const handleImageLoad = () => {
    const image = imageRef.current;
    const canvas = canvasRef.current;
    
    if (!image || !canvas) return;

    // 设置 canvas 尺寸为图片的实际显示尺寸
    const rect = image.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // 如果有标注数据，立即绘制
    if (annotationArray.length > 0) {
      drawThumbnailAnnotations();
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

  return (
    <div 
      onClick={handleClick}
      className={`relative border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col ${clickable ? 'cursor-pointer hover:border-gray-400 hover:bg-gray-50' : ''} transition-colors`}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        onClick={e => e.stopPropagation()}
      />
      
      {label && (
        <div className="absolute top-2 left-2 text-sm font-medium text-gray-500">
          {label}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-2 text-sm text-gray-500">処理中...</p>
        </div>
      ) : (
        <>
          {originalImageUrl ? (
            <>
              <div className="relative aspect-video w-full">
                <img
                  ref={imageRef}
                  src={originalImageUrl?.startsWith('/') ? `${API_BASE_URL}${originalImageUrl}` : originalImageUrl}
                  alt="Original"
                  className="w-full h-full object-contain"
                  onLoad={handleImageLoad}
                  style={{ pointerEvents: 'none' }}
                  crossOrigin="anonymous"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
              </div>
              {annotationArray.length > 0 && (
                <div className="mt-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    {annotationArray
                      .filter(box => {
                        const diseases = Array.isArray(box.disease_type) 
                          ? box.disease_type 
                          : [box.disease_type];
                        return diseases[0] !== 'Normal';
                      })
                      .map((box, index) => {
                        const displayNumber = box.source === 'Manual'
                          ? box.tooth_number
                          : convertToothNumber(box.tooth_number, true);
                        
                        const diseases = Array.isArray(box.disease_type) 
                          ? box.disease_type 
                          : [box.disease_type];

                        return (
                          <div key={index} className="text-gray-600">
                            {displayNumber}：{diseases.map(type => DISEASE_TYPE_MAP[type]).join('・')}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">クリックしてアップロード</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}