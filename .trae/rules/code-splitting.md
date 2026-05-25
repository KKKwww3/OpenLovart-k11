---
alwaysApply: false
description: 代码文件拆分的触发条件、目录结构、命名约定和改造流程
scene: code_split
---

## 代码模块拆分规范

### 一、触发拆分的条件

当单个文件满足以下 **任一** 条件时，应当拆分为目录模块：

1. **行数超过 250 行** — 单文件过长不利于定位和 review
2. **职责混合 ≥ 3 种** — 如：费率计算 + HTML 模板 + PNG 导出 + PDF 导出 混在一个文件
3. **需要独立维护** — 某部分逻辑可能被多个组件复用，或需要单独迭代优化

### 二、拆分后的目录结构（行业标准：`index.js` 桶模式）

```
component/
└── 模块目录名/                   # 小驼峰，如 billPdfGenerator、useOrderAccounting
    ├── index.js                  # barrel 入口，纯 re-export（不写业务逻辑）
    ├── 编制器.js                 # 主组件/编排器，保留 state 和 hooks 调用
    ├── 功能A.js                  # 单一职责逻辑文件（hook / 计算 / 工具）
    ├── 功能B.js
    ├── utils.js                  # 本模块内部工具函数
    └── components/               # [可选] UI 子组件目录（仅一层，不放逻辑文件）
        ├── SubHeader.js          # 表现层子组件，PascalCase 命名
        └── SubBody.js
```

**规则**：
- 目录名 = 原文件名去掉扩展名（`FooBar.js` → `FooBar/`）
- 入口文件 **必须** 叫 `index.js`，只能包含 `export { ... } from '...'` 语句
- **`components/` 子目录**：当模块有 ≥ 3 个 UI 表现层子组件时，可创建 `components/` 目录集中管理，与 hooks / 逻辑文件分层
- 逻辑文件（hooks、计算、工具）放在模块根层，**不要放入 `components/`**，保持 `components/` 的纯表现层定位
- **`components/` 只能有一层**，不能再往下拆子目录（如 `components/header/` ❌）
- 工具函数放在 `utils.js`，不要继续拆子目录

### 三、命名约定

| 类别 | 命名 | 示例 |
|------|------|------|
| 纯计算逻辑 | `computeXxx.js` | `computeFee.js` |
| HTML/模板构建 | `buildXxx.js` | `buildHtml.js` |
| 导出/下载 | `generateXxx.js` | `generateImage.js` / `generatePdf.js` |
| 工具函数 | `utils.js` | `utils.js` |
| Hook 拆分 | `useXxx.js` | `useSettlement.js` |
| UI 子组件 | PascalCase `.js` | `ExpandRowHeader.js` / `OrderTable.js` |

### 四、入口文件 `index.js` 模板

```js
export { computeFeeResults } from './computeFee';
export { buildBillHtml } from './buildHtml';
export { generateBillImage } from './generateImage';
export { generateBillPdfText } from './generatePdf';
```

**禁止在 `index.js` 中写 import 逻辑或函数体**，只能是 re-export。

### 五、改造步骤

1. **分析职责** — 标注文件中每段代码属于哪类功能
2. **创建目录** — 在原文件同级创建同名目录
3. **逐个提取** — 按功能创建子文件，确保每个文件只依赖自己的 import
4. **分类归位** — UI 子组件放入 `components/`（若有），hooks/逻辑文件放入模块根层
5. **调整 import** — 子文件间用相对路径 `./xxx` 或 `./components/Xxx`，外部依赖保持在各自文件顶部
6. **创建 `index.js`** — 纯 re-export
7. **删除原文件**
8. **验证** — 外部引用 `import from './旧文件名'` 路径不变，ESLint 零错误

### 六、反向示例（不要这样做）

```
❌ FooBar.js + FooBar/ 共存          # 歧义，编辑器/bundler 可能混乱
❌ FooBar/main.js 作为入口            # 不符合 bundler 默认解析规则
❌ index.js 中包含 import + 业务代码   # 入口应保持纯 re-export
❌ components/ 下再拆子子目录          # 嵌套过深，components/ 只能一层
❌ 逻辑 hook 放入 components/ 中       # components/ 仅放纯 UI 表现组件
❌ 根层同时保留原大文件和已拆分目录     # 拆分完成后必须删除原文件
```
