import { useState, useMemo } from 'react';
import { Dimension, DimensionType, DimensionOption, DimensionCategory, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { 
  Check, Plus, ChevronDown, ChevronUp, AlertCircle, 
  Trash2, Edit2, Sliders
} from 'lucide-react';

interface DimensionManagerProps {
  dimensions: Dimension[];
  onToggle: (id: string) => void;
  onAddCustom: (dim: Dimension) => void;
  onRemoveCustom: (id: string) => void;
  onUpdateDimension: (id: string, updates: Partial<Dimension>) => void;
}

const DimensionManager: React.FC<DimensionManagerProps> = ({ 
  dimensions, onToggle, onRemoveCustom, onUpdateDimension 
}) => {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [editingOption, setEditingOption] = useState<{ dimId: string, optValue: string, label: string } | null>(null);

  const calculateAutoScores = (options: DimensionOption[], isPenalty: boolean): DimensionOption[] => {
    const m = options.length;
    if (m === 0) return [];
    if (m === 1) return [{ ...options[0], score: isPenalty ? -100 : 100 }];

    return options.map((opt, index) => {
      const score = isPenalty 
        ? Math.round(-100 * (m - 1 - index) / (m - 1))
        : Math.round(100 * (m - 1 - index) / (m - 1));
      return { ...opt, score };
    });
  };

  const handleAddOption = (dimId: string) => {
    if (!newOptionLabel.trim()) return;
    const dim = dimensions.find(d => d.id === dimId);
    if (!dim || !dim.options) return;

    const newOptions = [...dim.options, { 
      label: newOptionLabel.trim(), 
      value: `opt_${Date.now()}`, 
      score: 0 
    }];
    
    onUpdateDimension(dimId, { 
      options: calculateAutoScores(newOptions, !!dim.isPenalty) 
    });
    setNewOptionLabel('');
  };

  const handleRemoveOption = (dimId: string, optValue: string) => {
    const dim = dimensions.find(d => d.id === dimId);
    if (!dim || !dim.options) return;

    const newOptions = dim.options.filter(o => o.value !== optValue);
    onUpdateDimension(dimId, { 
      options: calculateAutoScores(newOptions, !!dim.isPenalty) 
    });
  };

  const handleReorderOptions = (dimId: string, fromIndex: number, toIndex: number) => {
    const dim = dimensions.find(d => d.id === dimId);
    if (!dim || !dim.options) return;

    const newOptions = [...dim.options];
    const [removed] = newOptions.splice(fromIndex, 1);
    newOptions.splice(toIndex, 0, removed);
    
    onUpdateDimension(dimId, { 
      options: calculateAutoScores(newOptions, !!dim.isPenalty) 
    });
  };

  const handleSaveOptionLabel = () => {
    if (!editingOption || !editingOption.label.trim()) return;
    const dim = dimensions.find(d => d.id === editingOption.dimId);
    if (!dim || !dim.options) return;

    const newOptions = dim.options.map(o => 
      o.value === editingOption.optValue ? { ...o, label: editingOption.label.trim() } : o
    );
    onUpdateDimension(editingOption.dimId, { options: newOptions });
    setEditingOption(null);
  };

  // 按分类分组
  const dimensionsByCategory = useMemo(() => {
    const result: Record<DimensionCategory, Dimension[]> = {
      objective: [],
      subjective: [],
      personal: []
    };
    dimensions.forEach(dim => {
      result[dim.category].push(dim);
    });
    return result;
  }, [dimensions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {(['objective', 'subjective', 'personal'] as const).map(category => (
        <CategoryCard
          key={category}
          category={category}
          dimensions={dimensionsByCategory[category]}
          expandedDim={expandedDim}
          onToggle={onToggle}
          onRemoveCustom={onRemoveCustom}
          onExpandDim={setExpandedDim}
          onUpdateDimension={onUpdateDimension}
          newOptionLabel={newOptionLabel}
          setNewOptionLabel={setNewOptionLabel}
          editingOption={editingOption}
          setEditingOption={setEditingOption}
          handleAddOption={handleAddOption}
          handleRemoveOption={handleRemoveOption}
          handleReorderOptions={handleReorderOptions}
          handleSaveOptionLabel={handleSaveOptionLabel}
          calculateAutoScores={calculateAutoScores}
        />
      ))}
    </div>
  );
};

interface CategoryCardProps {
  category: DimensionCategory;
  dimensions: Dimension[];
  expandedDim: string | null;
  onToggle: (id: string) => void;
  onRemoveCustom: (id: string) => void;
  onExpandDim: (id: string | null) => void;
  onUpdateDimension: (id: string, updates: Partial<Dimension>) => void;
  newOptionLabel: string;
  setNewOptionLabel: (label: string) => void;
  editingOption: { dimId: string, optValue: string, label: string } | null;
  setEditingOption: (option: { dimId: string, optValue: string, label: string } | null) => void;
  handleAddOption: (dimId: string) => void;
  handleRemoveOption: (dimId: string, optValue: string) => void;
  handleReorderOptions: (dimId: string, fromIndex: number, toIndex: number) => void;
  handleSaveOptionLabel: () => void;
  calculateAutoScores: (options: DimensionOption[], isPenalty: boolean) => DimensionOption[];
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  dimensions,
  expandedDim,
  onToggle,
  onRemoveCustom,
  onExpandDim,
  onUpdateDimension,
  newOptionLabel,
  setNewOptionLabel,
  editingOption,
  setEditingOption,
  handleAddOption,
  handleRemoveOption,
  handleReorderOptions,
  handleSaveOptionLabel
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showAddDimension, setShowAddDimension] = useState(false);
  const [newDimName, setNewDimName] = useState('');
  const [newDimType, setNewDimType] = useState<DimensionType>('select');
  const [isPenalty, setIsPenalty] = useState(false);
  const colors = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];

  const visibleDimensions = expanded ? dimensions : dimensions.slice(0, 3);
  const hasMore = dimensions.length > 3;

  const handleAddNewDimension = () => {
    if (!newDimName.trim()) return;

    const newDim: Dimension = {
      id: `custom_${Date.now()}`,
      name: newDimName.trim(),
      type: newDimType,
      category: category,
      isDefault: false,
      active: true,
      isPenalty: isPenalty,
      options: (newDimType === 'select' || newDimType === 'location') ? [
        { label: '符合预期', value: 'good', score: 100 },
        { label: '一般', value: 'medium', score: 60 },
        { label: '不符合预期', value: 'bad', score: 20 }
      ] : undefined
    };

    onUpdateDimension(newDim.id, newDim);
    setNewDimName('');
    setNewDimType('select');
    setIsPenalty(false);
    setShowAddDimension(false);
  };

  const renderDimensionItem = (dim: Dimension) => {
    const hasOptions = (dim.type === 'select' || dim.type === 'location') && dim.options && dim.options.length > 0;
    const isExpanded = expandedDim === dim.id;

    return (
      <div key={dim.id} className="space-y-2">
        <div className={`flex items-center justify-between p-2 rounded-lg transition-all ${dim.active ? colors.light : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => onToggle(dim.id)}
              className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                dim.active ? `${colors.bg} text-white` : 'bg-gray-200 text-gray-400'
              }`}
            >
              {dim.active && <Check className="w-3 h-3" />}
            </button>
            <span className={`text-xs font-medium flex items-center gap-1 ${dim.isPenalty ? 'text-rose-700' : 'text-gray-700'}`}>
              {dim.isPenalty && <AlertCircle className="w-3 h-3" />}
              {dim.name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {hasOptions && (
              <button
                onClick={() => onExpandDim(isExpanded ? null : dim.id)}
                className={`p-1 rounded transition-colors ${isExpanded ? colors.text : 'text-gray-300 hover:text-gray-500'}`}
              >
                <Sliders className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => {
                if (confirm(`确定要删除"${dim.name}"吗？`)) {
                  onRemoveCustom(dim.id);
                }
              }}
              className="p-1 text-gray-300 hover:text-red-500 transition-colors"
              title="删除维度"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {isExpanded && hasOptions && (
          <div className={`p-3 rounded-lg ${dim.isPenalty ? 'bg-rose-50' : colors.light} space-y-2`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${dim.isPenalty ? 'text-rose-600' : colors.text}`}>
              子选项管理
            </p>
            
            <div className="space-y-1.5">
              {dim.options?.map((opt, index) => (
                <div key={opt.value} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100 group/opt">
                  <div className="flex flex-col gap-0.5 text-gray-300">
                    <button 
                      onClick={() => handleReorderOptions(dim.id, index, index - 1)} 
                      disabled={index === 0} 
                      className={`hover:${colors.text} disabled:opacity-0 transition-opacity`}
                    >
                      <ChevronUp className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      onClick={() => handleReorderOptions(dim.id, index, index + 1)} 
                      disabled={index === (dim.options?.length || 0) - 1} 
                      className={`hover:${colors.text} disabled:opacity-0 transition-opacity`}
                    >
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    {editingOption?.optValue === opt.value ? (
                      <input 
                        type="text"
                        autoFocus
                        value={editingOption.label}
                        onChange={(e) => setEditingOption({ ...editingOption, label: e.target.value })}
                        onBlur={handleSaveOptionLabel}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveOptionLabel()}
                        className={`flex-1 text-xs font-bold text-gray-700 bg-gray-50 border ${colors.border} rounded px-2 py-1 outline-none mr-2`}
                      />
                    ) : (
                      <span 
                        className={`text-xs font-bold text-gray-700 truncate cursor-pointer hover:${colors.text} flex items-center gap-1`}
                        onClick={() => setEditingOption({ dimId: dim.id, optValue: opt.value, label: opt.label })}
                      >
                        {opt.label}
                        <Edit2 className="w-2 h-2 opacity-0 group-hover/opt:opacity-100 transition-opacity" />
                      </span>
                    )}
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${opt.score < 0 ? 'bg-rose-100 text-rose-600' : `${colors.light} ${colors.text}`}`}>
                        {opt.score > 0 ? `+${opt.score}` : opt.score}
                      </span>
                      <button 
                        onClick={() => handleRemoveOption(dim.id, opt.value)}
                        className="p-0.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/opt:opacity-100"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-1.5 mt-2">
              <input 
                type="text"
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddOption(dim.id)}
                placeholder="新增选项..."
                className={`flex-1 text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:${colors.border}`}
              />
              <button 
                onClick={() => handleAddOption(dim.id)}
                className={`${colors.bg} text-white p-1.5 rounded-lg hover:opacity-90`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg p-5 border ${colors.border} flex flex-col`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${colors.bg}`}></div>
        <h3 className={`text-sm font-semibold ${colors.text}`}>{label}</h3>
        <span className="text-xs text-gray-400">({dimensions.length})</span>
        <button
          onClick={() => setShowAddDimension(!showAddDimension)}
          className={`ml-auto p-1 rounded transition-colors ${showAddDimension ? colors.bg + ' text-white' : 'text-gray-300 hover:' + colors.text}`}
          title="添加新维度"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showAddDimension && (
        <div className={`mb-4 p-3 rounded-lg ${colors.light} space-y-2`}>
          <input
            type="text"
            value={newDimName}
            onChange={(e) => setNewDimName(e.target.value)}
            placeholder="维度名称..."
            className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-purple-400"
          />
          <div className="flex gap-2">
            <select
              value={newDimType}
              onChange={(e) => setNewDimType(e.target.value as DimensionType)}
              className="flex-1 text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg outline-none"
            >
              <option value="select">单选</option>
              <option value="numeric">数值</option>
              <option value="slider">滑动条</option>
              <option value="location">地点</option>
            </select>
            <label className="flex items-center gap-1 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={isPenalty}
                onChange={(e) => setIsPenalty(e.target.checked)}
                className="rounded"
              />
              扣分项
            </label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddNewDimension}
              className={`flex-1 ${colors.bg} text-white text-xs py-1.5 rounded-lg hover:opacity-90 font-medium`}
            >
              添加
            </button>
            <button
              onClick={() => {
                setShowAddDimension(false);
                setNewDimName('');
                setIsPenalty(false);
              }}
              className="px-3 text-xs text-gray-500 hover:text-gray-700"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {visibleDimensions.map(dim => renderDimensionItem(dim))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full mt-3 py-1.5 text-xs font-medium ${colors.text} hover:${colors.light} rounded transition-colors`}
        >
          {expanded ? '收起' : `展开全部 (${dimensions.length - 3})`}
        </button>
      )}
    </div>
  );
};

export default DimensionManager;
