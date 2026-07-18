import { CURRENT_MARKET } from "@/lib/marketConfig";
import NewsletterInlineForm, { NewsletterSource } from "@/components/NewsletterInlineForm";

const IS_HR = CURRENT_MARKET === "hr";

interface Props {
  source: NewsletterSource;
  className?: string;
  /** Use "h1" when this is the page's primary heading (e.g. /kontakt) */
  headingLevel?: "h1" | "h2";
}

export default function NewsletterSection({ source, className = "", headingLevel = "h2" }: Props) {
  const Heading = headingLevel;
  return (
    <div className={`rounded-2xl bg-gradient-to-br from-[#131921] to-[#1B2B4B] py-10 px-6 sm:px-10 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF9900] mb-3">
        Newsletter
      </p>
      <Heading className="text-2xl sm:text-3xl font-black text-white mb-2 max-w-md">
        {IS_HR
          ? "Uštedi do 20% — mi pratimo cijene, ti samo štediš"
          : "Uštedi do 20% — mi pratimo cene, ti samo štediš"}
      </Heading>
      <p className="text-sm text-white/70 mb-6 max-w-md">
        {IS_HR
          ? "Dva puta mjesečno šaljemo ti popis proizvoda čija je cijena pala i do 20%. Bez pretraživanja po stranicama — mi pratimo, ti samo klikneš i uštediš."
          : "Dva puta mesečno šaljemo ti listu proizvoda čija je cena pala i do 20%. Bez pretrage po sajtovima — mi pratimo, ti samo klikneš i uštediš."}
      </p>
      <div className="sm:max-w-md">
        <NewsletterInlineForm
          source={source}
          variant="dark"
          ctaLabel={IS_HR ? "Počnem štedjeti" : "Počni da štedim"}
        />
      </div>
    </div>
  );
}
