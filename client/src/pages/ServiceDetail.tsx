/* CONCORDVEST / Quiet Structure: service detail pages read like disciplined project briefs—clear scope, process, and a quote-led close with no invented pricing. */
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardList,
  Clock3,
  Compass,
  Hammer,
  ImagePlus,
  Loader2,
  MessageCircle,
  Ruler,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Editorial";
import { BrandButton } from "@/components/BrandButton";
import { ServicePackageCard } from "@/components/ServicePackageCard";
import { RenovationQuoteFlow } from "@/components/RenovationQuoteFlow";
import { useService, useServices } from "@/hooks/useContent";
import { trackEvent } from "@/lib/analytics";

const VIEWED_SERVICES_SESSION_KEY = "concordvest_viewed_services";
const inMemoryViewedServices = new Set<string>();

export default function ServiceDetail() {
  const [, params] = useRoute("/services/:slug");
  const [, setLocation] = useLocation();

  // Fetch services from Supabase (or demo data fallback)
  const { services, customService, isLoading, error } = useServices();

  // Find the service by slug
  const service =
    params?.slug === customService.slug
      ? customService
      : services.find(s => s.slug === params?.slug);

  // Track service detail view once per service per browser session
  useEffect(() => {
    if (!service?.id) return;

    let alreadyViewed = inMemoryViewedServices.has(service.id);

    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const stored = window.sessionStorage.getItem(
          VIEWED_SERVICES_SESSION_KEY
        );
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.includes(service.id)) {
            alreadyViewed = true;
          }
        }
      }
    } catch {
      // sessionStorage restricted or unavailable
    }

    if (!alreadyViewed) {
      inMemoryViewedServices.add(service.id);
      try {
        if (typeof window !== "undefined" && window.sessionStorage) {
          const stored = window.sessionStorage.getItem(
            VIEWED_SERVICES_SESSION_KEY
          );
          const parsed = stored ? JSON.parse(stored) : [];
          const list = Array.isArray(parsed) ? parsed : [];
          if (!list.includes(service.id)) {
            list.push(service.id);
            window.sessionStorage.setItem(
              VIEWED_SERVICES_SESSION_KEY,
              JSON.stringify(list)
            );
          }
        }
      } catch {
        // sessionStorage restricted
      }

      trackEvent("service_view", {
        serviceId: service.id,
        metadata: {
          location: "service_detail",
        },
      });
    }
  }, [service?.id]);

  if (isLoading) return <LoadingState />;
  if (error)
    return <ErrorState error={error} onBack={() => setLocation("/services")} />;
  if (!service)
    return <MissingService onBack={() => setLocation("/services")} />;
  if (service.slug === customService.slug)
    return <CustomRenovation onNavigate={setLocation} />;
  return <PackageDetail service={service} onNavigate={setLocation} />;
}

function PackageDetail({
  service,
  onNavigate,
}: {
  service: NonNullable<ReturnType<typeof useService>["service"]>;
  onNavigate: (path: string) => void;
}) {
  // Fetch all services for related content
  const { services } = useServices();
  const related = services
    .filter(
      item =>
        item.id !== service.id &&
        item.tags.some(tag => service.tags.includes(tag))
    )
    .slice(0, 3);
  const navigate = (label: string) => {
    if (label === "Home") {
      onNavigate("/");
      return;
    }
    if (
      label === "All Properties" ||
      [
        "Land for Sale",
        "Apartments for Sale",
        "Concordvest Property",
        "Partner Property",
        "Developer Listings",
      ].includes(label)
    ) {
      onNavigate("/properties");
      return;
    }
    if (label === "All Services") {
      onNavigate("/services");
      return;
    }
    toast(`${label} is part of the next Concordvest release.`);
  };
  return (
    <div className="min-h-screen bg-white text-[#17212f]">
      <Header onAction={navigate} />
      <main>
        <section className="bg-[#012770] pb-12 pt-28 text-white sm:pb-16 sm:pt-32">
          <div className="container">
            <button
              type="button"
              onClick={() => onNavigate("/services")}
              className="mb-9 inline-flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-[#ED7D01]"
            >
              <ArrowLeft size={15} /> All services
            </button>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-20">
              <div>
                <p className="eyebrow">
                  Package {service.number} · Renovation &amp; finishing
                </p>
                <h1 className="display-serif mt-6 max-w-3xl text-[4.2rem] leading-[0.86] sm:text-[6.8rem]">
                  {service.name}
                </h1>
                <p className="mt-8 max-w-lg text-[0.92rem] leading-[1.8] text-white/72">
                  {service.shortDescription}
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <BrandButton
                    onClick={() => onNavigate("/services/custom-renovation")}
                  >
                    Request a quote
                  </BrandButton>
                  <BrandButton
                    variant="outline"
                    onClick={() => onNavigate("/services/site-inspection")}
                  >
                    Book site inspection
                  </BrandButton>
                </div>
              </div>
              <div className="relative min-h-[22rem] overflow-hidden border border-white/18 bg-[#0a337d] sm:min-h-[31rem]">
                <img
                  src={service.image}
                  alt={service.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-72"
                />
                <div className="absolute inset-0 bg-[#012770]/42" />
                <div className="absolute inset-x-0 bottom-0 border-t border-white/20 bg-[#012770]/75 p-5 sm:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[0.58rem] font-extrabold uppercase tracking-[0.15em] text-[#ED7D01]">
                        Estimated timeline
                      </div>
                      <div className="mt-2 text-[0.78rem] font-semibold text-white/80">
                        {service.timeline}
                      </div>
                    </div>
                    <Clock3 size={20} className="text-[#ED7D01]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="container py-16 sm:py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24">
            <div>
              <p className="eyebrow">The brief</p>
              <h2 className="display-serif mt-5 max-w-md text-[3.4rem] leading-[0.9] text-[#012770] sm:text-[5rem]">
                A clearer route from problem to place.
              </h2>
            </div>
            <div className="border-t-2 border-[#ED7D01] pt-5">
              <p className="text-[1rem] leading-[1.85] text-[#17212f]">
                {service.overview}
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <MiniFact
                  icon={<Compass size={18} />}
                  label="Approach"
                  detail="Considered"
                />
                <MiniFact
                  icon={<ShieldCheck size={18} />}
                  label="Pricing"
                  detail="Quote-led"
                />
                <MiniFact
                  icon={<Sparkles size={18} />}
                  label="Finish"
                  detail="Quality checked"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="bg-[#f4f1ea] py-16 sm:py-20 lg:py-28">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24">
              <div>
                <p className="eyebrow">Problems solved</p>
                <h2 className="display-serif mt-5 max-w-md text-[3.3rem] leading-[0.9] text-[#012770] sm:text-[5rem]">
                  The work behind the work.
                </h2>
              </div>
              <div className="space-y-4">
                {service.problemsSolved.map((problem, index) => (
                  <div
                    key={problem}
                    className="flex items-start gap-4 border-b border-[#012770]/16 py-5"
                  >
                    <span className="text-[0.62rem] font-extrabold tracking-[0.14em] text-[#ED7D01]">
                      0{index + 1}
                    </span>
                    <p className="max-w-lg text-[0.92rem] font-bold leading-[1.5] text-[#012770]">
                      {problem}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="container py-16 sm:py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-24">
            <div>
              <p className="eyebrow">What’s included</p>
              <h2 className="display-serif mt-5 max-w-sm text-[3.3rem] leading-[0.9] text-[#012770] sm:text-[5rem]">
                The scope, clearly.
              </h2>
            </div>
            <div className="grid border-l-2 border-[#ED7D01] sm:grid-cols-2">
              {service.includes.map(item => (
                <div
                  key={item}
                  className="flex items-center gap-3 border-b border-r border-[#012770]/12 px-5 py-5 text-[0.78rem] font-bold text-[#17212f]"
                >
                  <Check size={15} className="shrink-0 text-[#ED7D01]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="navy-grid bg-[#012770] py-16 text-white sm:py-20 lg:py-28">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24">
              <div>
                <p className="eyebrow">The process</p>
                <h2 className="display-serif mt-5 max-w-md text-[3.3rem] leading-[0.9] text-white sm:text-[5rem]">
                  A calm sequence.
                </h2>
              </div>
              <div className="space-y-0">
                {service.process.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-5 border-b border-white/18 py-6"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center border border-[#ED7D01] text-[0.61rem] font-extrabold text-[#ED7D01]">
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="text-[1rem] font-extrabold text-white">
                        {step}
                      </h3>
                      <p className="mt-2 max-w-md text-[0.72rem] leading-[1.65] text-white/58">
                        A defined step in the {service.name.toLowerCase()}{" "}
                        programme.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="bg-[#f4f1ea] py-16 sm:py-20 lg:py-28">
          <div className="container">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Related work</p>
                <h2 className="display-serif mt-5 text-[3.3rem] leading-[0.9] text-[#012770] sm:text-[5rem]">
                  The same point of view.
                </h2>
              </div>
              <p className="max-w-sm text-[0.78rem] leading-[1.7] text-[#637085]">
                A project image placeholder for the work this package can
                unlock.
              </p>
            </div>
            <div className="mt-9 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="image-reveal relative min-h-[24rem] overflow-hidden">
                <img
                  src={service.relatedProjectImage}
                  alt="Related Concordvest project"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 bg-[#012770]/90 px-5 py-4 text-[0.6rem] font-extrabold uppercase tracking-[0.13em] text-white">
                  Related project placeholder
                </div>
              </div>
              <div className="flex flex-col justify-between border-t-2 border-[#ED7D01] pt-5">
                <p className="max-w-sm text-[1rem] leading-[1.8] text-[#17212f]">
                  The project story is shaped with the same care as the package:
                  clear decisions, durable finishes, and a better relationship
                  between the space and the people using it.
                </p>
                <BrandButton
                  variant="navy"
                  className="mt-8 w-fit"
                  onClick={() => onNavigate("/services/custom-renovation")}
                >
                  Request a quote
                </BrandButton>
              </div>
            </div>
          </div>
        </section>
        {related.length > 0 && (
          <section className="container py-16 sm:py-20 lg:py-28">
            <div className="flex items-end justify-between gap-6 border-b border-[#012770]/16 pb-7">
              <div>
                <p className="eyebrow">Related services</p>
                <h2 className="display-serif mt-5 text-[3.2rem] leading-[0.9] text-[#012770] sm:text-[4.8rem]">
                  Keep exploring.
                </h2>
              </div>
            </div>
            <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map(item => (
                <ServicePackageCard
                  key={item.id}
                  service={item}
                  onView={() => onNavigate(`/services/${item.slug}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <QuotePlate onRequest={() => onNavigate("/services/custom-renovation")} />
      <Footer onAction={navigate} />
    </div>
  );
}

function QuotePlate({ onRequest }: { onRequest: () => void }) {
  return (
    <section className="bg-[#ED7D01] py-12 text-[#012770] sm:py-16">
      <div className="container flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
        <div>
          <p className="text-[0.6rem] font-extrabold uppercase tracking-[0.16em]">
            No fixed prices before the brief
          </p>
          <h2 className="display-serif mt-4 max-w-2xl text-[3rem] leading-[0.92] sm:text-[4.8rem]">
            Start with a conversation.
          </h2>
        </div>
        <BrandButton variant="navy" onClick={onRequest}>
          Request a quote
        </BrandButton>
      </div>
    </section>
  );
}
function MiniFact({
  icon,
  label,
  detail,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <div className="border-t border-[#012770]/16 pt-3">
      <div className="text-[#ED7D01]">{icon}</div>
      <div className="mt-3 text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-[#637085]">
        {label}
      </div>
      <div className="mt-1 text-[0.74rem] font-extrabold text-[#012770]">
        {detail}
      </div>
    </div>
  );
}

function CustomRenovation({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const nav = (label: string) => {
    if (label === "Home") {
      onNavigate("/");
      return;
    }
    if (label === "All Properties") {
      onNavigate("/properties");
      return;
    }
    if (label === "All Services") {
      onNavigate("/services");
      return;
    }
    if (label === "All Projects") {
      onNavigate("/projects");
      return;
    }
    if (label === "All Inspiration") {
      onNavigate("/inspiration");
      return;
    }
    toast(`${label} is part of the next Concordvest release.`);
  };
  return (
    <div className="min-h-screen bg-white text-[#17212f]">
      <Header onAction={nav} />
      <main>
        <section className="bg-[#012770] pb-14 pt-32 text-white sm:pb-20">
          <div className="container">
            <button
              type="button"
              onClick={() => onNavigate("/services")}
              className="mb-9 inline-flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-[#ED7D01]"
            >
              <ArrowLeft size={15} /> All services
            </button>
            <p className="eyebrow">A brief built around you</p>
            <h1 className="display-serif mt-6 max-w-4xl text-[4rem] leading-[0.86] sm:text-[6.8rem]">
              Don’t see exactly what you need?
            </h1>
            <p className="mt-8 max-w-lg text-[0.95rem] leading-[1.8] text-white/72">
              Tell us about your project and we’ll help shape the right route
              through renovation, finishing, or a combination of both.
            </p>
          </div>
        </section>
        <section className="container py-14 sm:py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
            <div>
              <p className="eyebrow">Custom renovation</p>
              <h2 className="display-serif mt-5 text-[3.3rem] leading-[0.9] text-[#012770] sm:text-[5rem]">
                Tell us about your project.
              </h2>
              <p className="mt-7 max-w-sm text-[0.8rem] leading-[1.8] text-[#637085]">
                Share the context, the property, and what you want to change.
                We’ll help turn the brief into a clear next step.
              </p>
            </div>
            <RenovationQuoteFlow onNavigate={onNavigate} />
          </div>
        </section>
      </main>
      <Footer onAction={nav} />
    </div>
  );
}

function MissingService({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#012770]">
      <Header onAction={onBack} />
      <div className="container flex min-h-[70vh] flex-col justify-center pt-20">
        <p className="eyebrow">Service note</p>
        <h1 className="display-serif mt-6 max-w-3xl text-[4rem] leading-[0.88] sm:text-[6rem]">
          That service is not in the brief.
        </h1>
        <BrandButton variant="navy" className="mt-8 w-fit" onClick={onBack}>
          Back to services
        </BrandButton>
      </div>
      <Footer onAction={onBack} />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-white text-[#012770]">
      <Header onAction={() => {}} />
      <div className="container flex min-h-[70vh] items-center justify-center pt-20">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto animate-spin text-[#ED7D01]" />
          <p className="mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#637085]">
            Loading service...
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onBack }: { error: Error; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#012770]">
      <Header onAction={onBack} />
      <div className="container flex min-h-[70vh] flex-col items-center justify-center pt-20">
        <p className="eyebrow">Error loading service</p>
        <h1 className="display-serif mt-6 max-w-3xl text-center text-[3rem] leading-[0.88] sm:text-[5rem]">
          Unable to load this service
        </h1>
        <p className="mt-4 max-w-md text-center text-[0.85rem] leading-[1.7] text-[#637085]">
          {error.message}
        </p>
        <BrandButton variant="navy" className="mt-8 w-fit" onClick={onBack}>
          Back to services
        </BrandButton>
      </div>
    </div>
  );
}
