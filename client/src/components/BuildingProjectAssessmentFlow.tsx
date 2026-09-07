/* CONCORDVEST / Quiet Structure: Building Project Assessment Flow provides a calm, guided multi-step consultation for ground-up construction. */
import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { BrandButton } from "@/components/BrandButton";
import {
  buildBuildingProjectWhatsAppMessage,
  buildWhatsAppUrl,
  recordLead,
} from "@/lib/leads";
import { submitLead } from "@/hooks/useLeads";
import { locations } from "@/lib/properties";

const stepLabels = [
  "Building type",
  "Land status",
  "Location",
  "Project stage",
  "Services needed",
  "Project details",
  "Contact details",
];

const buildingTypes = [
  "Residential Home",
  "Apartment / Block of Flats",
  "Estate / Multiple Units",
  "Commercial Building",
  "Other",
];

const landStatuses = [
  "Yes, I already have land",
  "No, I need help finding land",
  "I am still deciding",
];

const stages = [
  "Just an idea",
  "I have land",
  "I have architectural drawings/plans",
  "I have drawings and approvals",
  "Ready to start construction",
];

const serviceOptions = [
  "Project planning",
  "Architectural / design support",
  "Cost estimation",
  "Construction",
  "Project management",
  "Full project from planning to completion",
];

const budgetOptions = [
  "Under ₦50M",
  "₦50M – ₦100M",
  "₦100M – ₦250M",
  "₦250M – ₦500M",
  "Above ₦500M",
  "Not sure yet / To discuss",
];

const timelineOptions = [
  "Immediately",
  "Within 1–3 months",
  "3–6 months",
  "6–12 months",
  "Flexible / Exploring",
];

const floorOptions = [
  "Single storey (Bungalow)",
  "2 Floors (Duplex / 2-Storey)",
  "3 Floors",
  "4+ Floors",
];

export interface BuildingProjectFormData {
  buildingType: string;
  customBuildingType: string;
  landStatus: string;
  area: string;
  exactLocation: string;
  stage: string;
  services: string[];
  bedrooms: string;
  floors: string;
  propertySize: string;
  startDate: string;
  budget: string;
  additionalNotes: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  consent: boolean;
}

const initialFormData: BuildingProjectFormData = {
  buildingType: "",
  customBuildingType: "",
  landStatus: "",
  area: "Abuja",
  exactLocation: "",
  stage: "",
  services: [],
  bedrooms: "",
  floors: "",
  propertySize: "",
  startDate: "",
  budget: "",
  additionalNotes: "",
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  consent: false,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BuildingProjectAssessmentFlow({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] =
    useState<BuildingProjectFormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadId, setLeadId] = useState("");

  const updateField = <K extends keyof BuildingProjectFormData>(
    field: K,
    value: BuildingProjectFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    setFormData(prev => {
      const exists = prev.services.includes(service);
      const updated = exists
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service];
      return { ...prev, services: updated };
    });
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.buildingType) {
        toast.error("Please choose what you are planning to build.");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.landStatus) {
        toast.error("Please select your current land status.");
        return false;
      }
    }
    if (currentStep === 3) {
      if (!formData.area.trim()) {
        toast.error("Please specify a project area or location.");
        return false;
      }
    }
    if (currentStep === 4) {
      if (!formData.stage) {
        toast.error("Please indicate what stage your project is currently at.");
        return false;
      }
    }
    if (currentStep === 5) {
      if (formData.services.length === 0) {
        toast.error(
          "Please select at least one service you would like help with."
        );
        return false;
      }
    }
    if (currentStep === 7) {
      if (!formData.name.trim()) {
        toast.error("Please enter your full name.");
        return false;
      }
      if (!formData.phone.trim() || formData.phone.trim().length < 7) {
        toast.error("Please enter a valid contact phone number.");
        return false;
      }
      if (!formData.email.trim() || !EMAIL_REGEX.test(formData.email.trim())) {
        toast.error("Please enter a valid email address.");
        return false;
      }
      if (!formData.consent) {
        toast.error(
          "Please confirm your consent for ConcordVest to contact you."
        );
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!validateStep(7)) return;

    setIsSubmitting(true);

    const effectiveBuildingType =
      formData.buildingType === "Other" && formData.customBuildingType.trim()
        ? `Other: ${formData.customBuildingType.trim()}`
        : formData.buildingType;

    const messageLines = [
      "[BUILDING PROJECT CONSULTATION]",
      "",
      `Building Type: ${effectiveBuildingType}`,
      `Land Status: ${formData.landStatus}`,
      `Location: ${formData.area}`,
      formData.exactLocation.trim() &&
        `Exact Location: ${formData.exactLocation.trim()}`,
      `Current Stage: ${formData.stage}`,
      `Services Requested: ${formData.services.join(", ")}`,
      formData.bedrooms.trim() &&
        `Bedrooms / Units: ${formData.bedrooms.trim()}`,
      formData.floors && `Floors: ${formData.floors}`,
      formData.propertySize.trim() &&
        `Approximate Size: ${formData.propertySize.trim()}`,
      formData.startDate && `Expected Start Date: ${formData.startDate}`,
      formData.budget && `Estimated Budget: ${formData.budget}`,
      formData.additionalNotes.trim() &&
        `Additional Notes: ${formData.additionalNotes.trim()}`,
      `Consent to Contact: Yes`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = await submitLead({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        whatsapp: (formData.whatsapp || formData.phone).trim(),
        email: formData.email.trim().toLowerCase(),
        interestType: "Building Project",
        message: messageLines,
        source: "Direct",
        page: "/start-building-project",
      });

      if (!result.success) {
        throw (
          result.error || new Error("Failed to submit your project assessment.")
        );
      }

      setLeadId(result.leadId);
      setSubmitted(true);
      toast.success("Your building project assessment has been submitted.");
    } catch (error) {
      console.error("Building project assessment submission error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit project assessment. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveBuildingType =
    formData.buildingType === "Other" && formData.customBuildingType.trim()
      ? formData.customBuildingType.trim()
      : formData.buildingType || "Building Project";

  const whatsAppMessage = buildBuildingProjectWhatsAppMessage({
    name: formData.name,
    buildingType: effectiveBuildingType,
    landStatus: formData.landStatus,
    stage: formData.stage,
    budget: formData.budget,
  });

  return (
    <div className="bg-[#f4f1ea] p-5 sm:p-8 lg:p-10">
      {submitted ? (
        <SuccessScreen
          formData={formData}
          effectiveBuildingType={effectiveBuildingType}
          whatsAppMessage={whatsAppMessage}
          onNavigate={onNavigate}
        />
      ) : (
        <div>
          {/* Header & Progress */}
          <div className="flex flex-col justify-between gap-5 border-b border-[#012770]/14 pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Guided Consultation</p>
              <h2 className="display-serif mt-4 text-[2.4rem] leading-[0.9] text-[#012770] sm:text-[3.8rem]">
                Start a building project.
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-[#ED7D01]">
                Step {step} of 7
              </p>
              <p className="mt-2 text-[0.67rem] font-semibold text-[#637085]">
                {stepLabels[step - 1]}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 flex gap-1">
            {stepLabels.map((label, index) => (
              <span
                key={label}
                title={label}
                className={`h-1 flex-1 transition-all duration-300 ${
                  index + 1 <= step ? "bg-[#ED7D01]" : "bg-[#012770]/12"
                }`}
              />
            ))}
          </div>

          {/* Step Forms */}
          <form
            onSubmit={event => {
              event.preventDefault();
              if (step === 7) {
                handleSubmit(event);
              } else {
                handleNext();
              }
            }}
          >
            <div className="mt-8">
              {step === 1 && (
                <StepOne
                  selected={formData.buildingType}
                  custom={formData.customBuildingType}
                  onSelect={val => updateField("buildingType", val)}
                  onCustomChange={val => updateField("customBuildingType", val)}
                />
              )}

              {step === 2 && (
                <StepTwo
                  selected={formData.landStatus}
                  onSelect={val => updateField("landStatus", val)}
                  onNavigate={onNavigate}
                />
              )}

              {step === 3 && (
                <StepThree
                  area={formData.area}
                  exactLocation={formData.exactLocation}
                  onAreaChange={val => updateField("area", val)}
                  onExactChange={val => updateField("exactLocation", val)}
                />
              )}

              {step === 4 && (
                <StepFour
                  selected={formData.stage}
                  onSelect={val => updateField("stage", val)}
                />
              )}

              {step === 5 && (
                <StepFive
                  selectedServices={formData.services}
                  onToggleService={toggleService}
                />
              )}

              {step === 6 && (
                <StepSix formData={formData} updateField={updateField} />
              )}

              {step === 7 && (
                <StepSeven formData={formData} updateField={updateField} />
              )}
            </div>

            {/* Actions: Back & Continue/Submit */}
            <div className="mt-10 flex flex-col-reverse justify-between gap-4 border-t border-[#012770]/14 pt-6 sm:flex-row sm:items-center">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#637085] transition-colors hover:text-[#012770] disabled:opacity-50"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 7 ? (
                <BrandButton type="button" onClick={handleNext}>
                  Continue <ArrowRight size={15} />
                </BrandButton>
              ) : (
                <BrandButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Project Assessment <ArrowRight size={15} />
                    </>
                  )}
                </BrandButton>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   STEP 1: BUILDING TYPE
   ========================================================================= */
function StepOne({
  selected,
  custom,
  onSelect,
  onCustomChange,
}: {
  selected: string;
  custom: string;
  onSelect: (value: string) => void;
  onCustomChange: (value: string) => void;
}) {
  return (
    <div>
      <h3 className="text-[1.3rem] font-bold text-[#012770]">
        What are you planning to build?
      </h3>
      <p className="mt-2 text-[0.8rem] leading-[1.6] text-[#637085]">
        Select the option that best describes your envisioned project.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {buildingTypes.map(type => {
          const isSelected = selected === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={`flex items-center justify-between border p-5 text-left transition-all ${
                isSelected
                  ? "border-[#012770] bg-[#012770]/5 shadow-sm"
                  : "border-[#012770]/18 bg-white hover:border-[#012770]/45 hover:bg-[#faf9f6]"
              }`}
            >
              <span
                className={`text-[0.88rem] font-bold ${
                  isSelected ? "text-[#012770]" : "text-[#17212f]"
                }`}
              >
                {type}
              </span>
              <span
                className={`grid h-5 w-5 place-items-center rounded-full border transition-colors ${
                  isSelected
                    ? "border-[#012770] bg-[#012770] text-white"
                    : "border-[#637085]/40 bg-transparent"
                }`}
              >
                {isSelected && <Check size={12} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {selected === "Other" && (
        <div className="mt-5">
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            Describe your building type (optional)
          </label>
          <input
            type="text"
            value={custom}
            onChange={e => onCustomChange(e.target.value)}
            placeholder="e.g. Mixed-use plaza, boutique hotel, religious center"
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          />
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   STEP 2: LAND STATUS
   ========================================================================= */
function StepTwo({
  selected,
  onSelect,
  onNavigate,
}: {
  selected: string;
  onSelect: (value: string) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div>
      <h3 className="text-[1.3rem] font-bold text-[#012770]">
        Do you already have land?
      </h3>
      <p className="mt-2 text-[0.8rem] leading-[1.6] text-[#637085]">
        Whether you have acquired land or are actively seeking the right parcel,
        ConcordVest can advise at every stage.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {landStatuses.map(status => {
          const isSelected = selected === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => onSelect(status)}
              className={`flex items-center justify-between border p-5 text-left transition-all ${
                isSelected
                  ? "border-[#012770] bg-[#012770]/5 shadow-sm"
                  : "border-[#012770]/18 bg-white hover:border-[#012770]/45 hover:bg-[#faf9f6]"
              }`}
            >
              <span
                className={`text-[0.86rem] font-bold ${
                  isSelected ? "text-[#012770]" : "text-[#17212f]"
                }`}
              >
                {status}
              </span>
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
                  isSelected
                    ? "border-[#012770] bg-[#012770] text-white"
                    : "border-[#637085]/40 bg-transparent"
                }`}
              >
                {isSelected && <Check size={12} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {selected === "No, I need help finding land" && (
        <div className="mt-6 border-l-2 border-[#ED7D01] bg-white p-5 shadow-sm">
          <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-[#ED7D01]">
            Land Acquisition
          </p>
          <p className="mt-2 text-[0.84rem] text-[#17212f]">
            Looking for land too? Explore available land opportunities.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("/properties")}
            className="mt-3 inline-flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#012770] transition-colors hover:text-[#ED7D01]"
          >
            Explore Land Listings <ArrowUpRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   STEP 3: LOCATION
   ========================================================================= */
function StepThree({
  area,
  exactLocation,
  onAreaChange,
  onExactChange,
}: {
  area: string;
  exactLocation: string;
  onAreaChange: (value: string) => void;
  onExactChange: (value: string) => void;
}) {
  return (
    <div>
      <h3 className="text-[1.3rem] font-bold text-[#012770]">
        Where is the project?
      </h3>
      <p className="mt-2 text-[0.8rem] leading-[1.6] text-[#637085]">
        ConcordVest primarily builds in Abuja and surrounding prime corridors.
        Please specify your target district or location.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            Area / District in Abuja *
          </label>
          <select
            value={area}
            onChange={e => onAreaChange(e.target.value)}
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          >
            {locations.map(loc => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
            <option value="Other Area in Abuja">Other Area in Abuja</option>
            <option value="Outside Abuja">Outside Abuja</option>
          </select>
        </div>

        <div>
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            Exact Location / Landmark (optional)
          </label>
          <input
            type="text"
            value={exactLocation}
            onChange={e => onExactChange(e.target.value)}
            placeholder="e.g. Near IBB Golf Course, Cadastral Zone B06"
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   STEP 4: CURRENT STAGE
   ========================================================================= */
function StepFour({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <h3 className="text-[1.3rem] font-bold text-[#012770]">
        What stage are you currently at?
      </h3>
      <p className="mt-2 text-[0.8rem] leading-[1.6] text-[#637085]">
        Select where your project stands today so we can tailor our initial
        consultation.
      </p>

      <div className="mt-6 grid gap-3">
        {stages.map(stage => {
          const isSelected = selected === stage;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => onSelect(stage)}
              className={`flex items-center justify-between border p-5 text-left transition-all ${
                isSelected
                  ? "border-[#012770] bg-[#012770]/5 shadow-sm"
                  : "border-[#012770]/18 bg-white hover:border-[#012770]/45 hover:bg-[#faf9f6]"
              }`}
            >
              <span
                className={`text-[0.88rem] font-bold ${
                  isSelected ? "text-[#012770]" : "text-[#17212f]"
                }`}
              >
                {stage}
              </span>
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
                  isSelected
                    ? "border-[#012770] bg-[#012770] text-white"
                    : "border-[#637085]/40 bg-transparent"
                }`}
              >
                {isSelected && <Check size={12} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   STEP 5: SERVICES REQUESTED
   ========================================================================= */
function StepFive({
  selectedServices,
  onToggleService,
}: {
  selectedServices: string[];
  onToggleService: (service: string) => void;
}) {
  return (
    <div>
      <h3 className="text-[1.3rem] font-bold text-[#012770]">
        What would you like ConcordVest to help with?
      </h3>
      <p className="mt-2 text-[0.8rem] leading-[1.6] text-[#637085]">
        Select all that apply. ConcordVest provides end-to-end turnkey delivery
        or specialized stage-by-stage advisory.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {serviceOptions.map(service => {
          const isSelected = selectedServices.includes(service);
          return (
            <button
              key={service}
              type="button"
              onClick={() => onToggleService(service)}
              className={`flex items-center justify-between border p-5 text-left transition-all ${
                isSelected
                  ? "border-[#012770] bg-[#012770]/5 shadow-sm"
                  : "border-[#012770]/18 bg-white hover:border-[#012770]/45 hover:bg-[#faf9f6]"
              }`}
            >
              <span
                className={`text-[0.86rem] font-bold ${
                  isSelected ? "text-[#012770]" : "text-[#17212f]"
                }`}
              >
                {service}
              </span>
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center border transition-colors ${
                  isSelected
                    ? "border-[#012770] bg-[#012770] text-white"
                    : "border-[#637085]/40 bg-transparent"
                }`}
              >
                {isSelected && <Check size={12} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   STEP 6: PROJECT DETAILS
   ========================================================================= */
function StepSix({
  formData,
  updateField,
}: {
  formData: BuildingProjectFormData;
  updateField: <K extends keyof BuildingProjectFormData>(
    field: K,
    value: BuildingProjectFormData[K]
  ) => void;
}) {
  return (
    <div>
      <h3 className="text-[1.3rem] font-bold text-[#012770]">
        Project details
      </h3>
      <p className="mt-2 text-[0.8rem] leading-[1.6] text-[#637085]">
        Share any preliminary figures you have in mind. All fields here are
        optional and help us prepare a realistic proposal.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            Number of Bedrooms / Units (optional)
          </label>
          <input
            type="text"
            value={formData.bedrooms}
            onChange={e => updateField("bedrooms", e.target.value)}
            placeholder="e.g. 5 bedrooms or 8 apartments"
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          />
        </div>

        <div>
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            Number of Floors (optional)
          </label>
          <select
            value={formData.floors}
            onChange={e => updateField("floors", e.target.value)}
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          >
            <option value="">Choose an option</option>
            {floorOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            Approximate Property Size (optional)
          </label>
          <input
            type="text"
            value={formData.propertySize}
            onChange={e => updateField("propertySize", e.target.value)}
            placeholder="e.g. 600 sqm or 1,200 sqm"
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          />
        </div>

        <div>
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            Expected Start Date (optional)
          </label>
          <select
            value={formData.startDate}
            onChange={e => updateField("startDate", e.target.value)}
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          >
            <option value="">Select expected start</option>
            {timelineOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            Estimated Budget Range (optional)
          </label>
          <select
            value={formData.budget}
            onChange={e => updateField("budget", e.target.value)}
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          >
            <option value="">Select budget range</option>
            {budgetOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            Additional Project Information (optional)
          </label>
          <textarea
            rows={3}
            value={formData.additionalNotes}
            onChange={e => updateField("additionalNotes", e.target.value)}
            placeholder="Share any architectural ideas, site challenges, or specific desires for the project..."
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   STEP 7: CONTACT DETAILS
   ========================================================================= */
function StepSeven({
  formData,
  updateField,
}: {
  formData: BuildingProjectFormData;
  updateField: <K extends keyof BuildingProjectFormData>(
    field: K,
    value: BuildingProjectFormData[K]
  ) => void;
}) {
  return (
    <div>
      <h3 className="text-[1.3rem] font-bold text-[#012770]">
        Contact details
      </h3>
      <p className="mt-2 text-[0.8rem] leading-[1.6] text-[#637085]">
        Provide your contact information so our project development team can
        reach out to review your brief.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => updateField("name", e.target.value)}
            placeholder="e.g. Ibrahim Abubakar"
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          />
        </div>

        <div>
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={e => updateField("phone", e.target.value)}
            placeholder="e.g. 0801 234 5678"
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          />
        </div>

        <div>
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            WhatsApp Number (optional)
          </label>
          <input
            type="tel"
            value={formData.whatsapp}
            onChange={e => updateField("whatsapp", e.target.value)}
            placeholder="Leave blank if same as phone"
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          />
        </div>

        <div>
          <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#012770]">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={e => updateField("email", e.target.value)}
            placeholder="e.g. ibrahim@example.com"
            className="mt-2 w-full border border-[#012770]/20 bg-white px-4 py-3 text-[0.85rem] text-[#17212f] outline-none transition-colors focus:border-[#012770]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 border border-[#012770]/14 bg-white p-4 cursor-pointer hover:bg-[#faf9f6]">
            <input
              type="checkbox"
              required
              checked={formData.consent}
              onChange={e => updateField("consent", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#012770] focus:ring-[#012770]"
            />
            <span className="text-[0.78rem] leading-[1.6] text-[#637085]">
              I agree that ConcordVest may contact me regarding this building
              project enquiry. We respect your privacy and will never share your
              information.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   SUCCESS SCREEN
   ========================================================================= */
function SuccessScreen({
  formData,
  effectiveBuildingType,
  whatsAppMessage,
  onNavigate,
}: {
  formData: BuildingProjectFormData;
  effectiveBuildingType: string;
  whatsAppMessage: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="py-8 sm:py-12">
      <div className="grid h-12 w-12 place-items-center bg-[#ED7D01] text-[#012770]">
        <Check size={22} strokeWidth={2.5} />
      </div>

      <h2 className="display-serif mt-6 text-[2.6rem] leading-[0.9] text-[#012770] sm:text-[4rem]">
        Your project starts here.
      </h2>

      <p className="mt-5 max-w-xl text-[0.88rem] leading-[1.8] text-[#637085]">
        Thank you. We have the information we need to understand your project. A
        Concordvest representative will review your requirements and guide you
        through the next step.
      </p>

      {/* Summary box */}
      <div className="mt-6 max-w-xl border-l-2 border-[#ED7D01] bg-white p-5 text-[0.76rem] leading-[1.8] text-[#637085] shadow-sm">
        <p>
          <strong className="text-[#012770]">Project:</strong>{" "}
          {effectiveBuildingType}
        </p>
        <p>
          <strong className="text-[#012770]">Land Status:</strong>{" "}
          {formData.landStatus}
        </p>
        <p>
          <strong className="text-[#012770]">Location:</strong> {formData.area}
          {formData.exactLocation ? ` · ${formData.exactLocation}` : ""}
        </p>
        <p>
          <strong className="text-[#012770]">Stage:</strong> {formData.stage}
        </p>
        <p>
          <strong className="text-[#012770]">Budget:</strong>{" "}
          {formData.budget || "To discuss"}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={buildWhatsAppUrl(whatsAppMessage)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-[#012770] px-6 py-4 text-[0.66rem] font-extrabold uppercase tracking-[0.13em] text-white transition-colors hover:bg-[#023799]"
        >
          <MessageCircle size={17} /> Talk to a Concordvest Agent on WhatsApp
        </a>

        <BrandButton variant="line" onClick={() => onNavigate("/projects")}>
          Explore Portfolio
        </BrandButton>
      </div>
    </div>
  );
}
