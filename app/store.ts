import { create } from "zustand";

interface FormulaState {
  formula: string[];
  addTag: (tag: string) => void;
  removeTag: (index: number) => void;
  updateTag: (index: number, newTag: string) => void;
}

export const useFormulaStore = create<FormulaState>((set) => ({
  formula: [],
  addTag: (tag) => set((state) => ({ formula: [...state.formula, tag] })),
  removeTag: (index) =>
    set((state) => ({ formula: state.formula.filter((_, i) => i !== index) })),
  updateTag: (index, newTag) =>
    set((state) => ({
      formula: state.formula.map((tag, i) => (i === index ? newTag : tag)),
    })),
}));
