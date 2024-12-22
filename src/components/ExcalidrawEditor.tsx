import React, { useEffect, useState, useCallback } from 'react';
import { Excalidraw, Sidebar } from "@excalidraw/excalidraw";
import type { ExcalidrawElement, FileId } from "@excalidraw/excalidraw/types/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import type { DataURL } from "@excalidraw/excalidraw/types/types";
import type { NormalizedZoomValue } from "@excalidraw/excalidraw/types/types";
import { Calendar, Image } from "lucide-react";  // 导入 Feather 图标和 Image 图标
import { Dialog } from "@headlessui/react"; // 用于模态框
import { API_BASE_URL } from '../config/api';  // 添加这行导入

interface Patient {
  id: string;
  name: string;
  nameKana?: string;
  birthDate?: string;
  gender?: string;
  chartNumber: string;
  tanto_name?: string;
}

interface ExcalidrawEditorProps {
  imageUrl: string;
  onSave?: (elements: ExcalidrawElement[]) => void;
  initialElements?: ExcalidrawElement[];
  onImageLoad?: (width: number, height: number) => void;
  patient?: Patient | null;
}

// 添加图像选择模态框组件
const ImageSelector = ({
  isOpen,
  onClose,
  onSelect,
  patientId
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  patientId: string;
}) => {
  const [images, setImages] = useState<{ id: string, url: string }[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetch(`${API_BASE_URL}/api/patients/${patientId}/images`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Received image data:', data);
          
          // 使用返回数据中的 id 和 url
          const imageUrls = data
            .filter((image: any) => image && image.id) // 过滤掉无效数据
            .map((image: any) => ({
              id: image.id.toString(),
              url: `${API_BASE_URL}${image.url}` // 使用完整的 URL 路径
            }));
          
          setImages(imageUrls);
        })
        .catch(error => {
          console.error('Error fetching images:', error);
          setError('画像の読み込みに失敗しました');
          setImages([]);
        });
    }
  }, [isOpen, patientId]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-3xl bg-white rounded-lg p-4">
          <Dialog.Title className="text-lg font-medium mb-4">画像選択</Dialog.Title>
          {error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={`Patient image ${index + 1}`}
                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80"
                  onClick={() => {
                    onSelect(image.url);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

// 修改工具栏组件
const RightSidebar = ({ 
  onDateClick,
  onImageClick, 
  isDateMode,
  isImageMode
}: { 
  onDateClick: () => void;
  onImageClick: () => void;
  isDateMode: boolean;
  isImageMode: boolean;
}) => {
  return (
    <div className="absolute right-0 top-0 bottom-0 w-[98px] bg-white border-l flex flex-col items-center pt-4 gap-2 z-50 shadow-sm">
      <button
        className="w-12 h-12 flex items-center justify-center rounded hover:bg-gray-100"
        title="日付"
        style={{
          backgroundColor: isDateMode ? 'rgba(0,0,0,0.1)' : 'transparent'
        }}
        onClick={onDateClick}
      >
        <Calendar size={24} />
      </button>
      <button
        className="w-12 h-12 flex items-center justify-center rounded hover:bg-gray-100"
        title="画像"
        style={{
          backgroundColor: isImageMode ? 'rgba(0,0,0,0.1)' : 'transparent'
        }}
        onClick={onImageClick}
      >
        <Image size={24} />
      </button>
    </div>
  );
};

export function ExcalidrawEditor({ 
  imageUrl, 
  onSave, 
  initialElements = [], 
  onImageLoad,
  patient
}: ExcalidrawEditorProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isDateMode, setIsDateMode] = useState(false);  // 添加日期模式状态
  const [isImageMode, setIsImageMode] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const loadImage = useCallback(async () => {
    if (!excalidrawAPI || isImageLoaded) return;
    console.log('Loading image:', imageUrl);

    try {
      setIsLoading(true);
      
      // 预加载图片
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      console.log('Image loaded and converted to base64');

      // 获取片尺寸
      const img = document.createElement('img');
      await new Promise<Event>((resolve, reject) => {
        img.onload = (event: Event) => resolve(event);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = base64;
      });

      console.log('Image dimensions:', img.width, img.height);
      onImageLoad?.(img.width, img.height);

      // 添加文件
      await excalidrawAPI.addFiles([{
        id: "background-image" as FileId,
        dataURL: base64 as unknown as DataURL,
        mimeType: "image/png",
        created: Date.now()
      }]);

      console.log('File added to Excalidraw');

      // 创建背景元素
      const backgroundElement: ExcalidrawElement = {
        type: "image",
        x: 0,
        y: 100,  // 给顶部文本留出间
        width: img.width,
        height: img.height,
        id: "background",
        fileId: "background-image" as FileId,
        status: "saved",
        scale: [1, 1],
        locked: true,
        strokeColor: "transparent",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        groupIds: [],
        seed: 1,
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        boundElements: null,
        updated: 1,
        customData: undefined,
        roundness: null,
        angle: 0,
        frameId: null,
        link: null
      };

      // 创建患者信息文本素
      const elements: ExcalidrawElement[] = [];

      // 添加背景图片元素
      elements.push(backgroundElement);

      if (patient) {
        // 添加患者信息文本
        elements.push({
          type: "text",
          x: 40,
          y: 160,
          width: 1200,
          height: 10,
          text: `${patient.name} ${patient.nameKana || ''}　　　${patient.gender === 'male' ? '男性' : '女性'}　　${calculateAge(patient.birthDate || '')}歳　　　　　　カルテ番号：${patient.chartNumber}`,
          fontSize: 20,
          fontFamily: 3,
          textAlign: "left",
          verticalAlign: "middle",
          id: "patient-info",
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1,
          strokeStyle: "solid",
          roughness: 0,
          opacity: 100,
          locked: true,
          angle: 0,
          groupIds: [],
          strokeColor: "#000000",
          roundness: null,
          boundElements: null,
          updated: 1,
          link: null,
          frameId: null,
          seed: 1,
          version: 1,
          versionNonce: 1,
          isDeleted: false,
          customData: undefined,
          baseline: 0,
          containerId: null,
          originalText: `${patient.name} ${patient.nameKana || ''}　　　${patient.gender === 'male' ? '男性' : '女性'}　　${calculateAge(patient.birthDate || '')}歳　　　　　　カルテ番号：${patient.chartNumber}`,
          lineHeight: 1.25
        } as unknown as ExcalidrawElement);

        // 添加日期文本元素
        elements.push({
          type: "text",
          x: 75,
          y: 290,
          width: 100,
          height: 10,
          text: new Date().toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }).replace('/', '/'),
          fontSize: 20,
          fontFamily: 3,
          textAlign: "left",
          verticalAlign: "middle",
          id: "date-text",
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1,
          strokeStyle: "solid",
          roughness: 0,
          opacity: 100,
          locked: true,
          angle: 0,
          groupIds: [],
          strokeColor: "#000000",
          roundness: null,
          boundElements: null,
          updated: 1,
          link: null,
          frameId: null,
          seed: 1,
          version: 1,
          versionNonce: 1,
          isDeleted: false,
          customData: undefined,
          baseline: 0,
          containerId: null,
          originalText: new Date().toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }).replace('/', '/'),
          lineHeight: 1.25
        } as unknown as ExcalidrawElement);
      }

      // 更新场景
      excalidrawAPI.updateScene({
        elements: [...elements, ...initialElements],
        appState: {
          viewBackgroundColor: "#ffffff",
          currentItemStrokeColor: "#000000",
          currentItemBackgroundColor: "transparent",
          currentItemFillStyle: "hachure",
          currentItemStrokeWidth: 1,
          currentItemStrokeStyle: "solid",
          currentItemRoughness: 1,
          currentItemOpacity: 100,
          currentItemFontFamily: 1,
          currentItemFontSize: 20,
          currentItemTextAlign: "left",
          viewModeEnabled: false,
          gridSize: null,
          theme: "light",
          zoom: { value: 1 as NormalizedZoomValue },
          scrollX: 0,  // 添加个
          scrollY: 0   // 添加这个
        }
      });

      console.log('Scene updated');
      setIsImageLoaded(true);
    } catch (error) {
      console.error('Failed to load image:', error);
    } finally {
      setIsLoading(false);
    }
  }, [excalidrawAPI, imageUrl, initialElements, onImageLoad, isImageLoaded, patient]);

  useEffect(() => {
    if (excalidrawAPI && !isImageLoaded) {
      console.log('ExcalidrawAPI initialized, loading image...');
      loadImage();
    }
  }, [excalidrawAPI, loadImage, isImageLoaded]);

  // 添加鼠标点击事件处理
  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDateMode || !excalidrawAPI) return;

    const dateElement = {
      type: "text",
      x: event.nativeEvent.offsetX,
      y: event.nativeEvent.offsetY,
      width: 100,
      height: 10,
      text: new Date().toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }).replace('/', '/'),
      fontSize: 20,
      fontFamily: 3,
      textAlign: "left",
      verticalAlign: "middle",
      id: "date-text",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      locked: true,
      angle: 0,
      groupIds: [],
      strokeColor: "#000000",
      roundness: null,
      boundElements: null,
      updated: 1,
      link: null,
      frameId: null,
      seed: 1,
      version: 1,
      versionNonce: 1,
      isDeleted: false,
      customData: undefined,
      baseline: 0,
      containerId: null,
      originalText: new Date().toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }).replace('/', '/'),
      lineHeight: 1.25
    } as unknown as ExcalidrawElement;

    excalidrawAPI.updateScene({
      elements: [...excalidrawAPI.getSceneElements(), dateElement]
    });

    setIsDateMode(false);
  }, [isDateMode, excalidrawAPI]);

  // 处理图像选择
  const handleImageSelect = useCallback(async (imageUrl: string) => {
    if (!excalidrawAPI) return;

    try {
      // 先通过 fetch 加载图片并转换为 blob
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      
      // 创建图片对象并加载 blob
      const img = document.createElement('img');
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(blob);
      });

      // 获取背景图片元素的宽度作为参考
      const backgroundElement = excalidrawAPI.getSceneElements().find(
        el => el.id === "background"
      );
      const maxWidth = backgroundElement ? (backgroundElement.width * 0.8) : 800;

      // 计算压缩后的尺寸
      let newWidth = img.width;
      let newHeight = img.height;
      if (newWidth > maxWidth) {
        const ratio = maxWidth / newWidth;
        newWidth = maxWidth;
        newHeight = img.height * ratio;
      }

      // 创建 canvas 并设置跨域属性
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // 释放 blob URL
      URL.revokeObjectURL(img.src);

      // 获取压缩后的数据 URL
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

      // 创建完整的 Excalidraw ��片元素
      const imageElement: ExcalidrawElement = {
        type: "image",
        x: 100,
        y: 100,
        width: newWidth,
        height: newHeight,
        id: `image-${Date.now()}`,
        fileId: imageUrl as FileId,
        status: "saved",
        scale: [1, 1],
        locked: false,
        strokeColor: "transparent",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        groupIds: [],
        seed: 1,
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        boundElements: null,
        updated: 1,
        customData: undefined,
        roundness: null,
        angle: 0,
        frameId: null,
        link: null
      };

      // 添加压缩后的文件到 Excalidraw
      await excalidrawAPI.addFiles([{
        id: imageUrl as FileId,
        dataURL: compressedDataUrl as unknown as DataURL,
        mimeType: "image/jpeg",
        created: Date.now()
      }]);

      // 更新场景
      excalidrawAPI.updateScene({
        elements: [...excalidrawAPI.getSceneElements(), imageElement]
      });

    } catch (error) {
      console.error('Failed to add image:', error);
    }
  }, [excalidrawAPI]);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-40">
          <div className="text-gray-500">Loading...</div>
        </div>
      )}
      
      <div className="h-[calc(100%-40px)] bg-white relative">
        <div 
          className="absolute inset-0" 
          onPointerDown={handlePointerDown}
        >
          <Excalidraw
            excalidrawAPI={(api) => {
              setExcalidrawAPI(api);
            }}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                saveAsImage: false,
                saveToActiveFile: false,
                export: false,
                clearCanvas: true,
                changeViewBackgroundColor: false
              },
              tools: {
                image: false
              }
            }}
          />
        </div>
        <RightSidebar 
          onDateClick={() => setIsDateMode(!isDateMode)}
          onImageClick={() => setIsImageSelectorOpen(true)}
          isDateMode={isDateMode}
          isImageMode={isImageMode}
        />
        <ImageSelector
          isOpen={isImageSelectorOpen}
          onClose={() => setIsImageSelectorOpen(false)}
          onSelect={handleImageSelect}
          patientId={patient?.id || ''}
        />
      </div>
      <div className="h-10 flex justify-end p-2">
        <button
          onClick={() => {
            if (excalidrawAPI && onSave) {
              onSave([...excalidrawAPI.getSceneElements()]);
            }
          }}
          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          保存
        </button>
      </div>
    </div>
  );
} 