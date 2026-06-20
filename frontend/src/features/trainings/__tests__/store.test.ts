import { describe, it, expect, beforeEach } from "vitest";
import { useTrainingStore } from "../store";

beforeEach(() => {
  useTrainingStore.setState({
    umkmId: "",
    filters: { category: "Semua Pelatihan", search: "" },
    lessonState: { currentModuleId: null, completedModules: [] },
    selectedTrainingId: null,
  });
});

describe("TrainingStore", () => {
  it("has correct initial state", () => {
    const state = useTrainingStore.getState();
    expect(state.umkmId).toBe("");
    expect(state.filters.category).toBe("Semua Pelatihan");
    expect(state.filters.search).toBe("");
    expect(state.lessonState.currentModuleId).toBeNull();
    expect(state.lessonState.completedModules).toEqual([]);
    expect(state.selectedTrainingId).toBeNull();
  });

  it("setUmkmId updates umkmId", () => {
    useTrainingStore.getState().setUmkmId("UMK000001");
    expect(useTrainingStore.getState().umkmId).toBe("UMK000001");
  });

  it("setFilters merges partial filters", () => {
    useTrainingStore.getState().setFilters({ search: "digital" });
    const state = useTrainingStore.getState();
    expect(state.filters.category).toBe("Semua Pelatihan");
    expect(state.filters.search).toBe("digital");
  });

  it("setFilters overrides existing category", () => {
    useTrainingStore.getState().setFilters({ category: "Online" });
    expect(useTrainingStore.getState().filters.category).toBe("Online");
  });

  it("resetFilters restores default filters", () => {
    useTrainingStore.getState().setFilters({ category: "Offline", search: "test" });
    useTrainingStore.getState().resetFilters();
    const state = useTrainingStore.getState();
    expect(state.filters.category).toBe("Semua Pelatihan");
    expect(state.filters.search).toBe("");
  });

  it("setCurrentModule updates currentModuleId", () => {
    useTrainingStore.getState().setCurrentModule("MOD001");
    expect(useTrainingStore.getState().lessonState.currentModuleId).toBe("MOD001");
  });

  it("markModuleCompleted adds module to completed list", () => {
    useTrainingStore.getState().markModuleCompleted("MOD001");
    expect(useTrainingStore.getState().lessonState.completedModules).toContain("MOD001");
  });

  it("markModuleCompleted does not duplicate", () => {
    useTrainingStore.getState().markModuleCompleted("MOD001");
    useTrainingStore.getState().markModuleCompleted("MOD001");
    expect(useTrainingStore.getState().lessonState.completedModules).toHaveLength(1);
  });

  it("markModuleCompleted tracks multiple modules", () => {
    useTrainingStore.getState().markModuleCompleted("MOD001");
    useTrainingStore.getState().markModuleCompleted("MOD002");
    useTrainingStore.getState().markModuleCompleted("MOD003");
    expect(useTrainingStore.getState().lessonState.completedModules).toHaveLength(3);
  });

  it("resetLessonState restores defaults", () => {
    useTrainingStore.getState().setCurrentModule("MOD001");
    useTrainingStore.getState().markModuleCompleted("MOD001");
    useTrainingStore.getState().resetLessonState();
    const state = useTrainingStore.getState();
    expect(state.lessonState.currentModuleId).toBeNull();
    expect(state.lessonState.completedModules).toEqual([]);
  });

  it("setSelectedTrainingId updates selectedTrainingId", () => {
    useTrainingStore.getState().setSelectedTrainingId("PLT001");
    expect(useTrainingStore.getState().selectedTrainingId).toBe("PLT001");
  });

  it("setSelectedTrainingId accepts null", () => {
    useTrainingStore.getState().setSelectedTrainingId("PLT001");
    useTrainingStore.getState().setSelectedTrainingId(null);
    expect(useTrainingStore.getState().selectedTrainingId).toBeNull();
  });
});
