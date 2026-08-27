/* CONCORDVEST / Quiet Structure: site inspection is a focused appointment page that keeps the same editorial shell as the service experience. */
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Editorial";
import { RenovationQuoteFlow } from "@/components/RenovationQuoteFlow";

export default function SiteInspection() {
  const [, setLocation] = useLocation();
  const navigate = (label: string) => {
    if (label === "Home") { setLocation("/"); return; }
    if (label === "All Properties") { setLocation("/properties"); return; }
    if (label === "All Services") { setLocation("/services"); return; }
    if (label === "All Projects") { setLocation("/projects"); return; }
    if (label === "All Inspiration") { setLocation("/inspiration"); return; }
  };
  return <div className="min-h-screen bg-white text-[#17212f]"><Header onAction={navigate} /><main><section className="bg-[#012770] pb-14 pt-32 text-white sm:pb-20"><div className="container"><button type="button" onClick={() => setLocation("/services")} className="mb-9 inline-flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-[#ED7D01]"><ArrowLeft size={15} /> All services</button><p className="eyebrow">A considered first visit</p><h1 className="display-serif mt-6 max-w-4xl text-[4rem] leading-[0.86] sm:text-[6.8rem]">Book a site inspection.</h1><p className="mt-8 max-w-lg text-[0.95rem] leading-[1.8] text-white/72">Give us the place, the preferred time, and a little context. We’ll use the visit to understand the work before we shape the route.</p></div></section><section className="container py-14 sm:py-20 lg:py-28"><div className="mx-auto max-w-5xl"><RenovationQuoteFlow onNavigate={setLocation} startAtInspection /></div></section></main><Footer onAction={navigate} /></div>;
}
