import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { UploadedFile } from "../../UploadZone";
import type { ResultItem } from "../../ResultPreview";
import type { StepStatus, ModeType, WorkflowMode } from "../types";

export interface UseFileHandlersParams {
  setSceneFiles: Dispatch<SetStateAction<UploadedFile[]>>;
  setProcessedSceneUrl: Dispatch<SetStateAction<string | null>>;
  setOriginalSceneUrl: Dispatch<SetStateAction<string | null>>;
  setStyleStepStatus: Dispatch<SetStateAction<StepStatus>>;
  setStyleStepError: Dispatch<SetStateAction<string | null>>;
  productFileMapRef: React.MutableRefObject<Map<string, File>>;
  setProductFiles: Dispatch<SetStateAction<UploadedFile[]>>;
  materialFileMapRef: React.MutableRefObject<Map<string, File>>;
  setMaterialFiles: Dispatch<SetStateAction<UploadedFile[]>>;
  edgeFileMapRef: React.MutableRefObject<Map<string, File>>;
  setEdgeFiles: Dispatch<SetStateAction<UploadedFile[]>>;
  setMode: Dispatch<SetStateAction<ModeType>>;
  setSceneItems: Dispatch<
    SetStateAction<
      Array<{
        file: UploadedFile;
        processedUrl: string | null;
        originalUrl: string | null;
        styleStatus: StepStatus;
        styleMessage: string;
        styleError: string | null;
      }>
    >
  >;
  setResults: Dispatch<SetStateAction<ResultItem[]>>;
  clearTasks: () => void;
  designFileMapRef: React.MutableRefObject<Map<string, File>>;
  setDesignFiles: Dispatch<SetStateAction<UploadedFile[]>>;
  setWorkflowMode: Dispatch<SetStateAction<WorkflowMode>>;
  materialRefFileMapRef: React.MutableRefObject<Map<string, File>>;
}

export interface UseFileHandlersReturn {
  handleSceneChange: (files: UploadedFile[]) => void;
  handleProductChange: (files: UploadedFile[]) => void;
  handleMaterialChange: (files: UploadedFile[]) => void;
  handleEdgeChange: (files: UploadedFile[]) => void;
  handleModeChange: (newMode: ModeType) => void;
  handleSceneItemsChange: (
    items: Array<{
      file: UploadedFile;
      processedUrl: string | null;
      styleStatus: StepStatus;
    }>,
  ) => void;
  handleDesignChange: (files: UploadedFile[]) => void;
  handleWorkflowModeChange: (newMode: WorkflowMode) => void;
  handleMaterialRefChange: (designId: string, file: File | null) => void;
}

export function useFileHandlers(
  params: UseFileHandlersParams,
): UseFileHandlersReturn {
  const handleSceneChange = useCallback(
    (files: UploadedFile[]) => {
      params.setSceneFiles(files);
      params.setProcessedSceneUrl(null);
      params.setOriginalSceneUrl(null);
      params.setStyleStepStatus("idle");
      params.setStyleStepError(null);
    },
    [params],
  );

  const handleProductChange = useCallback(
    (files: UploadedFile[]) => {
      files.forEach((f) => {
        if (f.file) {
          params.productFileMapRef.current.set(f.id, f.file);
        }
      });
      params.setProductFiles(files);
    },
    [params],
  );

  const handleMaterialChange = useCallback(
    (files: UploadedFile[]) => {
      files.forEach((f) => {
        if (f.file) {
          params.materialFileMapRef.current.set(f.id, f.file);
        } else {
          params.materialFileMapRef.current.delete(f.id);
        }
      });
      params.setMaterialFiles(files);
    },
    [params],
  );

  const handleEdgeChange = useCallback(
    (files: UploadedFile[]) => {
      files.forEach((f) => {
        if (f.file) {
          params.edgeFileMapRef.current.set(f.id, f.file);
        } else {
          params.edgeFileMapRef.current.delete(f.id);
        }
      });
      params.setEdgeFiles(files);
    },
    [params],
  );

  const handleModeChange = useCallback(
    (newMode: ModeType) => {
      params.setMode(newMode);
      params.setSceneFiles([]);
      params.setSceneItems([]);
      params.setProcessedSceneUrl(null);
      params.setOriginalSceneUrl(null);
      params.setStyleStepStatus("idle");
      params.setStyleStepError(null);
      params.setResults([]);
      params.clearTasks();
    },
    [params],
  );

  const handleSceneItemsChange = useCallback(
    (
      items: Array<{
        file: UploadedFile;
        processedUrl: string | null;
        styleStatus: StepStatus;
      }>,
    ) => {
      params.setSceneItems(
        items.map((item) => ({
          ...item,
          originalUrl: null,
          styleMessage: "",
          styleError: null,
        })),
      );
    },
    [params],
  );

  const handleDesignChange = useCallback(
    (files: UploadedFile[]) => {
      files.forEach((f) => {
        if (f.file) {
          params.designFileMapRef.current.set(f.id, f.file);
        }
      });
      params.setDesignFiles(files);
    },
    [params],
  );

  const handleWorkflowModeChange = useCallback(
    (newMode: WorkflowMode) => {
      params.setWorkflowMode(newMode);
      params.setSceneFiles([]);
      params.setProductFiles([]);
      params.setDesignFiles([]);
      params.setSceneItems([]);
      params.setProcessedSceneUrl(null);
      params.setOriginalSceneUrl(null);
      params.setStyleStepStatus("idle");
      params.setStyleStepError(null);
      params.setResults([]);
      params.clearTasks();
    },
    [params],
  );

  const handleMaterialRefChange = useCallback(
    (designId: string, file: File | null) => {
      if (file) {
        params.materialRefFileMapRef.current.set(designId, file);
      } else {
        params.materialRefFileMapRef.current.delete(designId);
      }
    },
    [params],
  );

  return {
    handleSceneChange,
    handleProductChange,
    handleMaterialChange,
    handleEdgeChange,
    handleModeChange,
    handleSceneItemsChange,
    handleDesignChange,
    handleWorkflowModeChange,
    handleMaterialRefChange,
  };
}
