import Link from "next/link";

export default function Footer() {
  return (
    <footer
      style={{ backgroundColor: "#1B2B4B" }}
      className="text-white mt-auto"
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Gornji deo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          {/* Logo + opis */}
          <div className="col-span-2 md:col-span-1">
            <svg
              width="160"
              height="42"
              viewBox="0 0 690 210"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-3"
            >
              <g transform="translate(28, 35)">
                <rect
                  x="0"
                  y="85"
                  width="16"
                  height="35"
                  fill="#FF9900"
                  rx="2"
                  opacity="0.3"
                />
                <rect
                  x="20"
                  y="68"
                  width="16"
                  height="52"
                  fill="#FF9900"
                  rx="2"
                  opacity="0.45"
                />
                <rect
                  x="40"
                  y="50"
                  width="16"
                  height="70"
                  fill="#FF9900"
                  rx="2"
                  opacity="0.6"
                />
                <rect
                  x="60"
                  y="30"
                  width="16"
                  height="90"
                  fill="#FF9900"
                  rx="2"
                  opacity="0.8"
                />
                <rect
                  x="80"
                  y="8"
                  width="16"
                  height="112"
                  fill="#FF9900"
                  rx="2"
                />
                <polygon
                  points="88,2 91,10 99,10 93,15 95,23 88,18 81,23 83,15 77,10 85,10"
                  fill="#FF9900"
                />
                <rect
                  x="0"
                  y="120"
                  width="96"
                  height="2"
                  fill="#FF9900"
                  rx="1"
                  opacity="0.5"
                />
              </g>
              <line
                x1="153"
                y1="42"
                x2="153"
                y2="158"
                stroke="#FF9900"
                strokeWidth="1.5"
                opacity="0.3"
              />
              <text
                x="171"
                y="138"
                fontFamily="Arial Black, sans-serif"
                fontSize="60"
                fontWeight="900"
              >
                <tspan fill="white">PROTEIN</tspan>
                <tspan fill="#FF9900">OTEKA</tspan>
              </text>
            </svg>
            <p className="text-sm text-white/60 leading-relaxed">
              Poredimo cene proteina i suplemenata iz svih većih prodavnica u
              Srbiji. Uvek znaj da li je tvoja kupovina vredna novca.
            </p>
          </div>

          {/* Navigacija */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
              Navigacija
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href="/"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Početna
                </Link>
              </li>
              <li>
                <Link
                  href="/?sort=valueScore,desc"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Najisplativiji
                </Link>
              </li>
              <li>
                <Link
                  href="/?sort=price,asc"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Najjeftiniji
                </Link>
              </li>
              <li>
                <Link
                  href="/?query=whey"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Whey protein
                </Link>
              </li>
              <li>
                <Link
                  href="/?query=izolat"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Izolati
                </Link>
              </li>
              <li>
                <Link
                  href="/?query=kreatin"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Kreatin
                </Link>
              </li>
            </ul>
          </div>

          {/* Prodavnice */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
              Prodavnice
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href="/?store=Pansport"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Pansport
                </Link>
              </li>
              <li>
                <Link
                  href="/?store=Proteini.si"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Proteini.si
                </Link>
              </li>
              <li>
                <Link
                  href="/?store=Proteinbox"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Proteinbox
                </Link>
              </li>
              <li>
                <Link
                  href="/?store=Supplementshop"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Supplementshop
                </Link>
              </li>
              <li>
                <Link
                  href="/?store=FitLab"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  FitLab
                </Link>
              </li>
              <li>
                <Link
                  href="/?store=Ogistrashop"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Ogistrashop
                </Link>
              </li>
            </ul>
          </div>

          {/* O nama */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">
              O sajtu
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href="/o-nama"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  O nama
                </Link>
              </li>
              <li>
                <Link
                  href="/kako-racunamo"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Kako računamo Value Score
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/kontakt"
                  className="text-sm text-white/70 hover:text-[#FF9900] transition-colors"
                >
                  Kontakt
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Donji deo */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6">
          <p className="text-xs text-white/40 text-center md:text-left">
            © {new Date().getFullYear()} Proteinoteka. Sva prava zadržana.
          </p>
          <p className="text-xs text-white/40 text-center md:text-right">
            Cene se ažuriraju svakodnevno. Proteinoteka nije prodavnica —
            prikazujemo cene iz eksternih izvora.
          </p>
        </div>
      </div>
    </footer>
  );
}
