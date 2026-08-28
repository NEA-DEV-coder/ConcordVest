/* CONCORDVEST / Quiet Structure: catalogue cards pair large architectural crops with useful metadata and an honest prototype label. */
import { useState } from "react";
import { BedDouble, Bath, Heart, MapPin, Maximize2 } from "lucide-react";

export type Property = {
  slug?: string;
  title: string;
  location: string;
  price: string;
  category: string;
  specs: string;
  image: string;
  status: string;
};

export function PropertyCard({
  property,
  onView,
  featured = false,
}: {
  property: Property;
  onView: () => void;
  featured?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const isLand = property.category.toLowerCase().includes("land");
  return (
    <article
      className={`group border border-[#012770]/12 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(1,39,112,0.12)] ${featured ? "lg:row-span-2" : ""}`}
    >
      <div
        className={`image-reveal relative bg-[#f4f1ea] ${featured ? "aspect-[1.08/1] lg:aspect-[1.05/1]" : "aspect-[1.15/1]"}`}
      >
        <img
          src={
            property.image ||
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85"
          }
          alt={property.title}
          onError={e => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85";
          }}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="bg-[#012770] px-2.5 py-2 text-[0.55rem] font-extrabold uppercase tracking-[0.14em] text-white">
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
            className={`grid h-9 w-9 place-items-center bg-white/90 transition-colors ${saved ? "text-[#ED7D01]" : "text-[#012770] hover:text-[#ED7D01]"}`}
          >
            <Heart
              size={16}
              fill={saved ? "currentColor" : "none"}
              strokeWidth={1.7}
            />
          </button>
        </div>
        <span className="absolute bottom-3 left-4 bg-[#ED7D01] px-2.5 py-2 text-[0.55rem] font-extrabold uppercase tracking-[0.14em] text-[#012770]">
          {property.status}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-4 inline-flex items-center gap-1.5 bg-[#012770] px-2.5 py-2 text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-white">
          <MapPin size={12} className="text-[#ED7D01]" />
          {property.location}
        </div>
        <h3 className="display-serif text-2xl leading-[1.02] text-[#012770] sm:text-[1.7rem]">
          {property.title}
        </h3>
        <div className="mt-4 border-t border-[#012770]/10 pt-4">
          <div className="flex items-end justify-between gap-3">
            <span className="text-[1.15rem] font-extrabold tracking-[-0.03em] text-[#012770]">
              {property.price}
            </span>
            <span className="bg-[#f4f1ea] px-2 py-1 text-[0.56rem] font-extrabold uppercase tracking-[0.12em] text-[#012770]">
              {property.category}
            </span>
          </div>
          <div className="mt-4 flex gap-4 text-[0.66rem] font-semibold text-[#637085]">
            {isLand ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Maximize2 size={14} />
                  {property.specs}
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <BedDouble size={14} />
                  {property.specs.split(" · ")[0]}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Bath size={14} />
                  {property.specs.split(" · ")[1]}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onView}
          className="line-link mt-6 text-[0.64rem] font-extrabold uppercase tracking-[0.13em] text-[#012770]"
        >
          View property <span aria-hidden="true">↗</span>
        </button>
      </div>
    </article>
  );
}
