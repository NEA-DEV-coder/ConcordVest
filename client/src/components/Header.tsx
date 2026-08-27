/* CONCORDVEST / Quiet Structure: sticky navigation is a calm catalogue index with anchored dropdowns and an elevated mobile drawer. */
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { WhatsAppAgentLink } from "@/components/WhatsAppAgentButton";
import { resolveNavigation } from "@/lib/navigation";

const menus = {
  Properties: ["All Properties", "Land for Sale", "Apartments for Sale", "Concordvest Property", "Partner Property", "Developer Listings"],
  "Renovation & Finishing": ["All Services", "Home Refresh", "Kitchen Transformation", "Luxury Bathroom Upgrade", "Complete Building Finishing", "Office Remodeling", "Rental Property Makeover", "Complete Home Remodeling"],
  Projects: ["All Projects", "Renovation", "Finishing", "Kitchens", "Bathrooms", "Interiors", "Before & After"],
  Inspiration: ["Home Improvement Tips", "Kitchen Inspiration", "Bathroom Inspiration", "Staircase Ideas", "Materials & Finishes", "Construction Tips"],
};

export function Header({ onAction }: { onAction: (label: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavigate = (label: string) => {
    setOpen(null);
    setMobileOpen(false);
    const destination = resolveNavigation(label);
    if (destination) { window.location.assign(destination); return; }
    onAction(label);
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 text-[#012770] shadow-[0_1px_0_rgba(1,39,112,0.1)] backdrop-blur-md" : "bg-[#012770]/15 text-white"}`}>
      <div className="container flex h-[4.75rem] items-center justify-between gap-6">
        <Logo light={!scrolled} />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          {Object.entries(menus).map(([label, items]) => (
            <div key={label} className="relative">
              <button
                type="button"
                aria-expanded={open === label}
                onClick={() => setOpen(open === label ? null : label)}
                className={`flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.1em] transition-colors ${scrolled ? "text-[#17212f] hover:text-[#ED7D01]" : "text-white/90 hover:text-white"}`}
              >
                {label}<ChevronDown size={13} strokeWidth={1.75} className={`transition-transform ${open === label ? "rotate-180" : ""}`} />
              </button>
              {open === label && (
                <div className="absolute left-1/2 top-[2.9rem] w-64 -translate-x-1/2 border border-[#012770]/10 bg-white p-2 text-[#012770] shadow-[0_18px_44px_rgba(1,39,112,0.14)]">
                  <div className="mb-2 border-b border-[#012770]/10 px-3 pb-2 text-[0.57rem] font-extrabold uppercase tracking-[0.18em] text-[#ED7D01]">Explore {label}</div>
                  {items.map((item) => <button key={item} type="button" onClick={() => handleNavigate(item)} className="block w-full px-3 py-2 text-left text-[0.72rem] font-semibold transition-colors hover:bg-[#f4f1ea] hover:text-[#ED7D01]">{item}</button>)}
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={() => handleNavigate("About")} className={`text-[0.68rem] font-bold tracking-[0.1em] transition-colors ${scrolled ? "text-[#17212f] hover:text-[#ED7D01]" : "text-white/90 hover:text-white"}`}>About</button>
        </nav>
        <div className="flex items-center gap-3">
          <WhatsAppAgentLink label="Talk to an Agent" className="hidden items-center gap-2 bg-[#ED7D01] px-4 py-3 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#012770] transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97] sm:flex" />
          <button type="button" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen(!mobileOpen)} className={`grid h-10 w-10 place-items-center border lg:hidden ${scrolled ? "border-[#012770]/20 text-[#012770]" : "border-white/40 text-white"}`}>{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button>
        </div>
      </div>
      {mobileOpen && (
        <div className="max-h-[calc(100vh-4.75rem)] overflow-y-auto border-t border-[#012770]/10 bg-white text-[#012770] lg:hidden">
          <nav className="container flex flex-col py-5" aria-label="Mobile navigation">
            {Object.entries(menus).map(([label, items]) => (
              <div key={label} className="border-b border-[#012770]/10 py-3">
                <div className="mb-2 text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-[#ED7D01]">{label}</div>
                <div className="grid grid-cols-2 gap-x-5 gap-y-1">{items.map(item => <button key={item} type="button" onClick={() => handleNavigate(item)} className="py-1.5 text-left text-[0.72rem] font-semibold text-[#17212f]/80 hover:text-[#ED7D01]">{item}</button>)}</div>
              </div>
            ))}
            <button type="button" onClick={() => handleNavigate("About")} className="py-4 text-left text-[0.68rem] font-extrabold uppercase tracking-[0.12em]">About</button>
            <WhatsAppAgentLink label="Talk to an Agent" className="flex items-center justify-center gap-2 bg-[#ED7D01] px-4 py-4 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#012770]" />
          </nav>
        </div>
      )}
    </header>
  );
}
