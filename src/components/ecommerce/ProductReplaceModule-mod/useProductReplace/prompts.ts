export const COMBINED_APPEND_PROMPT =
  "\n\n【材质与锁边要求】提供的参考图中已包含目标产品的材质和锁边效果，请从该图中提取以下特征并应用到替换后的产品上：1）材质特征（纤维密度、表面纹理、光泽度、绒面质感等）；2）锁边特征（锁边密度、纹理、厚度、收边效果等）。保持产品形状和颜色结构不变，仅改变材质和边缘表现。";

export const MATERIAL_PREVIEW_PROMPT =
  "【核心目标】：生成参考图 1 款式的地毯实物电商白底图，精准还原设计、材质、工艺 【最高优先级・参考图用途严格区分，不得混淆】 参考图 1（设计稿）：唯一的图案 / 配色 / 纹样 / 外形比例参考，必须 100% 还原所有花纹、米白 + 浅咖的配色、排版、地毯长宽比例，不允许任何修改参考图 2（材质图）：仅参考毯面材质质感，绝对不允许使用该图的任何图案，仅还原它的哑光短绒触感：短绒蓬松柔软、触感细腻温润、绒面细密无毛刺反光参考图 3（锁边图）：仅参考边缘锁边工艺，边缘包边样式和这张图完全一致，为工整的白色双线锁边 【画面构图要求】背景为完全纯净的纯白色，无任何杂物、文字、装饰、多余阴影，无任何多余元素地毯完整平铺无遮挡，100% 露出全部四个边角，无任何花纹、边缘被裁切；地毯整体在画面中占比 65%-70%，四周预留均匀的白色空隙，画布比例和参考图 1 的地毯长宽比例完全一致采用 45° 轻微斜俯全景拍摄视角，不局部近拍，同时清晰展示全毯完整纹样、表面短绒细节、边缘锁边工艺、地毯自然厚度光线为柔和均匀的商业产品打光，无强烈反光、无过重暗部阴影，所有细节清晰可见 【质感做工要求】毯面完全匹配参考图 2 的短绒质感：哑光、蓬松柔软、能看出细密的短绒纹理，不是光滑硬面 / 纸片扁平效果边缘完全匹配参考图 3 的锁边工艺：双线白色锁边工整平整、不毛躁，地毯有自然的厚度感 【画质 & 禁止规则】8K 超高清，商业产品摄影级画质，细节锐利，色彩和参考图 1 完全一致禁止修改参考图 1 的任何纹样，禁止花纹模糊走形；禁止出现人手、饰品等无关物体；禁止地毯变形扭曲；禁止裁切地毯任何部分、禁止仅展示地毯局部";

// 阶段一：将设计图贴到产品白底图
export const COMPOSE_PROMPT =
  "A professional, hyper-realistic, commercial-grade product photograph of a finished carpet. Synthetically merge input A (the perspective/material reference, image_0.png) and input B (the 2D pattern reference, image_1.png). Preserve the unique geometric shape, exact perspective angle, and tactile pile fiber texture of input A. Perspectively warp the entire pattern design from input B to perfectly align with the surface of input A. The pattern must not be a flat overlay but must be meticulously rendered as if woven into the fibers themselves (displacement mapped), ensuring the individual strands are coated by the pattern colors without losing their texture depth and soft-shadowing. The environmental lighting, depth of field, and left-right light gradient from input A must be maintained and applied consistently over the newly patterned surface. The carpet is presented against the deep, clean, black isolation background from input A. No text, logos, or artificial borders. Focus on maximizing the perceived textile realism for a high-end e-commerce look.";

// 阶段二：将成品产品图替换到场景图中
export const SCENE_REPLACE_PROMPT =
  "【核心任务】将提供的产品图（成品）精准替换到场景图中对应产品的位置，保持场景中的所有其他元素不变。\n\n【参考图说明】\n- 场景图：包含完整场景，需要保留场景中所有元素的位置、光影、氛围\n- 产品图：已经贴好设计图案的成品产品图，需要将其替换到场景中的产品位置\n\n【具体要求】\n1. 成品的形状、大小、透视必须完全匹配场景中原产品的位置和角度\n2. 保持成品的材质质感、图案、锁边效果与原图一致\n3. 成品要自然融入场景光影，阴影和高光要与场景一致\n4. 场景中的其他所有元素（家具、装饰、光线等）完全保持不变\n5. 不要产生任何变形、扭曲或不自然的边缘\n\n【画质要求】8K 超高清，商业产品摄影级画质，成品图案清晰锐利，与场景光影完美融合，禁止图案模糊、走形、裁切或遗漏，禁止场景其他元素发生变化";

// 保留旧 prompt 供 replace 模式使用
export const APPLY_PROMPT =
  "【核心任务】将设计图的图案精准应用到场景图中的产品表面，以产品白底图为材质和锁边参考，保持产品的形状、材质、锁边、厚度等所有物理特征完全不变。\n\n【参考图说明】\n- 场景图：包含产品和完整场景，需要保留产品的位置、形状、光影和场景布局\n- 产品白底图：提供产品的准确材质质感（绒面、纤维密度、光泽度等）和锁边工艺（锁边颜色、纹理、厚度等），必须以此图的材质和锁边为准\n- 设计图：仅提供图案和纹理信息，需要将其应用到场景中的产品表面\n\n【具体要求】\n1. 仅改变产品表面的图案/纹样/配色，严格按照设计图的图案进行替换\n2. 产品的材质质感必须与产品白底图一致（包括绒面蓬松度、纤维密度、表面纹理、光泽度等）\n3. 产品的锁边效果必须与产品白底图一致（锁边颜色、纹理、厚度等）\n4. 保持产品在场景中的位置、大小、角度不变\n5. 保持产品的形状和厚度不变，不要产生变形或扭曲\n6. 保持场景中的光影效果一致，图案要自然融入产品表面\n7. 背景和其他场景元素完全保持不变\n\n【画质要求】8K 超高清，商业产品摄影级画质，图案清晰锐利，与设计图色彩一致，材质和锁边与产品白底图一致，禁止图案模糊、走形、裁切或遗漏";

export const MATERIAL_REFERENCE_PROMPT =
  "【核心任务】将设计图的图案精准应用到场景图中的产品表面，以产品白底图为基础材质参考，同时以材质参考图为准，保持产品的材质质感和物理特征。\n\n【参考图说明】\n- 场景图：包含产品和完整场景，需要保留产品的位置、形状、锁边、阴影等所有特征\n- 产品白底图：提供产品的基础材质和锁边工艺，需要以此图的材质和锁边为基准\n- 设计图：仅提供图案和纹理信息，需要将其应用到场景中的产品表面\n- 材质参考图：提供产品的材质特征（如绒面质感、纤维密度、表面纹理、光泽度等），需要以这张图的材质为标准进行微调\n\n【具体要求】\n1. 仅改变产品表面的图案/纹样/配色，严格按照设计图的图案进行替换\n2. 产品的材质质感必须以产品白底图为基础，同时与材质参考图一致（包括绒面蓬松度、纤维密度、表面纹理、光泽度等）\n3. 产品的锁边效果必须与产品白底图一致（锁边颜色、纹理、厚度等）\n4. 保持产品在场景中的位置、大小、角度不变\n5. 保持产品的形状和厚度不变，不要产生变形或扭曲\n6. 保持场景中的光影效果一致，图案要自然融入产品表面\n7. 背景和其他场景元素完全保持不变\n\n【画质要求】8K 超高清，商业产品摄影级画质，图案清晰锐利，与设计图色彩一致，材质质感与产品白底图和材质参考图一致，禁止图案模糊、走形、裁切或遗漏";
