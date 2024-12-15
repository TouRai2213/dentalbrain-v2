import React, { createContext, useContext, useState } from 'react';

// 修改 ImageContextType 接口，使用 React.Dispatch 类型
interface ImageContextType {
  images: (string | null)[];
  setImages: React.Dispatch<React.SetStateAction<(string | null)[]>>;
}

const ImageContext = createContext<ImageContextType | null>(null);

export function ImageProvider({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<(string | null)[]>(Array(12).fill(null));

  return (
    <ImageContext.Provider value={{ images, setImages }}>
      {children}
    </ImageContext.Provider>
  );
}

export function useImages() {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImages must be used within an ImageProvider');
  }
  return context;
}