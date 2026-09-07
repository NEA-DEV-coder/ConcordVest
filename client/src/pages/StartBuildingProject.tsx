/* CONCORDVEST / Quiet Structure: Start a Building Project provides a dedicated consultation experience for ground-up construction in Abuja. */
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Editorial";
import { BrandButton } from "@/components/BrandButton";
import { BuildingProjectAssessmentFlow } from "@/components/BuildingProjectAssessmentFlow";
import { buildWhatsAppUrl } from "@/lib/leads";

export default function StartBuildingProject() {
  const [, setLocation] = useLocation();

  const navigate = (label: string) => {
    if (label === "Home") {
      setLocation("/");
      return;
    }
    if (label === "All Properties") {
      setLocation("/properties");
      return;
    }
    if (label === "All Services") {
      setLocation("/services");
      return;
    }
    if (label === "All Projects") {
      setLocation("/projects");
      return;
    }
    if (label === "All Inspiration") {
      setLocation("/inspiration");
      return;
    }
  };

  const scrollToAssessment = () => {
    const el = document.getElementById("assessment-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const openWhatsApp = () => {
    const url = buildWhatsAppUrl(
      "Hello Concordvest, I'd like to talk to an agent about starting a building project."
    );
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-white text-[#17212f]">
      <Header onAction={navigate} />

      <main>
        {/* Editorial Hero Section */}
        <section className="relative overflow-hidden bg-[#012770] pb-16 pt-32 text-white sm:pb-24 sm:pt-36">
          <div className="navy-grid absolute inset-0 opacity-60" />
          <div className="container relative">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="mb-8 inline-flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-[#ED7D01]"
            >
              <ArrowLeft size={15} /> Back to home
            </button>

            <p className="eyebrow text-[#ED7D01]">Ground-Up Construction</p>

            <h1 className="display-serif mt-5 max-w-4xl text-[3.4rem] leading-[0.9] sm:text-[5.5rem] lg:text-[6.5rem]">
              START A BUILDING PROJECT
            </h1>

            <p className="mt-7 max-w-2xl text-[0.96rem] leading-[1.8] text-white/75 sm:text-[1.08rem]">
              Have an idea, a piece of land, or a plan? Let’s help you turn it
              into a real project.
            </p>

            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <BrandButton onClick={scrollToAssessment}>
                Start Project Assessment
              </BrandButton>
              <BrandButton variant="outline" onClick={openWhatsApp}>
                <MessageCircle size={15} /> Talk to an Agent
              </BrandButton>
            </div>
          </div>
        </section>

        {/* Assessment Flow Section */}
        <section
          id="assessment-section"
          className="container py-14 sm:py-20 lg:py-28"
        >
          <div className="mx-auto max-w-5xl">
            <BuildingProjectAssessmentFlow onNavigate={setLocation} />
          </div>
        </section>
      </main>

      <Footer onAction={navigate} />
    </div>
  );
}
