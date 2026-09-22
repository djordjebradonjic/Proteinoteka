"use client";

import dynamic from "next/dynamic";
import KontaktFoma from "@/components/KontaktFoma";

// The wishlist drawer is opened from the header's heart on every page; `ssr: false` is only allowed in a
// client component, which is why the server-rendered creatine pages mount it through this wrapper.
const WishlistDrawer = dynamic(() => import("@/components/WishlistDrawer"), { ssr: false });

export default function CreatineExtras({ contact = true }: { contact?: boolean }) {
  return (
    <>
      {contact && <KontaktFoma />}
      <WishlistDrawer />
    </>
  );
}
