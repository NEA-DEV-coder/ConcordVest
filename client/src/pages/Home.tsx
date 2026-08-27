/* CONCORDVEST / Quiet Structure: the homepage is an editorial property catalogue—cinematic hero, offset discovery, useful listings, and a navy anchor CTA. */
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ArrowDown, ArrowUpRight, Building2, Compass, Hammer, Home as HomeIcon, Layers3, MoveRight, Paintbrush, Ruler, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { BrandButton } from "@/components/BrandButton";
import { PropertyCard, type Property } from "@/components/PropertyCard";
import { ServiceCard, ProjectCard } from "@/components/ShowcaseCards";
import { Footer, ArticleCard } from "@/components/Editorial";
import { servicePackages } from "@/lib/services";
import { resolveNavigation } from "@/lib/navigation";

const asset = {
  hero: "/manus-storage/concordvest-hero_a234c846.jpg",
  property: "/manus-storage/concordvest-property_ef36ee68.jpg",
  kitchen: "/manus-storage/concordvest-kitchen_fd650693.jpg",
  project: "/manus-storage/concordvest-project_00304348.jpg",
};

const unsplash = {
  apartment: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
  interior: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85",
  kitchen: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85",
  bath: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85",
  staircase: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=85",
  living: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85",
};

const properties: Property[] = [
  { slug: "modern-3-bedroom-apartment-jabi", title: "Modern 3 Bedroom Apartment", location: "Jabi, Abuja", price: "₦185,000,000", category: "Apartment", specs: "3 bedrooms · 4 bathrooms", image: asset.property, status: "Available" },
  { slug: "premium-residential-land-katampe", title: "Premium Residential Land", location: "Katampe, Abuja", price: "₦120,000,000", category: "Land for sale", specs: "600 sqm", image: unsplash.apartment, status: "Available" },
  { slug: "luxury-4-bedroom-apartment-wuse-2", title: "Luxury 4 Bedroom Apartment", location: "Wuse 2, Abuja", price: "₦220,000,000", category: "Apartment", specs: "4 bedrooms · 5 bathrooms", image: unsplash.interior, status: "Enquire" },
];

const services = [
  ["01", "Home Refresh"], ["02", "Kitchen Transformation"], ["03", "Luxury Bathroom Upgrade"], ["04", "Complete Building Finishing"], ["05", "Office Remodeling"], ["06", "Rental Property Makeover"], ["07", "Complete Home Remodeling"],
] as const;

function notify(label: string) {
  toast(`${label} is part of the next Concordvest release.`, { description: "This prototype keeps the destination ready while we build the full experience." });
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Home() {
  const [, setLocation] = useLocation();
  const handleHeaderAction = (label: string) => {
    if (label === "Home") { scrollTo("top"); return; }
    const destination = resolveNavigation(label);
    if (destination) { setLocation(destination); return; }
    notify(label);
  };
  return (
    <div id="top" className="min-h-screen bg-white text-[#17212f]">
      <Header onAction={handleHeaderAction} />
      <main>
        <section className="grain relative flex min-h-[720px] items-end overflow-hidden bg-[#012770] pb-16 pt-32 text-white sm:min-h-[800px] sm:pb-20 lg:min-h-[min(860px,100vh)] lg:pb-24">
          <img src={asset.hero} alt="Contemporary Concordvest residence at golden hour" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-[#012770]/48" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#012770]/90 via-[#012770]/45 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#012770]/70 to-transparent" />
          <div className="container relative grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-20">
            <div className="max-w-[56rem]">
              <p className="eyebrow reveal-up">Abuja · Property + Spaces</p>
              <h1 className="display-serif hero-title reveal-up reveal-delay-1 mt-7 max-w-[57rem] text-white">DISCOVER.<br />BUILD.<br /><span className="text-[#ED7D01]">TRANSFORM.</span></h1>
              <p className="reveal-up reveal-delay-2 mt-8 max-w-md text-[0.95rem] leading-[1.65] text-white/78 sm:text-[1.05rem]">Premium properties, thoughtful renovations, and exceptional finishing — all in one place.</p>
              <div className="reveal-up reveal-delay-3 mt-8 flex flex-col items-start gap-3 sm:flex-row"><BrandButton onClick={() => scrollTo("properties")}>Explore Properties</BrandButton><BrandButton variant="outline" onClick={() => scrollTo("renovation")} arrow="right">Transform Your Property</BrandButton></div>
            </div>
            <div className="hidden border-l border-white/35 pl-6 lg:block"><div className="mb-12 flex items-center gap-2 text-[0.6rem] font-extrabold uppercase tracking-[0.16em] text-white/65"><span className="h-px w-8 bg-[#ED7D01]" /> 09° 04′ N · 07° 29′ E</div><p className="max-w-[12rem] text-[0.74rem] leading-[1.65] text-white/72">A considered approach to the places we call home.</p></div>
          </div>
          <button type="button" onClick={() => scrollTo("discover")} className="absolute bottom-7 right-5 hidden items-center gap-3 text-[0.58rem] font-extrabold uppercase tracking-[0.18em] text-white/70 transition-colors hover:text-white sm:flex lg:right-14"><span className="grid h-9 w-9 place-items-center border border-white/35"><ArrowDown size={14} /></span> Scroll to explore</button>
        </section>

        <section id="discover" className="container py-20 sm:py-24 lg:py-32">
          <div className="grid gap-10 lg:grid-cols-[0.86fr_1.7fr] lg:gap-24"><div><p className="eyebrow">Start here</p><h2 className="display-serif mt-5 max-w-sm text-[3.2rem] leading-[0.94] text-[#012770] sm:text-[4.4rem]">What are you looking for?</h2><p className="mt-7 max-w-xs text-[0.83rem] leading-[1.75] text-[#637085]">Tell us where you are in the journey. We’ll help you find the next considered move.</p></div><div className="grid gap-px bg-[#012770]/15 sm:grid-cols-2">{[["01", "Buy land", "Find carefully selected land opportunities across Abuja.", Compass], ["02", "Buy an apartment", "Explore completed apartments and homes.", Building2], ["03", "Renovate my property", "Transform an existing property with Concordvest.", Hammer], ["04", "Finish my property", "Bring your unfinished property to life.", Ruler]].map(([number, title, copy, Icon]) => <button key={String(number)} type="button" onClick={() => { const destination = resolveNavigation(String(title)); if (destination) setLocation(destination); else notify(String(title)); }} className="group min-h-[15rem] bg-white p-6 text-left transition-colors hover:bg-[#f4f1ea] sm:p-8"><div className="flex items-start justify-between"><span className="text-[0.62rem] font-extrabold tracking-[0.16em] text-[#ED7D01]">{number as string}</span><Icon size={21} strokeWidth={1.4} className="text-[#012770] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" /></div><div className="mt-16 flex items-end justify-between gap-5"><div><h3 className="text-[1.4rem] font-extrabold capitalize leading-[1.02] tracking-[-0.05em] text-[#012770]">{title as string}</h3><p className="mt-3 max-w-[15rem] text-[0.72rem] leading-[1.6] text-[#637085]">{copy as string}</p></div><ArrowUpRight size={18} className="shrink-0 text-[#ED7D01] transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1" /></div></button>)}</div></div>
        </section>

        <section id="properties" className="bg-[#f4f1ea] py-20 sm:py-24 lg:py-32">
          <div className="container"><div className="flex flex-col justify-between gap-8 border-b border-[#012770]/16 pb-7 sm:flex-row sm:items-end"><div><p className="eyebrow">The property edit</p><h2 className="display-serif mt-5 text-[3rem] leading-[0.95] text-[#012770] sm:text-[4.5rem]">Featured properties</h2></div><button type="button" onClick={() => setLocation("/properties")} className="line-link text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-[#012770]">View all properties <span>↗</span></button></div><div className="mt-8 flex items-center justify-between gap-5 text-[0.64rem] text-[#637085]"><span>Prototype listings · Abuja, Nigeria</span><span className="hidden sm:inline">Curated for the next move</span></div><div className="mt-8 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]"><PropertyCard property={properties[0]} featured onView={() => setLocation(`/properties/${properties[0].slug}`)} /><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1">{properties.slice(1).map(property => <PropertyCard key={property.title} property={property} onView={() => setLocation(`/properties/${property.slug}`)} />)}</div></div></div>
        </section>

        <section id="renovation" className="navy-grid bg-[#012770] py-20 text-white sm:py-24 lg:py-32">
          <div className="container"><div className="grid gap-12 lg:grid-cols-[0.92fr_1.65fr] lg:gap-24"><div><p className="eyebrow">The transformation edit</p><h2 className="display-serif mt-5 max-w-lg text-[3.5rem] leading-[0.9] text-white sm:text-[5rem]">Transform your space.</h2><p className="mt-7 max-w-sm text-[0.88rem] leading-[1.8] text-white/70">From unfinished structures to beautifully finished homes, Concordvest brings expertise, precision and thoughtful design to every project.</p><BrandButton className="mt-9" onClick={() => setLocation("/services")}>Explore Renovation Services</BrandButton><div className="mt-16 hidden items-center gap-3 text-[0.6rem] font-extrabold uppercase tracking-[0.16em] text-white/45 lg:flex"><Sparkles size={15} className="text-[#ED7D01]" /> Built around how you live</div></div><div className="grid gap-px bg-white/18 sm:grid-cols-2">{services.map(([number, title], index) => <ServiceCard key={number} number={number} title={title} image={index === 1 ? asset.kitchen : undefined} onClick={() => setLocation(`/services/${servicePackages.find(item => item.name === title)?.slug || "custom-renovation"}`)} />)}</div></div></div>
        </section>

        <section id="projects" className="container py-20 sm:py-24 lg:py-32"><div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><p className="eyebrow">Selected work</p><h2 className="display-serif mt-5 text-[3.2rem] leading-[0.93] text-[#012770] sm:text-[4.6rem]">A closer look.</h2></div><BrandButton variant="line" onClick={() => setLocation("/projects")}>View all projects</BrandButton></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-12"><ProjectCard title="A softer kind of arrival" category="Renovation" image={asset.project} className="sm:min-h-[28rem] lg:col-span-7" onClick={() => setLocation("/projects/the-softened-arrival")} /><ProjectCard title="Material, made precise" category="Finishing" image={unsplash.living} className="sm:min-h-[28rem] lg:col-span-5" onClick={() => setLocation("/projects/material-made-precise")} /><ProjectCard title="The everyday kitchen" category="Kitchen" image={unsplash.kitchen} className="sm:min-h-[23rem] lg:col-span-5" onClick={() => setLocation("/projects/the-everyday-kitchen")} /><ProjectCard title="Quiet lines, warm light" category="Bathroom" image={unsplash.bath} className="sm:min-h-[23rem] lg:col-span-7" onClick={() => setLocation("/projects/quiet-lines-warm-light")} /></div></section>

        <section id="inspiration" className="border-y border-[#012770]/12 bg-[#f4f1ea] py-20 sm:py-24 lg:py-32"><div className="container"><div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24"><div><p className="eyebrow">From the journal</p><h2 className="display-serif mt-5 max-w-sm text-[3.3rem] leading-[0.92] text-[#012770] sm:text-[4.6rem]">Ideas for living well.</h2><p className="mt-7 max-w-xs text-[0.84rem] leading-[1.75] text-[#637085]">A growing collection of useful details, considered materials, and better ways to make a space your own.</p><BrandButton variant="line" className="mt-8" onClick={() => setLocation("/inspiration")}>Explore inspiration</BrandButton></div><div className="border-t border-[#012770]/16"><ArticleCard number="01" title="Things to Inspect Before Moving Into a New Home" onClick={() => setLocation("/inspiration/things-to-inspect-before-moving-into-a-new-home")} /><ArticleCard number="02" title="Which Kitchen Would You Choose?" image={unsplash.kitchen} onClick={() => setLocation("/inspiration/which-kitchen-would-you-choose")} /><ArticleCard number="03" title="5 Modern Staircase Ideas" image={unsplash.staircase} onClick={() => setLocation("/inspiration/5-modern-staircase-ideas")} /><ArticleCard number="04" title="Painting Transformation" image={unsplash.interior} onClick={() => setLocation("/inspiration/painting-transformation")} /><ArticleCard number="05" title="Spa Bathroom Inspiration" onClick={() => setLocation("/inspiration/spa-bathroom-inspiration")} /></div></div></div></section>

        <section id="about" className="container py-20 sm:py-24 lg:py-32"><div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24"><div><p className="eyebrow">One point of view</p><h2 className="display-serif mt-5 max-w-sm text-[3.25rem] leading-[0.93] text-[#012770] sm:text-[4.6rem]">More than a property search.</h2></div><div className="grid gap-8 sm:grid-cols-3 sm:gap-5"><div className="border-t-2 border-[#ED7D01] pt-5"><HomeIcon size={20} className="text-[#012770]" strokeWidth={1.5} /><h3 className="mt-5 text-[1.4rem] font-extrabold tracking-[-0.05em] text-[#012770]">Property</h3><p className="mt-3 text-[0.76rem] leading-[1.7] text-[#637085]">Discover a place that fits the life you’re building.</p></div><div className="border-t-2 border-[#ED7D01] pt-5"><Paintbrush size={20} className="text-[#012770]" strokeWidth={1.5} /><h3 className="mt-5 text-[1.4rem] font-extrabold tracking-[-0.05em] text-[#012770]">Renovation</h3><p className="mt-3 text-[0.76rem] leading-[1.7] text-[#637085]">Bring clarity and intention to the spaces you already own.</p></div><div className="border-t-2 border-[#ED7D01] pt-5"><Layers3 size={20} className="text-[#012770]" strokeWidth={1.5} /><h3 className="mt-5 text-[1.4rem] font-extrabold tracking-[-0.05em] text-[#012770]">Finishing</h3><p className="mt-3 text-[0.76rem] leading-[1.7] text-[#637085]">Make the final decisions feel like the beginning of something.</p></div></div></div></section>

        <section className="bg-[#f4f1ea] py-12 sm:py-16 lg:py-20"><div className="container"><div className="relative overflow-hidden bg-[#012770] px-6 py-14 text-white sm:px-10 sm:py-16 lg:px-16 lg:py-20"><div className="navy-grid absolute inset-0 opacity-70" /><div className="relative flex flex-col justify-between gap-10 lg:flex-row lg:items-end"><div><p className="eyebrow">Your next move</p><h2 className="display-serif mt-5 max-w-3xl text-[3.4rem] leading-[0.9] text-white sm:text-[5.8rem]">Ready to discover what’s possible?</h2><p className="mt-7 max-w-md text-[0.88rem] leading-[1.7] text-white/68">Explore properties, plan your renovation, or speak directly with Concordvest.</p></div><div className="flex flex-col items-start gap-3 sm:flex-row"><BrandButton onClick={() => scrollTo("properties")}>Explore Properties</BrandButton><BrandButton variant="outline" onClick={() => window.open("https://wa.me/2348156648952?text=Hello%20Concordvest%2C%20I%27d%20like%20to%20talk%20to%20an%20agent.", "_blank", "noopener,noreferrer")}>Talk to an Agent</BrandButton></div></div><span className="absolute bottom-5 right-6 hidden text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-white/40 lg:block">Discover · Build · Transform</span></div></div></section>
      </main>
      <Footer onAction={handleHeaderAction} />
      <button type="button" onClick={() => scrollTo("top")} aria-label="Back to top" className="fixed bottom-5 right-5 z-40 grid h-11 w-11 place-items-center bg-[#012770] text-white shadow-[0_8px_22px_rgba(1,39,112,0.22)] transition-transform hover:-translate-y-1"><MoveRight size={16} className="-rotate-90" /></button>
    </div>
  );
}
