/* CONCORDVEST / Quiet Structure: property enquiries stay short, contextual, and calm—then hand directly to the configured WhatsApp destination. */
import { useState } from "react";
import type { FormEvent } from "react";
import { Check, Loader2, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { BrandButton } from "@/components/BrandButton";
import type { PropertyRecord } from "@/lib/properties";
import {
  buildLeadWhatsAppMessage,
  buildPropertyWhatsAppMessage,
  buildWhatsAppUrl,
  getLeadContext,
} from "@/lib/leads";
import { submitLead } from "@/hooks/useLeads";

export function whatsappLink(propertyTitle: string) {
  return buildWhatsAppUrl(buildPropertyWhatsAppMessage(propertyTitle));
}

export function EnquiryModal({
  property,
  onClose,
}: {
  property: PropertyRecord;
  onClose: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadMessage, setLeadMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    message: "",
  });
  const update = (field: keyof typeof form, value: string) =>
    setForm(current => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const context = getLeadContext({
      propertyId: property.id,
      propertyName: property.title,
      propertyUrl: `${window.location.origin}/properties/${property.slug}`,
    });

    try {
      const result = await submitLead({
        ...form,
        interestType: "Property Enquiry",
        propertyId: property.id,
        property: property.title,
        message: form.message,
        source: context.source,
        page: context.page,
      });

      if (!result.success) {
        throw result.error || new Error("Failed to save lead.");
      }

      setLeadMessage(
        buildLeadWhatsAppMessage({
          interestType: "Property Enquiry",
          name: form.name,
          phone: form.phone,
          whatsapp: form.whatsapp,
          email: form.email,
          property: property.title,
          message: form.message,
        })
      );
      setSubmitted(true);
      toast.success("Property enquiry submitted successfully.");
    } catch (error) {
      console.error("Failed to submit enquiry:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit enquiry. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close enquiry form"
        onClick={onClose}
        className="absolute inset-0 bg-[#012770]/65 backdrop-blur-sm"
      />
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto bg-white p-6 text-[#012770] shadow-[0_20px_70px_rgba(1,39,112,0.28)] sm:p-9">
        <div className="flex items-start justify-between gap-6 border-b border-[#012770]/14 pb-5">
          <div>
            <p className="eyebrow">Property enquiry</p>
            <h2 className="display-serif mt-4 text-3xl leading-none sm:text-4xl">
              {submitted ? "Thank you." : "Let's talk about it."}
            </h2>
            <p className="mt-3 text-[0.72rem] text-[#637085]">
              {property.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close enquiry form"
            className="grid h-9 w-9 place-items-center border border-[#012770]/20"
          >
            <X size={17} />
          </button>
        </div>
        {submitted ? (
          <div className="py-10">
            <div className="grid h-12 w-12 place-items-center bg-[#ED7D01] text-[#012770]">
              <Check size={22} />
            </div>
            <h3 className="mt-6 text-[1.45rem] font-extrabold tracking-[-0.04em]">
              Your enquiry has been received.
            </h3>
            <p className="mt-3 max-w-sm text-[0.78rem] leading-[1.7] text-[#637085]">
              Your property context and contact details are ready for
              Concordvest follow-up.
            </p>
            <a
              href={buildWhatsAppUrl(leadMessage)}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-2 bg-[#012770] px-5 py-4 text-[0.64rem] font-extrabold uppercase tracking-[0.13em] text-white transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle size={16} /> Continue on WhatsApp
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 pt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="form-label">
                Name
                <input
                  required
                  value={form.name}
                  onChange={event => update("name", event.target.value)}
                  className="form-input"
                  placeholder="Your name"
                />
              </label>
              <label className="form-label">
                Phone
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={event => update("phone", event.target.value)}
                  className="form-input"
                  placeholder="0815 664 8952"
                />
              </label>
              <label className="form-label">
                WhatsApp
                <input
                  required
                  type="tel"
                  value={form.whatsapp}
                  onChange={event => update("whatsapp", event.target.value)}
                  className="form-input"
                  placeholder="Your WhatsApp number"
                />
              </label>
              <label className="form-label">
                Email
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={event => update("email", event.target.value)}
                  className="form-input"
                  placeholder="you@example.com"
                />
              </label>
            </div>
            <label className="form-label">
              Message
              <textarea
                required
                value={form.message}
                onChange={event => update("message", event.target.value)}
                className="form-input min-h-28 resize-y"
                placeholder={`I'd like to know more about ${property.title}.`}
              />
            </label>
            <div className="flex flex-col justify-between gap-4 border-t border-[#012770]/12 pt-5 sm:flex-row sm:items-center">
              <p className="max-w-[16rem] text-[0.6rem] leading-[1.5] text-[#637085]">
                This enquiry includes{" "}
                <span className="font-bold text-[#012770]">
                  {property.title}
                </span>{" "}
                and this page as the source.
              </p>
              <BrandButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  "Send enquiry"
                )}
              </BrandButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
