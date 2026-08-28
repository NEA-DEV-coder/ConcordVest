/* CONCORDVEST / Quiet Structure: discovery cards are information-rich catalogue plates with navy address metadata, orange availability signals, and honest prototype labeling. */
import { useState } from "react";
import {
  Bath,
  BedDouble,
  Heart,
  MapPin,
  Maximize2,
  ArrowUpRight,
} from "lucide-react";
import type { PropertyRecord } from "@/lib/properties";
import { formatNaira } from "@/lib/properties";

export function DiscoveryCard({
  property,
  view = "grid",
  onView,
}: {
  property: PropertyRecord;
  view?: "grid" | "list";
  onView: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const sold = property.availability === "Sold";
  const isLand = property.propertyType === "Land";
  const specs = [
    !isLand && property.bedrooms ? `${property.bedrooms} beds` : "",
    !isLand && property.bathrooms ? `${property.bathrooms} baths` : "",
    property.landSize ? `${property.landSize} sqm land` : "",
    property.buildingSize ? `${property.buildingSize} sqm build` : "",
  ].filter(Boolean);
  return (
    <article
      className={`group border border-[#012770]/12 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(1,39,112,0.12)] ${view === "list" ? "grid gap-0 sm:grid-cols-[15rem_1fr]" : ""}`}
    >
      <div
        className={`image-reveal relative bg-[#f4f1ea] ${view === "list" ? "aspect-[1.2/1] sm:aspect-auto sm:min-h-full" : "aspect-[1.24/1]"}`}
      >
        <img
          src={
            property.images?.[0] ||
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85"
          }
          alt={property.title}
          onError={e => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85";
          }}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3.5">
          <span className="bg-[#012770] px-2.5 py-2 text-[0.53rem] font-extrabold uppercase tracking-[0.13em] text-white">
            Prototype listing
          </span>
          <button
            type="button"
            aria-label={
              saved
                ? `Remove ${property.title} from saved listings`
                : `Save ${property.title}`
            }
            onClick={() => setSaved(!saved)}
            className={`grid h-9 w-9 place-items-center bg-white/92 transition-colors ${saved ? "text-[#ED7D01]" : "text-[#012770] hover:text-[#ED7D01]"}`}
          >
            <Heart
              size={16}
              fill={saved ? "currentColor" : "none"}
              strokeWidth={1.7}
            />
          </button>
        </div>
        <span
          className={`absolute bottom-3 left-3.5 px-2.5 py-2 text-[0.53rem] font-extrabold uppercase tracking-[0.13em] ${sold ? "bg-[#17212f] text-white" : "bg-[#ED7D01] text-[#012770]"}`}
        >
          {property.availability}
        </span>
      </div>
      <div className="flex flex-col p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-[#012770] px-2.5 py-2 text-[0.55rem] font-extrabold uppercase tracking-[0.12em] text-white">
            <MapPin size={11} className="text-[#ED7D01]" />
            {property.location}, {property.area}
          </span>
          <span className="bg-[#f4f1ea] px-2 py-2 text-[0.53rem] font-extrabold uppercase tracking-[0.12em] text-[#012770]">
            {property.propertyType}
          </span>
        </div>
        <h3
          className={`display-serif leading-[1.04] text-[#012770] ${view === "list" ? "text-2xl" : "text-[1.55rem]"}`}
        >
          {property.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[0.7rem] leading-[1.6] text-[#637085]">
          {property.description}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#012770]/10 pt-4">
          <span className="text-[1.08rem] font-extrabold tracking-[-0.04em] text-[#012770]">
            {formatNaira(property.price)}
          </span>
          <span className="text-right text-[0.53rem] font-extrabold uppercase leading-[1.35] tracking-[0.1em] text-[#ED7D01]">
            {property.listingType}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[0.63rem] font-semibold text-[#637085]">
          {specs.slice(0, 3).map(spec => (
            <span key={spec} className="inline-flex items-center gap-1.5">
              {spec.includes("bed") ? (
                <BedDouble size={13} />
              ) : spec.includes("bath") ? (
                <Bath size={13} />
              ) : (
                <Maximize2 size={13} />
              )}
              {spec}
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onView}
            className="line-link text-[0.61rem] font-extrabold uppercase tracking-[0.13em] text-[#012770]"
          >
            View property <ArrowUpRight size={15} />
          </button>
          <span className="text-[0.52rem] font-bold uppercase tracking-[0.12em] text-[#637085]">
            {property.documentation.slice(0, 2).join(" · ")}
          </span>
        </div>
      </div>
    </article>
  );
}
