/* CONCORDVEST / Quiet Structure: the portfolio hub is an image-led archive with disciplined filters and direct movement into project conversations. */
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowDown, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Editorial";
import { BrandButton } from "@/components/BrandButton";
import { PortfolioCard } from "@/components/PortfolioCard";
import { projectCategories, type ProjectCategory } from "@/lib/content";
import { useProjects } from "@/hooks/useContent";
import { resolveNavigation } from "@/lib/navigation";

export default function ProjectsHub() {
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState<(typeof projectCategories)[number]>("All Projects");
  
  // Fetch projects from Supabase (or demo data fallback)
  const { projects, isLoading, error } = useProjects({ category });
  
  const filtered = category === "All Projects" ? projects : projects.filter(project => project.category.includes(category as ProjectCategory));
  const navigate = (label: string) => {
    const destination = resolveNavigation(label);
    if (destination) { setLocation(destination); return; }
    toast(`${label} is part of the next Concordvest release.`);
  };
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#17212f]">
      <Header onAction={navigate} />
      <main>
        <section className="bg-[#012770] pb-14 pt-32 text-white sm:pb-20 lg:pb-24">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-[1.03fr_0.97fr] lg:items-end lg:gap-24">
              <div>
                <p className="eyebrow">The Concordvest archive</p>
                <h1 className="display-serif mt-6 max-w-3xl text-[4rem] leading-[0.86] sm:text-[7rem]">A closer<br /><span className="text-[#ED7D01]">look.</span></h1>
                <p className="mt-8 max-w-lg text-[0.92rem] leading-[1.8] text-white/72">A living portfolio of renovation, finishing, kitchens, bathrooms, interiors, and exteriors shaped with a sharper point of view.</p>
                <BrandButton className="mt-9" onClick={() => setLocation("/services/custom-renovation")}>Start your project</BrandButton>
              </div>
              <div className="relative aspect-[1.1/0.86] overflow-hidden border border-white/18">
                <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85" alt="Concordvest project archive" className="h-full w-full object-cover opacity-75" />
                <div className="absolute inset-0 bg-[#012770]/42" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between border-t border-white/18 bg-[#012770]/70 p-5 sm:p-7"><p className="max-w-xs text-[0.76rem] leading-[1.6] text-white/78">Demo project archive · Abuja, Nigeria</p><ArrowDown size={20} className="text-[#ED7D01]" /></div>
              </div>
            </div>
          </div>
        </section>
        <section className="container py-14 sm:py-20 lg:py-28">
          <div className="flex flex-col justify-between gap-7 border-b border-[#012770]/16 pb-7 lg:flex-row lg:items-end">
            <div><p className="eyebrow">Browse by lens</p><h2 className="display-serif mt-5 text-[3.2rem] leading-[0.92] text-[#012770] sm:text-[5rem]">The work, in context.</h2></div>
            <p className="max-w-sm text-[0.78rem] leading-[1.7] text-[#637085]">Use the archive to move between project types, then open a case study for the story behind the finish.</p>
          </div>
          <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2">{projectCategories.map(item => <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap border px-4 py-3 text-[0.59rem] font-extrabold uppercase tracking-[0.12em] transition-colors ${category === item ? "border-[#012770] bg-[#012770] text-white" : "border-[#012770]/20 bg-transparent text-[#012770] hover:border-[#ED7D01] hover:text-[#ED7D01]"}`}>{item}</button>)}</div>
          {isLoading ? <div className="mt-10 flex min-h-[40vh] items-center justify-center"><div className="text-center"><Loader2 size={32} className="mx-auto animate-spin text-[#ED7D01]" /><p className="mt-4 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#637085]">Loading projects...</p></div></div> : error ? <div className="mt-10 border border-red-200 bg-red-50 px-6 py-12 text-center"><h3 className="display-serif text-2xl text-[#012770]">Unable to load projects</h3><p className="mx-auto mt-3 max-w-sm text-[0.78rem] leading-[1.7] text-[#637085]">{error.message}</p><BrandButton variant="navy" className="mt-6" onClick={() => window.location.reload()}>Try again</BrandButton></div> : filtered.length > 0 ? <div className="mt-10 grid gap-5 lg:grid-cols-12">{filtered.map((project, index) => <div key={project.id} className={index === 0 ? "lg:col-span-7" : index === 1 ? "lg:col-span-5" : index === 2 ? "lg:col-span-5" : "lg:col-span-7"}><PortfolioCard project={project} featured={index === 0} onView={() => setLocation(`/projects/${project.slug}`)} /></div>)}</div> : <div className="mt-10 border border-[#012770]/14 bg-white px-6 py-12 text-center"><h3 className="display-serif text-4xl text-[#012770]">No project in this lens yet.</h3><p className="mx-auto mt-4 max-w-md text-[0.78rem] leading-[1.7] text-[#637085]">Try another category or start a project brief with Concordvest.</p><BrandButton variant="navy" className="mt-7" onClick={() => setLocation("/services/custom-renovation")}>Start your project</BrandButton></div>}
        </section>
        <section className="bg-white py-14 sm:py-20 lg:py-24"><div className="container flex flex-col justify-between gap-8 sm:flex-row sm:items-center"><div><p className="eyebrow">Have a space in mind?</p><h2 className="display-serif mt-5 max-w-2xl text-[3.2rem] leading-[0.92] text-[#012770] sm:text-[5rem]">Start with the brief.</h2></div><BrandButton variant="navy" onClick={() => setLocation("/services/custom-renovation")}>Start your project <ArrowUpRight size={15} /></BrandButton></div></section>
      </main>
      <Footer onAction={navigate} />
    </div>
  );
}
