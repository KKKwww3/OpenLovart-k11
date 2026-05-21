export interface AnglePreset {
  id: string;
  name: string;
  prompt: string;
  description: string;
}

export interface SourceAngleOption {
  id: string;
  name: string;
  description: string;
}

/** 原图拍摄角度选项 — 用户选择输入图是从哪个角度拍的 */
export const SOURCE_ANGLES: SourceAngleOption[] = [
  { id: "left-45", name: "左前侧", description: "从左侧前方拍摄，左边比右边多" },
  { id: "right-45", name: "右前侧", description: "从右侧前方拍摄，右边比左边多" },
  { id: "front", name: "正前方", description: "从正前方平视拍摄" },
  { id: "left", name: "纯左侧", description: "从正左方拍摄，只看到左侧面" },
  { id: "right", name: "纯右侧", description: "从正右方拍摄，只看到右侧面" },
  { id: "top-down", name: "正上方", description: "从上往下俯拍" },
  { id: "front-left-up", name: "左前上", description: "从左前上方俯拍" },
  { id: "front-right-up", name: "右前上", description: "从右前上方俯拍" },
];

function buildSourceAnglePrompt(sourceAngleId: string): string {
  const source = SOURCE_ANGLES.find((a) => a.id === sourceAngleId);
  if (!source) return "";
  return `The input photo was taken from the "${source.name}" viewpoint — ${source.description}. Based on this source viewpoint, now generate what this exact same scene would look like when viewed from:\n\n`;
}

/** 生成完整提示词：原图角度描述 + 目标视角描述 */
export function buildMultiAnglePrompt(sourceAngleId: string, targetPreset: AnglePreset): string {
  return buildSourceAnglePrompt(sourceAngleId) + targetPreset.prompt;
}

/** 多角度渲染预设 — 纯目标视角描述（不含原图角度信息） */
export const ANGLE_PRESETS: AnglePreset[] = [
  {
    id: "front",
    name: "正面平视",
    prompt: `directly from the front at eye level. Show the full front view of the scene with symmetrical perspective. Keep the same subject, same background environment, same materials, colors, and lighting style — the only difference is the camera is now positioned straight in front. Infer and complete the front-facing details that are not visible in the input. Make it look like a real photograph taken from the front.`,
    description: "标准正面视角",
  },
  {
    id: "right-45",
    name: "右侧45°",
    prompt: `from the right-front, approximately 45 degrees to the right. The right side of the scene becomes more visible, while the left side recedes. Keep the same subject, same background environment, same materials, colors, and lighting style — the only difference is the camera angle. Infer and complete the right-side details that are hidden in the input. Make it look like a real photograph taken from the right-front.`,
    description: "展示右侧面",
  },
  {
    id: "right",
    name: "右侧90°",
    prompt: `directly from the right side, a pure right-side profile view (90 degrees). The front of the scene is no longer visible. Keep the same subject, same background environment, same materials, colors, and lighting style — the only difference is the camera angle. Infer and complete the right-side details that are completely hidden in the input. Make it look like a real photograph taken from the right side.`,
    description: "纯右侧面视角",
  },
  {
    id: "left-45",
    name: "左侧45°",
    prompt: `from the left-front, approximately 45 degrees to the left. The left side of the scene becomes more visible, while the right side recedes. Keep the same subject, same background environment, same materials, colors, and lighting style — the only difference is the camera angle. Infer and complete the left-side details that are hidden in the input. Make it look like a real photograph taken from the left-front.`,
    description: "展示左侧面",
  },
  {
    id: "left",
    name: "左侧90°",
    prompt: `directly from the left side, a pure left-side profile view (90 degrees). The front of the scene is no longer visible. Keep the same subject, same background environment, same materials, colors, and lighting style — the only difference is the camera angle. Infer and complete the left-side details that are completely hidden in the input. Make it look like a real photograph taken from the left side.`,
    description: "纯左侧面视角",
  },
  {
    id: "back",
    name: "背面",
    prompt: `from behind, looking at the rear of the scene (180 degrees opposite). The front is now behind the scene. Keep the same subject, same background environment, same materials, colors, and lighting style — the only difference is the camera angle. Infer and complete the back-side details, rear surfaces, and reversed background that are completely hidden in the input. Make it look like a real photograph taken from behind.`,
    description: "背面视角",
  },
  {
    id: "top-down",
    name: "正俯视",
    prompt: `directly from above, a bird's-eye view looking straight down. The ground plane fills the frame with the subject seen from the top. Keep the same subject, same background environment, same materials, colors, and lighting style — the only difference is the camera angle. Infer and complete the top surfaces, overhead layout, and ground details that are not visible in the input. Make it look like a real photograph taken from directly above.`,
    description: "顶部俯瞰视角",
  },
  {
    id: "bottom-up",
    name: "正仰视",
    prompt: `from below looking up, a low-angle upward view. The underside and bottom portions are prominent with the ceiling or sky in view. Keep the same subject, same background environment, same materials, colors, and lighting style — the only difference is the camera angle. Infer and complete the underside details, bottom edges, and surrounding environment that are not visible in the input. Make it look like a real photograph taken from below.`,
    description: "底部仰视视角",
  },
  {
    id: "front-left-30-up",
    name: "左前侧30°仰拍",
    prompt: `from a low left-front angle looking upward. The lower-left portion of the scene is emphasized, giving a slightly dramatic upward perspective. Keep the same subject, same background environment, same materials, colors, and lighting style — the only difference is the camera angle. Infer and complete the underside and left-side details not visible in the input. Make it look like a real photograph taken from a low left-front angle.`,
    description: "低角度仰拍突出立体感",
  },
  {
    id: "right-30-down",
    name: "右前侧30°俯拍",
    prompt: `from a high right-front angle looking downward. The top surface and right side of the scene are prominent in this overhead perspective. Keep the same subject, same background environment, same materials, colors, and lighting style — the only difference is the camera angle. Infer and complete the top and right-side details not visible in the input. Make it look like a real photograph taken from a high right-front angle.`,
    description: "俯拍展示顶部和右侧",
  },
];

