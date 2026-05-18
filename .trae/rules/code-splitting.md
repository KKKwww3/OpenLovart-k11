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
└── 模块目录名/               # 小驼峰，如 billPdfGenerator、useOrderAccounting
    ├── index.js              # barrel 入口，纯 re-export（不写业务逻辑）
    ├── 功能A.js              # 单一职责，文件名描述功能
    ├── 功能B.js
    └── utils.js              # 本模块内部工具函数
```

**规则**：
- 目录名 = 原文件名去掉扩展名（`FooBar.js` → `FooBar/`）
- 入口文件 **必须** 叫 `index.js`，只能包含 `export { ... } from '...'` 语句
- 子文件命名描述功能：`computeFee.js` / `buildHtml.js` / `generatePdf.js`
- 工具函数放在 `utils.js`，不要继续拆子目录

### 三、命名约定

| 类别 | 命名 | 示例 |
|------|------|------|
| 纯计算逻辑 | `computeXxx.js` | `computeFee.js` |
| HTML/模板构建 | `buildXxx.js` | `buildHtml.js` |
| 导出/下载 | `generateXxx.js` | `generateImage.js` / `generatePdf.js` |
| 工具函数 | `utils.js` | `utils.js` |
| Hook 拆分 | `useXxx.js` | `useSettlement.js` |

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
4. **调整 import** — 子文件间用相对路径 `./xxx`，外部依赖保持在各自文件顶部
5. **创建 `index.js`** — 纯 re-export
6. **删除原文件**
7. **验证** — 外部引用 `import from './旧文件名'` 路径不变，ESLint 零错误

### 六、反向示例（不要这样做）

```
❌ FooBar.js + FooBar/ 共存        # 歧义，编辑器/bundler 可能混乱
❌ FooBar/main.js 作为入口          # 不符合 bundler 默认解析规则
❌ index.js 中包含 import + 业务代码 # 入口应保持纯 re-export
❌ 子目录再拆子子目录               # 嵌套过深，扁平目录优先
```
