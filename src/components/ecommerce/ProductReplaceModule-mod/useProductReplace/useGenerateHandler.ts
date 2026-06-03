import { useCallback, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { stylePreprocess } from "@/lib/stylePreprocess";
import { uploadImageToImgbbBrowser } from "@/lib/imgbb-browser";
import type { UploadedFile } from "../../UploadZone";
import type { ResultItem } from "../../ResultPreview";
import type { StepStatus, ModeType, WorkflowMode } from "../types";
import type { UseBatchGenerationReturn } from "@/hooks/useBatchGeneration";
import type { UsePreviewReturn } from "./usePreview";
import { buildPrompt, createReplaceTasks, createComposeTasks, createSceneReplaceTasks } from "./buildTasks";

export interface UseGenerateHandlerParams {
  workflowMode: WorkflowMode;
  mode: ModeType;
  productFiles: UploadedFile[];
  designFiles: UploadedFile[];
  sceneFiles: UploadedFile[];
  sceneItems: Array<{
    file: UploadedFile;
    processedUrl: string | null;
    originalUrl: string | null;
    styleStatus: StepStatus;
    styleMessage: string;
    styleError: string | null;
  }>;
  materialFiles: UploadedFile[];
  currentPrompt: string;
  selectedModel: number | undefined;
  aspectRatio: string;
  imageSize: string;
  similarity: number;
  keepItems: string;
  changeItems: string;
  supabase?: SupabaseClient;

  productFileMapRef: React.MutableRefObject<Map<string, File>>;
  designFileMapRef: React.MutableRefObject<Map<string, File>>;
  materialRefFileMapRef: React.MutableRefObject<Map<string, File>>;

  processedSceneUrl: string | null;
  originalSceneUrl: string | null;
  tasks: UseBatchGenerationReturn["tasks"];

  setResults: Dispatch<SetStateAction<ResultItem[]>>;
  setProcessedSceneUrl: Dispatch<SetStateAction<string | null>>;
  setProcessedMaterialUrl: Dispatch<SetStateAction<string | null>>;
  setOriginalSceneUrl: Dispatch<SetStateAction<string | null>>;
  setStyleStepStatus: Dispatch<SetStateAction<StepStatus>>;
  setStyleStepMessage: Dispatch<SetStateAction<string>>;
  setStyleStepError: Dispatch<SetStateAction<string | null>>;

  startBatch: UseBatchGenerationReturn["startBatch"];
  clearTasks: () => void;
  retryTask: UseBatchGenerationReturn["retryTask"];
  preview: Pick<UsePreviewReturn, "preprocessMaterialImages">;
}

export interface UseGenerateHandlerReturn {
  needsStylePreprocess: () => boolean;
  doStylePreprocess: (sceneImageUrl: string) => Promise<string | null>;
  handleGenerate: () => Promise<void>;
  handleRetryStylePreprocess: () => Promise<void>;
  handleRetryProductReplace: () => Promise<void>;
  preprocessedMaterialUrlRef: React.MutableRefObject<string | null>;
}

export function useGenerateHandler(
  params: UseGenerateHandlerParams,
): UseGenerateHandlerReturn {
  const preprocessedMaterialUrlRef = useRef<string | null>(null);
  // 收集阶段一的成品产品图 URL（key: designFileId, value: composedImageUrl）
  const composedResultsRef = useRef<Map<string, string>>(new Map());

  const needsStylePreprocess = useCallback(() => {
    return params.workflowMode === "replace" && (params.similarity < 100 || params.keepItems.trim() !== "" || params.changeItems.trim() !== "");
  }, [params]);

  const doStylePreprocess = useCallback(async (sceneImageUrl: string): Promise<string | null> => {
    const keepItemsArray = params.keepItems.split(",").map((s) => s.trim()).filter(Boolean);
    const changeItemsArray = params.changeItems.split(",").map((s) => s.trim()).filter(Boolean);

    return new Promise((resolve) => {
      stylePreprocess(
        {
          sceneImageUrl,
          similarity: params.similarity,
          keepItems: keepItemsArray,
          changeItems: changeItemsArray,
          modelId: params.selectedModel,
        },
        {
          onStatus: (_stage, message) => {
            params.setStyleStepMessage(message);
          },
          onComplete: (result) => {
            params.setProcessedSceneUrl(result.imageUrl);
            params.setStyleStepStatus("done");
            params.setStyleStepMessage("风格预处理完成");
            resolve(result.imageUrl);
          },
          onError: (error) => {
            params.setStyleStepStatus("error");
            params.setStyleStepError(error);
            params.setStyleStepMessage(`风格预处理失败: ${error}`);
            resolve(null);
          },
        },
        params.supabase,
      );
    });
  }, [params]);

  const uploadSceneImage = useCallback(async (fileObj: File): Promise<string | null> => {
    const uploadResult = await uploadImageToImgbbBrowser(fileObj);
    if (!uploadResult?.url) {
      params.setStyleStepStatus("error");
      params.setStyleStepError("场景图上传失败");
      params.setStyleStepMessage("场景图上传失败，请重试");
      return null;
    }
    return uploadResult.url;
  }, [params]);

  // 两阶段生成：阶段一（设计图→产品白底图）→ 阶段二（成品产品图→场景图）
  const runTwoStageGenerate = useCallback(
    async (sceneImageUrl: string) => {
      // 重置阶段结果
      composedResultsRef.current.clear();

      // ===== 阶段一：设计图贴到产品白底图 → 成品产品图 =====
      params.setStyleStepStatus("processing");
      params.setStyleStepMessage("阶段一：设计图贴图...");

      await params.startBatch({
        tasks: createComposeTasks(
          params.productFiles,
          params.designFiles,
          params.productFileMapRef,
          params.designFileMapRef,
        ),
        modelId: params.selectedModel,
        aspectRatio: params.aspectRatio,
        imageSize: params.imageSize,
        concurrency: 2,
        onAllComplete: (stage1Results) => {
          // 收集阶段一所有成功结果
          composedResultsRef.current.clear();
          stage1Results
            .filter((t) => t.status === "completed" && t.result)
            .forEach((t, index) => {
              if (params.designFiles[index]) {
                composedResultsRef.current.set(params.designFiles[index].id, t.result!);
              }
            });
        },
      });

      // 检查阶段一是否有成功结果
      if (composedResultsRef.current.size === 0) {
        params.setStyleStepStatus("error");
        params.setStyleStepError("阶段一全部失败");
        params.setStyleStepMessage("设计图贴图全部失败，请重试");
        return;
      }

      // ===== 阶段二：成品产品图替换场景图中的产品 =====
      params.setStyleStepMessage("阶段二：场景替换...");

      await params.startBatch({
        tasks: createSceneReplaceTasks(
          sceneImageUrl,
          params.designFiles,
          composedResultsRef.current,
        ),
        modelId: params.selectedModel,
        aspectRatio: params.aspectRatio,
        imageSize: params.imageSize,
        concurrency: 2,
        onTaskComplete: (taskId, result) => {
          params.setResults((prev) => [...prev, { id: taskId, imageUrl: result }]);
        },
      });

      params.setStyleStepStatus("done");
      params.setStyleStepMessage("生成完成");
    },
    [params],
  );

  const handleGenerate = useCallback(async () => {
    if (params.workflowMode === "material") {
      // material 模式暂用与 apply 相同的两阶段流程
      if (params.sceneFiles.length === 0 || params.productFiles.length === 0 || params.designFiles.length === 0) return;
      const sceneFile = params.sceneFiles[0];
      if (!sceneFile?.file) return;

      params.setResults([]);
      params.clearTasks();
      params.setStyleStepError(null);

      const sceneImageUrl = await uploadSceneImage(sceneFile.file);
      if (!sceneImageUrl) return;

      params.setOriginalSceneUrl(sceneImageUrl);
      await runTwoStageGenerate(sceneImageUrl);
    } else if (params.workflowMode === "apply") {
      if (params.sceneFiles.length === 0 || params.productFiles.length === 0 || params.designFiles.length === 0) return;
      const sceneFile = params.sceneFiles[0];
      if (!sceneFile?.file) return;

      params.setResults([]);
      params.clearTasks();
      params.setStyleStepError(null);
      preprocessedMaterialUrlRef.current = null;
      params.setProcessedMaterialUrl(null);

      const sceneImageUrl = await uploadSceneImage(sceneFile.file);
      if (!sceneImageUrl) return;

      params.setOriginalSceneUrl(sceneImageUrl);
      await runTwoStageGenerate(sceneImageUrl);
    } else {
      if (params.productFiles.length === 0) return;

      if (params.mode === "single") {
        if (params.sceneFiles.length === 0) return;
        const sceneFile = params.sceneFiles[0];
        if (!sceneFile?.file) return;

        params.setResults([]);
        params.clearTasks();
        params.setStyleStepError(null);
        preprocessedMaterialUrlRef.current = null;
        params.setProcessedMaterialUrl(null);

        params.setStyleStepStatus("processing");
        params.setStyleStepMessage("正在处理...");

        const hasMaterial = params.materialFiles.length > 0;

        const processScene = async (): Promise<string | null> => {
          const url = await uploadSceneImage(params.sceneFiles[0]!.file!);
          if (!url) return null;

          params.setOriginalSceneUrl(url);

          if (needsStylePreprocess()) {
            const processedUrl = await doStylePreprocess(url);
            if (!processedUrl) return null;
            return processedUrl;
          } else {
            params.setStyleStepStatus("done");
            params.setStyleStepMessage("跳过风格预处理");
          }
          return url;
        };

        const [sceneImageUrl, preprocessedMaterialUrl] = await Promise.all([
          processScene(),
          hasMaterial ? params.preview.preprocessMaterialImages() : Promise.resolve(undefined),
        ]);

        if (!sceneImageUrl) return;

        if (hasMaterial && preprocessedMaterialUrl) {
          preprocessedMaterialUrlRef.current = preprocessedMaterialUrl;
          params.setProcessedMaterialUrl(preprocessedMaterialUrl);
        }

        const prompt = buildPrompt(params.currentPrompt, params.workflowMode, params.materialFiles.length);
        await params.startBatch({
          tasks: createReplaceTasks(
            sceneImageUrl,
            params.productFiles,
            params.productFileMapRef,
            prompt,
            preprocessedMaterialUrlRef.current,
          ),
          modelId: params.selectedModel,
          aspectRatio: params.aspectRatio,
          imageSize: params.imageSize,
          concurrency: 2,
          onTaskComplete: (taskId, result) => {
            params.setResults((prev) => [...prev, { id: taskId, imageUrl: result }]);
          },
        });
      } else {
        if (params.sceneItems.length === 0) return;

        params.setResults([]);
        params.clearTasks();
        params.setStyleStepError(null);
        preprocessedMaterialUrlRef.current = null;
        params.setProcessedMaterialUrl(null);
        params.setStyleStepStatus("processing");
        params.setStyleStepMessage("正在处理多场景图...");

        const hasMaterial = params.materialFiles.length > 0;
        const sceneUrlMap = new Map<string, string>();

        const processSceneItems = async (): Promise<void> => {
          for (const sceneItem of params.sceneItems) {
            if (!sceneItem.file?.file) continue;

            if (sceneItem.processedUrl) {
              sceneUrlMap.set(sceneItem.file.id, sceneItem.processedUrl);
            } else {
              const uploadResult = await uploadImageToImgbbBrowser(sceneItem.file.file);
              if (uploadResult?.url) {
                sceneUrlMap.set(sceneItem.file.id, uploadResult.url);
              }
            }
          }
        };

        const [, preprocessedMaterialUrl] = await Promise.all([
          processSceneItems(),
          hasMaterial ? params.preview.preprocessMaterialImages() : Promise.resolve(undefined),
        ]);

        if (hasMaterial && preprocessedMaterialUrl) {
          preprocessedMaterialUrlRef.current = preprocessedMaterialUrl;
          params.setProcessedMaterialUrl(preprocessedMaterialUrl);
        }

        const prompt = buildPrompt(params.currentPrompt, params.workflowMode, params.materialFiles.length);
        const allTasks = [];
        for (const sceneItem of params.sceneItems) {
          const sceneUrl = sceneUrlMap.get(sceneItem.file.id);
          if (!sceneUrl) continue;

          for (const pf of params.productFiles) {
            allTasks.push({
              id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
              prompt,
              referenceImage: sceneUrl,
              productImage: params.productFileMapRef.current.get(pf.id),
              materialImage: preprocessedMaterialUrlRef.current || undefined,
            });
          }
        }

        if (allTasks.length === 0) {
          params.setStyleStepStatus("error");
          params.setStyleStepError("没有可生成的任务");
          params.setStyleStepMessage("没有可生成的任务");
          return;
        }

        params.setStyleStepMessage(`正在批量生成 ${allTasks.length} 张图片...`);

        await params.startBatch({
          tasks: allTasks,
          modelId: params.selectedModel,
          aspectRatio: params.aspectRatio,
          imageSize: params.imageSize,
          concurrency: 2,
          onTaskComplete: (taskId, result) => {
            params.setResults((prev) => [...prev, { id: taskId, imageUrl: result }]);
          },
        });

        params.setStyleStepStatus("done");
        params.setStyleStepMessage("批量生成完成");
      }
    }
  }, [params, uploadSceneImage, needsStylePreprocess, doStylePreprocess, runTwoStageGenerate]);

  const handleRetryStylePreprocess = useCallback(async () => {
    if (!params.originalSceneUrl) return;

    params.setStyleStepStatus("processing");
    params.setStyleStepMessage("正在重试风格预处理...");
    params.setStyleStepError(null);

    const processedUrl = await doStylePreprocess(params.originalSceneUrl);
    if (processedUrl) {
      const prompt = buildPrompt(params.currentPrompt, params.workflowMode, params.materialFiles.length);
      await params.startBatch({
        tasks: createReplaceTasks(
          processedUrl,
          params.productFiles,
          params.productFileMapRef,
          prompt,
          preprocessedMaterialUrlRef.current,
        ),
        modelId: params.selectedModel,
        aspectRatio: params.aspectRatio,
        imageSize: params.imageSize,
        concurrency: 2,
        onTaskComplete: (taskId, result) => {
          params.setResults((prev) => [...prev, { id: taskId, imageUrl: result }]);
        },
      });
    }
  }, [params, doStylePreprocess]);

  const handleRetryProductReplace = useCallback(async () => {
    if (!params.processedSceneUrl && !params.originalSceneUrl) return;
    const failedTasks = params.tasks.filter((t) => t.status === "failed");
    if (failedTasks.length === 0) return;
    for (const task of failedTasks) {
      await params.retryTask(task.id);
    }
  }, [params]);

  return {
    needsStylePreprocess,
    doStylePreprocess,
    handleGenerate,
    handleRetryStylePreprocess,
    handleRetryProductReplace,
    preprocessedMaterialUrlRef,
  };
}
