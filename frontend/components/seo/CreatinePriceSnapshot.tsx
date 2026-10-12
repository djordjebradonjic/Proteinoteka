import Link from "next/link";
import { getCreatineGuideStats, type Pack } from "@/lib/creatine-guide-stats";
import { CURRENT_MARKET } from "@/lib/marketConfig";
import { CREATINE_PATH, storeCount } from "@/lib/creatine";
import { displayName } from "@/lib/productDisplayName";
import { formatPrice } from "@/lib/formatPrice";
import { productUrl } from "@/lib/productUrl";

// The price section of the creatine guides, written from the live catalog. No number in here is typed by hand;
// it renders nothing when the market carries too few creatine powders to say anything.

const HR = CURRENT_MARKET === "hr";

const COPY = HR
  ? {
      h2: "Koliko kreatin košta u Hrvatskoj: stvarne cijene",
      pack: "pakiranje",
      band: { small: "do 300 g", medium: "300 – 600 g", large: "preko 600 g" },
      th: { pack: "Veličina pakiranja", offers: "Ponuda", median: "Medijan / 100 g", cheapest: "Najpovoljnije / 100 g" },
      rankedH: "Pet najpovoljnijih brendova (njihovo najpovoljnije pakiranje od 250 g naviše)",
      thRanked: { name: "Kreatin", size: "Pakiranje", price: "Cijena", per100: "Za 100 g", dose: "Po dozi (5 g)" },
      source: "Cijene su iz baze Proteinoteke i osvježavaju se redovito; prije kupnje provjeri cijenu u trgovini. Prikazani su samo praškasti kreatin monohidrat. Kapsule i tablete namjerno nisu uključene jer mnoga pakiranja ne navode koliko kreatina zaista sadrže.",
      all: "Sve ponude kreatina, s filterima",
    }
  : {
      h2: "Koliko kreatin košta u Srbiji: stvarne cene",
      pack: "pakovanje",
      band: { small: "do 300 g", medium: "300 – 600 g", large: "preko 600 g" },
      th: { pack: "Veličina pakovanja", offers: "Ponuda", median: "Medijana / 100 g", cheapest: "Najpovoljnije / 100 g" },
      rankedH: "Pet najpovoljnijih brendova (njihovo najpovoljnije pakovanje od 250 g naviše)",
      thRanked: { name: "Kreatin", size: "Pakovanje", price: "Cena", per100: "Za 100 g", dose: "Po dozi (5 g)" },
      source: "Cene su iz baze Proteinoteke i redovno se osvežavaju; pre kupovine proveri cenu u prodavnici. Prikazan je samo kreatin monohidrat u prahu. Kapsule i tablete namerno nisu uključene jer mnoga pakovanja ne navode koliko kreatina zaista sadrže.",
      all: "Sve ponude kreatina, sa filterima",
    };

function packWord(n: number): string {
  if (HR) return n % 10 === 1 && n % 100 !== 11 ? "pakiranje" : "pakiranja";
  return n % 10 === 1 && n % 100 !== 11 ? "pakovanje" : "pakovanja";
}

function grams(g: number): string {
  return g >= 1000 ? `${String(Math.round(g / 100) / 10).replace(".", ",")} kg` : `${Math.round(g)} g`;
}

function pct(n: number): number {
  return Math.round(Math.abs(n) * 100);
}

// A few stores file the product name in the brand field ("300G (KREATIN MONOHIDRAT)"); prefixing that would
// print the name twice, so the brand is only added when it is a brand.
function label(product: Pack["product"]): string {
  return /kreatin|creatine/i.test(product.brand ?? "") ? product.name : displayName(product);
}

function PackLink({ pack }: { pack: Pack }) {
  const { product } = pack;
  return (
    <Link href={productUrl(product)} className="text-slate-800 hover:text-[#FF9900] underline-offset-2 hover:underline">
      {label(product)}
    </Link>
  );
}

export default async function CreatinePriceSnapshot({ linkToListing }: { linkToListing: boolean }) {
  const s = await getCreatineGuideStats();
  if (!s) return null;

  const small = s.bands.find((b) => b.key === "small");
  const large = s.bands.find((b) => b.key === "large");
  const bulkSaving = small && large ? 1 - large.median100 / small.median100 : null;
  const yearSaving = (s.monthMedian - s.monthMin) * 12;
  const creapureGap = s.creapure ? s.creapure.median100 / s.median100 - 1 : null;

  const intro = HR ? (
    <>
      Prošli smo kroz <strong className="text-slate-900">{s.count} {packWord(s.count)}</strong> kreatin monohidrata u prahu iz{" "}
      <strong className="text-slate-900">{storeCount(s.stores)}</strong>. Medijan je{" "}
      <strong className="text-slate-900">{formatPrice(s.median100)} za 100 g</strong>, a to je{" "}
      <strong className="text-slate-900">{formatPrice(s.doseMedian)} po dozi od 5 g</strong>. Mjesec dana na medijanu (5 g dnevno)
      stoji {formatPrice(s.monthMedian)}, a na najpovoljnijem vjerodostojnom pakiranju {formatPrice(s.monthMin)}. Kroz godinu
      dana razlika između nasumične i pametne kupnje iznosi oko <strong className="text-slate-900">{formatPrice(yearSaving)}</strong>:
      za isti kreatin, istog sastava.
    </>
  ) : (
    <>
      Prošli smo kroz <strong className="text-slate-900">{s.count} {packWord(s.count)}</strong> kreatin monohidrata u prahu iz{" "}
      <strong className="text-slate-900">{storeCount(s.stores)}</strong>. Medijana je{" "}
      <strong className="text-slate-900">{formatPrice(s.median100)} za 100 g</strong>, što je{" "}
      <strong className="text-slate-900">{formatPrice(s.doseMedian)} po dozi od 5 g</strong>. Mesec dana na medijani (5 g dnevno)
      košta {formatPrice(s.monthMedian)}, a na najpovoljnijem verodostojnom pakovanju {formatPrice(s.monthMin)}. Kroz godinu
      dana razlika između nasumične i pametne kupovine iznosi oko <strong className="text-slate-900">{formatPrice(yearSaving)}</strong>:
      za isti kreatin, istog sastava.
    </>
  );

  const bulk = bulkSaving !== null && bulkSaving > 0.05 ? (
    HR ? (
      <p>
        Veličina pakiranja ovdje je najjači pojedinačni faktor. Gram kreatina u pakiranju preko 600 g po medijanu je{" "}
        <strong className="text-slate-900">{pct(bulkSaving)}% jeftiniji</strong> nego u pakiranju do 300 g. Kreatin se ne kvari
        (suh prah stoji godinama), pa je veliko pakiranje gotovo uvijek pametniji izbor, osim ako ga prvi put isprobavaš.
      </p>
    ) : (
      <p>
        Veličina pakovanja je ovde najjači pojedinačni faktor. Gram kreatina u pakovanju preko 600 g je po medijani{" "}
        <strong className="text-slate-900">{pct(bulkSaving)}% jeftiniji</strong> nego u pakovanju do 300 g. Kreatin se ne kvari
        (suv prah stoji godinama), pa je veliko pakovanje skoro uvek pametniji izbor, osim ako ga prvi put isprobavaš.
      </p>
    )
  ) : null;

  const premium = s.creapure && creapureGap !== null ? (
    HR ? (
      <p>
        Creapure® (njemački monohidrat s provjerenom čistoćom) ima{" "}
        {s.creapure.count} {packWord(s.creapure.count)} u ponudi i medijan od {formatPrice(s.creapure.median100)} za 100 g,{" "}
        {creapureGap >= 0 ? <>to jest <strong className="text-slate-900">{pct(creapureGap)}% skuplje</strong> od običnog monohidrata</> : <>to jest <strong className="text-slate-900">{pct(creapureGap)}% jeftinije</strong> od običnog monohidrata</>}.
        Je li to vrijedno, ovisi o tebi; o razlozima za i protiv pišemo u poglavlju o vrstama kreatina.
      </p>
    ) : (
      <p>
        Creapure® (nemački monohidrat sa proverenom čistoćom) ima{" "}
        {s.creapure.count} {packWord(s.creapure.count)} u ponudi i medijanu od {formatPrice(s.creapure.median100)} za 100 g,{" "}
        {creapureGap >= 0 ? <>to jest <strong className="text-slate-900">{pct(creapureGap)}% skuplje</strong> od običnog monohidrata</> : <>to jest <strong className="text-slate-900">{pct(creapureGap)}% jeftinije</strong> od običnog monohidrata</>}.
        Da li se to isplati, zavisi od tebe; razloge za i protiv pišemo u poglavlju o vrstama kreatina.
      </p>
    )
  ) : null;

  return (
    <section className="mb-10" id={HR ? "cijene" : "cene"}>
      <h2 className="text-xl font-bold text-slate-900 mb-4">{COPY.h2}</h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
        <p>{intro}</p>
        {bulk}
        {premium}
      </div>

      {s.bands.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{COPY.th.pack}</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">{COPY.th.offers}</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">{COPY.th.median}</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{COPY.th.cheapest}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {s.bands.map((b) => (
                <tr key={b.key}>
                  <td className="px-3 py-2.5 text-[13px] font-medium text-slate-800">{COPY.band[b.key]}</td>
                  <td className="px-3 py-2.5 text-center text-[13px] text-slate-600">{b.count}</td>
                  <td className="px-3 py-2.5 text-center text-[13px] text-slate-700">{formatPrice(b.median100)}</td>
                  <td className="px-3 py-2.5 text-[13px] text-slate-700">
                    <span className="font-semibold text-slate-900">{formatPrice(b.cheapest.per100)}</span>{" "}
                    <span className="text-slate-400">·</span> <PackLink pack={b.cheapest} />, {grams(b.cheapest.packGrams)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {s.ranked.length > 0 && (
        <>
          <h3 className="text-[17px] font-bold text-slate-800 mt-8 mb-3">{COPY.rankedH}</h3>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">{COPY.thRanked.name}</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">{COPY.thRanked.size}</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 hidden sm:table-cell">{COPY.thRanked.price}</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500">{COPY.thRanked.per100}</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 hidden sm:table-cell">{COPY.thRanked.dose}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {s.ranked.map((r) => (
                  <tr key={r.product.id}>
                    <td className="px-3 py-2.5 text-[13px]"><PackLink pack={r} /></td>
                    <td className="px-3 py-2.5 text-center text-[13px] text-slate-600">{grams(r.packGrams)}</td>
                    <td className="px-3 py-2.5 text-center text-[13px] text-slate-600 hidden sm:table-cell">{formatPrice(r.product.numericPrice)}</td>
                    <td className="px-3 py-2.5 text-center text-[13px] font-semibold text-slate-900">{formatPrice(r.per100)}</td>
                    <td className="px-3 py-2.5 text-center text-[13px] text-slate-600 hidden sm:table-cell">{formatPrice((r.per100 * 5) / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-[13px] text-slate-500 leading-relaxed mt-4">{COPY.source}</p>
      {linkToListing && (
        <p className="mt-3">
          <Link href={CREATINE_PATH} className="inline-block px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-[#FF9900] hover:text-[#FF9900] transition-colors shadow-sm">
            {COPY.all} →
          </Link>
        </p>
      )}
    </section>
  );
}
