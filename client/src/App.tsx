import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import PropertyDiscovery from "./pages/PropertyDiscovery";
import PropertyDetail from "./pages/PropertyDetail";
import ProjectsHub from "./pages/ProjectsHub";
import ProjectDetail from "./pages/ProjectDetail";
import InspirationHub from "./pages/InspirationHub";
import ArticleDetail from "./pages/ArticleDetail";
import ServicesHub from "./pages/ServicesHub";
import ServiceDetail from "./pages/ServiceDetail";
import SiteInspection from "./pages/SiteInspection";
import { MobileWhatsAppCta } from "./components/WhatsAppAgentButton";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AdminRegister from "./pages/AdminRegister";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/register" component={AdminRegister} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/:section" component={Admin} />
      <Route path="/properties/:slug" component={PropertyDetail} />
      <Route path="/properties" component={PropertyDiscovery} />
      <Route path="/services/site-inspection" component={SiteInspection} />
      <Route path="/services/:slug" component={ServiceDetail} />
      <Route path="/services" component={ServicesHub} />
      <Route path="/projects/:slug" component={ProjectDetail} />
      <Route path="/projects" component={ProjectsHub} />
      <Route path="/inspiration/:slug" component={ArticleDetail} />
      <Route path="/inspiration" component={InspirationHub} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ConditionalMobileWhatsAppCta() {
  const [location] = useLocation();
  return location.startsWith("/admin") ? null : <MobileWhatsAppCta />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster position="bottom-right" />
            <Router />
            <ConditionalMobileWhatsAppCta />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
