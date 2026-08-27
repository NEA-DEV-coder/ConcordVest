/* CONCORDVEST / Quiet Structure: related content is a bridge from editorial discovery to a concrete next action. */
import { ArrowUpRight } from "lucide-react";
import { PortfolioCard } from "@/components/PortfolioCard";
import { ServicePackageCard } from "@/components/ServicePackageCard";
import { EditorialCard } from "@/components/EditorialCard";
import type { ArticleRecord, ProjectRecord } from "@/lib/content";
import type { ServicePackage } from "@/lib/services";

export function RelatedContentSection({ type, title, items, onNavigate }: { type: "articles" | "projects" | "services"; title: string; items: Array<ArticleRecord | ProjectRecord | ServicePackage>; onNavigate: (path: string) => void }) {
  return <section className="container py-16 sm:py-20 lg:py-28"><div className="flex flex-col justify-between gap-7 border-b border-[#012770]/16 pb-7 sm:flex-row sm:items-end"><div><p className="eyebrow">Related {type}</p><h2 className="display-serif mt-5 max-w-3xl text-[3.3rem] leading-[0.9] text-[#012770] sm:text-[5rem]">{title}</h2></div><ArrowUpRight size={22} className="hidden text-[#ED7D01] sm:block" /></div><div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map(item => { if (type === "articles") { const article = item as ArticleRecord; return <EditorialCard key={article.id} article={article} onRead={() => onNavigate(`/inspiration/${article.slug}`)} />; } if (type === "projects") { const project = item as ProjectRecord; return <PortfolioCard key={project.id} project={project} onView={() => onNavigate(`/projects/${project.slug}`)} />; } const service = item as ServicePackage; return <ServicePackageCard key={service.id} service={service} onView={() => onNavigate(`/services/${service.slug}`)} />; })}</div></section>;
}
