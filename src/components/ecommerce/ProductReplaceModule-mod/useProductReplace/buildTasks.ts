import { v4 as uuidv4 } from "uuid";
import type { UploadedFile } from "../../UploadZone";
import type { WorkflowMode } from "../types";
import { COMBINED_APPEND_PROMPT, APPLY_PROMPT, MATERIAL_REFERENCE_PROMPT, COMPOSE_PROMPT, SCENE_REPLACE_PROMPT } from "./prompts";

export function buildPrompt(
  currentPrompt: string,
  workflowMode: WorkflowMode,
  materialFilesLength: number,
): string {
  if (workflowMode === "apply") {
    return currentPrompt || APPLY_PROMPT;
  }
  if (workflowMode === "material") {
    return currentPrompt || MATERIAL_REFERENCE_PROMPT;
  }
  let prompt = currentPrompt;
  if (materialFilesLength > 0) {
    prompt += COMBINED_APPEND_PROMPT;
  }
  return prompt;
}

export function createReplaceTasks(
  sceneImageUrl: string,
  productFiles: UploadedFile[],
  productFileMapRef: React.MutableRefObject<Map<string, File>>,
  prompt: string,
  preprocessedMaterialUrl: string | null,
) {
  return productFiles.map((pf) => ({
    id: uuidv4(),
    prompt,
    referenceImage: sceneImageUrl,
    productImage: productFileMapRef.current.get(pf.id),
    materialImage: preprocessedMaterialUrl || undefined,
  }));
}

// 阶段一：设计图贴到产品白底图 → 成品产品图
export function createComposeTasks(
  productFiles: UploadedFile[],
  designFiles: UploadedFile[],
  productFileMapRef: React.MutableRefObject<Map<string, File>>,
  designFileMapRef: React.MutableRefObject<Map<string, File>>,
) {
  const productFile = productFiles[0];
  return designFiles.map((df) => ({
    id: uuidv4(),
    prompt: COMPOSE_PROMPT,
    productImage: productFile ? productFileMapRef.current.get(productFile.id) : undefined,
    designImage: designFileMapRef.current.get(df.id),
  }));
}

// 阶段二：成品产品图替换场景图中的产品
export function createSceneReplaceTasks(
  sceneImageUrl: string,
  designFiles: UploadedFile[],
  composedUrls: Map<string, string>,
) {
  return designFiles
    .filter((df) => composedUrls.has(df.id))
    .map((df) => ({
      id: uuidv4(),
      prompt: SCENE_REPLACE_PROMPT,
      referenceImage: sceneImageUrl,
      productImage: composedUrls.get(df.id),
    }));
}

// 保留旧函数供 material 模式后续使用
export function createMaterialTasks(
  sceneImageUrl: string,
  productFiles: UploadedFile[],
  designFiles: UploadedFile[],
  productFileMapRef: React.MutableRefObject<Map<string, File>>,
  designFileMapRef: React.MutableRefObject<Map<string, File>>,
  materialRefFileMapRef: React.MutableRefObject<Map<string, File>>,
  prompt: string,
) {
  const productFile = productFiles[0];
  return designFiles.map((df) => ({
    id: uuidv4(),
    prompt,
    referenceImage: sceneImageUrl,
    productImage: productFile ? productFileMapRef.current.get(productFile.id) : undefined,
    designImage: designFileMapRef.current.get(df.id),
    materialImage: materialRefFileMapRef.current.get(df.id),
  }));
}
