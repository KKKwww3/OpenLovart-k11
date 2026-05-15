# Lovart UI - Supabase 集成设置指南（内部版本）

本指南将帮助你完成 Lovart UI 项目的 Supabase 数据库集成。

## 📋 前置要求

- Node.js 18+ 已安装
- npm 或 yarn 包管理器
- 一个 Supabase 账号（免费）

---

## 🗄️ 步骤 1: 设置 Supabase 数据库

### 1.1 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - Name: `lovart-ui` (或你喜欢的名称)
   - Database Password: 设置一个强密码（保存好！）
   - Region: 选择离你最近的区域
4. 等待项目创建完成（约 2-3 分钟）

### 1.2 获取 Supabase API 密钥

在 Supabase Dashboard 的 **Settings > API** 页面，复制：

- **Project URL**
- **anon public** key

### 1.3 运行数据库迁移

1. 在 Supabase Dashboard，进入 **SQL Editor**
2. 打开项目根目录的 `supabase-schema.sql` 文件
3. 复制所有内容
4. 粘贴到 Supabase SQL Editor
5. 点击 **Run** 执行 SQL

这将创建以下表：
- `projects` - 存储项目
- `canvas_elements` - 存储画布元素数据
- `user_credits` - 存储用户积分

并且会自动设置好 **行级安全（RLS）策略**（内部使用模式，允许所有 anon 访问）。

---

## 🔧 步骤 2: 配置环境变量

### 2.1 创建 `.env.local` 文件

在项目根目录创建 `.env.local` 文件（如果不存在）：

```bash
# 复制 .env.example 文件
cp .env.example .env.local
```

### 2.2 填写环境变量

编辑 `.env.local` 文件，填入你的密钥：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx

# Google Gemini AI (如果已有)
GEMINI_API_KEY=your_gemini_api_key

# X.AI Grok API (可选)
XAI_API_KEY=your_xai_api_key
```

⚠️ **重要提示**：
- 不要把 `.env.local` 提交到 Git
- 确保 `.gitignore` 包含 `.env.local`
- 所有以 `NEXT_PUBLIC_` 开头的变量会暴露到客户端

---

## 🚀 步骤 3: 启动项目

### 3.1 安装依赖（如果还没安装）

```bash
npm install
```

### 3.2 启动开发服务器

```bash
npm run dev
```

### 3.3 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

---

## ✅ 步骤 4: 测试功能

### 4.1 测试项目保存

1. 点击 "New Project" 创建新项目
2. 在画布上添加一些元素（图片、文字、形状）
3. 修改项目标题
4. 观察右上角的保存状态：
   - 🔄 "保存中..." - 正在保存
   - ✅ "已保存" - 保存成功
   - ❌ "离线" - 保存失败

### 4.2 测试项目加载

1. 返回 Dashboard
2. 你应该能看到刚才创建的项目
3. 点击项目卡片
4. 项目应该加载并显示之前创建的所有元素

---

## 🔍 故障排除

### 问题 1: "离线" 状态持续显示

**可能原因**：Supabase 环境变量配置错误

**解决方法**：检查 `.env.local` 中的 Supabase 密钥是否正确

### 问题 2: 无法保存项目

**检查步骤**：
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签是否有错误信息
3. 查看 Network 标签，检查 Supabase 请求是否成功

### 问题 3: RLS 策略错误

如果看到类似 "new row violates row-level security policy" 的错误：

1. 进入 Supabase Dashboard > Authentication > Policies
2. 检查 `projects`、`canvas_elements` 和 `user_credits` 表的策略
3. 确认策略设置为 `USING (true)` 和 `WITH CHECK (true)`

---

## 📚 数据结构

**projects 表**：
- `id` - 项目唯一标识符 (UUID)
- `user_id` - 用户 ID（默认 'internal_user_001'）
- `title` - 项目标题
- `thumbnail` - 项目缩略图（可选）
- `created_at` - 创建时间
- `updated_at` - 更新时间（自动更新）

**canvas_elements 表**：
- `id` - 元素唯一标识符 (UUID)
- `project_id` - 关联的项目 ID
- `element_data` - 元素数据（JSONB 格式）
- `created_at` - 创建时间
- `updated_at` - 更新时间（自动更新）

**user_credits 表**：
- `user_id` - 用户 ID
- `credits` - 积分数
- `created_at` - 创建时间
- `updated_at` - 更新时间（自动更新）

---

## 📞 获取帮助

- **Supabase 文档**: https://supabase.com/docs

---

祝你使用愉快！🎉
