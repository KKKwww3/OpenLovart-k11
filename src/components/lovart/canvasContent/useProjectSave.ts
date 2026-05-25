import { useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { CanvasElement } from "@/components/lovart/CanvasArea";
import { useSupabase } from "@/hooks/useSupabase";

interface UseProjectSaveParams {
  supabase: ReturnType<typeof useSupabase>;
  elements: CanvasElement[];
  title: string;
  currentProjectId: string | null;
  isLoading: boolean;
  isInitializedRef: React.MutableRefObject<boolean>;
  saveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  isSavingRef: React.MutableRefObject<boolean>;
  needsSaveRef: React.MutableRefObject<boolean>;
  setCurrentProjectId: (id: string | null) => void;
  setSaveStatus: (status: "saved" | "saving" | "offline") => void;
  setIsLoading: (loading: boolean) => void;
  setTitle: (title: string) => void;
  setElements: (
    elements: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[]),
  ) => void;
}

export function useProjectSave(params: UseProjectSaveParams) {
  const {
    supabase,
    elements,
    title,
    currentProjectId,
    isLoading,
    isInitializedRef,
    saveTimeoutRef,
    isSavingRef,
    needsSaveRef,
    setCurrentProjectId,
    setSaveStatus,
    setIsLoading,
    setTitle,
    setElements,
  } = params;

  const saveProject = useCallback(async () => {
    if (!supabase) {
      console.log("Save skipped: Supabase client not initialized yet");
      return;
    }

    if (isSavingRef.current) {
      needsSaveRef.current = true;
      return;
    }

    isSavingRef.current = true;
    console.log("Starting save...", {
      projectId: currentProjectId,
      elementsCount: elements.length,
    });

    try {
      setSaveStatus("saving");

      if (currentProjectId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: projectError } = await (supabase as any)
          .from("projects")
          .update({
            title,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentProjectId);

        if (projectError) throw projectError;

        const { error: deleteError } = await supabase
          .from("canvas_elements")
          .delete()
          .eq("project_id", currentProjectId);

        if (deleteError) throw deleteError;

        if (elements.length > 0) {
          const uniqueElements = Array.from(
            new Map(elements.map((item) => [item.id, item])).values(),
          );

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: elementsError } = await (supabase as any)
            .from("canvas_elements")
            .insert(
              uniqueElements.map((el) => ({
                project_id: currentProjectId,
                element_data: el,
              })),
            );

          if (elementsError) throw elementsError;
        }
      } else {
        const newProjectId = uuidv4();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: projectError } = await (supabase as any)
          .from("projects")
          .insert({
            id: newProjectId,
            title,
          });

        if (projectError) throw projectError;

        if (elements.length > 0) {
          const uniqueElements = Array.from(
            new Map(elements.map((item) => [item.id, item])).values(),
          );

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: elementsError } = await (supabase as any)
            .from("canvas_elements")
            .insert(
              uniqueElements.map((el) => ({
                project_id: newProjectId,
                element_data: el,
              })),
            );

          if (elementsError) throw elementsError;
        }

        setCurrentProjectId(newProjectId);
        window.history.pushState({}, "", `/lovart/canvas?id=${newProjectId}`);
      }

      console.log("Save successful!");
      setSaveStatus("saved");
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      console.error("Failed to save project:", {
        message: err?.message ?? String(error),
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
      });
      setSaveStatus("offline");
    } finally {
      isSavingRef.current = false;
      if (needsSaveRef.current) {
        needsSaveRef.current = false;
        saveProject();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, currentProjectId, title, elements]);

  const loadProject = useCallback(
    async (id: string) => {
      if (!supabase) {
        console.log("Load skipped: Supabase client not initialized yet");
        return;
      }

      try {
        setIsLoading(true);
        console.log("Loading project:", id);

        const [projectResult, elementsResult] = await Promise.all([
          supabase.from("projects").select("*").eq("id", id).single(),
          supabase.from("canvas_elements").select("*").eq("project_id", id),
        ]);

        if (projectResult.error) throw projectResult.error;
        const project = projectResult.data;
        if (project) {
          console.log("Project loaded:", project);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setTitle((project as any).title);
        }

        setCurrentProjectId(id);
        console.log("Set currentProjectId to:", id);

        if (elementsResult.error) throw elementsResult.error;

        const canvasElements = elementsResult.data;
        console.log("Canvas elements loaded:", canvasElements?.length || 0);
        if (canvasElements && canvasElements.length > 0) {
          const loadedElements = canvasElements.map(
            (ce: { element_data: CanvasElement }) => ce.element_data,
          );
          const uniqueElements = Array.from(
            new Map(loadedElements.map((item) => [item.id, item])).values(),
          );
          console.log("Unique elements after dedup:", uniqueElements.length);
          setElements(uniqueElements);
        } else {
          console.log("No canvas elements found for this project");
          setElements([]);
        }
      } catch (error: unknown) {
        console.error("Failed to load project:", error);
        if (error instanceof Error) {
          console.error("  message:", error.message);
          console.error("  stack:", error.stack);
        }
        const err = error as Record<string, unknown>;
        if (err.code || err.details || err.hint) {
          console.error("  code:", err.code, "details:", err.details, "hint:", err.hint);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [supabase, setTitle, setElements, setIsLoading, setCurrentProjectId],
  );

  useEffect(() => {
    if (isLoading || !isInitializedRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveProject();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, title, isLoading, saveProject]);

  return { saveProject, loadProject };
}
