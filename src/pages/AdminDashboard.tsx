import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Placeholder for Admin Dashboard sub-pages, adjust imports as needed
const AdminHome = () => <div className="p-4 text-white">Admin Dashboard Home (Placeholder)</div>;
const UsersPage = () => <div className="p-4 text-white">Users Management Page (Placeholder)</div>;
const CoinsPage = () => <div className="p-4 text-white">Coins Management Page (Placeholder)</div>;
const TradingPairsPage = () => <div className="p-4 text-white">Trading Pairs Management Page (Placeholder)</div>;
const AdminSettingsPage = () => <div className="p-4 text-white">Admin Settings Page (Placeholder)</div>;
const WithdrawalsPage = () => <div className="p-4 text-white">Withdrawals Management Page (Placeholder)</div>;
const AdminTransactionsPage = () => <div className="p-4 text-white">Admin Transactions Page (Placeholder)</div>;
const DepositsPage = () => <div className="p-4 text-white">Deposits Management Page (Placeholder)</div>;
const AdminReferralsPage = () => <div className="p-4 text-white">Admin Referrals Page (Placeholder)</div>;
const MarketPage = () => <div className="p-4 text-white">Market Page (Placeholder)</div>; // Also used here

const AdminDashboard: React.FC = () => {
  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
      <p className="mb-4">This is a placeholder for the main admin dashboard area.</p>
      {/* Nested routes for admin dashboard sections will go here */}
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="home" element={<AdminHome />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="coins" element={<CoinsPage />} />
        <Route path="trading-pairs" element={<TradingPairsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="withdrawals" element={<WithdrawalsPage />} />
        <Route path="transactions" element={<AdminTransactionsPage />} />
        <Route path="deposits" element={<DepositsPage />} />
        <Route path="referrals" element={<AdminReferralsPage />} />
        <Route path="market" element={<MarketPage />} />
        {/* Add other admin dashboard routes here */}
      </Routes>
    </div>
  );
};

export default AdminDashboard;

