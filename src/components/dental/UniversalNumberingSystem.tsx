import React, { useEffect, useRef, useState } from 'react';
import universalNumberingSvg from '../../assets/universal-numbering-system.svg';

interface UniversalNumberingSystemProps {
  highlightedTeeth?: string[];
  diseaseTypes?: Record<string, string | string[]>;
  onTeethUpdate?: (toothNumber: string, diseaseType: string, source: 'Manual', newToothNumber?: string, isAddingDisease?: boolean) => void;
  popoverPosition: { x: number; y: number };
  setPopoverPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

// 牙齿编号到 SVG path ID 的映射
const TOOTH_PATH_MAP: Record<string, string> = {
  // 右上（从中间往外）
  '1-1': 'path3908',  // 上排右侧第1颗
  '1-2': 'path3900',  // 上排右侧第2颗
  '1-3': 'path3892',  // 上排右侧第3颗
  '1-4': 'path3876',  // 上排右侧第4颗
  '1-5': 'path3063',  // 上排右侧第5颗
  '1-6': 'path5187',  // 上排右侧第6颗
  '1-7': 'path5171',  // 上排右侧第7颗
  '1-8': 'path2994',  // 上排右侧第8颗

  // 左上（从中间往外）
  '2-1': 'path4364',  // 上排左侧第1颗
  '2-2': 'path4356',  // 上排左侧第2颗
  '2-3': 'path4348',  // 上排左侧第3颗
  '2-4': 'path4332',  // 上排左侧第4颗
  '2-5': 'path4320',  // 上排左侧第5��
  '2-6': 'path4306',  // 上排左侧第6颗
  '2-7': 'path4290',  // 上排左侧第7颗
  '2-8': 'path4278',  // 上排左侧第8颗

  // 左下（从中间往外）
  '3-1': 'path4454',  // 下排左侧第1颗
  '3-2': 'path4452',  // 下排左侧第2颗
  '3-3': 'path4436',  // 下排左侧第3颗
  '3-4': 'path4426',  // 下排左侧第4颗
  '3-5': 'path4416',  // 下排左侧第5颗
  '3-6': 'path4400',  // 下排左侧第6颗
  '3-7': 'path4382',  // 下排左侧第7颗
  '3-8': 'path4368',  // 下排左侧第8颗

  // 右下（从中间往外）
  '4-1': 'path3899',  // 下排右侧第1颗
  '4-2': 'path3897',  // 下排右侧第2颗
  '4-3': 'path3881',  // 下排右侧第3颗
  '4-4': 'path3870',  // 下排右侧第4颗
  '4-5': 'path3962',  // 下排右侧第5颗
  '4-6': 'path3946',  // 下排右侧第6颗
  '4-7': 'path3928',  // 下排右侧第7颗
  '4-8': 'path3912',  // 下排右侧第8颗
};

// 疾病类型映射（包括正常牙齿）
const DISEASE_TYPES = {
  'Normal': '健全歯',
  'Caries': '齲蝕',
  'Impacted': '埋伏歯',
  'Periapical': '根尖病変',
  'Deep Caries': '深部齲蝕'
} as const;

// 疾病类型到颜色的映射
const HIGHLIGHT_COLORS: Record<string, string> = {
  'Caries': 'rgba(0, 255, 0, 0.3)',      // 半透明绿色
  'Impacted': 'rgba(255, 0, 0, 0.3)',    // ���透明红色
  'Periapical': 'rgba(0, 0, 255, 0.3)',  // 半透明蓝色
  'Deep Caries': 'rgba(255, 153, 0, 0.3)'// 半透明橙色
};

const getToothNumbers = () => {
  const numbers = [];
  for (let quadrant = 1; quadrant <= 4; quadrant++) {
    for (let tooth = 1; tooth <= 8; tooth++) {
      numbers.push(`${quadrant}-${tooth}`);
    }
  }
  return numbers;
};

// 添加新的按钮组件
const AddDiseaseButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
  >
    追加
  </button>
);

export function UniversalNumberingSystem({ 
  highlightedTeeth = [], 
  diseaseTypes = {},
  onTeethUpdate 
}: UniversalNumberingSystemProps) {
  const objectRef = useRef<HTMLObjectElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [svgLoaded, setSvgLoaded] = useState(false);

  // 添加新状态来控制是否在添加额外疾病
  const [isAddingDisease, setIsAddingDisease] = useState(false);

  useEffect(() => {
    const object = objectRef.current;
    if (!object) return;

    const handleLoad = () => {
      setSvgLoaded(true);
      updateHighlights();
    };

    object.addEventListener('load', handleLoad);
    
    // 如果 SVG 已经加载，立即更新
    if (object.contentDocument?.querySelector('svg')) {
      setSvgLoaded(true);
      updateHighlights();
    }

    return () => {
      object.removeEventListener('load', handleLoad);
    };
  }, []);

const handleToothNumberChange = (oldNumber: string, newNumber: string) => {
  if (onTeethUpdate && selectedTooth) {
    const currentDiseaseType = Array.isArray(diseaseTypes[selectedTooth]) 
      ? (diseaseTypes[selectedTooth] as string[])[0]  // 如果是数组，使用第一个疾病类型
      : (diseaseTypes[selectedTooth] as string) || 'Normal';
    
    onTeethUpdate(selectedTooth, currentDiseaseType, 'Manual', newNumber);
    setSelectedTooth(null);
  }
};
  
  const updateHighlights = () => {
    const svgDoc = objectRef.current?.contentDocument;
    const svgElement = objectRef.current;
    if (!svgDoc || !svgElement) {
      console.log('SVG document or element not found'); // 添加调试日志
      return;
    }

    Object.entries(TOOTH_PATH_MAP).forEach(([toothNumber, pathId]) => {
      const path = svgDoc.getElementById(pathId);
      if (!path) {
        return;
      }

      // 确保移除旧的事件监听器
      const newPath = path.cloneNode(true);
      path.parentNode?.replaceChild(newPath, path);
      
      newPath.addEventListener('click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log(`Tooth clicked: ${toothNumber}`);

        const pathRect = (newPath as Element).getBoundingClientRect();
        const svgRect = svgElement.getBoundingClientRect();
        
        const popoverHeight = popoverRef.current?.offsetHeight || 200;
        const windowHeight = window.innerHeight;
        const TOP_MARGIN = 80; // 顶部留出更多空间
        const BOTTOM_MARGIN = 10;

        const menuX = svgRect.left + (pathRect.right - pathRect.left) - 180;
        
        // 计算菜单的 Y 坐标，确保顶部有足够空间
        let menuY = Math.max(
          pathRect.top + (pathRect.height / 2),
          TOP_MARGIN + popoverHeight / 2
        );

        // 检查底部边界
        if (menuY + popoverHeight / 2 > windowHeight - BOTTOM_MARGIN) {
          menuY = windowHeight - BOTTOM_MARGIN - popoverHeight / 2;
        }
        
        setSelectedTooth(toothNumber);
        setPopoverPosition({ x: menuX, y: menuY });
      });

      (newPath as HTMLElement).style.fill = 'transparent';
      (newPath as HTMLElement).style.cursor = 'pointer';
      (newPath as HTMLElement).style.pointerEvents = 'all';
    });

    // 应用高亮
    highlightedTeeth.forEach(tooth => {
      const pathId = TOOTH_PATH_MAP[tooth];
      if (pathId) {
        const path = svgDoc.getElementById(pathId);
        if (path) {
          const diseases = diseaseTypes[tooth];
          // 如果是数组，使用第一个疾病类型的颜色
          const diseaseType = Array.isArray(diseases) ? diseases[0] : diseases;
          path.style.fill = HIGHLIGHT_COLORS[diseaseType] || HIGHLIGHT_COLORS['Caries'];
          path.style.pointerEvents = 'all';
        }
      }
    });
  };
  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isInsidePopover = popoverRef.current?.contains(target);
      const isInsidePath = target.tagName === 'path';
      
      if (!isInsidePopover && !isInsidePath) {
        setSelectedTooth(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const object = objectRef.current;
    if (!object) return;

    const handleLoad = () => {
      updateHighlights();
    };

    object.addEventListener('load', handleLoad);
    
    if (object.contentDocument) {
      updateHighlights();
    }

    return () => {
      object.removeEventListener('load', handleLoad);
    };
  }, [highlightedTeeth, diseaseTypes]);

  const handleDiseaseSelect = (diseaseType: keyof typeof DISEASE_TYPES) => {
    if (selectedTooth && onTeethUpdate) {
      onTeethUpdate(
        selectedTooth, 
        diseaseType, 
        'Manual', 
        undefined, 
        isAddingDisease
      );
      setSelectedTooth(null);
      setIsAddingDisease(false);
    }
  };

  return (
    <div className="relative">
      <object
        ref={objectRef}
        data={universalNumberingSvg}
        type="image/svg+xml"
        className="w-full h-full"
        onLoad={() => {
          updateHighlights();
        }}
      />
      {selectedTooth && (
        <div
          ref={popoverRef}
          className="fixed z-50"
          style={{
            left: `${popoverPosition.x}px`,
            top: `${popoverPosition.y}px`,
            transform: 'translate(0, -50%)', // 确保垂直居中
            minWidth: '200px'
          }}
        >
          {/* 现在修改成包含下拉选择框的菜单 */}
          <div className="bg-white rounded-lg shadow-lg p-4 border">
            <div className="text-base font-medium mb-3 flex items-center gap-2">
              歯番号：
              <select
                value={selectedTooth}
                onChange={(e) => handleToothNumberChange(selectedTooth, e.target.value)}
                className="py-1 px-2 border rounded text-sm"
              >
                {getToothNumbers().map(num => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              {/* 只在有疾病时显示追加按钮 */}
              {diseaseTypes[selectedTooth] && 
               diseaseTypes[selectedTooth] !== 'Normal' && 
               !isAddingDisease && (
                <AddDiseaseButton onClick={() => setIsAddingDisease(true)} />
              )}
            </div>
            <div className="space-y-2">
              {Object.entries(DISEASE_TYPES).map(([key, label]) => {
                // 如果是没有疾病的牙齿，隐藏健全齿选项
                if (!diseaseTypes[selectedTooth] && key === 'Normal') {
                  return null;
                }

                // 在添加模式下，过滤掉已有的疾病和健全齿选项
                if (isAddingDisease) {
                  const currentDiseases = Array.isArray(diseaseTypes[selectedTooth])
                    ? diseaseTypes[selectedTooth] as string[]
                    : [diseaseTypes[selectedTooth]];

                  if (key === 'Normal' || currentDiseases.includes(key)) {
                    return null;
                  }
                }

                return (
                  <button
                    key={key}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded text-base"
                    onClick={() => handleDiseaseSelect(key as keyof typeof DISEASE_TYPES)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}