import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ImageBox } from './ImageBox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { UniversalNumberingSystem } from './dental/UniversalNumberingSystem';
import { useParams } from 'react-router-dom';

export interface Box {
  corners: number[][];
  disease_type: string | string[];
  name: string;
  probability: number;
  tooth_number: string;
  source?: 'AI' | 'Manual';
}

interface APIResponse {
  boxes: Box[];
  name: string;
  type: string;
  version: {
    major: number;
    minor: number;
  };
}

export const DISEASE_TYPE_MAP: Record<string, string> = {
  'Caries': '齲蝕',
  'Impacted': '埋伏歯',
  'Periapical': '根尖病変',
  'Deep Caries': '深部齲蝕'
};

export const DISEASE_COLOR_MAP: Record<string, string> = {
  'Caries': '#00ff00',      // 绿色
  'Impacted': '#ff0000',    // 红色
  'Periapical': '#0000ff', // 蓝色
  'Deep Caries': '#ff9900', // 橙色
  'Normal': 'rgba(200, 200, 200, 0.3)'  // 浅灰色
};

export const convertToothNumber = (originalNumber: string, isFromAPI: boolean = true): string => {
  const [quadrant, number] = originalNumber.split('-');
  
  if (isFromAPI) {
    // API 返回的编号需要 +1
    const newQuadrant = parseInt(quadrant) + 1;
    return `${newQuadrant}-${number}`;
  }

  // 手动修改时，如果编号已经是正确的（如 1-7），直接返回
  if (quadrant === '1' || quadrant === '2' || quadrant === '3' || quadrant === '4') {
    return originalNumber;
  }
  
  // 否则进行转换
  const manualQuadrant = parseInt(quadrant) - 1;
  return `${manualQuadrant}-${number}`;
};

// 添加疾病标签组件
const DiseaseTag = ({ 
  disease, 
  canDelete, 
  onDelete,
  onClick 
}: { 
  disease: string; 
  canDelete: boolean;
  onDelete?: () => void;
  onClick?: () => void;
}) => (
  <span 
    className={`inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded mr-2 ${onClick ? 'cursor-pointer hover:bg-gray-200' : ''}`}
    onClick={onClick}
  >
    {DISEASE_TYPE_MAP[disease]}
    {canDelete && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
        className="ml-1 text-gray-500 hover:text-red-500"
      >
        ×
      </button>
    )}
  </span>
);

// 添加确认对话框组件
const ConfirmDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  onCancel 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>変更したデータを保存しますか？</DialogTitle>
      </DialogHeader>
      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          保存する
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          保存せずに進む
        </button>
      </div>
    </DialogContent>
  </Dialog>
);

// 添加删除确认对话框组件
const DeleteConfirmDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>フォルダを削除しますか？</DialogTitle>
      </DialogHeader>
      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          確認
        </button>
        <button
          onClick={() => onOpenChange(false)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          キャンセル
        </button>
      </div>
    </DialogContent>
  </Dialog>
);

interface DatabaseImage {
  id: string;
  url: string;
  uploadTime: string;
  annotations?: Box[];  // 添加标注字段
}

export function ImageGrid() {
  const [annotations, setAnnotations] = useState<Box[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [hasChanges, setHasChanges] = useState(false);
  const [memo, setMemo] = useState('');
  const initialAnnotationsRef = useRef<Box[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [savedAnnotations, setSavedAnnotations] = useState<Box[]>([]);  // 保存的标注
  const [predictedAnnotations, setPredictedAnnotations] = useState<Box[]>([]);  // 预测的标注
  const [uploadedImages, setUploadedImages] = useState<Array<{
    id: string;
    url: string;
    uploadTime: string;
    annotations: Box[];
    originalUrl: string;
  }>>([]);

  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { id } = useParams<{ id: string }>();
  const [databaseImages, setDatabaseImages] = useState<DatabaseImage[]>([]);
  const [loadingImageId, setLoadingImageId] = useState<string | null>(null);  // 添加新状态来跟踪正在加载的图片

  const fetchDatabaseImages = async () => {
    try {
      console.log('Fetching images at:', new Date().toISOString());
      console.log('For patient ID:', id);
      const response = await fetch(`http://localhost:3001/api/patients/${id}/images`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received images:', data);
      setDatabaseImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDatabaseImages();
    }
  }, [id]);

  // 恢复原来的 drawAnnotations 函数
  const drawAnnotations = (boxes: Box[]) => {
    if (!boxes || !Array.isArray(boxes)) {
      console.warn('Invalid boxes data:', boxes);
      return;
    }

    const canvas = annotationCanvasRef.current;
    const image = imageRef.current;
    
    if (!canvas || !image) {
      console.warn('Canvas or image not found');
      return;
    }

    // 获取图片和容器的尺寸
    const imageRect = image.getBoundingClientRect();
    canvas.width = imageRect.width;
    canvas.height = imageRect.height;

    // 计算图片在容器中的实际位置（考虑 object-contain 的影响）
    const containerWidth = canvas.width;
    const containerHeight = canvas.height;
    const imageAspectRatio = image.naturalWidth / image.naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let scaledWidth, scaledHeight, offsetX = 0, offsetY = 0;
    
    if (imageAspectRatio > containerAspectRatio) {
      scaledWidth = containerWidth;
      scaledHeight = containerWidth / imageAspectRatio;
      offsetY = (containerHeight - scaledHeight) / 2;
    } else {
      scaledHeight = containerHeight;
      scaledWidth = containerHeight * imageAspectRatio;
      offsetX = (containerWidth - scaledWidth) / 2;
    }

    const scaleX = scaledWidth / image.naturalWidth;
    const scaleY = scaledHeight / image.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制矩形框
    boxes.forEach(box => {
      if (!box || !Array.isArray(box.corners) || box.corners.length < 3) {
        console.warn('Invalid box data:', box);
        return;
      }

      const [[x1, y1], [_, y2], [x2, __]] = box.corners;
      // 如果是数组，使用第一个疾病类型的颜色
      const diseaseType = Array.isArray(box.disease_type) ? box.disease_type[0] : box.disease_type;
      const color = DISEASE_COLOR_MAP[diseaseType] || '#00ff00';

      // 应用缩放和偏移
      const scaledX1 = x1 * scaleX + offsetX;
      const scaledY1 = y1 * scaleY + offsetY;
      const scaledWidth = (x2 - x1) * scaleX;
      const scaledHeight = (y2 - y1) * scaleY;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX1, scaledY1, scaledWidth, scaledHeight);

      // 绘制文本
      ctx.fillStyle = color;
      ctx.font = `${Math.max(12, 16 * Math.min(scaleX, scaleY))}px Arial`;
      const convertedNumber = convertToothNumber(box.tooth_number, box.source !== 'Manual');
      const japaneseType = Array.isArray(box.disease_type)
        ? box.disease_type.map(type => DISEASE_TYPE_MAP[type]).join('・')
        : DISEASE_TYPE_MAP[box.disease_type];

      const displayText = box.source === 'Manual' 
        ? `${convertedNumber} - ${japaneseType} (手動調整)`
        : `${convertedNumber} - ${japaneseType} (${(box.probability * 100).toFixed(1)}%)`;

      ctx.fillText(displayText, scaledX1, scaledY1 - 5);
    });
  };

  // 恢复原来的图片加载处理
  const handleImageLoad = () => {
    const image = imageRef.current;
    const canvas = annotationCanvasRef.current;
    
    if (!image || !canvas) return;

    // 设置 canvas 尺寸与加载后的图片一致
    canvas.width = image.width;
    canvas.height = image.height;

    // 如果有标注数据，立即绘制
    if (annotations.length > 0) {
      drawAnnotations(annotations);
    }
  };

  const handleUpload = async (files: FileList) => {
    for (const file of files) {
      try {
        setIsLoading(true);

        // 先发送到预测服务器
        const predictionFormData = new FormData();
        predictionFormData.append('file', file);
        const predictionResponse = await fetch('https://panorama.dentalbrain.app/predict', {
          method: 'POST',
          body: predictionFormData,
        });

        if (predictionResponse.ok) {
          const predictionResult = await predictionResponse.json();

          // 保存图片和预测结果到后端
          const saveFormData = new FormData();
          saveFormData.append('image', file);
          saveFormData.append('annotations', JSON.stringify(predictionResult.boxes));

          const saveResponse = await fetch(`http://localhost:3001/api/patients/${id}/images`, {
            method: 'POST',
            body: saveFormData,
          });

          if (saveResponse.ok) {
            const saveResult = await saveResponse.json();
            
            // 直接使用保存到S3的URL，而不是创建本地URL
            const newImage = {
              id: saveResult.imageId,
              url: saveResult.url,  // 使用S3的URL
              uploadTime: new Date().toISOString().split('T')[0],
              annotations: predictionResult.boxes,
              originalUrl: saveResult.url  // 使用相同的URL
            };

            // 更新本地状态
            setDatabaseImages(prev => [...prev, {
              id: saveResult.imageId,
              url: saveResult.url,
              uploadTime: newImage.uploadTime,
              annotations: predictionResult.boxes
            }]);
          }
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDialogOpen = (isOpen: boolean) => {
    if (!isOpen && hasChanges) {
      // 如果有修改且试图关闭对话框示确认对话框
      setConfirmDialogOpen(true);
    } else if (!hasChanges) {
      // 如果没有修改，直接关闭
      setDialogOpen(false);
    }
  };

  const checkChanges = useCallback((newAnnotations: Box[], newMemo: string) => {
    const annotationsChanged = JSON.stringify(newAnnotations) !== JSON.stringify(initialAnnotationsRef.current);
    const memoChanged = newMemo !== '';
    setHasChanges(annotationsChanged || memoChanged);
  }, []);

  const handleTeethUpdate = (
    toothNumber: string,
    diseaseType: string,
    source: 'Manual',
    newToothNumber?: string,
    isAddingDisease?: boolean
  ) => {
    setAnnotations(prev => {
      // 处理编号修改
      if (newToothNumber) {
        const existingIndex = prev.findIndex(a => {
          const currentNumber = a.source === 'Manual'
            ? a.tooth_number
            : convertToothNumber(a.tooth_number, true);
          return currentNumber === toothNumber;
        });

        if (existingIndex >= 0) {
          const newAnnotations = [...prev];
          newAnnotations[existingIndex] = {
            ...prev[existingIndex],
            tooth_number: newToothNumber,
            name: `${newToothNumber} - ${Array.isArray(prev[existingIndex].disease_type) 
              ? prev[existingIndex].disease_type.map(type => DISEASE_TYPE_MAP[type]).join('・')
              : DISEASE_TYPE_MAP[prev[existingIndex].disease_type]}`,
            source: 'Manual' as const
          };

          requestAnimationFrame(() => {
            drawAnnotations(newAnnotations);
          });

          return newAnnotations;
        }
        return prev;
      }

      // 处理病类型修改
      const existingIndex = prev.findIndex(a => {
        const currentNumber = a.source === 'Manual'
          ? a.tooth_number
          : convertToothNumber(a.tooth_number, true);
        return currentNumber === toothNumber;
      });

      if (existingIndex >= 0) {
        const existingAnnotation = prev[existingIndex];

        if (diseaseType === 'Normal') {
          const newAnnotations = [...prev];
          newAnnotations[existingIndex] = {
            ...existingAnnotation,
            disease_type: ['Normal'],  // 使用组格式，保持一致性
            name: toothNumber,  // 只保留编号
            source: 'Manual' as const
          };
          requestAnimationFrame(() => {
            drawAnnotations(newAnnotations);
          });
          return newAnnotations.filter(a => a.disease_type[0] !== 'Normal');  // 过滤掉健康齿
        }

        // 无论是添加还是修改，都在同一个条目上作
        const currentDiseases = Array.isArray(existingAnnotation.disease_type)
          ? existingAnnotation.disease_type
          : [existingAnnotation.disease_type];

        const newDiseases = isAddingDisease
          ? [...currentDiseases, diseaseType]
          : [diseaseType];

        const newAnnotations = [...prev];
        newAnnotations[existingIndex] = {
          ...existingAnnotation,
          tooth_number: toothNumber,  // 直接使用传入的编号，不需要转换
          disease_type: newDiseases,
          name: `${toothNumber} - ${newDiseases.map(type => DISEASE_TYPE_MAP[type]).join('・')}`,
          source: 'Manual' as const
        };

        requestAnimationFrame(() => {
          drawAnnotations(newAnnotations);
        });

        return newAnnotations;
      }

      // 有在找不到现有条目时才新增
      const newAnnotation: Box = {
        tooth_number: toothNumber,  // 直接使用入的编号
        disease_type: [diseaseType],
        probability: 1.0,
        name: `${toothNumber} - ${DISEASE_TYPE_MAP[diseaseType]}`,
        corners: [],
        source: 'Manual' as const
      };
      return [...prev, newAnnotation];
    });
    checkChanges(annotations, memo);
  };

  const handleConfirmSave = () => {
    setSavedAnnotations(annotations);
    // 更新 uploadedImages 中的标注数据
    setUploadedImages(prev => prev.map(img => {
      if (img.originalUrl === originalImageUrl) {
        return {
          ...img,
          annotations: annotations  // 使用最新的标注数据
        };
      }
      return img;
    }));
    setConfirmDialogOpen(false);
    setDialogOpen(false);
  };

  const handleConfirmCancel = () => {
    // 恢复到预测的标注
    setAnnotations(predictedAnnotations);
    setConfirmDialogOpen(false);
    setDialogOpen(false);
  };

  // 移除 useEffect，恢复直接绑定事件
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const newScale = scale * (1 + delta * 0.001);
    
    // 限制缩放范围
    if (newScale >= 0.5 && newScale <= 5) {
      setScale(newScale);
      // 重绘标注
      requestAnimationFrame(() => {
        drawAnnotations(annotations);
      });
    }
  };

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  // 处理拖拽移动
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // 限制拖拽范围
      const container = containerRef.current;
      if (container) {
        const bounds = container.getBoundingClientRect();
        const maxX = bounds.width * (scale - 1);
        const maxY = bounds.height * (scale - 1);
        
        setPosition({
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY))
        });
        
        // 重绘标注
        requestAnimationFrame(() => {
          drawAnnotations(annotations);
        });
      }
    }
  };

  // 处理拖拽结束
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 处理删除确认
  const handleDelete = (index: number) => {
    const image = uploadedImages[index];
    if (image && image.originalUrl) {
      // 使用originalUrl作为标识
      setDatabaseImages(prev => prev.filter(img => img.url !== image.originalUrl));
    }
  };

  // 修改预测函数
  const handleDatabaseImagePredict = async (image: DatabaseImage) => {
    try {
      setLoadingImageId(image.id);

      // 如果已经有预测结果，直接使用
      if (image.annotations) {
        setAnnotations(image.annotations);
        setPredictedAnnotations(image.annotations);
        setOriginalImageUrl(image.url);
        setDialogOpen(true);
        return;
      }

      // 先获取图像文件
      const response = await fetch(image.url);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

      // 发���预测请求
      const formData = new FormData();
      formData.append('file', file);
      const predictionResponse = await fetch('https://panorama.dentalbrain.app/predict', {
        method: 'POST',
        body: formData,
      });

      if (predictionResponse.ok) {
        const predictionResult = await predictionResponse.json();
        const newAnnotations = predictionResult.boxes;

        // 更新数据库图片的预测结果
        setDatabaseImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, annotations: newAnnotations }
            : img
        ));

        // 设置预测结果并开对话框
        setAnnotations(newAnnotations);
        setPredictedAnnotations(newAnnotations);
        setOriginalImageUrl(image.url);
        setDialogOpen(true);
      }
    } catch (error) {
      console.error('Error predicting database image:', error);
      setAnnotations([]);
      setPredictedAnnotations([]);
    } finally {
      setLoadingImageId(null);
    }
  };

  // 添加删除处理函数
  const handleDeleteImage = (imageId: string) => {
    setDeleteImageId(imageId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteImage = async () => {
    if (deleteImageId) {
      try {
        const response = await fetch(`http://localhost:3001/api/images/${deleteImageId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setDatabaseImages(prev => prev.filter(img => img.id !== deleteImageId));
        } else {
          throw new Error('Failed to delete image');
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('画像の削除に失敗しました');
      } finally {
        setDeleteDialogOpen(false);
        setDeleteImageId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* 数据库图像 */}
        {databaseImages.map((image) => {
          console.log('Rendering image:', image);  // 添加日志
          return (
            <div key={`db-${image.id}`} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">アップロード時間：{image.uploadTime}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(image.id);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
              <div 
                className="cursor-pointer" 
                onClick={async () => {
                  await handleDatabaseImagePredict(image);
                }}
              >
                <ImageBox
                  image={null}
                  originalImageUrl={image.url}
                  annotations={image.annotations}
                  onUpload={() => {}}
                  clickable={false}
                  isLoading={loadingImageId === image.id}
                />
              </div>
            </div>
          );
        })}

        {/* 本地上传的图像 */}
        {uploadedImages.map((image, index) => (
          <div key={`local-${index}`} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">アップロード時間：{image.uploadTime}</h3>
              <button
                onClick={() => handleDelete(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </div>
            <div 
              className="cursor-pointer" 
              onClick={() => {
                setAnnotations(image.annotations);
                setPredictedAnnotations(image.annotations);
                setOriginalImageUrl(image.originalUrl);
                setDialogOpen(true);
              }}
            >
              <ImageBox
                image={null}
                originalImageUrl={image.originalUrl}
                annotations={image.annotations}
                onUpload={() => {}}
                clickable={false}
              />
            </div>
          </div>
        ))}
        
        {/* 上传框 */}
        <div key="upload-box" className="border rounded-lg p-4">
          <ImageBox
            image={null}
            onUpload={(files) => handleUpload(files)}
            isLoading={isLoading}
            multiple={true}
          />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
        <DialogContent className="max-w-[80vw] w-[80vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>データアラート検出</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-6">
            {/* 第一行：图片和齿位图 - 修改列宽比例 */}
            <div className="grid grid-cols-[3fr_1fr] gap-6 h-[70vh]">
              {/* 侧标注图片容器 */}
              <div 
                className="w-full h-full relative"
                ref={containerRef}
                onWheel={handleWheel as any}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ overflow: 'hidden' }}
              >
                <div 
                  className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg"
                  style={{
                    transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                    transformOrigin: 'center',
                    transition: isDragging ? 'none' : 'transform 0.1s'
                  }}
                >
                  {originalImageUrl && (
                    <img
                      src={originalImageUrl}
                      alt="Original"
                      className="w-full h-full object-contain"
                      ref={imageRef}
                      onLoad={handleImageLoad}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                </div>
                {/* 上层标注 */}
                <canvas
                  ref={annotationCanvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                    transformOrigin: 'center',
                    transition: isDragging ? 'none' : 'transform 0.1s'
                  }}
                />
              </div>
              {/* 右侧牙位图 */}
              <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <UniversalNumberingSystem 
                  highlightedTeeth={annotations
                    .filter(box => {
                      const diseases = Array.isArray(box.disease_type) 
                        ? box.disease_type 
                        : [box.disease_type];
                      return diseases[0] !== 'Normal';  // 过滤掉健康齿
                    })
                    .map(box => {
                      if (box.source === 'Manual') {
                        return box.tooth_number;
                      }
                      return convertToothNumber(box.tooth_number, true);
                    })}
                  diseaseTypes={annotations.reduce((acc, box) => ({
                    ...acc,
                    // 同样，根来源决定是否要转换编号
                    [box.source === 'Manual' ? box.tooth_number : convertToothNumber(box.tooth_number, true)]: box.disease_type
                  }), {})}
                  onTeethUpdate={handleTeethUpdate}
                  popoverPosition={popoverPosition}
                  setPopoverPosition={setPopoverPosition}
                />
              </div>
            </div>

            {/* 第二行：备注和检出结果 */}
            <div className="grid grid-cols-2 gap-6">
              {/* 左侧备注 */}
              <div className="w-full">
                <h3 className="text-lg font-semibold mb-2">メモ</h3>
                <textarea
                  className="w-full h-[150px] p-3 border rounded-lg resize-none"
                  placeholder="医師のメモを入力してください..."
                  value={memo}
                  onChange={(e) => {
                    setMemo(e.target.value);
                    checkChanges(annotations, e.target.value);
                  }}
                />
              </div>
              {/* 右检出结果 */}
              <div className="flex-1 overflow-auto max-h-[200px]">
                <h3 className="text-lg font-semibold mb-2">検出結果</h3>
                <div className="space-y-2">
                  {annotations
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
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{displayNumber}</p>
                                <div className="flex flex-wrap gap-1 flex-1">
                                  {diseases.map((disease, i) => (
                                    <DiseaseTag
                                      key={i}
                                      disease={disease}
                                      canDelete={diseases.length > 1}
                                      onDelete={() => {
                                        const newDiseases = diseases.filter(d => d !== disease);
                                        handleTeethUpdate(
                                          box.tooth_number,
                                          newDiseases[0],
                                          'Manual',
                                          undefined,
                                          false
                                        );
                                      }}
                                      onClick={diseases.length === 1 ? () => {
                                        // 显示与齿位图相同的菜单
                                        setSelectedTooth(box.tooth_number);
                                        // 计算菜单位置
                                        const element = document.getElementById(`disease-tag-${index}-${i}`);
                                        if (element) {
                                          const rect = element.getBoundingClientRect();
                                          setPopoverPosition({
                                            x: rect.right - 180,
                                            y: rect.top + rect.height / 2
                                          });
                                        }
                                      } : undefined}
                                    />
                                  ))}
                                </div>
                                <p className="text-sm text-gray-500 whitespace-nowrap">
                                  {box.source === 'Manual' ? '手動調整' : `確率: ${(box.probability * 100).toFixed(1)}%`}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmSave}
        onCancel={handleConfirmCancel}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDeleteImage}
      />
    </div>
  );
}