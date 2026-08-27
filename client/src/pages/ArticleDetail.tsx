/* CONCORDVEST / Quiet Structure: article detail keeps the reading experience spacious, image-led, and commercially useful without feeling like a sales page. */
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, ArrowUpRight, BookOpen, Clock3, Compass, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Editorial";
import { BrandButton } from "@/components/BrandButton";
import { RelatedContentSection } from "@/components/RelatedContent";
import { useArticle, useArticles, useProjects } from "@/hooks/useContent";
import { useService } from "@/hooks/useContent";
import { resolveNavigation } from "@/lib/navigation";

export default function ArticleDetail() {
  const [, params] = useRoute("/inspiration/:slug");
  const [, setLocation] = useLocation();
  
  // Fetch article from Supabase (or demo data fallback)
  const { article, isLoading, error } = useArticle(params?.slug);
  
  // Fetch related content
  const { articles } = useArticles();
  const { projects } = useProjects();
  
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onBack={() => setLocation("/inspiration")} />;
  if (!article) return <MissingArticle onBack={() => setLocation("/inspiration")} />;
  
  const relatedArticles = articles.filter(item => item.id !== article.id && (item.category === article.category || item.serviceSlugs.some(slug => article.serviceSlugs.includes(slug)))).slice(0, 3);
  const relatedServices = article.serviceSlugs.map(slug => {
    const { service } = useService(slug);
    return service;
  }).filter(Boolean).slice(0, 3);
  const relatedProjects = projects.filter(project => article.projectSlugs.includes(project.slug));
  
  const navigate = (label: string) => { const destination = resolveNavigation(label); if (destination) { setLocation(destination); return; } toast(`${label} is part of the next Concordvest release.`); };
  return <div className="min-h-screen bg-white text-[#17212f]"><Header onAction={navigate} /><main><section className="bg-[#012770] pb-14 pt-28 text-white sm:pb-20 sm:pt-32"><div className="container"><button type="button" onClick={() => setLocation("/inspiration")} className="mb-9 inline-flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-[#ED7D01]"><ArrowLeft size={15} /> The journal</button><div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end lg:gap-20"><div><p className="eyebrow">{article.category}</p><h1 className="display-serif mt-6 max-w-4xl text-[3.8rem] leading-[0.88] sm:text-[6.5rem]">{article.title}</h1><div className="mt-8 flex flex-wrap items-center gap-4 text-[0.61rem] font-extrabold uppercase tracking-[0.14em] text-white/60"><span>{article.date}</span><span className="h-1 w-1 rounded-full bg-[#ED7D01]" /><span>{article.readTime}</span></div></div><div className="relative aspect-[1.18/0.84] overflow-hidden border border-white/18"><img src={article.heroImage} alt={article.title} className="h-full w-full object-cover opacity-78" /><div className="absolute inset-0 bg-[#012770]/34" /><div className="absolute bottom-0 left-0 border-t border-white/18 bg-[#012770]/72 px-5 py-4 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-[#ED7D01]">Concordvest journal · demo editorial</div></div></div></div></section><section className="container py-16 sm:py-20 lg:py-28"><div className="grid gap-12 lg:grid-cols-[0.58fr_1.42fr] lg:gap-24"><aside className="lg:sticky lg:top-28 lg:self-start"><p className="eyebrow">A useful read</p><p className="mt-6 max-w-xs text-[0.92rem] leading-[1.8] text-[#637085]">{article.excerpt}</p><div className="mt-9 border-t-2 border-[#ED7D01] pt-4"><div className="flex items-center gap-3 text-[0.66rem] font-extrabold uppercase tracking-[0.13em] text-[#012770]"><BookOpen size={16} className="text-[#ED7D01]" /> Read slowly</div><div className="mt-3 flex items-center gap-3 text-[0.66rem] text-[#637085]"><Clock3 size={15} /> {article.readTime}</div></div></aside><article className="max-w-3xl"><p className="display-serif text-[2.4rem] leading-[1.03] text-[#012770] sm:text-[3.5rem]">The decisions that make a space feel resolved usually begin before the visible work.</p><div className="mt-12 space-y-10">{article.content.map((section, index) => <section key={section.heading || index} className="border-t border-[#012770]/14 pt-6"><div className="flex gap-5"><span className="text-[0.61rem] font-extrabold tracking-[0.14em] text-[#ED7D01]">0{index + 1}</span><div>{section.heading && <h2 className="display-serif text-[2rem] leading-[0.98] text-[#012770] sm:text-[2.7rem]">{section.heading}</h2>}<p className="mt-4 max-w-2xl text-[1rem] leading-[1.95] text-[#39485c]">{section.body}</p></div></div></section>)}</div><div className="mt-14 flex flex-col justify-between gap-6 border-y border-[#012770]/14 py-7 sm:flex-row sm:items-center"><div><p className="text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-[#ED7D01]">Take it further</p><p className="mt-2 max-w-md text-[0.78rem] leading-[1.6] text-[#637085]">Turn the idea into a clearer brief for your own property.</p></div><BrandButton variant="navy" onClick={() => setLocation("/services/custom-renovation")}>Start your project <ArrowUpRight size={15} /></BrandButton></div></article></div></section>{relatedServices.length > 0 && <RelatedContentSection type="services" title="Make the idea practical." items={relatedServices} onNavigate={setLocation} />}{relatedProjects.length > 0 && <section className="bg-[#f4f1ea]"><RelatedContentSection type="projects" title="See the thinking in a project." items={relatedProjects} onNavigate={setLocation} /></section>}{relatedArticles.length > 0 && <RelatedContentSection type="articles" title="Continue reading." items={relatedArticles} onNavigate={setLocation} />}<section className="bg-[#ED7D01] py-12 text-[#012770] sm:py-16"><div className="container flex flex-col justify-between gap-7 sm:flex-row sm:items-center"><div><p className="text-[0.6rem] font-extrabold uppercase tracking-[0.16em]">From editorial to action</p><h2 className="display-serif mt-4 text-[3rem] leading-[0.92] sm:text-[4.8rem]">Talk through your space.</h2></div><BrandButton variant="navy" onClick={() => setLocation("/services/custom-renovation")}>Request a quote <MessageCircle size={15} /></BrandButton></div></section></main><Footer onAction={navigate} /></div>;
}
function MissingArticle({ onBack }: { onBack: () => void }) { return <div className="min-h-screen bg-[#f4f1ea] text-[#012770]"><Header onAction={onBack} /><div className="container flex min-h-[70vh] flex-col justify-center pt-20"><p className="eyebrow">Journal note</p><h1 className="display-serif mt-6 max-w-3xl text-[4rem] leading-[0.88] sm:text-[6rem]">That story is not in the journal.</h1><BrandButton variant="navy" className="mt-8 w-fit" onClick={onBack}>Back to inspiration</BrandButton></div><Footer onAction={onBack} /></div>; }


function LoadingState() { return <div className="min-h-screen bg-white text-[#012770]"><Header onAction={() => {}} /><div className="container flex min-h-[70vh] items-center justify-center pt-20"><div className="text-center"><Loader2 size={40} className="mx-auto animate-spin text-[#ED7D01]" /><p className="mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#637085]">Loading article...</p></div></div></div>; }

function ErrorState({ error, onBack }: { error: Error; onBack: () => void }) { return <div className="min-h-screen bg-[#f4f1ea] text-[#012770]"><Header onAction={onBack} /><div className="container flex min-h-[70vh] flex-col items-center justify-center pt-20"><p className="eyebrow">Error loading article</p><h1 className="display-serif mt-6 max-w-3xl text-center text-[3rem] leading-[0.88] sm:text-[5rem]">Unable to load this article</h1><p className="mt-4 max-w-md text-center text-[0.85rem] leading-[1.7] text-[#637085]">{error.message}</p><BrandButton variant="navy" className="mt-8 w-fit" onClick={onBack}>Back to inspiration</BrandButton></div></div>; }
