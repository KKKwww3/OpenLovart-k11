export interface AnglePreset {
  id: string;
  name: string;
  prompt: string;
  description: string;
}

/** 多角度渲染预设 — 用自然语言描述真正视角变换，防止 AI 简单镜像原图 */
export const ANGLE_PRESETS: AnglePreset[] = [
  {
    id: "front",
    name: "正面平视",
    prompt: `Re-render this product from a straight-on front view at eye level, showing the full front face clearly with both left and right sides symmetrically visible. Maintain the original product's color, material, texture, and lighting style exactly. The product should be centered in frame with a medium shot composition. Do NOT mirror or flip the input image — generate a true front-facing perspective view of the product.`,
    description: "标准产品主图",
  },
  {
    id: "right-45",
    name: "右侧45°",
    prompt: `Re-render this product rotated approximately 45 degrees to the right, showing the right side panel and the right portion of the front face. The right edge and side details should be clearly visible. Maintain the original product's color, material, texture, and lighting style exactly. Medium shot composition. Do NOT simply mirror the input image — generate a true 3D perspective from the right-front angle.`,
    description: "展示右侧面细节",
  },
  {
    id: "left-45",
    name: "左侧45°",
    prompt: `Re-render this product rotated approximately 45 degrees to the left, showing the left side panel and the left portion of the front face. The left edge and side details should be clearly visible. Maintain the original product's color, material, texture, and lighting style exactly. Medium shot composition. Do NOT simply mirror the input image — generate a true 3D perspective from the left-front angle.`,
    description: "展示左侧面细节",
  },
  {
    id: "top-down",
    name: "正俯视",
    prompt: `Re-render this product viewed directly from above, looking straight down. Show the top surface, top edges, and the overall silhouette shape from a bird's-eye perspective. Maintain the original product's color, material, texture, and lighting style exactly. Wide shot composition showing the full top view. Do NOT mirror the input image — generate a true top-down perspective view.`,
    description: "顶部俯瞰展示",
  },
  {
    id: "bottom-up",
    name: "正仰视",
    prompt: `Re-render this product viewed from below, looking upward at the bottom surface. Show the underside details, bottom edges, and the product's form from a low angle perspective. Maintain the original product's color, material, texture, and lighting style exactly. Wide shot composition. Do NOT mirror the input image — generate a true bottom-up perspective view.`,
    description: "底部仰视展示",
  },
  {
    id: "back",
    name: "背面",
    prompt: `Re-render this product viewed from the back side, showing the rear surface and back details. The product is rotated 180 degrees so the front face is not visible. Maintain the original product's color, material, texture, and lighting style exactly. Medium shot composition. Do NOT simply mirror the input image — generate a true rear-view perspective of the product.`,
    description: "背面展示",
  },
  {
    id: "front-left-30-up",
    name: "左前侧30°仰拍",
    prompt: `Re-render this product from a low-angle view, approximately 30 degrees to the left of center and looking upward from below. The left side and bottom portions are emphasized, giving the product a tall, dramatic appearance. Show the underside of any overhanging features. Maintain the original product's color, material, texture, and lighting style exactly. Close-up shot composition. Do NOT mirror the input image — generate a true low-angle perspective from the left-front.`,
    description: "低角度仰拍突出立体感",
  },
  {
    id: "right-30-down",
    name: "右前侧30°俯拍",
    prompt: `Re-render this product from a high-angle view, approximately 30 degrees to the right of center and looking downward from above. The top surface and right side are prominently visible, creating a slightly overhead perspective that reveals both top and side details. Maintain the original product's color, material, texture, and lighting style exactly. High angle shot composition. Do NOT mirror the input image — generate a true top-side perspective from the right-front.`,
    description: "俯拍展示顶部和右侧",
  },
];

