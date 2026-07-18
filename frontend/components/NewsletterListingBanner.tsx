"use client";

import { useEffect, useState } from "react";
import { TrendingDown } from "lucide-react";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import NewsletterInlineForm from "./NewsletterInlineForm";

const IS_HR = CURRENT_MARKET === "hr";

export default function NewsletterListingBanner() {
  const [subscribed, setSubscribed] = useState(true); // default hidden until we check, avoids flash

  useEffect(() => {
    try {
      setSubscribed(localStorage.getItem("newsletter_subscribed") === "1");
    } catch {
      setSubscribed(false);
    }
  }, []);

  if (subscribed) return null;

  return (
    <div className="my-1 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#131921] to-[#1B2B4B] flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#FF9900]/15 flex items-center justify-center shrink-0">
          <TrendingDown className="w-5 h-5 text-[#FF9900]" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">
            {IS_HR ? "Ne propusti najveće padove cijena" : "Ne propusti najveće padove cena"}
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            {IS_HR ? "2x mjesečno u inbox. Bez spama." : "2x mesečno u inbox. Bez spama."}
          </p>
        </div>
      </div>
      <div className="sm:ml-auto sm:max-w-xs w-full">
        <NewsletterInlineForm source="inline_banner" variant="dark" />
      </div>
    </div>
  );
}
