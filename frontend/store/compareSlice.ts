import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CompareItem {
  id: number;
  name: string;
}

interface CompareState {
  ids: number[];
  items: CompareItem[];
}

const initialState: CompareState = { ids: [], items: [] };

const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    addToCompare: (state, action: PayloadAction<CompareItem>) => {
      if (state.ids.length < 4 && !state.ids.includes(action.payload.id)) {
        state.ids.push(action.payload.id);
        state.items.push(action.payload);
      }
    },
    removeFromCompare: (state, action: PayloadAction<number>) => {
      state.ids   = state.ids.filter(id => id !== action.payload);
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    clearCompare: (state) => {
      state.ids   = [];
      state.items = [];
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;
