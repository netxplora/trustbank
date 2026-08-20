import React, { Suspense, lazy } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { ThemeProvider } from "@/components/theme-provider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicLayout } from "@/components/public/PublicLayout";
import { AnimatePresence } from "framer-motion";
import { ScrollToTop } from "@/components/public/ScrollToTop";

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
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const CustomerDashboardLayout = lazy(() => import("@/components/dashboard/CustomerDashboardLayout"));
const CustomerDashboardHome = lazy(() => import("./pages/dashboard/CustomerDashboardHome"));
const AccountsPage = lazy(() => import("./pages/dashboard/AccountsPage"));
const TransfersPage = lazy(() => import("./pages/dashboard/TransfersPage"));
const PaymentsPage = lazy(() => import("./pages/dashboard/PaymentsPage"));
const CustomerLoansPage = lazy(() => import("./pages/dashboard/LoansPage"));
const CardsPage = lazy(() => import("./pages/dashboard/CardsPage"));
const BeneficiariesPage = lazy(() => import("./pages/dashboard/BeneficiariesPage"));
const NotificationsPage = lazy(() => import("./pages/dashboard/NotificationsPage"));
const ProfilePage = lazy(() => import("./pages/dashboard/ProfilePage"));
const SecurityPage = lazy(() => import("./pages/dashboard/SecurityPage"));
const DigitalCurrencyPage = lazy(() => import("./pages/dashboard/DigitalCurrencyPage"));
const TaxRefundPage = lazy(() => import("./pages/dashboard/TaxRefundPage"));
const TaxRefundWizard = lazy(() => import("./pages/dashboard/TaxRefundWizard"));
const GrantsPage = lazy(() => import("./pages/dashboard/GrantsPage"));
const GrantApplicationWizard = lazy(() => import("./pages/dashboard/GrantApplicationWizard"));
const TransactionsPage = lazy(() => import("./pages/dashboard/TransactionsPage"));

const AdminDigitalCurrencyPage = lazy(() => import("./pages/admin/AdminDigitalCurrencyPage"));
const AdminTaxRefundsPage = lazy(() => import("./pages/admin/AdminTaxRefundsPage"));
const AdminGrantsPage = lazy(() => import("./pages/admin/AdminGrantsPage"));

const KYCPage = lazy(() => import("./pages/dashboard/KYCPage"));
const DepositPage = lazy(() => import("./pages/dashboard/DepositPage"));
const DashboardServicesPage = lazy(() => import("./pages/dashboard/ServicesPage"));

const InvestmentsPage = lazy(() => import("./pages/dashboard/InvestmentsPage"));
const CertificatePage = lazy(() => import("./pages/dashboard/CertificatePage"));
const VerifyCertificate = lazy(() => import("./pages/public/VerifyCertificate"));
const StatementsPage = lazy(() => import("./pages/dashboard/StatementsPage"));
const PayeesPage = lazy(() => import("./pages/dashboard/PayeesPage"));
const PremiumDashboardHome = lazy(() => import("./pages/dashboard/PremiumDashboardHome"));
const CheckingApplicationPage = lazy(() => import("./pages/dashboard/CheckingApplicationPage"));
const AdminDashboardLayout = lazy(() => import("@/components/dashboard/AdminDashboardLayout"));
const AdminDashboardHome = lazy(() => import("./pages/admin/AdminDashboardHome"));
const AdminCustomersPage = lazy(() => import("./pages/admin/AdminCustomersPage"));
const AdminClosedAccountsPage = lazy(() => import("./pages/admin/AdminClosedAccountsPage").then(m => ({ default: m.AdminClosedAccountsPage })));
const AdminAccountsPage = lazy(() => import("./pages/admin/AdminAccountsPage"));
const AdminCheckingApplicationsPage = lazy(() => import("./pages/admin/AdminCheckingApplicationsPage"));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage"));
const AdminDepositsPage = lazy(() => import("./pages/admin/AdminDepositsPage"));
const AdminTransactionsPage = lazy(() => import("./pages/admin/AdminTransactionsPage"));
const AdminLoansPage = lazy(() => import("./pages/admin/AdminLoansPage"));
const AdminCardsPage = lazy(() => import("./pages/admin/AdminCardsPage"));
const AdminKYCPage = lazy(() => import("./pages/admin/AdminKYCPage"));
const AdminNotificationsPage = lazy(() => import("./pages/admin/AdminNotificationsPage"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminFeesPage = lazy(() => import("./pages/admin/AdminFeesPage"));
const AdminDepositSettingsPage = lazy(() => import("./pages/admin/AdminDepositSettingsPage"));
const AdminChatPage = lazy(() => import("./pages/admin/AdminChatPage"));
const AdminInvestmentsPage = lazy(() => import("./pages/admin/AdminInvestmentsPage"));
const AdminTaxDocumentsPage = lazy(() => import("./pages/admin/AdminTaxDocumentsPage"));
const AdminNewsPage = lazy(() => import("./pages/admin/AdminNewsPage"));
const AdminMediaLibrary = lazy(() => import("./pages/admin/AdminMediaLibrary"));
const AdminPagesManager = lazy(() => import("./pages/admin/AdminPagesManager"));
const AdminProductsManager = lazy(() => import("./pages/admin/AdminProductsManager"));
const AdminAuditLogPage = lazy(() => import("./pages/admin/AdminAuditLogPage"));
const AdminDocumentsPage = lazy(() => import("./pages/admin/AdminDocumentsPage"));
const DocumentCenterPage = lazy(() => import("./pages/dashboard/DocumentCenterPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));
const ServerErrorPage = lazy(() => import("./pages/ServerErrorPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5-minute stale time: prevents redundant refetches on rapid navigation
      staleTime: 1000 * 60 * 5,
      // Keep unused data in memory for 10 minutes before garbage collection
      gcTime: 1000 * 60 * 10,
      // Disable window focus refetch — avoids wasted network on tab switch
      refetchOnWindowFocus: false,
      // Only retry on actual server errors, not auth errors
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403 || error?.status === 404) return false;
        return failureCount < 1;
      },
      // Pause background fetches when the user is offline
      networkMode: 'online',
    },
    mutations: {
      // Mutations retry once on network failure
      retry: 1,
      networkMode: 'online',
    },
  },
});
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
                  <Route path="/dashboard/current-application" element={<Navigate to="/dashboard/checking-application" replace />} />
                  <Route path="/admin/current-applications" element={<Navigate to="/admin/checking-applications" replace />} />
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
                    <Route path="/verify/:code" element={<VerifyCertificate />} />
                  </Route>

                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  
                  <Route path="/403" element={<AccessDenied />} />
                  <Route path="/500" element={<ServerErrorPage />} />
                  <Route path="/maintenance" element={<MaintenancePage />} />

                  <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboardLayout /></ProtectedRoute>}>
                    <Route index element={<CustomerDashboardHome />} />
                    <Route path="accounts" element={<AccountsPage />} />
                    <Route path="digital-currency" element={<DigitalCurrencyPage />} />
                    <Route path="transfers" element={<TransfersPage />} />
                    <Route path="transactions" element={<TransactionsPage />} />
                    <Route path="payments" element={<PaymentsPage />} />
                    <Route path="loans" element={<CustomerLoansPage />} />
                    <Route path="tax-refund" element={<TaxRefundPage />} />
                    <Route path="tax-refund/apply" element={<TaxRefundWizard />} />
                    <Route path="grants" element={<GrantsPage />} />
                    <Route path="grants/apply" element={<GrantApplicationWizard />} />
                    <Route path="cards" element={<CardsPage />} />
                    <Route path="beneficiaries" element={<BeneficiariesPage />} />
                    <Route path="kyc" element={<KYCPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="security" element={<SecurityPage />} />
                    <Route path="investments" element={<InvestmentsPage />} />
                    <Route path="investments/certificate/:id" element={<CertificatePage />} />
                    <Route path="statements" element={<StatementsPage />} />
                    <Route path="documents" element={<DocumentCenterPage />} />
                    <Route path="payees" element={<PayeesPage />} />
                    <Route path="deposit" element={<DepositPage />} />
                    <Route path="checking-application" element={<CheckingApplicationPage />} />
                    <Route path="services" element={<DashboardServicesPage />} />
                  </Route>

                  <Route path="/premium-dashboard" element={<ProtectedRoute><PremiumDashboardHome /></ProtectedRoute>} />

                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboardLayout /></ProtectedRoute>}>
                    <Route index element={<AdminDashboardHome />} />
                    <Route path="customers" element={<AdminCustomersPage />} />
                    <Route path="closed-accounts" element={<AdminClosedAccountsPage />} />
                    <Route path="accounts" element={<AdminAccountsPage />} />
                    <Route path="checking-applications" element={<AdminCheckingApplicationsPage />} />
                    <Route path="payments" element={<AdminPaymentsPage />} />
                    <Route path="deposits" element={<AdminDepositsPage />} />
                    <Route path="digital-currency" element={<AdminDigitalCurrencyPage />} />
                    <Route path="transactions" element={<AdminTransactionsPage />} />
                    <Route path="loans" element={<AdminLoansPage />} />
                    <Route path="tax-refunds" element={<AdminTaxRefundsPage />} />
                    <Route path="grants" element={<AdminGrantsPage />} />
                    <Route path="cards" element={<AdminCardsPage />} />
                    <Route path="kyc" element={<AdminKYCPage />} />
                    <Route path="notifications" element={<AdminNotificationsPage />} />
                    <Route path="reports" element={<AdminReportsPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                    <Route path="fees" element={<AdminFeesPage />} />
                    <Route path="deposit-settings" element={<AdminDepositSettingsPage />} />
                    <Route path="chat" element={<AdminChatPage />} />
                    <Route path="investments" element={<AdminInvestmentsPage />} />
                    <Route path="tax-documents" element={<AdminTaxDocumentsPage />} />
                    <Route path="cms-pages" element={<AdminPagesManager />} />
                    <Route path="cms-products" element={<AdminProductsManager />} />
                    <Route path="cms-media" element={<AdminMediaLibrary />} />
                    <Route path="cms-news" element={<AdminNewsPage />} />
                    <Route path="audit-logs" element={<AdminAuditLogPage />} />
                    <Route path="documents" element={<AdminDocumentsPage />} />
                  </Route>

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
