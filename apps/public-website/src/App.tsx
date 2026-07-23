import React, { Suspense, lazy, useEffect } from "react";
import { PageLoader } from "@trustbank/shared-ui/components/ui/PageLoader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@trustbank/shared-ui/components/ui/sonner";
import { Toaster } from "@trustbank/shared-ui/components/ui/toaster";
import { TooltipProvider } from "@trustbank/shared-ui/components/ui/tooltip";
import { AuthProvider } from "@trustbank/shared-utils/contexts/AuthContext";
import { BrandProvider } from "@trustbank/shared-utils/contexts/BrandContext";
import { ThemeProvider } from "@trustbank/shared-ui/components/theme-provider";
import { PublicLayout } from "./components/public/PublicLayout";
import { ScrollToTop } from "./components/public/ScrollToTop";

const Index = lazy(() => import("./pages/Index"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const LoansPage = lazy(() => import("./pages/LoansPage"));
const DigitalBankingPage = lazy(() => import("./pages/DigitalBankingPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const BranchesPage = lazy(() => import("./pages/BranchesPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const CareersPage = lazy(() => import("./pages/CareersPage"));
const SavingsPage = lazy(() => import("./pages/SavingsPage"));
const CheckingPage = lazy(() => import("./pages/CheckingPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InfoPage = lazy(() => import("./pages/InfoPage"));

const RedirectToBankingApp = ({ path }: { path: string }) => {
    useEffect(() => {
        const appUrl = import.meta.env.VITE_BANKING_APP_URL || 'https://app.trustbank.com';
        window.location.href = `${appUrl}${path}`;
    }, [path]);
    return <PageLoader />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Sonner />
        <Toaster />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <BrandProvider>
            <AuthProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/loans" element={<LoansPage />} />
                    <Route path="/digital-banking" element={<DigitalBankingPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/branches" element={<BranchesPage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/news/:slug" element={<ArticlePage />} />
                    <Route path="/careers" element={<CareersPage />} />
                    <Route path="/savings" element={<SavingsPage />} />
                    <Route path="/checking" element={<CheckingPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/info/:slug" element={<InfoPage />} />
                  </Route>

                  <Route path="/login" element={<RedirectToBankingApp path="/auth/login" />} />
                  <Route path="/register" element={<RedirectToBankingApp path="/register" />} />
                  <Route path="/reset-password" element={<RedirectToBankingApp path="/reset-password" />} />
                  <Route path="/dashboard/*" element={<RedirectToBankingApp path="/dashboard" />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrandProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
