import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "@/types/product";

interface WishlistState {
  items: Product[];
  count: number;
  isOpen: boolean;
}

// Učitaj iz localStorage
const loadFromStorage = (): Product[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Sačuvaj u localStorage
const saveToStorage = (items: Product[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("wishlist", JSON.stringify(items));
  } catch {
    // ignore
  }
};

const savedItems = loadFromStorage();

const initialState: WishlistState = {
  items: savedItems,
  count: savedItems.length,
  isOpen: false,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<Product>) => {
      const exists = state.items.find((p) => p.id === action.payload.id);
      if (!exists) {
        state.items.push(action.payload);
        state.count = state.items.length;
        saveToStorage(state.items as Product[]);
      }
    },
    removeFromWishlist: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
      state.count = state.items.length;
      saveToStorage(state.items as Product[]);
    },
    clearWishlist: (state) => {
      state.items = [];
      state.count = 0;
      saveToStorage([]);
    },
    openWishlist: (state) => { state.isOpen = true; },
    closeWishlist: (state) => { state.isOpen = false; },
    toggleWishlist: (state) => { state.isOpen = !state.isOpen; },
    // backward compatibility
    increment: (state) => { state.count += 1; },
    decrement: (state) => { state.count = Math.max(0, state.count - 1); },
    setCount: (state, action: PayloadAction<number>) => { state.count = action.payload; },
  },
});

export const {
  addToWishlist, removeFromWishlist, clearWishlist,
  openWishlist, closeWishlist, toggleWishlist,
  increment, decrement, setCount,
} = wishlistSlice.actions;
export default wishlistSlice.reducer;