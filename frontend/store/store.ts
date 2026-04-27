import { configureStore } from "@reduxjs/toolkit";
import wishlistReducer from "./wishlistSlice";
import compareReducer from "./compareSlice";

export const store = configureStore({
  reducer: {
    wishlist: wishlistReducer,
    compare: compareReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;