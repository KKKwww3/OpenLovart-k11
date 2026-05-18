# Supabase Edge Functions 配置指南

## 1. 设置 Edge Functions Secrets

在部署 Edge Functions 之前，需要设置以下 secrets：

### 跳过 JWT 验证 + 指定环境变量文件

supabase functions serve --no-verify-jwt --env-file supabase/functions/.env

```bash
# 设置 X.AI API Key (用于 generate-design)
supabase secrets set XAI_API_KEY=your_grok_api_key

# 设置图像生成 API
supabase secrets set IMAGE_API_BASE_URL=https://router-us.xavierwork.eu.cc/api/v1
supabase secrets set IMAGE_API_KEY=your_image_api_key

# 设置视频生成 API
supabase secrets set VIDEO_API_BASE_URL=https://www.clockapi.fun/v1
supabase secrets set VIDEO_API_KEY=your_video_api_key
```

## 2. 本地开发

启动本地 Supabase 服务：

```bash
supabase start
```

创建 `.env` 文件在 `supabase/functions/.env` 中设置本地环境变量：

```
XAI_API_KEY=your_grok_api_key
IMAGE_API_BASE_URL=https://router-us.xavierwork.eu.cc/api/v1
IMAGE_API_KEY=your_image_api_key
VIDEO_API_BASE_URL=https://www.clockapi.fun/v1
VIDEO_API_KEY=your_video_api_key
```

## 3. 部署 Edge Functions

部署单个函数：

```bash
supabase functions deploy generate-design
supabase functions deploy generate-image
supabase functions deploy generate-video
supabase functions deploy video-status
```

部署所有函数：

```bash
supabase functions deploy
```

## 4. Edge Functions 列表

| 函数名          | 功能            | 环境变量                          |
| --------------- | --------------- | --------------------------------- |
| generate-design | AI 设计建议生成 | XAI_API_KEY                       |
| generate-image  | 图像生成        | IMAGE_API_BASE_URL, IMAGE_API_KEY |
| generate-video  | 视频生成        | VIDEO_API_BASE_URL, VIDEO_API_KEY |
| video-status    | 视频状态查询    | VIDEO_API_BASE_URL, VIDEO_API_KEY |

## 5. 调用方式

Edge Functions 通过 Supabase 客户端调用：

```typescript
import {
  generateDesign,
  generateImage,
  generateVideo,
  getVideoStatus,
} from "@/lib/edge-functions";

// 生成设计建议
const suggestion = await generateDesign(prompt);

// 生成图像
const { imageData, textResponse } = await generateImage({ prompt, model });

// 生成视频
const { taskId, status } = await generateVideo({ prompt, seconds, size });

// 查询视频状态
const status = await getVideoStatus(taskId);
```

## 6. 安全优势

- API Keys 不再暴露在前端代码中
- 所有敏感操作在服务端执行
- 使用 Supabase 的认证和授权机制
- 支持 CORS 配置
