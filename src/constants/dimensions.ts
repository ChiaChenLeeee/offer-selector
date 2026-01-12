import { Dimension } from '../types';

export const DEFAULT_DIMENSIONS: Dimension[] = [
  {
    id: 'company',
    name: '公司名称',
    type: 'text',
    isDefault: true,
    active: true
  },
  {
    id: 'jobTitleValue',
    name: '岗位title价值打分',
    type: 'select',
    isDefault: true,
    active: true,
    description: '1-5分，分值越高代表岗位Title或背书价值越高',
    options: [
      { label: '5分', value: '5', score: 100 },
      { label: '4分', value: '4', score: 80 },
      { label: '3分', value: '3', score: 60 },
      { label: '2分', value: '2', score: 40 },
      { label: '1分', value: '1', score: 20 }
    ]
  },
  {
    id: 'location',
    name: '工作地点',
    type: 'location',
    isDefault: true,
    active: true,
    description: '输入城市名称并选择符合程度',
    options: [
      { label: '符合预期', value: 'met', score: 100 },
      { label: '无所谓', value: 'indifferent', score: 50 },
      { label: '不符合预期', value: 'unmet', score: 20 }
    ]
  },
  {
    id: 'salary',
    name: '薪酬待遇',
    type: 'salary',
    isDefault: true,
    active: true
  },
  {
    id: 'isCore',
    name: '业务是否核心',
    type: 'select',
    isDefault: true,
    active: true,
    options: [
      { label: '是', value: 'yes', score: 100 },
      { label: '否', value: 'no', score: 30 },
      { label: '不确定', value: 'unsure', score: 50 }
    ]
  },
  {
    id: 'workload',
    name: '上班时长',
    type: 'workload',
    isDefault: true,
    active: true
  },
  {
    id: 'pua',
    name: '老板是否经常PUA',
    type: 'select',
    isDefault: true,
    active: true,
    isPenalty: true,
    options: [
      { label: '是', value: 'yes', score: -100 },
      { label: '不确定', value: 'unsure', score: -50 },
      { label: '否', value: 'no', score: 0 }
    ]
  }
];

export const OPTIONAL_DIMENSIONS: Dimension[] = [
  {
    id: 'abilityImprovement',
    name: '是否能持续有能力提升',
    type: 'select',
    isDefault: false,
    active: false,
    options: [
      { label: '很大', value: 'high', score: 100 },
      { label: '一般', value: 'medium', score: 60 },
      { label: '几乎没有', value: 'none', score: 20 },
      { label: '不确定', value: 'unsure', score: 50 }
    ]
  },
  {
    id: 'mainJobEmpowersSide',
    name: '主业是否赋能未来的副业',
    type: 'select',
    isDefault: false,
    active: false,
    options: [
      { label: '非常有帮助', value: 'v_high', score: 100 },
      { label: '有一定帮助', value: 'high', score: 70 },
      { label: '完全没关系', value: 'none', score: 20 },
      { label: '不确定', value: 'unsure', score: 50 }
    ]
  },
  {
    id: 'annualLeave',
    name: '年假',
    type: 'numeric',
    isDefault: false,
    active: false,
    description: '输入天数'
  },
  {
    id: 'leadership',
    name: '领导风格',
    type: 'select',
    isDefault: false,
    active: false,
    options: [
      { label: '适合自己', value: 'fit', score: 100 },
      { label: '不适合自己', value: 'unfit', score: 20 },
      { label: '不知道', value: 'unknown', score: 50 }
    ]
  },
  {
    id: 'atmosphere',
    name: '团队氛围',
    type: 'select',
    isDefault: false,
    active: false,
    options: [
      { label: '适合自己', value: 'fit', score: 100 },
      { label: '不适合自己', value: 'unfit', score: 20 },
      { label: '不知道', value: 'unknown', score: 50 }
    ]
  },
  {
    id: 'outlook',
    name: '业务前景',
    type: 'select',
    isDefault: false,
    active: false,
    options: [
      { label: '发展期', value: 'growth', score: 100 },
      { label: '成熟停滞期', value: 'mature', score: 60 },
      { label: '业务下滑', value: 'decline', score: 20 },
      { label: '不确定', value: 'unsure', score: 50 }
    ]
  },
  {
    id: 'turnover',
    name: '组内离职情况',
    type: 'numeric',
    isDefault: false,
    active: false,
    description: '半年内离职人数'
  },
  {
    id: 'promotion',
    name: '晋升机会',
    type: 'select',
    isDefault: false,
    active: false,
    options: [
      { label: '上升空间大', value: 'high', score: 100 },
      { label: '能晋升但比较慢', value: 'slow', score: 70 },
      { label: '基本不能晋升', value: 'none', score: 30 },
      { label: '不确定', value: 'unsure', score: 50 }
    ]
  },
  {
    id: 'salaryIncrease',
    name: '每年调薪幅度',
    type: 'numeric',
    isDefault: false,
    active: false,
    description: '输入百分比，10%为满分'
  },
  {
    id: 'exitDifficulty',
    name: '后续是否便于跳槽',
    type: 'select',
    isDefault: false,
    active: false,
    options: [
      { label: '是', value: 'yes', score: 100 },
      { label: '否', value: 'no', score: 0 },
      { label: '不确定', value: 'unsure', score: 50 }
    ]
  },
  {
    id: 'sideHustle',
    name: '是否有时间做副业',
    type: 'select',
    isDefault: false,
    active: false,
    options: [
      { label: '是', value: 'yes', score: 100 },
      { label: '否', value: 'no', score: 0 },
      { label: '不确定', value: 'unsure', score: 50 }
    ]
  },
  {
    id: 'personalTime',
    name: '个人娱乐时间',
    type: 'select',
    isDefault: false,
    active: false,
    options: [
      { label: '有', value: 'yes', score: 100 },
      { label: '没有', value: 'no', score: 0 },
      { label: '不确定', value: 'unsure', score: 50 }
    ]
  }
];
