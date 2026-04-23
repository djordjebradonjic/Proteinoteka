import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CompareState {
  ids: number[];
}

const initialState: CompareState = { ids: [] };

const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    addToCompare: (state, action: PayloadAction<number>) => {
      if (state.ids.length < 4 && !state.ids.includes(action.payload)) {
        state.ids.push(action.payload);
      }
    },
    removeFromCompare: (state, action: PayloadAction<number>) => {
      state.ids = state.ids.filter((id) => id !== action.payload);
    },
    clearCompare: (state) => {
      state.ids = [];
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;