/* CONCORDVEST / Quiet Structure: the renovation flow breaks a complex brief into calm, legible decisions—never an intimidating wall of fields. */
import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { BrandButton } from "@/components/BrandButton";
import {
  buildLeadWhatsAppMessage,
  buildWhatsAppUrl,
  createLead,
  getLeadContext,
  recordLead,
} from "@/lib/leads";
import { submitLead } from "@/hooks/useLeads";
import { customService, servicePackages } from "@/lib/services";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { trackEvent } from "@/lib/analytics";

const stepLabels = [
  "Choose service",
  "Property details",
  "Requirements",
  "Budget & timeline",
  "Photos",
  "Submit request",
  "Book inspection",
];

type QuoteForm = {
  service: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  propertyType: string;
  projectType: string;
  description: string;
  rooms: string;
  budget: string;
  timeline: string;
  notes: string;
  photos: string;
};

type InspectionForm = {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  location: string;
  preferredDate: string;
  preferredTime: string;
  projectType: string;
  notes: string;
};

export function RenovationQuoteFlow({
  onNavigate,
  startAtInspection = false,
}: {
  onNavigate: (path: string) => void;
  startAtInspection?: boolean;
}) {
  const [step, setStep] = useState(startAtInspection ? 7 : 1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadMessage, setLeadMessage] = useState("");
  const [submittedServiceId, setSubmittedServiceId] = useState<string | undefined>(undefined);
  const [quote, setQuote] = useState<QuoteForm>({
    service: customService.slug,
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    location: "",
    propertyType: "",
    projectType: "",
    description: "",
    rooms: "",
    budget: "",
    timeline: "",
    notes: "",
    photos: "",
  });
  const [inspection, setInspection] = useState<InspectionForm>({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    location: "",
    preferredDate: "",
    preferredTime: "",
    projectType: "",
    notes: "",
  });
  const updateQuote = (key: keyof QuoteForm, value: string) =>
    setQuote(current => ({ ...current, [key]: value }));
  const updateInspection = (key: keyof InspectionForm, value: string) =>
    setInspection(current => ({ ...current, [key]: value }));
  const serviceName =
    servicePackages.find(item => item.slug === quote.service)?.name ||
    customService.name;

  const submitQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const context = getLeadContext({ serviceName });
    const message = [
      quote.description,
      `Property location: ${quote.location}`,
      `Property type: ${quote.propertyType}`,
      `Project type: ${quote.projectType}`,
      `Rooms or areas: ${quote.rooms}`,
      `Budget: ${quote.budget || "To discuss"}`,
      `Timeline: ${quote.timeline || "To discuss"}`,
      quote.notes && `Additional notes: ${quote.notes}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      let serviceId: string | undefined = undefined;
      if (isSupabaseConfigured()) {
        const { data } = (await supabase
          .from("services")
          .select("id")
          .eq("slug", quote.service)
          .single()) as any;
        serviceId = data?.id;
      }

      const result = await submitLead({
        name: quote.name,
        phone: quote.phone,
        whatsapp: quote.whatsapp,
        email: quote.email,
        interestType: "Renovation Quote",
        serviceId,
        service: serviceName,
        message,
        source: context.source,
        page: context.page,
        location: "renovation_quote",
        formType: "renovation_quote_flow",
      });

      if (!result.success) {
        throw result.error || new Error("Failed to submit renovation quote.");
      }

      const lead = {
        id: result.leadId,
        name: quote.name,
        phone: quote.phone,
        whatsapp: quote.whatsapp,
        email: quote.email,
        interestType: "Renovation Quote" as const,
        service: serviceName,
        message,
        source: context.source,
        page: context.page,
        date: new Date().toISOString(),
        status: "New" as const,
        isRead: false,
      };

      setLeadMessage(buildLeadWhatsAppMessage(lead));
      setSubmittedServiceId(serviceId);
      setStep(7);
      toast.success("Renovation quote request submitted successfully.");
    } catch (error) {
      console.error("Failed to submit quote request:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit quote request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitInspection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const context = getLeadContext({ serviceName });
    const message = [
      `Inspection location: ${inspection.location}`,
      `Preferred date: ${inspection.preferredDate}`,
      `Preferred time: ${inspection.preferredTime}`,
      `Project type: ${inspection.projectType}`,
      inspection.notes && `Notes: ${inspection.notes}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      let serviceId: string | undefined = undefined;
      if (isSupabaseConfigured()) {
        const { data } = (await supabase
          .from("services")
          .select("id")
          .eq("slug", quote.service)
          .single()) as any;
        serviceId = data?.id;
      }

      const result = await submitLead({
        name: inspection.name || quote.name,
        phone: inspection.phone || quote.phone,
        whatsapp: inspection.whatsapp || quote.whatsapp,
        email: inspection.email || quote.email,
        interestType: "Site Inspection",
        serviceId,
        service: serviceName,
        message,
        source: context.source,
        page: context.page,
        preferredDate: inspection.preferredDate,
        preferredTime: inspection.preferredTime,
        location: "site_inspection",
        formType: "site_inspection_flow",
      });

      if (!result.success) {
        throw result.error || new Error("Failed to submit inspection request.");
      }

      const lead = {
        id: result.leadId,
        name: inspection.name || quote.name,
        phone: inspection.phone || quote.phone,
        whatsapp: inspection.whatsapp || quote.whatsapp,
        email: inspection.email || quote.email,
        interestType: "Site Inspection" as const,
        service: serviceName,
        message,
        source: context.source,
        page: context.page,
        preferredDate: inspection.preferredDate,
        preferredTime: inspection.preferredTime,
        date: new Date().toISOString(),
        status: "New" as const,
        isRead: false,
      };

      setLeadMessage(buildLeadWhatsAppMessage(lead));
      setSubmittedServiceId(serviceId);
      setSubmitted(true);
      toast.success("Site inspection booked successfully.");
    } catch (error) {
      console.error("Failed to submit inspection request:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit inspection request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f4f1ea] p-5 sm:p-8 lg:p-10">
      {submitted ? (
        <Confirmation
          message={leadMessage}
          serviceId={submittedServiceId}
          onNavigate={onNavigate}
        />
      ) : (
        <>
          <div className="flex flex-col justify-between gap-5 border-b border-[#012770]/14 pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">
                {startAtInspection ? "Site inspection" : "Custom renovation"}
              </p>
              <h2 className="display-serif mt-4 text-[2.7rem] leading-[0.9] text-[#012770] sm:text-[4.3rem]">
                {startAtInspection
                  ? "Book a site inspection."
                  : "Build the brief."}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-[#ED7D01]">
                Step {step} / 7
              </p>
              <p className="mt-2 text-[0.67rem] text-[#637085]">
                {stepLabels[step - 1]}
              </p>
            </div>
          </div>
          <div className="mt-6 flex gap-1">
            {stepLabels.map((label, index) => (
              <span
                key={label}
                title={label}
                className={`h-1 flex-1 ${index + 1 <= step ? "bg-[#ED7D01]" : "bg-[#012770]/12"}`}
              />
            ))}
          </div>
          {step < 7 ? (
            <form
              onSubmit={event => {
                event.preventDefault();
                if (step === 6) submitQuote(event);
                else setStep(current => current + 1);
              }}
              className="mt-8 space-y-6"
            >
              {step === 1 && (
                <StepOne
                  service={quote.service}
                  onChange={value => updateQuote("service", value)}
                />
              )}
              {step === 2 && <StepTwo quote={quote} update={updateQuote} />}
              {step === 3 && <StepThree quote={quote} update={updateQuote} />}
              {step === 4 && <StepFour quote={quote} update={updateQuote} />}
              {step === 5 && (
                <StepFive
                  photos={quote.photos}
                  onChange={value => updateQuote("photos", value)}
                />
              )}
              {step === 6 && (
                <StepSix
                  quote={quote}
                  serviceName={serviceName}
                  update={updateQuote}
                />
              )}
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(current => current - 1)}
                  className="inline-flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-[#637085] hover:text-[#012770]"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              <div className="flex justify-end border-t border-[#012770]/14 pt-5">
                <BrandButton type="submit" disabled={isSubmitting}>
                  {step === 6
                    ? isSubmitting
                      ? "Submitting..."
                      : "Submit request"
                    : "Continue"}{" "}
                  <ArrowRight size={15} />
                </BrandButton>
              </div>
            </form>
          ) : (
            <form onSubmit={submitInspection} className="mt-8 space-y-6">
              <div className="border-l-2 border-[#ED7D01] pl-4">
                <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-[#012770]">
                  Your quote request is ready
                </p>
                <p className="mt-2 max-w-xl text-[0.78rem] leading-[1.7] text-[#637085]">
                  Book a site inspection now, or submit the appointment details
                  and continue on WhatsApp.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Name"
                  required
                  value={inspection.name || quote.name}
                  onChange={value => updateInspection("name", value)}
                  placeholder="Your name"
                />
                <Field
                  label="Phone"
                  required
                  value={inspection.phone || quote.phone}
                  onChange={value => updateInspection("phone", value)}
                  placeholder="0815 664 8952"
                />
                <Field
                  label="WhatsApp"
                  required
                  value={inspection.whatsapp || quote.whatsapp}
                  onChange={value => updateInspection("whatsapp", value)}
                  placeholder="Your WhatsApp number"
                />
                <Field
                  label="Email"
                  required
                  type="email"
                  value={inspection.email || quote.email}
                  onChange={value => updateInspection("email", value)}
                  placeholder="you@example.com"
                />
                <Field
                  label="Property location"
                  required
                  value={inspection.location || quote.location}
                  onChange={value => updateInspection("location", value)}
                  placeholder="e.g. Jabi, Abuja"
                />
                <Field
                  label="Preferred date"
                  required
                  type="date"
                  value={inspection.preferredDate}
                  onChange={value => updateInspection("preferredDate", value)}
                  placeholder="Choose a date"
                />
                <SelectField
                  label="Preferred time"
                  required
                  value={inspection.preferredTime}
                  onChange={value => updateInspection("preferredTime", value)}
                  options={[
                    "Morning · 9:00–12:00",
                    "Afternoon · 12:00–15:00",
                    "Late afternoon · 15:00–18:00",
                  ]}
                />
                <Field
                  label="Project type"
                  required
                  value={inspection.projectType || quote.projectType}
                  onChange={value => updateInspection("projectType", value)}
                  placeholder="Renovation, finishing..."
                />
              </div>
              <Field
                label="Additional notes"
                as="textarea"
                value={inspection.notes}
                onChange={value => updateInspection("notes", value)}
                placeholder="Anything we should know before visiting?"
              />
              <div className="flex flex-col justify-between gap-4 border-t border-[#012770]/14 pt-5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep(6)}
                  className="inline-flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-[#637085] hover:text-[#012770] disabled:opacity-50"
                >
                  <ArrowLeft size={14} /> Back to request
                </button>
                <BrandButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Booking..." : "Book site inspection"}
                </BrandButton>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

function StepOne({
  service,
  onChange,
}: {
  service: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-[0.78rem] leading-[1.7] text-[#637085]">
        Choose the first route that feels closest. We can refine the scope
        together.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {[...servicePackages, customService].map(item => (
          <button
            key={item.slug}
            type="button"
            onClick={() => onChange(item.slug)}
            className={`border p-5 text-left transition-colors ${service === item.slug ? "border-[#ED7D01] bg-white" : "border-[#012770]/14 bg-transparent hover:bg-white"}`}
          >
            <span className="text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-[#ED7D01]">
              {item.number || "Custom"}
            </span>
            <h3 className="mt-3 text-[1rem] font-extrabold text-[#012770]">
              {item.name}
            </h3>
            <p className="mt-2 text-[0.7rem] leading-[1.6] text-[#637085]">
              {item.shortDescription}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepTwo({
  quote,
  update,
}: {
  quote: QuoteForm;
  update: (key: keyof QuoteForm, value: string) => void;
}) {
  return (
    <div>
      <p className="text-[0.78rem] leading-[1.7] text-[#637085]">
        A little context helps us understand the right starting point.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          label="Name"
          required
          value={quote.name}
          onChange={value => update("name", value)}
          placeholder="Your name"
        />
        <Field
          label="Phone"
          required
          type="tel"
          value={quote.phone}
          onChange={value => update("phone", value)}
          placeholder="0815 664 8952"
        />
        <Field
          label="WhatsApp"
          required
          type="tel"
          value={quote.whatsapp}
          onChange={value => update("whatsapp", value)}
          placeholder="Your WhatsApp number"
        />
        <Field
          label="Email"
          required
          type="email"
          value={quote.email}
          onChange={value => update("email", value)}
          placeholder="you@example.com"
        />
        <Field
          label="Property location"
          required
          value={quote.location}
          onChange={value => update("location", value)}
          placeholder="e.g. Jabi, Abuja"
        />
        <Field
          label="Property type"
          required
          value={quote.propertyType}
          onChange={value => update("propertyType", value)}
          placeholder="Apartment, house, office..."
        />
      </div>
    </div>
  );
}

function StepThree({
  quote,
  update,
}: {
  quote: QuoteForm;
  update: (key: keyof QuoteForm, value: string) => void;
}) {
  return (
    <div>
      <p className="text-[0.78rem] leading-[1.7] text-[#637085]">
        Describe what you want the space to do better.
      </p>
      <div className="mt-6 space-y-5">
        <Field
          label="Project type"
          required
          value={quote.projectType}
          onChange={value => update("projectType", value)}
          placeholder="Renovation, finishing, kitchen..."
        />
        <Field
          label="What needs to change?"
          required
          as="textarea"
          value={quote.description}
          onChange={value => update("description", value)}
          placeholder="Tell us about the current space and the change you want to make."
        />
        <Field
          label="Rooms or areas involved"
          value={quote.rooms}
          onChange={value => update("rooms", value)}
          placeholder="Kitchen, living room, bathrooms..."
        />
      </div>
    </div>
  );
}

function StepFour({
  quote,
  update,
}: {
  quote: QuoteForm;
  update: (key: keyof QuoteForm, value: string) => void;
}) {
  const budgets = [
    "Not sure yet",
    "Under ₦5m",
    "₦5m–₦15m",
    "₦15m–₦30m",
    "Above ₦30m",
  ];
  const timelines = [
    "As soon as possible",
    "1–3 months",
    "3–6 months",
    "6–12 months",
    "Flexible",
  ];
  return (
    <div>
      <p className="text-[0.78rem] leading-[1.7] text-[#637085]">
        Ranges are welcome. They help us recommend a realistic route.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Budget range"
          value={quote.budget}
          onChange={value => update("budget", value)}
          options={budgets}
        />
        <SelectField
          label="Desired timeline"
          value={quote.timeline}
          onChange={value => update("timeline", value)}
          options={timelines}
        />
      </div>
      <div className="mt-5">
        <Field
          label="Additional notes"
          as="textarea"
          value={quote.notes}
          onChange={value => update("notes", value)}
          placeholder="Anything else we should know?"
        />
      </div>
    </div>
  );
}

function StepFive({
  photos,
  onChange,
}: {
  photos: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-[0.78rem] leading-[1.7] text-[#637085]">
        Photos help us arrive at the first conversation with useful context. You
        can also send them on WhatsApp later.
      </p>
      <label className="mt-6 flex min-h-48 cursor-pointer flex-col items-center justify-center border border-dashed border-[#012770]/22 bg-white p-6 text-center">
        <ImagePlus size={26} className="text-[#ED7D01]" />
        <span className="mt-4 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#012770]">
          Choose project photos
        </span>
        <span className="mt-2 text-[0.68rem] text-[#637085]">
          JPG or PNG · optional
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={event =>
            onChange(
              Array.from(event.target.files || [])
                .map(file => file.name)
                .join(", ")
            )
          }
        />
        {photos && (
          <span className="mt-4 text-[0.68rem] font-bold text-[#ED7D01]">
            {photos}
          </span>
        )}
      </label>
    </div>
  );
}

function StepSix({
  quote,
  serviceName,
  update,
}: {
  quote: QuoteForm;
  serviceName: string;
  update: (key: keyof QuoteForm, value: string) => void;
}) {
  return (
    <div>
      <p className="text-[0.78rem] leading-[1.7] text-[#637085]">
        Review the brief below, then send it to Concordvest for follow-up.
      </p>
      <div className="mt-6 border-l-2 border-[#ED7D01] bg-white p-5 text-[0.76rem] leading-[1.8] text-[#637085]">
        <p>
          <strong className="text-[#012770]">Service:</strong> {serviceName}
        </p>
        <p>
          <strong className="text-[#012770]">Property:</strong> {quote.location}{" "}
          · {quote.propertyType}
        </p>
        <p>
          <strong className="text-[#012770]">Project:</strong>{" "}
          {quote.projectType}
        </p>
        <p>
          <strong className="text-[#012770]">Timeline:</strong>{" "}
          {quote.timeline || "To discuss"}
        </p>
        <p>
          <strong className="text-[#012770]">Budget:</strong>{" "}
          {quote.budget || "To discuss"}
        </p>
      </div>
      <div className="mt-5">
        <Field
          label="Anything else before we reach out?"
          as="textarea"
          value={quote.notes}
          onChange={value => update("notes", value)}
          placeholder="A final note for the Concordvest team"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  as = "input",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
  as?: "input" | "textarea";
}) {
  return (
    <label className="form-label">
      {label}
      {as === "textarea" ? (
        <textarea
          required={required}
          value={value}
          onChange={event => onChange(event.target.value)}
          className="form-input min-h-28 resize-y"
          placeholder={placeholder}
        />
      ) : (
        <input
          required={required}
          type={type}
          value={value}
          onChange={event => onChange(event.target.value)}
          className="form-input"
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="form-label">
      {label}
      <select
        required={required}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="form-input"
      >
        <option value="">Choose an option</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Confirmation({
  message,
  serviceId,
  onNavigate,
}: {
  message: string;
  serviceId?: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="py-10">
      <div className="grid h-12 w-12 place-items-center bg-[#ED7D01] text-[#012770]">
        <Check size={22} />
      </div>
      <h2 className="display-serif mt-6 text-[2.9rem] leading-[0.9] text-[#012770] sm:text-[4.3rem]">
        Your request is in.
      </h2>
      <p className="mt-5 max-w-xl text-[0.84rem] leading-[1.8] text-[#637085]">
        Your brief has been captured for Concordvest. Continue on WhatsApp to
        add photos, ask questions, or confirm the next step.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={buildWhatsAppUrl(message)}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            trackEvent("whatsapp_click", {
              serviceId,
              metadata: {
                location: "service",
              },
            });
          }}
          className="inline-flex items-center justify-center gap-2 bg-[#012770] px-5 py-4 text-[0.64rem] font-extrabold uppercase tracking-[0.13em] text-white"
        >
          <MessageCircle size={16} /> Continue on WhatsApp
        </a>
        <BrandButton variant="line" onClick={() => onNavigate("/projects")}>
          See project work
        </BrandButton>
      </div>
    </div>
  );
}
