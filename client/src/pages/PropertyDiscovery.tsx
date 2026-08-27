/* CONCORDVEST / Quiet Structure: the discovery page is a premium catalogue workspace—navy index header, open filter rail, structured plates, and calm responsive controls. */
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { ArrowUpRight, Check, ChevronDown, Grid3X3, List, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { Header } from "@/components/Header";
import { BrandButton } from "@/components/BrandButton";
import { DiscoveryCard } from "@/components/DiscoveryCard";
import { Footer } from "@/components/Editorial";
import { categoryOptions, documentationOptions, featureOptions, locations, type Availability, type PropertyCategory } from "@/lib/properties";
import { useProperties } from "@/hooks/useProperties";
import { useLocation } from "wouter";

type SortOption = "Recommended" | "Newest" | "Price Low to High" | "Price High to Low";
type FilterState = { search: string; location: string; minPrice: string; maxPrice: string; propertyType: string; bedrooms: string; bathrooms: string; minLandSize: string; minBuildingSize: string; listingType: string; availability: string; features: string[]; documentation: string[] };

const initialFilters: FilterState = { search: "", location: "", minPrice: "", maxPrice: "", propertyType: "", bedrooms: "", bathrooms: "", minLandSize: "", minBuildingSize: "", listingType: "", availability: "", features: [], documentation: [] };

export default function PropertyDiscovery() {
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState<PropertyCategory>("All Properties");
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sort, setSort] = useState<SortOption>("Recommended");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch properties from Supabase (or demo data fallback)
  const { properties, isLoading, error } = useProperties();

  const update = (key: keyof FilterState, value: string | string[]) => setFilters(current => ({ ...current, [key]: value }));
  const toggleArray = (key: "features" | "documentation", value: string) => setFilters(current => ({ ...current, [key]: current[key].includes(value) ? current[key].filter(item => item !== value) : [...current[key], value] }));
  const clearFilters = () => { setCategory("All Properties"); setFilters(initialFilters); setSort("Recommended"); };

  const filteredProperties = useMemo(() => {
    const list = properties.filter(property => {
      const searchable = [property.title, property.location, property.area, property.category, property.listingType, property.propertyType, ...property.tags].join(" ").toLowerCase();
      const categoryMatch = category === "All Properties" || property.category === category || (category === "Apartments for Sale" && ["Apartment", "House"].includes(property.propertyType));
      const locationMatch = !filters.location || (filters.location === "Abuja" ? property.area === "Abuja" : property.location === filters.location);
      const searchMatch = !filters.search || searchable.includes(filters.search.toLowerCase());
      const minPriceMatch = !filters.minPrice || property.price >= Number(filters.minPrice);
      const maxPriceMatch = !filters.maxPrice || property.price <= Number(filters.maxPrice);
      const propertyTypeMatch = !filters.propertyType || property.propertyType === filters.propertyType;
      const bedroomsMatch = !filters.bedrooms || property.bedrooms >= Number(filters.bedrooms);
      const bathroomsMatch = !filters.bathrooms || property.bathrooms >= Number(filters.bathrooms);
      const landSizeMatch = !filters.minLandSize || property.landSize >= Number(filters.minLandSize);
      const buildingSizeMatch = !filters.minBuildingSize || property.buildingSize >= Number(filters.minBuildingSize);
      const listingMatch = !filters.listingType || property.listingType === filters.listingType;
      const availabilityMatch = !filters.availability || property.availability === filters.availability;
      const featuresMatch = filters.features.every(feature => [...property.features, ...property.amenities].includes(feature));
      const docsMatch = filters.documentation.every(doc => property.documentation.includes(doc));
      return categoryMatch && locationMatch && searchMatch && minPriceMatch && maxPriceMatch && propertyTypeMatch && bedroomsMatch && bathroomsMatch && landSizeMatch && buildingSizeMatch && listingMatch && availabilityMatch && featuresMatch && docsMatch;
    });
    return [...list].sort((a, b) => sort === "Price Low to High" ? a.price - b.price : sort === "Price High to Low" ? b.price - a.price : sort === "Newest" ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id));
  }, [properties, category, filters, sort]);

  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => count + (Array.isArray(value) ? value.length : value ? 1 : 0), category !== "All Properties" ? 1 : 0);
  const onHeaderAction = (label: string) => {
    if (label === "All Properties") { clearFilters(); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (categoryOptions.includes(label as PropertyCategory)) { setCategory(label as PropertyCategory); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (label === "Home") { setLocation("/"); return; }
    notify(label);
  };

  return (
    <div id="top" className="min-h-screen bg-white text-[#17212f]
">
      <Header onAction={onHeaderAction} />
      <main>
        <section className="navy-grid bg-[#012770] pb-12 pt-32 text-white sm:pb-16 lg:pb-20"><div className="container"><div className="max-w-4xl"><p className="eyebrow">The Concordvest catalogue</p><h1 className="display-serif mt-6 text-[3.6rem] leading-[0.9] sm:text-[5.8rem]">Find the right<br /><span className="text-[#ED7D01]">next address.</span></h1><p className="mt-7 max-w-xl text-[0.9rem] leading-[1.75] text-white/70 sm:text-[1rem]">A considered collection of land, apartments, and homes across Abuja. Search by what matters to you.</p></div><div className="mt-12 flex max-w-4xl flex-col gap-3 sm:flex-row"><label className="relative flex min-h-14 flex-1 items-center bg-white text-[#012770]"><Search size={18} className="ml-5 text-[#ED7D01]" /><span className="sr-only">Search properties</span><input value={filters.search} onChange={event => update("search", event.target.value)} placeholder="Search by title, location, or keyword" className="h-full w-full bg-transparent px-4 text-[0.78rem] font-semibold outline-none placeholder:text-[#637085]" /></label><button type="button" onClick={() => { document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }); }} className="min-h-14 bg-[#ED7D01] px-7 text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-[#012770] transition-transform hover:-translate-y-0.5 active:scale-[0.97]">Search catalogue <ArrowUpRight size={15} className="ml-2 inline" /></button></div></div></section>

        <section id="results" className="bg-[#f4f1ea] py-8 sm:py-12"><div className="container"><div className="flex flex-col gap-4 border-b border-[#012770]/16 pb-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><span className="text-[0.66rem] font-extrabold uppercase tracking-[0.16em] text-[#ED7D01]">Browse</span><span className="h-4 w-px bg-[#012770]/25" /><span className="text-[0.74rem] font-semibold text-[#637085]">{filteredProperties.length} {filteredProperties.length === 1 ? "property" : "properties"} found</span>{activeFilterCount > 0 && <span className="bg-[#012770] px-2 py-1 text-[0.55rem] font-extrabold uppercase tracking-[0.1em] text-white">{activeFilterCount} active</span>}</div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setMobileFiltersOpen(true)} className="inline-flex items-center gap-2 border border-[#012770]/20 bg-white px-3 py-2.5 text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-[#012770] lg:hidden"><SlidersHorizontal size={14} /> Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}</button><label className="flex items-center gap-2 text-[0.61rem] font-extrabold uppercase tracking-[0.12em] text-[#637085]">Sort<select value={sort} onChange={event => setSort(event.target.value as SortOption)} className="bg-transparent py-2 text-[0.66rem] font-extrabold normal-case tracking-normal text-[#012770] outline-none"><option>Recommended</option><option>Newest</option><option>Price Low to High</option><option>Price High to Low</option></select></label><span className="mx-1 hidden h-5 w-px bg-[#012770]/20 sm:block" /><div className="flex items-center border border-[#012770]/20 bg-white"><button type="button" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`grid h-9 w-9 place-items-center ${view === "grid" ? "bg-[#012770] text-white" : "text-[#012770]"}`}><Grid3X3 size={15} /></button><button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")} className={`grid h-9 w-9 place-items-center ${view === "list" ? "bg-[#012770] text-white" : "text-[#012770]"}`}><List size={16} /></button></div></div></div>

          <div className="mt-7 flex items-start gap-8 lg:mt-10"><aside className="hidden w-64 shrink-0 lg:block"><FilterPanel filters={filters} category={category} update={update} toggleArray={toggleArray} setCategory={setCategory} clearFilters={clearFilters} /></aside><div className="min-w-0 flex-1">{isLoading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={() => window.location.reload()} /> : filteredProperties.length > 0 ? <div className={view === "grid" ? "grid gap-5 md:grid-cols-2" : "grid gap-5"}>{filteredProperties.map(property => <DiscoveryCard key={property.id} property={property} view={view} onView={() => setLocation(`/properties/${property.slug}`)} />)}</div> : <EmptyState clearFilters={clearFilters} onAction={notify} />}</div></div></div></section>
        </main>

      {mobileFiltersOpen && <div className="fixed inset-0 z-[60] lg:hidden"><button type="button" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} className="absolute inset-0 bg-[#012770]/55" /><div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto bg-white px-5 pb-7 pt-4 text-[#012770] shadow-[0_-18px_45px_rgba(1,39,112,0.2)]"><div className="mb-4 flex items-center justify-between border-b border-[#012770]/12 pb-4"><div><p className="eyebrow">Refine the catalogue</p><h2 className="display-serif mt-3 text-3xl">Your filters</h2></div><button type="button" onClick={() => setMobileFiltersOpen(false)} className="grid h-9 w-9 place-items-center border border-[#012770]/20"><X size={17} /></button></div><FilterPanel filters={filters} category={category} update={update} toggleArray={toggleArray} setCategory={setCategory} clearFilters={clearFilters} /><BrandButton className="mt-7 w-full" onClick={() => setMobileFiltersOpen(false)}>Show {filteredProperties.length} properties</BrandButton></div></div>}
      <Footer onAction={onHeaderAction} />
    </div>
  );
}

function FilterPanel({ filters, category, update, toggleArray, setCategory, clearFilters }: { filters: FilterState; category: PropertyCategory; update: (key: keyof FilterState, value: string | string[]) => void; toggleArray: (key: "features" | "documentation", value: string) => void; setCategory: (value: PropertyCategory) => void; clearFilters: () => void }) {
  return <div className="space-y-7"><div className="flex items-center justify-between border-b border-[#012770]/16 pb-4"><span className="text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-[#012770]">Filter by</span><button type="button" onClick={clearFilters} className="text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-[#ED7D01]">Clear all</button></div><FilterGroup label="Category"><select value={category} onChange={event => setCategory(event.target.value as PropertyCategory)} className="filter-input"><option>All Properties</option>{categoryOptions.slice(1).map(option => <option key={option}>{option}</option>)}</select></FilterGroup><FilterGroup label="Location"><select value={filters.location} onChange={event => update("location", event.target.value)} className="filter-input"><option value="">Any location</option>{locations.map(location => <option key={location}>{location}</option>)}</select></FilterGroup><FilterGroup label="Price range"><div className="grid grid-cols-2 gap-2"><input type="number" min="0" value={filters.minPrice} onChange={event => update("minPrice", event.target.value)} placeholder="Min ₦" className="filter-input" /><input type="number" min="0" value={filters.maxPrice} onChange={event => update("maxPrice", event.target.value)} placeholder="Max ₦" className="filter-input" /></div></FilterGroup><FilterGroup label="Property type"><div className="grid grid-cols-3 gap-1.5">{["Land", "Apartment", "House"].map(type => <ChoiceButton key={type} active={filters.propertyType === type} onClick={() => update("propertyType", filters.propertyType === type ? "" : type)}>{type}</ChoiceButton>)}</div></FilterGroup><FilterGroup label="Bedrooms / bathrooms"><div className="grid grid-cols-2 gap-2"><select value={filters.bedrooms} onChange={event => update("bedrooms", event.target.value)} className="filter-input"><option value="">Beds</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+ beds</option>)}</select><select value={filters.bathrooms} onChange={event => update("bathrooms", event.target.value)} className="filter-input"><option value="">Baths</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+ baths</option>)}</select></div></FilterGroup><FilterGroup label="Size"><div className="grid grid-cols-2 gap-2"><input type="number" min="0" value={filters.minLandSize} onChange={event => update("minLandSize", event.target.value)} placeholder="Land sqm" className="filter-input" /><input type="number" min="0" value={filters.minBuildingSize} onChange={event => update("minBuildingSize", event.target.value)} placeholder="Build sqm" className="filter-input" /></div></FilterGroup><FilterGroup label="Listing type"><select value={filters.listingType} onChange={event => update("listingType", event.target.value)} className="filter-input"><option value="">Any listing type</option><option>Concordvest Property</option><option>Partner Property</option><option>Developer Listing</option></select></FilterGroup><FilterGroup label="Availability"><div className="grid grid-cols-3 gap-1.5">{(["Available", "Reserved", "Sold"] as Availability[]).map(item => <ChoiceButton key={item} active={filters.availability === item} onClick={() => update("availability", filters.availability === item ? "" : item)}>{item}</ChoiceButton>)}</div></FilterGroup><FilterGroup label="Features"><div className="grid grid-cols-2 gap-x-2 gap-y-2">{featureOptions.map(item => <CheckOption key={item} active={filters.features.includes(item)} onClick={() => toggleArray("features", item)}>{item}</CheckOption>)}</div></FilterGroup><FilterGroup label="Documentation"><div className="grid grid-cols-2 gap-x-2 gap-y-2">{documentationOptions.map(item => <CheckOption key={item} active={filters.documentation.includes(item)} onClick={() => toggleArray("documentation", item)}>{item}</CheckOption>)}</div></FilterGroup></div>;
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) { return <div><label className="mb-2 block text-[0.58rem] font-extrabold uppercase tracking-[0.15em] text-[#637085]">{label}</label>{children}</div>; }
function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className={`border px-2 py-2 text-[0.58rem] font-extrabold uppercase tracking-[0.06em] transition-colors ${active ? "border-[#012770] bg-[#012770] text-white" : "border-[#012770]/16 bg-white text-[#012770] hover:border-[#ED7D01]"}`}>{children}</button>; }
function CheckOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className="flex items-center gap-2 text-left text-[0.65rem] font-semibold text-[#17212f]"><span className={`grid h-4 w-4 shrink-0 place-items-center border ${active ? "border-[#012770] bg-[#012770] text-white" : "border-[#012770]/25 bg-white"}`}>{active && <Check size={11} />}</span>{children}</button>; }

function EmptyState({ clearFilters, onAction }: { clearFilters: () => void; onAction: (label: string) => void }) { return <div className="border border-dashed border-[#012770]/25 bg-white px-6 py-20 text-center sm:px-10"><div className="mx-auto grid h-12 w-12 place-items-center border border-[#ED7D01] text-[#ED7D01]"><Search size={19} /></div><h2 className="display-serif mt-7 text-4xl text-[#012770]">No properties found</h2><p className="mx-auto mt-4 max-w-sm text-[0.8rem] leading-[1.7] text-[#637085]">We couldn’t find a match for your current filters. Try opening up your search or speak to an agent.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><BrandButton variant="navy" onClick={clearFilters}>Clear Filters</BrandButton><BrandButton variant="line" onClick={() => onAction("All Properties")}>Explore All Properties</BrandButton><BrandButton variant="line" onClick={() => onAction("Talk to an Agent")}>Talk to an Agent</BrandButton></div></div>; }

function notify(label: string) { toast(`${label} is part of the next Concordvest release.`, { description: "This prototype keeps the destination ready while we build the full experience." }); }


function LoadingState() { return <div className="flex min-h-[40vh] items-center justify-center"><div className="text-center"><Loader2 size={32} className="mx-auto animate-spin text-[#ED7D01]" /><p className="mt-4 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#637085]">Loading properties...</p></div></div>; }

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) { return <div className="border border-red-200 bg-red-50 px-6 py-12 text-center"><h3 className="display-serif text-2xl text-[#012770]">Unable to load properties</h3><p className="mx-auto mt-3 max-w-sm text-[0.78rem] leading-[1.7] text-[#637085]">{error.message}</p><BrandButton variant="navy" className="mt-6" onClick={onRetry}>Try again</BrandButton></div>; }
