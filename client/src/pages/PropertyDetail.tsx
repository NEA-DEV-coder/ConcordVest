/* CONCORDVEST / Quiet Structure: property detail is an editorial address dossier—cinematic gallery first, structured facts second, and a clear path to human contact. */
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Bath,
  BedDouble,
  Building2,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  Droplets,
  Heart,
  Loader2,
  MapPin,
  Maximize2,
  MessageCircle,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Trees,
  Waves,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Editorial";
import { BrandButton } from "@/components/BrandButton";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { ServiceCard } from "@/components/ShowcaseCards";
import { EnquiryModal, whatsappLink } from "@/components/EnquiryModal";
import { ViewingModal } from "@/components/ViewingModal";
import { formatNaira, type PropertyRecord } from "@/lib/properties";
import { useProperty, useProperties } from "@/hooks/useProperties";
import { servicePackages } from "@/lib/services";
import { resolveNavigation } from "@/lib/navigation";

const serviceData = [
  ["01", "Home Refresh"],
  ["02", "Kitchen Transformation"],
  ["03", "Luxury Bathroom Upgrade"],
  ["04", "Complete Home Remodeling"],
] as const;
const iconMap: Record<string, ReactNode> = {
  Security: <ShieldCheck size={19} />,
  Parking: <Car size={19} />,
  Generator: <Sparkles size={19} />,
  Water: <Droplets size={19} />,
  "Fitted Kitchen": <ChefHat size={19} />,
  Balcony: <Building2 size={19} />,
  Garden: <Trees size={19} />,
  "Swimming Pool": <Waves size={19} />,
  "Smart Home": <Sparkles size={19} />,
  "Serviced Property": <Building2 size={19} />,
};

export default function PropertyDetail() {
  const [, params] = useRoute("/properties/:slug");
  const [, setLocation] = useLocation();
  const { property, isLoading, error } = useProperty(params?.slug);

  if (isLoading) return <LoadingState />;
  if (error)
    return (
      <ErrorState error={error} onBack={() => setLocation("/properties")} />
    );
  if (!property)
    return <MissingProperty onBack={() => setLocation("/properties")} />;
  return (
    <PropertyDetailContent
      property={property}
      onBack={() => setLocation("/properties")}
      onNavigate={setLocation}
    />
  );
}

function PropertyDetailContent({
  property,
  onBack,
  onNavigate,
}: {
  property: NonNullable<ReturnType<typeof useProperty>["property"]>;
  onBack: () => void;
  onNavigate: (path: string) => void;
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [viewingOpen, setViewingOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasVideo = Boolean(property.video && property.video.trim());

  // Fetch all properties for related sections
  const { properties } = useProperties();
  const defaultFallback =
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85";
  const validImages = (property.images || []).filter(Boolean);
  const galleryImages =
    validImages.length > 0 ? validImages : [defaultFallback];
  const similar = useMemo(
    () =>
      properties
        .filter(
          item =>
            item.id !== property.id &&
            (item.propertyType === property.propertyType ||
              item.location === property.location ||
              Math.abs(item.price - property.price) < 70000000)
        )
        .slice(0, 3),
    [properties, property]
  );
  const inArea = useMemo(
    () =>
      properties
        .filter(
          item => item.id !== property.id && item.location === property.location
        )
        .slice(0, 3),
    [properties, property]
  );
  const land = useMemo(
    () =>
      properties
        .filter(item => item.id !== property.id && item.propertyType === "Land")
        .slice(0, 3),
    [properties, property]
  );
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Property link copied", {
        description: "Share this address with someone who should see it.",
      });
    } catch {
      toast("Property link ready to share", {
        description: window.location.href,
      });
    }
  };
  const nextImage = () =>
    setActiveImage(current => (current + 1) % galleryImages.length);
  const previousImage = () =>
    setActiveImage(
      current => (current - 1 + galleryImages.length) % galleryImages.length
    );
  const onHeaderAction = (label: string) => {
    const destination = resolveNavigation(label);
    if (destination) {
      onNavigate(destination);
      return;
    }
    toast(`${label} is part of the next Concordvest release.`);
  };
  return (
    <div className="min-h-screen bg-white text-[#17212f]">
      <Header onAction={onHeaderAction} />
      <main className="pb-20 md:pb-0">
        <section className="bg-[#012770] pb-10 pt-24 text-white sm:pb-14 sm:pt-28">
          <div className="container">
            <button
              type="button"
              onClick={onBack}
              className="mb-8 inline-flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-[#ED7D01]"
            >
              <ArrowLeft size={15} /> Back to properties
            </button>
            <div className="grid gap-5 lg:grid-cols-[1.38fr_0.62fr]">
              <div className="relative overflow-hidden bg-[#123a82]">
                <div className="image-reveal aspect-[1.15/1] sm:aspect-[1.72/1] lg:aspect-[1.46/1]">
                  <img
                    src={galleryImages[activeImage]}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-5">
                  <span className="bg-[#ED7D01] px-2.5 py-2 text-[0.55rem] font-extrabold uppercase tracking-[0.14em] text-[#012770]">
                    Prototype listing
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label={saved ? "Remove from saved" : "Save property"}
                      onClick={() => setSaved(!saved)}
                      className={`grid h-9 w-9 place-items-center bg-white ${saved ? "text-[#ED7D01]" : "text-[#012770]"}`}
                    >
                      <Heart size={16} fill={saved ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      aria-label="Share property"
                      onClick={handleShare}
                      className="grid h-9 w-9 place-items-center bg-white text-[#012770]"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-[#012770]/90 to-transparent px-4 pb-4 pt-14 sm:px-5">
                  <button
                    type="button"
                    onClick={() => setGalleryOpen(true)}
                    className="inline-flex items-center gap-2 text-[0.6rem] font-extrabold uppercase tracking-[0.13em] text-white"
                  >
                    <Maximize2 size={14} className="text-[#ED7D01]" /> View full
                    gallery
                  </button>
                  <span className="text-[0.62rem] font-extrabold tracking-[0.1em] text-white/80">
                    {activeImage + 1} / {galleryImages.length}
                  </span>
                </div>
              </div>
              <div className="flex flex-col justify-end border border-white/16 bg-[#0a337d] p-6 sm:p-8 lg:p-10">
                <div className="mb-auto">
                  <p className="eyebrow">{property.listingType}</p>
                  <h1 className="display-serif mt-6 text-[3.2rem] leading-[0.93] text-white sm:text-[4.55rem]">
                    {property.title}
                  </h1>
                  <div className="mt-6 inline-flex items-center gap-2 bg-white/10 px-3 py-2 text-[0.62rem] font-extrabold uppercase tracking-[0.13em] text-white">
                    <MapPin size={13} className="text-[#ED7D01]" />{" "}
                    {property.location}, {property.area}
                  </div>
                </div>
                <div className="mt-12 border-t border-white/18 pt-5">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-[1.65rem] font-extrabold tracking-[-0.05em] text-white sm:text-[2rem]">
                      {formatNaira(property.price)}
                    </span>
                    <span
                      className={`px-2.5 py-2 text-[0.55rem] font-extrabold uppercase tracking-[0.13em] ${property.availability === "Sold" ? "bg-white/15 text-white" : "bg-[#ED7D01] text-[#012770]"}`}
                    >
                      {property.availability}
                    </span>
                  </div>
                  <div className="mt-2 text-[0.62rem] font-bold uppercase tracking-[0.13em] text-white/55">
                    {property.propertyType} · {property.category}
                  </div>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                    <BrandButton
                      onClick={() => setEnquiryOpen(true)}
                      className="flex-1"
                    >
                      I’m Interested
                    </BrandButton>
                    <button
                      type="button"
                      onClick={() => setViewingOpen(true)}
                      className="inline-flex flex-1 items-center justify-center gap-2 border border-white/45 px-4 py-4 text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#ED7D01] hover:text-[#ED7D01]"
                    >
                      Schedule a viewing
                    </button>
                    <a
                      href={whatsappLink(property.title)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 border border-white/45 px-4 py-4 text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#ED7D01] hover:text-[#ED7D01]"
                    >
                      <MessageCircle size={15} /> WhatsApp an Agent
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  aria-label={`View image ${index + 1}`}
                  onClick={() => setActiveImage(index)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden border-2 sm:h-20 sm:w-32 ${activeImage === index ? "border-[#ED7D01]" : "border-transparent opacity-65 hover:opacity-100"}`}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
              {hasVideo ? (
                <button
                  type="button"
                  aria-label="Open property video tour"
                  onClick={() => setVideoModalOpen(true)}
                  className="flex h-16 shrink-0 items-center gap-2 border border-[#ED7D01]/80 bg-white/10 px-4 text-left text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#ED7D01] hover:bg-white/15 sm:h-20"
                >
                  <span className="grid h-7 w-7 place-items-center bg-[#ED7D01] text-[#012770] shadow-sm">
                    <Play size={13} fill="currentColor" />
                  </span>
                  <span>
                    Video Tour
                    <br />
                    <span className="font-semibold text-[#ED7D01]">
                      Watch walkthrough
                    </span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    toast("Video tour placeholder", {
                      description:
                        "A property walkthrough will be added when video inventory is connected.",
                    })
                  }
                  className="flex h-16 shrink-0 items-center gap-2 border border-dashed border-white/35 px-4 text-left text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-white sm:h-20"
                >
                  <span className="grid h-7 w-7 place-items-center bg-[#ED7D01] text-[#012770]">
                    <Play size={13} fill="currentColor" />
                  </span>
                  <span>
                    Video tour
                    <br />
                    <em className="not-italic text-white/50">Placeholder</em>
                  </span>
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="container py-14 sm:py-18 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:gap-24">
            <div>
              <p className="eyebrow">Property overview</p>
              <h2 className="display-serif mt-5 text-[3rem] leading-none text-[#012770] sm:text-[4.3rem]">
                The essentials.
              </h2>
              <div className="mt-10 grid grid-cols-2 border-l-2 border-[#ED7D01] sm:grid-cols-4">
                {[
                  ...([
                    !property.bedrooms ? null : ["Bedrooms", property.bedrooms],
                    ...(!property.bathrooms
                      ? []
                      : [["Bathrooms", property.bathrooms]]),
                    [
                      "Land size",
                      property.landSize ? `${property.landSize} sqm` : "—",
                    ],
                    [
                      "Building size",
                      property.buildingSize
                        ? `${property.buildingSize} sqm`
                        : "—",
                    ],
                    [
                      "Parking",
                      property.features.includes("Parking") ? "Included" : "—",
                    ],
                    ["Property type", property.propertyType],
                    ["Status", property.availability],
                  ].filter(Boolean) as [string, string | number][]),
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="border-b border-r border-[#012770]/12 px-4 py-5 sm:px-5"
                  >
                    <div className="text-[0.57rem] font-extrabold uppercase tracking-[0.13em] text-[#637085]">
                      {label}
                    </div>
                    <div className="mt-3 text-[1rem] font-extrabold tracking-[-0.03em] text-[#012770]">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t-2 border-[#ED7D01] pt-5">
              <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-[#637085]">
                An address with intent
              </p>
              <p className="mt-5 text-[0.9rem] leading-[1.8] text-[#17212f]">
                {property.description}
              </p>
              <div className="mt-6 flex items-center gap-2 text-[0.63rem] font-bold uppercase tracking-[0.11em] text-[#637085]">
                <Building2 size={16} className="text-[#ED7D01]" />{" "}
                {property.listingType}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f4f1ea] py-14 sm:py-18 lg:py-24">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-24">
              <div>
                <p className="eyebrow">Inside the brief</p>
                <h2 className="display-serif mt-5 max-w-sm text-[3rem] leading-[0.94] text-[#012770] sm:text-[4.2rem]">
                  Made for the way you want to live.
                </h2>
              </div>
              <div className="grid gap-10 sm:grid-cols-2">
                <div>
                  <div className="mb-4 text-[0.61rem] font-extrabold uppercase tracking-[0.16em] text-[#012770]">
                    Features
                  </div>
                  <div className="space-y-3">
                    {property.features.map(item => (
                      <FeatureRow key={item} label={item} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-4 text-[0.61rem] font-extrabold uppercase tracking-[0.16em] text-[#012770]">
                    Amenities
                  </div>
                  <div className="space-y-3">
                    {property.amenities.map(item => (
                      <FeatureRow key={item} label={item} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-14 sm:py-18 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div>
              <p className="eyebrow">Property information</p>
              <h2 className="display-serif mt-5 text-[3rem] leading-[0.94] text-[#012770] sm:text-[4.2rem]">
                Clear from the start.
              </h2>
            </div>
            <div className="border-t border-[#012770]/16">
              {[
                ["Listing type", property.listingType],
                ["Documentation", property.documentation.join(" · ")],
                [
                  "Developer / partner",
                  property.listingType === "Partner Property"
                    ? "Partner property"
                    : "Concordvest catalogue",
                ],
                ["Availability", property.availability],
                [
                  "Completion status",
                  property.propertyType === "Land"
                    ? "Build-ready plot"
                    : "Completed property",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[0.8fr_1.2fr] gap-5 border-b border-[#012770]/16 py-4 text-[0.75rem] sm:grid-cols-2"
                >
                  <span className="font-extrabold uppercase tracking-[0.12em] text-[#637085]">
                    {label}
                  </span>
                  <span className="font-bold text-[#012770]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="navy-grid bg-[#012770] py-14 text-white sm:py-18 lg:py-24">
          <div className="container">
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24">
              <div>
                <p className="eyebrow">Location</p>
                <h2 className="display-serif mt-5 text-[3rem] leading-[0.94] text-white sm:text-[4.2rem]">
                  Close to what matters.
                </h2>
                <p className="mt-7 max-w-sm text-[0.82rem] leading-[1.8] text-white/65">
                  A styled location preview for the prototype. Connect a live
                  map service when the catalogue moves to real inventory.
                </p>
                <div className="mt-8 flex items-center gap-3 text-[0.63rem] font-extrabold uppercase tracking-[0.12em] text-white/70">
                  <MapPin size={16} className="text-[#ED7D01]" />{" "}
                  {property.location}, {property.area}
                </div>
              </div>
              <div>
                <div className="relative min-h-[20rem] overflow-hidden border border-white/18 bg-[#0a337d] p-6 sm:min-h-[24rem]">
                  <div
                    className="absolute inset-0 opacity-55"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
                      backgroundSize: "3rem 3rem",
                    }}
                  />
                  <div className="absolute left-[22%] top-[35%] h-28 w-44 rotate-12 border border-[#ED7D01]/50" />
                  <div className="absolute right-[18%] top-[22%] h-36 w-52 -rotate-12 border border-white/20" />
                  <div className="absolute bottom-[20%] left-[43%] h-10 w-10 rotate-45 border-2 border-[#ED7D01] bg-[#012770]" />
                  <div className="absolute bottom-[21.4%] left-[45.2%] text-[0.62rem] font-extrabold uppercase tracking-[0.1em] text-white">
                    {property.location}
                  </div>
                  <div className="absolute bottom-5 left-6 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white/50">
                    Map preview · {property.coordinates.lat.toFixed(3)}° N,{" "}
                    {property.coordinates.lng.toFixed(3)}° E
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Landmark label="Jabi Lake Mall" detail="8 min" />
                  <Landmark label="Central district" detail="15 min" />
                  <Landmark label="Airport road" detail="22 min" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {similar.length > 0 && (
          <RelatedSection
            title="You may also like"
            kicker="Curated next steps"
            description="Similar addresses selected by property type, location, tags, and price range."
            properties={similar}
            onNavigate={onNavigate}
          />
        )}
        {inArea.length > 0 && (
          <RelatedSection
            title={`More properties in ${property.location}`}
            kicker="The local edit"
            properties={inArea}
            onNavigate={onNavigate}
          />
        )}
        {land.length > 0 && (
          <RelatedSection
            title="Looking for land?"
            kicker="Start with the ground"
            description="For those who want to shape the address from the first line."
            properties={land}
            onNavigate={onNavigate}
          />
        )}
        <section className="bg-[#f4f1ea] py-14 sm:py-18 lg:py-24">
          <div className="container">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Complete your property</p>
                <h2 className="display-serif mt-5 text-[3rem] leading-[0.94] text-[#012770] sm:text-[4.2rem]">
                  Let’s draw the next room.
                </h2>
              </div>
              <p className="max-w-sm text-[0.8rem] leading-[1.75] text-[#637085]">
                Bring the same point of view to the spaces you already own.
              </p>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {serviceData.map(([number, title]) => (
                <ServiceCard
                  key={number}
                  number={number}
                  title={title}
                  onClick={() =>
                    onNavigate(
                      `/services/${servicePackages.find(item => item.name === title)?.slug || "custom-renovation"}`
                    )
                  }
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer onAction={onHeaderAction} />
      {galleryOpen && (
        <GalleryOverlay
          images={galleryImages}
          activeImage={activeImage}
          setActiveImage={setActiveImage}
          onClose={() => setGalleryOpen(false)}
          previousImage={previousImage}
          nextImage={nextImage}
        />
      )}
      {enquiryOpen && (
        <EnquiryModal
          property={property}
          onClose={() => setEnquiryOpen(false)}
        />
      )}
      {viewingOpen && (
        <ViewingModal
          property={property}
          onClose={() => setViewingOpen(false)}
        />
      )}
      {videoModalOpen && hasVideo && (
        <VideoTourModal
          videoUrl={property.video}
          title={property.title}
          onClose={() => setVideoModalOpen(false)}
        />
      )}
    </div>
  );
}

function FeatureRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-[0.77rem] font-bold text-[#17212f]">
      <span className="grid h-8 w-8 place-items-center border border-[#ED7D01] text-[#012770]">
        {iconMap[label] || <Sparkles size={19} />}
      </span>
      {label}
    </div>
  );
}
function Landmark({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="border-t border-white/20 pt-3">
      <div className="text-[0.65rem] font-bold text-white/85">{label}</div>
      <div className="mt-1 text-[0.57rem] font-extrabold uppercase tracking-[0.13em] text-[#ED7D01]">
        {detail} away
      </div>
    </div>
  );
}
function RelatedSection({
  title,
  kicker,
  description,
  properties,
  onNavigate,
}: {
  title: string;
  kicker: string;
  description?: string;
  properties: PropertyRecord[];
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="container py-14 sm:py-18 lg:py-24">
      <div className="flex flex-col justify-between gap-8 border-b border-[#012770]/16 pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{kicker}</p>
          <h2 className="display-serif mt-5 text-[3rem] leading-[0.94] text-[#012770] sm:text-[4.2rem]">
            {title}
          </h2>
        </div>
        {description && (
          <p className="max-w-sm text-[0.78rem] leading-[1.7] text-[#637085]">
            {description}
          </p>
        )}
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {properties.map(property => (
          <DiscoveryCard
            key={property.id}
            property={property}
            onView={() => onNavigate(`/properties/${property.slug}`)}
          />
        ))}
      </div>
    </section>
  );
}
function GalleryOverlay({
  images,
  activeImage,
  setActiveImage,
  onClose,
  previousImage,
  nextImage,
}: {
  images: string[];
  activeImage: number;
  setActiveImage: (value: number) => void;
  onClose: () => void;
  previousImage: () => void;
  nextImage: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#012770]/95 p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close full-screen gallery"
        onClick={onClose}
        className="absolute right-5 top-5 grid h-10 w-10 place-items-center border border-white/30 text-white"
      >
        <X size={18} />
      </button>
      <button
        type="button"
        aria-label="Previous image"
        onClick={previousImage}
        className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center border border-white/30 text-white sm:left-8"
      >
        <ChevronLeft size={19} />
      </button>
      <div className="flex w-full max-w-5xl flex-col items-center gap-5">
        <img
          src={images[activeImage]}
          alt=""
          className="max-h-[72vh] w-full object-contain"
        />
        <div className="flex max-w-full gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              type="button"
              key={image}
              onClick={() => setActiveImage(index)}
              className={`h-14 w-20 shrink-0 overflow-hidden border-2 ${activeImage === index ? "border-[#ED7D01]" : "border-transparent opacity-60"}`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-white/60">
          {activeImage + 1} / {images.length}
        </span>
      </div>
      <button
        type="button"
        aria-label="Next image"
        onClick={nextImage}
        className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center border border-white/30 text-white sm:right-8"
      >
        <ChevronRight size={19} />
      </button>
    </div>
  );
}

function VideoTourModal({
  videoUrl,
  title,
  onClose,
}: {
  videoUrl: string;
  title: string;
  onClose: () => void;
}) {
  const [loadError, setLoadError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Browser autoplay policy requires muted playback
    video.defaultMuted = true;
    video.muted = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked by browser policy; user can click play via controls
      });
    }
  }, [videoUrl]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Video tour for ${title}`}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[#012770]/95 p-4 sm:p-6 md:p-10"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        aria-label="Close video tour"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center border border-white/30 bg-[#012770]/80 text-white transition-colors hover:border-[#ED7D01] hover:text-[#ED7D01] sm:right-6 sm:top-6"
      >
        <X size={18} />
      </button>

      <div className="relative flex w-full max-w-4xl flex-col overflow-hidden border border-white/20 bg-black shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#012770] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center bg-[#ED7D01] text-[#012770]">
              <Play size={10} fill="currentColor" />
            </span>
            <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-white">
              Video Tour · {title}
            </span>
          </div>
          <span className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-white/60">
            ConcordVest Walkthrough
          </span>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black">
          {loadError ? (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white">
              <AlertCircle size={32} className="text-[#ED7D01]" />
              <p className="mt-3 text-sm font-bold">
                Video walkthrough is currently unavailable
              </p>
              <p className="mt-1 text-xs text-white/60">
                Please check back later or contact ConcordVest for a personal
                walkthrough.
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              autoPlay
              muted
              playsInline
              controls
              preload="metadata"
              onError={() => setLoadError(true)}
              className="h-full w-full object-contain"
            >
              Your browser does not support video playback.
            </video>
          )}
        </div>
      </div>
    </div>
  );
}
function MissingProperty({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#012770]">
      <Header onAction={() => onBack()} />
      <div className="container flex min-h-[70vh] flex-col justify-center pt-20">
        <p className="eyebrow">Catalogue note</p>
        <h1 className="display-serif mt-6 max-w-2xl text-[4rem] leading-[0.9] sm:text-[6rem]">
          This address is not in the catalogue.
        </h1>
        <p className="mt-6 max-w-md text-[0.85rem] leading-[1.7] text-[#637085]">
          The property may have moved, or this prototype link may be incomplete.
        </p>
        <BrandButton variant="navy" className="mt-8 w-fit" onClick={onBack}>
          Back to properties
        </BrandButton>
      </div>
      <Footer onAction={() => onBack()} />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#012770]">
      <Header onAction={() => {}} />
      <div className="container flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto animate-spin text-[#ED7D01]" />
          <p className="mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#637085]">
            Loading property...
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onBack }: { error: Error; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#012770]">
      <Header onAction={() => onBack()} />
      <div className="container flex min-h-[70vh] flex-col items-center justify-center pt-20">
        <p className="eyebrow">Error loading property</p>
        <h1 className="display-serif mt-6 max-w-2xl text-center text-[3rem] leading-[0.9] sm:text-[4rem]">
          Unable to load this property
        </h1>
        <p className="mt-4 max-w-md text-center text-[0.85rem] leading-[1.7] text-[#637085]">
          {error.message}
        </p>
        <BrandButton variant="navy" className="mt-8 w-fit" onClick={onBack}>
          Back to properties
        </BrandButton>
      </div>
    </div>
  );
}
