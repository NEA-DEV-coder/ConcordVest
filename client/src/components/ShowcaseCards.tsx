/* CONCORDVEST / Quiet Structure: numbered service cards and oversized project tiles carry the catalogue’s orange index system. */
import { ArrowUpRight } from "lucide-react";

export function ServiceCard({ number, title, image, onClick }: { number: string; title: string; image?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group relative flex min-h-[13rem] w-full flex-col justify-between overflow-hidden border border-[#012770]/14 bg-[#f4f1ea] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#ED7D01] sm:min-h-[15rem] sm:p-6">
      {image && <><img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100" /><div className="absolute inset-0 bg-[#012770]/70 opacity-0 transition-opacity duration-500 group-hover:opacity-100" /></>}
      <div className="relative flex items-start justify-between"><span className="text-[0.63rem] font-extrabold tracking-[0.16em] text-[#ED7D01]">{number}</span><ArrowUpRight size={18} className="text-[#012770] transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white" /></div>
      <h3 className="relative max-w-[11rem] text-[1.2rem] font-bold leading-[1.06] tracking-[-0.04em] text-[#012770] transition-colors duration-300 group-hover:text-white">{title}</h3>
    </button>
  );
}

export function ProjectCard({ title, category, image, className = "", onClick }: { title: string; category: string; image: string; className?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`group relative block min-h-[19rem] w-full overflow-hidden text-left ${className}`}>
      <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#012770]/90 via-[#012770]/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6"><div className="mb-2 flex items-center gap-2 text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-[#ED7D01]"><span className="h-px w-5 bg-current" />{category}</div><div className="flex items-end justify-between gap-4"><h3 className="display-serif text-2xl leading-[1] text-white">{title}</h3><span className="grid h-9 w-9 shrink-0 place-items-center border border-white/50 text-white transition-colors group-hover:border-[#ED7D01] group-hover:bg-[#ED7D01] group-hover:text-[#012770]"><ArrowUpRight size={16} /></span></div></div>
    </button>
  );
}
