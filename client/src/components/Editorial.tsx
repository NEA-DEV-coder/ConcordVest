/* CONCORDVEST / Quiet Structure: editorial cards use concise labels, warm material imagery, and restrained metadata. */
import { ArrowUpRight } from "lucide-react";
import { resolveNavigation } from "@/lib/navigation";

export function ArticleCard({ number, title, image, onClick }: { number: string; title: string; image?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex w-full items-start gap-4 border-t border-[#012770]/16 py-5 text-left transition-colors hover:border-[#ED7D01] sm:gap-5">
      <span className="pt-1 text-[0.62rem] font-extrabold tracking-[0.14em] text-[#ED7D01]">{number}</span>
      {image && <img src={image} alt="" className="hidden h-20 w-24 object-cover sm:block" />}
      <span className="flex-1"><span className="block max-w-[20rem] text-[1rem] font-bold leading-[1.13] tracking-[-0.03em] text-[#012770] transition-colors group-hover:text-[#ED7D01] sm:text-[1.12rem]">{title}</span><span className="mt-2 block text-[0.59rem] font-bold uppercase tracking-[0.14em] text-[#637085]">Concordvest journal · Read more</span></span>
      <ArrowUpRight size={18} className="mt-1 shrink-0 text-[#012770] transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#ED7D01]" />
    </button>
  );
}

export function Footer({ onAction }: { onAction: (label: string) => void }) {
  const footerNavigate = (label: string) => { const destination = resolveNavigation(label); if (destination) { window.location.assign(destination); return; } onAction(label); };
  return (
    <footer className="bg-[#012770] text-white">
      <div className="container py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 border-b border-white/15 pb-14 lg:grid-cols-[1.1fr_2fr] lg:gap-20">
          <div><button type="button" onClick={() => footerNavigate("Home")} className="group mb-7 flex items-center gap-3 text-left"><span className="grid h-12 w-12 place-items-center bg-white p-1.5 transition-transform duration-200 group-hover:-rotate-3"><img src="/manus-storage/concordvest-mark_3c9db8ed.png" alt="" className="h-full w-full object-contain" /></span><span className="text-[0.82rem] font-extrabold tracking-[0.3em] text-white">CONCORDVEST</span></button><button type="button" onClick={() => footerNavigate("Home")} className="display-serif text-left text-[2.6rem] leading-[0.9] tracking-[-0.04em] text-white sm:text-[3.6rem]">DISCOVER.<br />BUILD.<br /><span className="text-[#ED7D01]">TRANSFORM.</span></button><p className="mt-8 max-w-xs text-[0.78rem] leading-[1.8] text-white/65">Property, renovation, and finishing with a sharper point of view.</p></div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3"><FooterGroup title="Properties" items={["Land for Sale", "Apartments", "Concordvest Property", "Partner Property", "Developer Listings"]} onAction={footerNavigate} /><FooterGroup title="Renovation" items={["Home Refresh", "Kitchen Transformation", "Bathroom Upgrade", "Building Finishing", "Office Remodeling", "Rental Makeover", "Complete Remodeling"]} onAction={footerNavigate} /><FooterGroup title="Explore" items={["Projects", "Inspiration", "About", "Contact"]} onAction={footerNavigate} /></div>
        </div>
        <div className="grid gap-8 pt-10 text-[0.7rem] sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr] lg:items-end"><div><div className="mb-3 text-[0.59rem] font-extrabold uppercase tracking-[0.18em] text-[#ED7D01]">Visit the studio</div><p className="leading-[1.7] text-white/70">30 William Crescent, Utako, Abuja<br />08156648952 · 09033240600</p></div><div className="lg:text-center"><div className="mb-3 text-[0.59rem] font-extrabold uppercase tracking-[0.18em] text-[#ED7D01]">Say hello</div><p className="text-white/70">hello@concordvest.com<br />Instagram: @Concordvest_ng</p></div><div className="lg:text-right"><p className="text-white/45">© {new Date().getFullYear()} Concordvest</p><p className="mt-1 text-white/45">Concordvest.com</p></div></div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, items, onAction }: { title: string; items: string[]; onAction: (label: string) => void }) {
  return <div><div className="mb-4 text-[0.59rem] font-extrabold uppercase tracking-[0.18em] text-[#ED7D01]">{title}</div><div className="flex flex-col items-start gap-2.5">{items.map(item => <button type="button" key={item} onClick={() => onAction(item)} className="text-left text-[0.7rem] leading-[1.25] text-white/70 transition-colors hover:text-white">{item}</button>)}</div></div>;
}
