import React, { Suspense, lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext"; // This will be unused for now, but part of the structure

// Layouts
const AppLayout = lazy(() => import("@/components/layout/AppLayout"));
const AuthLayout = lazy(() => import("@/components/layout/AuthLayout"));
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout"));

// Pages
const HomePage = lazy(() => import("@/pages/HomePage"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const MarketPage = lazy(() => import("@/pages/MarketPage")); // Added
const TradePage = lazy(() => import("@/pages/TradePage"));   // Added
const OrdersPage = lazy(() => import("@/pages/OrdersPage")); // Added

// Fallback component for Suspense
const PageLoader: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px' }} className="text-white">
    Loading page...
  </div>
);

// ProtectedRoute component (will be simplified or its auth check effectively disabled if useAuth is not fully functional yet)
interface ProtectedRouteProps {
  children: JSX.Element;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  // const { isAuthenticated, isAdmin, isLoading } = useAuth(); // Temporarily disable auth check for this step
  const isLoading = false; // Assume not loading
  const isAuthenticated = true; // Assume authenticated for now to test routing
  const isAdmin = true; // Assume admin for now to test routing

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  console.log("[App.tsx] Full App component rendering with routing structure...");
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route index element={<Navigate to="login" replace />} />
        </Route>

        {/* App Routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="dashboard/*" element={<Dashboard />} />
          <Route path="market" element={<MarketPage />} /> {/* Added */}
          <Route path="trade" element={<TradePage />} />   {/* Added */}
          <Route path="orders" element={<OrdersPage />} /> {/* Added */}
          {/* Add other app-specific routes here */}
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminLayout /></ProtectedRoute>}>
          <Route path="dashboard/*" element={<AdminDashboard />} />
          {/* Add other admin-specific routes here */}
        </Route>

        {/* Fallback for unmatched routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </Suspense>
  );
}

export default App;

