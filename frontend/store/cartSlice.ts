import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CartState {
  count: number;
}

const initialState: CartState = { count: 0 };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    increment: (state) => { state.count += 1; },
    decrement: (state) => { state.count = Math.max(0, state.count - 1); },
    setCount: (state, action: PayloadAction<number>) => { state.count = action.payload; },
  },
});

export const { increment, decrement, setCount } = cartSlice.actions;
export default cartSlice.reducer;