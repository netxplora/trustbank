import React, { Suspense, lazy, useEffect } from "react";
import { PageLoader } from "@trustbank/shared-ui/components/ui/PageLoader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@trustbank/shared-ui/components/ui/sonner";
import { Toaster } from "@trustbank/shared-ui/components/ui/toaster";
import { TooltipProvider } from "@trustbank/shared-ui/components/ui/tooltip";
import { AuthProvider } from "@trustbank/shared-utils/contexts/AuthContext";
import { BrandProvider } from "@trustbank/shared-utils/contexts/BrandContext";
import { ThemeProvider } from "@trustbank/shared-ui/components/theme-provider";
import { ProtectedRoute } from "@trustbank/shared-ui/components/ProtectedRoute";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const CustomerDashboardLayout = lazy(() => import("./components/dashboard/CustomerDashboardLayout"));
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
const KYCPage = lazy(() => import("./pages/dashboard/KYCPage"));
const DepositPage = lazy(() => import("./pages/dashboard/DepositPage"));

const InvestmentsPage = lazy(() => import("./pages/dashboard/InvestmentsPage"));
const StatementsPage = lazy(() => import("./pages/dashboard/StatementsPage"));
const PayeesPage = lazy(() => import("./pages/dashboard/PayeesPage"));
const PremiumDashboardHome = lazy(() => import("./pages/dashboard/PremiumDashboardHome"));
const CurrentAccountApplicationPage = lazy(() => import("./pages/dashboard/CurrentAccountApplicationPage"));
const AdminDashboardLayout = lazy(() => import("./components/dashboard/AdminDashboardLayout"));
const AdminDashboardHome = lazy(() => import("./pages/admin/AdminDashboardHome"));
const AdminCustomersPage = lazy(() => import("./pages/admin/AdminCustomersPage"));
const AdminAccountsPage = lazy(() => import("./pages/admin/AdminAccountsPage"));
const AdminCurrentAccountsPage = lazy(() => import("./pages/admin/AdminCurrentAccountsPage"));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage"));
const AdminDepositsPage = lazy(() => import("./pages/admin/AdminDepositsPage"));
const AdminTransactionsPage = lazy(() => import("./pages/admin/AdminTransactionsPage"));
const AdminLoansPage = lazy(() => import("./pages/admin/AdminLoansPage"));
const AdminCardsPage = lazy(() => import("./pages/admin/AdminCardsPage"));
const AdminKYCPage = lazy(() => import("./pages/admin/AdminKYCPage"));
const AdminNotificationsPage = lazy(() => import("./pages/admin/AdminNotificationsPage"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminDepositSettingsPage = lazy(() => import("./pages/admin/AdminDepositSettingsPage"));
const AdminChatPage = lazy(() => import("./pages/admin/AdminChatPage"));
const AdminInvestmentsPage = lazy(() => import("./pages/admin/AdminInvestmentsPage"));
const AdminTaxDocumentsPage = lazy(() => import("./pages/admin/AdminTaxDocumentsPage"));
const AdminNewsPage = lazy(() => import("./pages/admin/AdminNewsPage"));
const AdminMediaLibrary = lazy(() => import("./pages/admin/AdminMediaLibrary"));
const AdminPagesManager = lazy(() => import("./pages/admin/AdminPagesManager"));
const AdminProductsManager = lazy(() => import("./pages/admin/AdminProductsManager"));
const AdminAuditLogPage = lazy(() => import("./pages/admin/AdminAuditLogPage"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));
const ServerErrorPage = lazy(() => import("./pages/ServerErrorPage"));

const RedirectToPublicSite = ({ path }: { path: string }) => {
    useEffect(() => {
        const publicUrl = import.meta.env.VITE_PUBLIC_WEBSITE_URL || 'https://trustbank.com';
        window.location.href = `${publicUrl}${path}`;
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
          <BrandProvider>
            <AuthProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Auth routes */}
                  {/* PRD states: The Login button should redirect to: https://app.trustbank.com/auth/login */}
                  <Route path="/auth/login" element={<LoginPage />} />
                  <Route path="/login" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  
                  <Route path="/403" element={<AccessDenied />} />
                  <Route path="/500" element={<ServerErrorPage />} />
                  <Route path="/maintenance" element={<MaintenancePage />} />

                  {/* Dashboard routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboardLayout /></ProtectedRoute>}>
                    <Route index element={<CustomerDashboardHome />} />
                    <Route path="accounts" element={<AccountsPage />} />
                    <Route path="transfers" element={<TransfersPage />} />
                    <Route path="payments" element={<PaymentsPage />} />
                    <Route path="loans" element={<CustomerLoansPage />} />
                    <Route path="cards" element={<CardsPage />} />
                    <Route path="beneficiaries" element={<BeneficiariesPage />} />
                    <Route path="kyc" element={<KYCPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="security" element={<SecurityPage />} />
                    <Route path="investments" element={<InvestmentsPage />} />
                    <Route path="statements" element={<StatementsPage />} />
                    <Route path="payees" element={<PayeesPage />} />
                    <Route path="deposit" element={<DepositPage />} />
                    <Route path="current-application" element={<CurrentAccountApplicationPage />} />
                  </Route>

                  <Route path="/premium-dashboard" element={<ProtectedRoute><PremiumDashboardHome /></ProtectedRoute>} />

                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboardLayout /></ProtectedRoute>}>
                    <Route index element={<AdminDashboardHome />} />
                    <Route path="customers" element={<AdminCustomersPage />} />
                    <Route path="accounts" element={<AdminAccountsPage />} />
                    <Route path="current-applications" element={<AdminCurrentAccountsPage />} />
                    <Route path="payments" element={<AdminPaymentsPage />} />
                    <Route path="deposits" element={<AdminDepositsPage />} />
                    <Route path="transactions" element={<AdminTransactionsPage />} />
                    <Route path="loans" element={<AdminLoansPage />} />
                    <Route path="cards" element={<AdminCardsPage />} />
                    <Route path="kyc" element={<AdminKYCPage />} />
                    <Route path="notifications" element={<AdminNotificationsPage />} />
                    <Route path="reports" element={<AdminReportsPage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                    <Route path="deposit-settings" element={<AdminDepositSettingsPage />} />
                    <Route path="chat" element={<AdminChatPage />} />
                    <Route path="investments" element={<AdminInvestmentsPage />} />
                    <Route path="tax-documents" element={<AdminTaxDocumentsPage />} />
                    <Route path="cms-pages" element={<AdminPagesManager />} />
                    <Route path="cms-products" element={<AdminProductsManager />} />
                    <Route path="cms-media" element={<AdminMediaLibrary />} />
                    <Route path="cms-news" element={<AdminNewsPage />} />
                    <Route path="audit-logs" element={<AdminAuditLogPage />} />
                  </Route>

                  <Route path="/" element={<RedirectToPublicSite path="/" />} />
                  <Route path="*" element={<RedirectToPublicSite path="/404" />} />
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
