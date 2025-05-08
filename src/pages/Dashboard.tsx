import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Placeholder for Dashboard sub-pages, adjust imports as needed
const DashboardHome = () => <div className="p-4 text-white">Dashboard Home (Placeholder)</div>;
const WalletPage = () => <div className="p-4 text-white">Wallet Page (Placeholder)</div>;
const SettingsPage = () => <div className="p-4 text-white">Settings Page (Placeholder)</div>;
const TransactionsPage = () => <div className="p-4 text-white">Transactions Page (Placeholder)</div>;
const OrdersPage = () => <div className="p-4 text-white">Orders Page (Placeholder)</div>;
const TradePage = () => <div className="p-4 text-white">Trade Page (Placeholder)</div>;
const MyWithdrawalsPage = () => <div className="p-4 text-white">My Withdrawals Page (Placeholder)</div>;
const ReferralPage = () => <div className="p-4 text-white">Referral Page (Placeholder)</div>;

const Dashboard: React.FC = () => {
  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl font-bold mb-2">User Dashboard</h1>
      <p className="mb-4">This is a placeholder for the main user dashboard area.</p>
      {/* Nested routes for dashboard sections will go here */}
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="home" element={<DashboardHome />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="trade" element={<TradePage />} />
        <Route path="my-withdrawals" element={<MyWithdrawalsPage />} />
        <Route path="referrals" element={<ReferralPage />} />
        {/* Add other dashboard routes here */}
      </Routes>
    </div>
  );
};

export default Dashboard;

