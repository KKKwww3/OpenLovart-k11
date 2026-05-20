export interface AnglePreset {
  id: string;
  name: string;
  prompt: string;
  description: string;
}

/** 多角度渲染预设模板 — 用提示词描述视角，适配 NB2/Gemini 文本驱动模型 */
export const ANGLE_PRESETS: AnglePreset[] = [
  {
    id: "front",
    name: "正面平视",
    prompt: "0° horizontal angle, 0° vertical angle, medium shot",
    description: "标准产品主图",
  },
  {
    id: "right-45",
    name: "右侧45°",
    prompt: "45° right of front view, 0° vertical angle, medium shot",
    description: "展示侧面细节",
  },
  {
    id: "left-45",
    name: "左侧45°",
    prompt: "45° left of front view, 0° vertical angle, medium shot",
    description: "展示侧面细节",
  },
  {
    id: "top-down",
    name: "正俯视",
    prompt: "0° horizontal angle, 90° downward angle, wide shot",
    description: "包装 / 顶部设计展示",
  },
  {
    id: "bottom-up",
    name: "正仰视",
    prompt: "0° horizontal angle, -90° upward angle, wide shot",
    description: "底部细节展示",
  },
  {
    id: "back",
    name: "背面",
    prompt: "180° horizontal angle, 0° vertical angle, medium shot",
    description: "背面展示",
  },
  {
    id: "front-left-30-up",
    name: "左前侧30°仰拍",
    prompt: "30° left of front view, -15° upward angle, close-up shot",
    description: "突出产品立体感",
  },
  {
    id: "right-30-down",
    name: "右前侧30°俯拍",
    prompt: "30° right of front view, -30° downward angle, high angle shot",
    description: "展示顶部和右侧细节",
  },
];

