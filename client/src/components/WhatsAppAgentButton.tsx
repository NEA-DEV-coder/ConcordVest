/* CONCORDVEST / Quiet Structure: WhatsApp is a quiet, always-available bridge to a human—not a competing visual layer. */
import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/leads";

const defaultMessage = "Hello Concordvest, I would like to speak with an agent. I found you through the website.";

export function WhatsAppAgentLink({ label = "WhatsApp an Agent", message = defaultMessage, className = "" }: { label?: string; message?: string; className?: string }) {
  return <a href={buildWhatsAppUrl(message)} target="_blank" rel="noreferrer" className={className}><MessageCircle size={15} /> {label}</a>;
}

export function MobileWhatsAppCta() {
  return <a href={buildWhatsAppUrl(defaultMessage)} target="_blank" rel="noreferrer" className="fixed inset-x-4 bottom-4 z-[55] flex items-center justify-center gap-2 border border-[#012770]/10 bg-[#ED7D01] px-5 py-3.5 text-[0.63rem] font-extrabold uppercase tracking-[0.13em] text-[#012770] shadow-[0_10px_28px_rgba(1,39,112,0.18)] md:hidden"><MessageCircle size={15} /> WhatsApp an Agent</a>;
}
