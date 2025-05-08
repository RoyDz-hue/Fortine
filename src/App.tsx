import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import AuthProvider from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary"; // Already added
import './App.css';

// --- Lazy load page components ---
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const WalletPage = lazy(() => import("./pages/dashboard/WalletPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const TransactionsPage = lazy(() => import("./pages/dashboard/TransactionsPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const MarketPage = lazy(() => import("./pages/MarketPage"));
const TradePage = lazy(() => import("./pages/TradePage"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const UsersPage = lazy(() => import("./pages/admin/UsersPage"));
const CoinsPage = lazy(() => import("./pages/admin/CoinsPage"));
const TradingPairsPage = lazy(() => import("./pages/admin/TradingPairsPage"));
const SettingsAdminPage = lazy(() => import("./pages/admin/SettingsPage")); // Note: same name as user settings, ensure correct path
const WithdrawalsPage = lazy(() => import("./pages/WithdrawalsPage"));
const AdminTransactionsPage = lazy(() => import("./pages/admin/TransactionsPage")); // Note: same name as user transactions, ensure correct path
const DepositsPage = lazy(() => import("./pages/admin/DepositsPage"));
const MarketOrdersPage = lazy(() => import("./pages/MarketOrdersPage"));
const MyWithdrawalsPage = lazy(() => import("./pages/MyWithdrawalsPage"));
const ReferralPage = lazy(() => import("./pages/dashboard/ReferralPage"));
const ReferralsPage = lazy(() => import("./pages/admin/ReferralsPage")); // Admin referrals page
const NotFound = lazy(() => import("./pages/NotFound"));

// Create a client
const queryClient = new QueryClient();

// Basic suspense fallback component
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    Loading page...
  </div>
);

function App() {
  console.log("App component rendering...");
  return (
    <ErrorBoundary> {/* ErrorBoundary is already wrapping App in main.tsx, but can be here too for finer control if needed */}
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="wallet" element={<WalletPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="withdrawals" element={<MyWithdrawalsPage />} />
                  <Route path="referrals" element={<ReferralPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="trade" element={<TradePage />} /> {/* Consider if :id is needed here or if TradePage handles it */} 
                </Route>
                
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/market" element={<MarketPage />} />
                <Route path="/market/orders" element={<MarketOrdersPage />} />
                <Route path="/trade/:id" element={<TradePage />} />
                
                <Route path="/admin" element={<AdminDashboard />}>
                  <Route index element={<AdminHome />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="coins" element={<CoinsPage />} />
                  <Route path="trading-pairs" element={<TradingPairsPage />} />
                  <Route path="settings" element={<SettingsAdminPage />} />
                  <Route path="withdrawals" element={<WithdrawalsPage />} />
                  <Route path="deposits" element={<DepositsPage />} />
                  <Route path="transactions" element={<AdminTransactionsPage />} />
                  <Route path="referrals" element={<ReferralsPage />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

