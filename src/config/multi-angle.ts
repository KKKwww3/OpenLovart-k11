export interface AnglePreset {
  id: string;
  name: string;
  prompt: string;
  description: string;
}

/** 多角度渲染预设 — 摄像机围绕产品空间中心环绕，产品本身完全保持不变 */
export const ANGLE_PRESETS: AnglePreset[] = [
  {
    id: "front",
    name: "正面平视",
    prompt: `Imagine a camera positioned directly in front of the product at eye level, pointing at the product's center. The product itself remains completely identical — same shape, color, material, texture, brand markings, and every detail unchanged. Show the full front face with both left and right sides symmetrically visible. Medium shot, product centered in frame. Only the camera angle changes — the product is exactly the same as the input image, just viewed from straight on.`,
    description: "标准产品主图",
  },
  {
    id: "right-45",
    name: "右侧45°",
    prompt: `Imagine a camera orbiting 45 degrees to the right around the product's center point. The product itself remains completely identical — same shape, color, material, texture, brand markings, and every detail unchanged. The right side of the product and part of the front face are now visible. Medium shot composition. Only the camera position changes — the product is exactly the same as the input image, just viewed from a right-front angle.`,
    description: "展示右侧面",
  },
  {
    id: "right",
    name: "右侧90°",
    prompt: `Imagine a camera orbiting 90 degrees to the right around the product's center point, now looking at the pure right side. The product itself remains completely identical — same shape, color, material, texture, brand markings, and every detail unchanged. Only the right side profile is visible, with the front face no longer in view. Medium shot composition. Only the camera position changes — the product is exactly the same as the input image, just viewed from the right side.`,
    description: "纯右侧面展示",
  },
  {
    id: "left-45",
    name: "左侧45°",
    prompt: `Imagine a camera orbiting 45 degrees to the left around the product's center point. The product itself remains completely identical — same shape, color, material, texture, brand markings, and every detail unchanged. The left side of the product and part of the front face are now visible. Medium shot composition. Only the camera position changes — the product is exactly the same as the input image, just viewed from a left-front angle.`,
    description: "展示左侧面",
  },
  {
    id: "left",
    name: "左侧90°",
    prompt: `Imagine a camera orbiting 90 degrees to the left around the product's center point, now looking at the pure left side. The product itself remains completely identical — same shape, color, material, texture, brand markings, and every detail unchanged. Only the left side profile is visible, with the front face no longer in view. Medium shot composition. Only the camera position changes — the product is exactly the same as the input image, just viewed from the left side.`,
    description: "纯左侧面展示",
  },
  {
    id: "back",
    name: "背面",
    prompt: `Imagine a camera orbiting 180 degrees around the product's center point, now positioned behind the product. The product itself remains completely identical — same shape, color, material, texture, brand markings, and every detail unchanged. Show the rear surface and back details clearly. Medium shot composition. Only the camera position changes — the product is exactly the same as the input image, just viewed from behind.`,
    description: "背面展示",
  },
  {
    id: "top-down",
    name: "正俯视",
    prompt: `Imagine a camera positioned directly above the product, looking straight down at its center point. The product itself remains completely identical — same shape, color, material, texture, brand markings, and every detail unchanged. Show the top surface, top edges, and overall silhouette from a bird's-eye perspective. Wide shot showing the full top view. Only the camera position changes — the product is exactly the same as the input image, just viewed from above.`,
    description: "顶部俯瞰展示",
  },
  {
    id: "bottom-up",
    name: "正仰视",
    prompt: `Imagine a camera positioned directly below the product, looking upward at its center point. The product itself remains completely identical — same shape, color, material, texture, brand markings, and every detail unchanged. Show the underside details and bottom edges from a low angle. Wide shot composition. Only the camera position changes — the product is exactly the same as the input image, just viewed from below.`,
    description: "底部仰视展示",
  },
  {
    id: "front-left-30-up",
    name: "左前侧30°仰拍",
    prompt: `Imagine a camera positioned low and to the left-front of the product, looking upward at its center point. The product itself remains completely identical — same shape, color, material, texture, brand markings, and every detail unchanged. The left side and bottom portions are emphasized, giving a slightly dramatic upward view. Close-up shot. Only the camera position changes — the product is exactly the same as the input image, just viewed from a low left-front angle.`,
    description: "低角度仰拍突出立体感",
  },
  {
    id: "right-30-down",
    name: "右前侧30°俯拍",
    prompt: `Imagine a camera positioned high and to the right-front of the product, looking downward at its center point. The product itself remains completely identical — same shape, color, material, texture, brand markings, and every detail unchanged. The top surface and right side are prominently visible in this overhead perspective. High angle shot. Only the camera position changes — the product is exactly the same as the input image, just viewed from a high right-front angle.`,
    description: "俯拍展示顶部和右侧",
  },
];

