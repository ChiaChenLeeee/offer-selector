# 项目版本对比

## 🌐 访问地址

| 项目 | URL | 端口 |
|------|-----|------|
| 原始项目 | http://localhost:5173/ | 5173 |
| Notion 风格项目 | http://localhost:5174/ | 5174 |

## 🎨 设计风格对比

### 原始项目 (根目录)
- **配色**: 黑白色调，简洁风格
- **布局**: 内容在左侧，传统布局
- **导航**: 顶部或内联导航
- **卡片**: 简单的边框卡片
- **主题**: 极简主义

### Notion 风格项目 (job-offer-selector-3)
- **配色**: 紫色主题色 (#6366F1)
- **布局**: 左侧固定导航栏 + 主内容区
- **导航**: 左侧垂直导航栏（Offer 合集、打分规则、AI 解读、社区、我的）
- **卡片**: Notion 风格的圆角卡片，带阴影
- **主题**: 现代化、专业感

## ⚙️ 功能对比

| 功能 | 原始项目 | Notion 风格项目 |
|------|---------|----------------|
| Offer 管理 | ✅ | ✅ |
| 维度配置 | ✅ | ✅ |
| 评分计算 | ✅ | ✅ |
| 维度分类 | ✅ (3类) | ✅ (3类) |
| 用户认证 | ❌ | ✅ Supabase Magic Link |
| 云端存储 | ❌ | ✅ Supabase |
| 自动保存 | ❌ | ✅ (2秒防抖) |
| 本地存储 | ✅ | ✅ |
| 测试套件 | ✅ 完整 | ❌ |
| AI 解读 | ❌ | 🚧 占位 |
| 社区功能 | ❌ | 🚧 占位 |

## 📁 文件结构对比

### 原始项目
```
根目录/
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── DimensionManager.tsx
│   │   ├── OfferForm.tsx
│   │   ├── Ranker.tsx
│   │   └── ResultsView.tsx
│   ├── constants/
│   │   └── dimensions.ts
│   ├── store/
│   │   ├── context.tsx
│   │   └── reducer.ts
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── scoring.ts
│       └── storage.ts
├── tests/ (完整测试套件)
└── package.json
```

### Notion 风格项目
```
job-offer-selector-3/
├── src/
│   ├── App.tsx (单文件应用)
│   ├── components/
│   │   └── Ranker.tsx
│   ├── lib/
│   │   ├── auth.tsx
│   │   ├── database.ts
│   │   └── supabase.ts
│   ├── constants.ts
│   ├── types.ts
│   └── utils.ts
├── .env.local (Supabase 配置)
└── package.json
```

## 🔧 技术栈对比

| 技术 | 原始项目 | Notion 风格项目 |
|------|---------|----------------|
| React | ✅ | ✅ |
| TypeScript | ✅ | ✅ |
| Vite | ✅ | ✅ |
| Tailwind CSS | ✅ | ✅ |
| Lucide Icons | ✅ | ✅ |
| Context API | ✅ | ❌ (直接状态管理) |
| Supabase | ❌ | ✅ |
| Vitest | ✅ | ❌ |

## 💡 使用建议

### 选择原始项目，如果你需要：
- ✅ 简洁的黑白设计
- ✅ 完整的测试覆盖
- ✅ 传统的应用架构
- ✅ 纯本地存储（无需云端）

### 选择 Notion 风格项目，如果你需要：
- ✅ 现代化的 UI 设计
- ✅ 用户认证和多设备同步
- ✅ 云端数据存储
- ✅ 自动保存功能
- ✅ 为未来功能预留空间（AI、社区）

## 🚀 下一步

你可以：
1. **继续开发 Notion 风格项目** - 添加更多功能（AI 解读、社区等）
2. **合并两个项目** - 将测试套件迁移到 Notion 风格项目
3. **保持两个版本** - 一个用于生产，一个用于实验

## 📝 当前状态

- ✅ 两个项目都在运行
- ✅ 原始项目: http://localhost:5173/
- ✅ Notion 风格项目: http://localhost:5174/
- ✅ 所有功能正常工作
