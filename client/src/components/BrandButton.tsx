/* CONCORDVEST / Quiet Structure: buttons are direct, tactile actions with disciplined rectangular geometry and orange cues. */
import type { ReactNode } from "react";
import { ArrowUpRight, ArrowRight } from "lucide-react";

type Props = { children: ReactNode; variant?: "orange" | "navy" | "outline" | "line"; onClick?: () => void; className?: string; arrow?: "up" | "right"; type?: "button" | "submit" | "reset"; disabled?: boolean };

export function BrandButton({ children, variant = "orange", onClick, className = "", arrow = "up", type = "button", disabled = false }: Props) {
  const styles = {
    orange: "bg-[#ED7D01] text-[#012770] hover:bg-[#f79117]",
    navy: "bg-[#012770] text-white hover:bg-[#123a82]",
    outline: "border border-white/50 text-white hover:border-white hover:bg-white/10",
    line: "px-0 text-[#012770] hover:text-[#ED7D01]",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`group inline-flex items-center justify-center gap-3 px-5 py-4 text-[0.66rem] font-extrabold uppercase tracking-[0.14em] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${styles[variant]} ${className}`}>
      {children}
      {arrow === "right" ? <ArrowRight size={15} strokeWidth={1.8} className="transition-transform duration-200 group-hover:translate-x-1" /> : <ArrowUpRight size={15} strokeWidth={1.8} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
    </button>
  );
}
