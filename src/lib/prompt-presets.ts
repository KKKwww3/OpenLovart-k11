export interface PromptPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  generatePrompt: (params: Record<string, unknown>) => string;
  defaultParams: Record<string, unknown>;
  paramSchema: ParamSchema[];
}

export interface ParamSchema {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "image" | "images";
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: unknown;
  placeholder?: string;
  min?: number;
  max?: number;
}

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "product-replace",
    name: "产品替换",
    description: "上传场景图 + 多产品图 → 同一场景批量替换",
    icon: "Image",
    generatePrompt: (params) => {
      const productType = params.productType as string || "产品";
      return `专业电商产品摄影，将${productType}自然融入指定场景中，保持场景原有布局、光影方向、墙面地面完全一致，产品与场景无缝融合成一张完整的照片，产品主体清晰突出，保持原有花色、材质、质感完全一致，透视关系与场景协调，高清商业摄影，8K分辨率，专业布光，商业级后期处理`;
    },
    defaultParams: {
      productType: "产品",
    },
    paramSchema: [
      {
        key: "productType",
        label: "产品类型",
        type: "text",
        required: true,
        placeholder: "如：沙发、台灯、茶几等",
      },
      {
        key: "sceneImage",
        label: "场景图片",
        type: "image",
        required: true,
      },
      {
        key: "productImages",
        label: "产品图片",
        type: "images",
        required: true,
      },
    ],
  },
  {
    id: "multi-angle",
    name: "多角度拍摄",
    description: "一张图生成7张不同角度的产品图",
    icon: "Rotate3d",
    generatePrompt: (params) => {
      const angle = params.angle as string || "正面";
      const productType = params.productType as string || "产品";
      return `专业电商产品摄影，${productType}的${angle}视角展示，纯白背景，产品主体居中，专业商业摄影布光，8K高清，细节清晰可见，无阴影，适合电商主图展示`;
    },
    defaultParams: {
      productType: "产品",
    },
    paramSchema: [
      {
        key: "productType",
        label: "产品类型",
        type: "text",
        required: true,
        placeholder: "如：沙发、台灯、包包等",
      },
      {
        key: "referenceImage",
        label: "产品主图",
        type: "image",
        required: true,
      },
    ],
  },
  {
    id: "model-generation",
    name: "模特生成",
    description: "在产品主图中添加指定性别、数量、位置的模特",
    icon: "User",
    generatePrompt: (params) => {
      const gender = params.gender as string || "女性";
      const count = params.count as number || 1;
      const pose = params.pose as string || "自然站立";
      const scene = params.scene as string || "室内场景";
      return `专业电商摄影，在${scene}中展示产品，添加${count}位${gender}模特，${pose}姿势，模特与产品自然互动，专业商业摄影风格，模特穿着时尚得体，表情自然，光影协调，8K高清，商业级后期处理`;
    },
    defaultParams: {
      gender: "女性",
      count: 1,
      pose: "自然站立",
      scene: "室内场景",
    },
    paramSchema: [
      {
        key: "gender",
        label: "模特性别",
        type: "select",
        required: true,
        options: [
          { label: "女性", value: "女性" },
          { label: "男性", value: "男性" },
          { label: "男女双人", value: "男女双人" },
        ],
      },
      {
        key: "count",
        label: "模特数量",
        type: "number",
        required: true,
        min: 1,
        max: 3,
        defaultValue: 1,
      },
      {
        key: "pose",
        label: "姿势风格",
        type: "select",
        required: true,
        options: [
          { label: "自然站立", value: "自然站立" },
          { label: "坐姿展示", value: "坐姿展示" },
          { label: "动态行走", value: "动态行走" },
          { label: "互动使用", value: "互动使用" },
        ],
      },
      {
        key: "scene",
        label: "场景风格",
        type: "select",
        required: true,
        options: [
          { label: "室内场景", value: "室内场景" },
          { label: "户外场景", value: "户外场景" },
          { label: "工作室场景", value: "工作室场景" },
          { label: "商业空间", value: "商业空间" },
        ],
      },
      {
        key: "referenceImage",
        label: "产品图片",
        type: "image",
        required: true,
      },
    ],
  },
  {
    id: "close-up",
    name: "近景图",
    description: "生成细节图（材质特写、功能展示等）",
    icon: "ZoomIn",
    generatePrompt: (params) => {
      const focusType = params.focusType as string || "材质纹理";
      const productType = params.productType as string || "产品";
      return `专业电商产品细节摄影，${productType}的${focusType}特写，微距摄影风格，极致清晰展示产品细节，专业布光突出质感，8K超高清，商业级后期处理，背景简洁不抢焦点`;
    },
    defaultParams: {
      focusType: "材质纹理",
      productType: "产品",
    },
    paramSchema: [
      {
        key: "productType",
        label: "产品类型",
        type: "text",
        required: true,
        placeholder: "如：皮革沙发、陶瓷花瓶等",
      },
      {
        key: "focusType",
        label: "特写类型",
        type: "select",
        required: true,
        options: [
          { label: "材质纹理", value: "材质纹理" },
          { label: "工艺细节", value: "工艺细节" },
          { label: "功能部件", value: "功能部件" },
          { label: "品牌标识", value: "品牌标识" },
          { label: "使用场景", value: "使用场景" },
        ],
      },
      {
        key: "referenceImage",
        label: "产品图片",
        type: "image",
        required: true,
      },
    ],
  },
  {
    id: "detail-template",
    name: "详情页套版",
    description: "选择固定模板，输入文字图片批量生成详情页",
    icon: "Layout",
    generatePrompt: (params) => {
      const template = params.template as string || "标准电商详情页";
      const productName = params.productName as string || "产品";
      const features = params.features as string || "高品质、精工艺";
      return `电商详情页设计，${template}模板风格，产品名称：${productName}，核心卖点：${features}，专业商业设计，清晰的信息层级，高质量产品展示，符合电商平台规范，适合移动端和PC端浏览`;
    },
    defaultParams: {
      template: "标准电商详情页",
      productName: "",
      features: "",
    },
    paramSchema: [
      {
        key: "template",
        label: "详情页模板",
        type: "select",
        required: true,
        options: [
          { label: "标准电商详情页", value: "标准电商详情页" },
          { label: "简约风格详情页", value: "简约风格详情页" },
          { label: "时尚风格详情页", value: "时尚风格详情页" },
          { label: "科技风格详情页", value: "科技风格详情页" },
        ],
      },
      {
        key: "productName",
        label: "产品名称",
        type: "text",
        required: true,
        placeholder: "输入产品名称",
      },
      {
        key: "features",
        label: "核心卖点",
        type: "text",
        required: true,
        placeholder: "如：高品质、精工艺、环保材质",
      },
      {
        key: "referenceImage",
        label: "产品图片",
        type: "images",
        required: true,
      },
    ],
  },
  {
    id: "buyer-show",
    name: "买家秀图片",
    description: "生成同一场景的远景+近景+人物/宠物三张图",
    icon: "Users",
    generatePrompt: (params) => {
      const scene = params.scene as string || "家居场景";
      const hasPet = params.hasPet as boolean || false;
      const petType = hasPet ? "和可爱的宠物" : "";
      return `真实买家秀风格摄影，${scene}，自然生活化场景，包含远景全景展示、中景产品特写、近景人物互动${petType}，温暖自然光线，生活化布置，真实使用感，8K高清，适合社交媒体分享`;
    },
    defaultParams: {
      scene: "家居场景",
      hasPet: false,
    },
    paramSchema: [
      {
        key: "scene",
        label: "场景类型",
        type: "select",
        required: true,
        options: [
          { label: "家居场景", value: "家居场景" },
          { label: "办公场景", value: "办公场景" },
          { label: "户外场景", value: "户外场景" },
          { label: "咖啡厅场景", value: "咖啡厅场景" },
        ],
      },
      {
        key: "hasPet",
        label: "包含宠物",
        type: "select",
        required: false,
        options: [
          { label: "不包含", value: "false" },
          { label: "猫咪", value: "cat" },
          { label: "狗狗", value: "dog" },
        ],
      },
      {
        key: "referenceImage",
        label: "产品图片",
        type: "image",
        required: true,
      },
    ],
  },
  {
    id: "white-background",
    name: "白底图",
    description: "一键生成白底产品图（保持花色材质）",
    icon: "Square",
    generatePrompt: (params) => {
      const angle = params.angle as string || "正面";
      return `专业电商白底产品图，纯白背景（RGB 255,255,255），产品${angle}展示，保持产品原有花色、材质、光泽完全一致，专业商业摄影布光，无阴影，产品主体清晰锐利，8K高清，符合电商平台主图规范`;
    },
    defaultParams: {
      angle: "正面",
    },
    paramSchema: [
      {
        key: "angle",
        label: "展示角度",
        type: "select",
        required: true,
        options: [
          { label: "正面", value: "正面" },
          { label: "侧面", value: "侧面" },
          { label: "斜45度", value: "斜45度" },
          { label: "俯视", value: "俯视" },
          { label: "背面", value: "背面" },
        ],
      },
      {
        key: "referenceImage",
        label: "产品图片",
        type: "image",
        required: true,
      },
    ],
  },
  {
    id: "main-video",
    name: "主图视频",
    description: "生成产品展示短视频",
    icon: "Video",
    generatePrompt: (params) => {
      const duration = params.duration as string || "15秒";
      const style = params.style as string || "产品旋转展示";
      return `电商主图视频，${duration}时长，${style}，产品主体清晰，专业商业摄影风格，流畅运镜，适合电商平台主图视频展示，高清画质，产品细节展示完整`;
    },
    defaultParams: {
      duration: "15秒",
      style: "产品旋转展示",
    },
    paramSchema: [
      {
        key: "duration",
        label: "视频时长",
        type: "select",
        required: true,
        options: [
          { label: "15秒", value: "15秒" },
          { label: "30秒", value: "30秒" },
          { label: "60秒", value: "60秒" },
        ],
      },
      {
        key: "style",
        label: "展示风格",
        type: "select",
        required: true,
        options: [
          { label: "产品旋转展示", value: "产品旋转展示" },
          { label: "细节特写切换", value: "细节特写切换" },
          { label: "使用场景展示", value: "使用场景展示" },
          { label: "功能演示", value: "功能演示" },
        ],
      },
      {
        key: "referenceImage",
        label: "产品图片",
        type: "image",
        required: true,
      },
    ],
  },
];

export const MULTI_ANGLE_PROMPTS = [
  "正面视角，产品居中展示",
  "左侧45度视角，展示产品侧面细节",
  "右侧45度视角，展示产品另一侧面",
  "俯视视角，展示产品顶部设计",
  "仰视视角，展示产品底部结构",
  "背面视角，展示产品背部设计",
  "斜上方45度视角，展示产品立体感",
];

export function getPromptPreset(id: string): PromptPreset | undefined {
  return PROMPT_PRESETS.find((preset) => preset.id === id);
}

export function generateModulePrompt(
  moduleId: string,
  params: Record<string, unknown>,
): string {
  const preset = getPromptPreset(moduleId);
  if (!preset) {
    throw new Error(`Unknown module id: ${moduleId}`);
  }
  return preset.generatePrompt(params);
}
