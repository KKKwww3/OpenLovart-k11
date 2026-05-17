import { useState, useCallback, useRef } from "react";
import { generateImage, GenerateImageResponse } from "@/lib/edge-functions";

export interface BatchTask {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  prompt: string;
  referenceImage?: string;
  result?: string;
  error?: string;
  progress: number;
}

export interface BatchGenerationOptions {
  tasks: Omit<BatchTask, "status" | "result" | "error" | "progress">[];
  model?: string;
  concurrency?: number;
  onTaskComplete?: (taskId: string, result: string) => void;
  onTaskError?: (taskId: string, error: string) => void;
  onAllComplete?: (results: BatchTask[]) => void;
}

export interface UseBatchGenerationReturn {
  tasks: BatchTask[];
  isProcessing: boolean;
  overallProgress: number;
  startBatch: (options: BatchGenerationOptions) => Promise<void>;
  cancelBatch: () => void;
  retryTask: (taskId: string) => Promise<void>;
  clearTasks: () => void;
}

export function useBatchGeneration(): UseBatchGenerationReturn {
  const [tasks, setTasks] = useState<BatchTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const cancelRef = useRef(false);
  const currentOptionsRef = useRef<BatchGenerationOptions | null>(null);

  const overallProgress =
    tasks.length > 0
      ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length
      : 0;

  const processTask = async (
    task: BatchTask,
    model?: string,
  ): Promise<BatchTask> => {
    try {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: "processing", progress: 10 } : t,
        ),
      );

      const response: GenerateImageResponse = await generateImage({
        prompt: task.prompt,
        referenceImage: task.referenceImage,
        mimeType: task.referenceImage ? "image/jpeg" : undefined,
        model,
      });

      if (!response.imageData) {
        throw new Error(response.textResponse || "未生成图片");
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "completed", result: response.imageData, progress: 100 }
            : t,
        ),
      );

      return { ...task, status: "completed", result: response.imageData, progress: 100 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "生成失败";
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "failed", error: errorMessage, progress: 0 }
            : t,
        ),
      );
      return { ...task, status: "failed", error: errorMessage, progress: 0 };
    }
  };

  const startBatch = useCallback(async (options: BatchGenerationOptions) => {
    cancelRef.current = false;
    currentOptionsRef.current = options;
    setIsProcessing(true);

    const initialTasks: BatchTask[] = options.tasks.map((t) => ({
      ...t,
      status: "pending" as const,
      progress: 0,
    }));

    setTasks(initialTasks);

    const concurrency = options.concurrency || 2;
    const results: BatchTask[] = [];
    const queue = [...initialTasks];
    const processing: Promise<void>[] = [];

    const processQueue = async () => {
      while (queue.length > 0 && !cancelRef.current) {
        const task = queue.shift();
        if (!task) break;

        const result = await processTask(task, options.model);
        results.push(result);

        if (result.status === "completed" && options.onTaskComplete) {
          options.onTaskComplete(result.id, result.result!);
        } else if (result.status === "failed" && options.onTaskError) {
          options.onTaskError(result.id, result.error!);
        }
      }
    };

    const workers = Array(Math.min(concurrency, initialTasks.length))
      .fill(null)
      .map(() => processQueue());

    await Promise.all(workers);

    setIsProcessing(false);

    if (!cancelRef.current && options.onAllComplete) {
      options.onAllComplete(results);
    }
  }, []);

  const cancelBatch = useCallback(() => {
    cancelRef.current = true;
    setIsProcessing(false);
    setTasks((prev) =>
      prev.map((t) =>
        t.status === "pending" || t.status === "processing"
          ? { ...t, status: "failed", error: "已取消" }
          : t,
      ),
    );
  }, []);

  const retryTask = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: "pending", error: undefined, progress: 0 } : t,
        ),
      );

      const model = currentOptionsRef.current?.model;
      await processTask({ ...task, status: "pending", progress: 0 }, model);
    },
    [tasks],
  );

  const clearTasks = useCallback(() => {
    setTasks([]);
  }, []);

  return {
    tasks,
    isProcessing,
    overallProgress,
    startBatch,
    cancelBatch,
    retryTask,
    clearTasks,
  };
}
