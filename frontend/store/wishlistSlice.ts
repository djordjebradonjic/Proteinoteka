import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WishlistState {
  count: number;
}

const initialState: WishlistState = { count: 0 };

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    increment: (state) => { state.count += 1; },
    decrement: (state) => { state.count = Math.max(0, state.count - 1); },
    setCount: (state, action: PayloadAction<number>) => { state.count = action.payload; },
  },
});

export const { increment, decrement, setCount } = wishlistSlice.actions;
export default wishlistSlice.reducer;