import { useState, useRef, useEffect } from 'react';
import { Offer, Dimension, SalaryData, LocationData } from '../types';
import { Trash2, Edit3, X, Calculator, AlertCircle, HelpCircle, ChevronDown, Save } from 'lucide-react';

interface OfferCardProps {
  offer: Offer;
  dimensions: Dimension[];
  score: number;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (id: string, updates: Partial<Offer>) => void;
  onDelete: (id: string) => void;
  onCancelEdit: () => void;
}

const OfferCard: React.FC<OfferCardProps> = ({ 
  offer, dimensions, score, isEditing, onEdit, onUpdate, onDelete, onCancelEdit 
}) => {
  const [showFormula, setShowFormula] = useState(false);
  const [localValues, setLocalValues] = useState(offer.values);
  const [hasChanges, setHasChanges] = useState(false);

  // 当进入编辑模式时，重置本地状态
  useEffect(() => {
    if (isEditing) {
      setLocalValues(offer.values);
      setHasChanges(false);
    }
  }, [isEditing, offer.values]);

  const handleValueChange = (dimId: string, value: any) => {
    setLocalValues(prev => ({ ...prev, [dimId]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(offer.id, { values: localValues });
    setHasChanges(false);
    onCancelEdit();
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('有未保存的修改，确定要放弃吗？')) {
        setLocalValues(offer.values);
        setHasChanges(false);
        onCancelEdit();
      }
    } else {
      onCancelEdit();
    }
  };

  const companyName = offer.values['company'] || '未命名公司';
  const jobTitle = offer.values['jobTitle'] || '未命名岗位';
  const salaryData = offer.values['salary'] as SalaryData;
  const yearSalary = salaryData 
    ? ((salaryData.monthly || 0) * (salaryData.months || 0) + (salaryData.bonus || 0)) / 10000
    : 0;

  if (!isEditing) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
              {score.toFixed(1)}
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{companyName}</h3>
            <p className="text-sm text-gray-600">{jobTitle}</p>
            {yearSalary > 0 && (
              <p className="text-sm text-purple-600 font-medium mt-2">¥{yearSalary.toFixed(1)}万/年</p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
              title="编辑"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(offer.id)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border-2 border-purple-300 shadow-lg">
      {/* Unsaved Warning at Top */}
      {hasChanges && (
        <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-700">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>有未保存的修改</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl font-bold text-purple-600">{score.toFixed(1)}</span>
            <button 
              onClick={() => setShowFormula(!showFormula)}
              className="text-xs text-purple-500 hover:text-purple-600 flex items-center gap-1"
            >
              <Calculator className="w-3 h-3" />
              {showFormula ? '隐藏' : '公式'}
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleSave}
              className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium"
            >
              <Save className="w-3 h-3" />
              保存
            </button>
            <button
              onClick={handleCancel}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              取消
            </button>
          </div>
          {showFormula && (
            <div className="mb-3 p-2 bg-purple-50 rounded text-[10px] text-gray-600 leading-relaxed">
              <p className="font-semibold mb-1">计算公式：</p>
              <p>总分 = Σ(维度分数 × 权重)</p>
            </div>
          )}
        </div>
        <button
          onClick={handleCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {/* Company Name */}
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">公司名称 *</label>
          <input
            type="text"
            value={localValues['company'] || ''}
            onChange={e => handleValueChange('company', e.target.value)}
            placeholder="输入公司名称"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-purple-400"
          />
        </div>

        {/* Job Title */}
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">岗位名称 *</label>
          <input
            type="text"
            value={localValues['jobTitle'] || ''}
            onChange={e => handleValueChange('jobTitle', e.target.value)}
            placeholder="输入岗位名称"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-purple-400"
          />
        </div>

        {/* Dimensions */}
        {dimensions.map(dim => (
          <DimensionInput
            key={dim.id}
            dimension={dim}
            value={localValues[dim.id]}
            onChange={(value) => handleValueChange(dim.id, value)}
          />
        ))}
      </div>
    </div>
  );
};

interface DimensionInputProps {
  dimension: Dimension;
  value: any;
  onChange: (value: any) => void;
}

const DimensionInput: React.FC<DimensionInputProps> = ({ dimension, value, onChange }) => {
  const { type, name, options, isPenalty, description } = dimension;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`p-3 rounded-lg ${isPenalty ? 'bg-rose-50' : 'bg-gray-50'}`}>
      <label className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${isPenalty ? 'text-rose-700' : 'text-gray-700'}`}>
        {isPenalty && <AlertCircle className="w-3.5 h-3.5" />}
        {name}
        {isPenalty && <span className="text-[10px] bg-rose-200 text-rose-700 px-1 rounded">扣分</span>}
        {description && (
          <div className="group/tip relative">
            <HelpCircle className="w-3.5 h-3.5 text-gray-300" />
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-gray-800 text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-10">
              {description}
            </div>
          </div>
        )}
      </label>

      {type === 'salary' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-gray-500 block mb-1">月薪(元)</span>
              <input
                type="number"
                value={(value as SalaryData)?.monthly || ''}
                onChange={e => onChange({ ...value, monthly: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block mb-1">月数</span>
              <input
                type="number"
                value={(value as SalaryData)?.months || ''}
                onChange={e => onChange({ ...value, months: Number(e.target.value) })}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
              />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block mb-1">奖金(元)</span>
            <input
              type="number"
              value={(value as SalaryData)?.bonus || ''}
              onChange={e => onChange({ ...value, bonus: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
            />
          </div>
        </div>
      )}

      {type === 'location' && (
        <div className="space-y-2">
          <input
            type="text"
            value={(value as LocationData)?.city || ''}
            onChange={e => onChange({ ...(value || {}), city: e.target.value })}
            placeholder="输入城市"
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
          />
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full px-3 py-1.5 text-sm border rounded-lg flex items-center justify-between ${
                (value as LocationData)?.preference
                  ? 'border-purple-300 bg-white text-gray-900'
                  : 'border-gray-200 bg-white text-gray-400'
              }`}
            >
              <span>
                {options?.find(opt => opt.value === (value as LocationData)?.preference)?.label || '选择符合程度'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {isOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {options?.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange({ ...(value || {}), preference: opt.value });
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-purple-50 transition-colors ${
                      (value as LocationData)?.preference === opt.value
                        ? 'bg-purple-50 text-purple-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {type === 'select' && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-3 py-2 text-sm border rounded-lg flex items-center justify-between ${
              value
                ? isPenalty
                  ? 'border-rose-300 bg-white text-gray-900'
                  : 'border-purple-300 bg-white text-gray-900'
                : 'border-gray-200 bg-white text-gray-400'
            }`}
          >
            <span>
              {options?.find(opt => opt.value === value)?.label || '请选择'}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {options?.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-purple-50 transition-colors ${
                    value === opt.value
                      ? isPenalty
                        ? 'bg-rose-50 text-rose-700 font-medium'
                        : 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {type === 'numeric' && (
        <input
          type="number"
          value={value || ''}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
        />
      )}

      {type === 'slider' && (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            value={value || 50}
            onChange={e => onChange(Number(e.target.value))}
            className={isPenalty ? 'flex-1 accent-rose-600' : 'flex-1 accent-purple-600'}
          />
          <span className="text-sm font-semibold text-gray-700 w-10 text-center">{value || 50}</span>
        </div>
      )}
    </div>
  );
};

export default OfferCard;
