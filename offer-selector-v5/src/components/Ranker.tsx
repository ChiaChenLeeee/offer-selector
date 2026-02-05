import { useState } from 'react';
import { Dimension, CATEGORY_COLORS } from '../types';
import { GripVertical, ArrowUp, ArrowDown, Award, AlertCircle } from 'lucide-react';

interface RankerProps {
  activeDimensions: Dimension[];
  onReorder: (ids: string[]) => void;
  weights: Record<string, number>;
}

const Ranker: React.FC<RankerProps> = ({ activeDimensions, onReorder, weights }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const move = (index: number, direction: 'up' | 'down') => {
    const newOrder = activeDimensions.map(d => d.id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    onReorder(newOrder);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const target = e.target as HTMLElement;
    target.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newOrderIds = activeDimensions.map(d => d.id);
    const [removed] = newOrderIds.splice(draggedIndex, 1);
    newOrderIds.splice(targetIndex, 0, removed);
    
    onReorder(newOrderIds);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
        <Award className="w-5 h-5 text-purple-600" /> 评分重要度排序
      </h3>
      <p className="text-sm text-gray-400 mb-6">位置越靠前，该项对最终评分的影响越大。支持拖拽排序。</p>

      <div className="space-y-2">
        {activeDimensions.map((dim, index) => (
          <div
            key={dim.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move group ${
              dragOverIndex === index ? 'border-purple-400 bg-purple-50 shadow-inner scale-[1.02]' : 'border-gray-100 hover:bg-white hover:border-purple-100'
            } ${draggedIndex === index ? 'opacity-40' : 'opacity-100'} ${dim.isPenalty ? 'bg-rose-50/30' : CATEGORY_COLORS[dim.category].light}`}
          >
            <div className={`w-1.5 h-8 rounded-full ${dim.isPenalty ? 'bg-rose-400' : CATEGORY_COLORS[dim.category].bg}`}></div>
            <div className={`text-gray-300 transition-colors ${dim.isPenalty ? 'group-hover:text-rose-400' : `group-hover:${CATEGORY_COLORS[dim.category].text}`}`}>
              <GripVertical className="w-5 h-5" />
            </div>

            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); move(index, 'up'); }}
                disabled={index === 0}
                className={`p-0.5 hover:text-purple-600 disabled:opacity-0 transition-all ${dim.isPenalty ? 'hover:text-rose-600' : ''}`}
                title="上移"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); move(index, 'down'); }}
                disabled={index === activeDimensions.length - 1}
                className={`p-0.5 hover:text-purple-600 disabled:opacity-0 transition-all ${dim.isPenalty ? 'hover:text-rose-600' : ''}`}
                title="下移"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium flex items-center gap-1.5 ${dim.isPenalty ? 'text-rose-700' : 'text-gray-800'}`}>
                  {dim.isPenalty && <AlertCircle className="w-3.5 h-3.5" />}
                  {dim.name}
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dim.isPenalty ? 'text-rose-600 bg-rose-100' : `${CATEGORY_COLORS[dim.category].text} ${CATEGORY_COLORS[dim.category].light}`}`}>
                  {(weights[dim.id] * 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${dim.isPenalty ? 'bg-rose-500' : CATEGORY_COLORS[dim.category].bg}`}
                  style={{ width: `${weights[dim.id] * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
        <p className="text-xs text-gray-500 leading-relaxed text-center italic">
          排名第 i 位的权重 = (n - i + 1) / [n(n+1)/2]
        </p>
      </div>
    </div>
  );
};

export default Ranker;
