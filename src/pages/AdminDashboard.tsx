import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Placeholder for Admin Dashboard sub-pages, adjust imports as needed
const AdminHome = () => <div>Admin Dashboard Home (Placeholder)</div>;
const UsersPage = () => <div>Users Management Page (Placeholder)</div>;
const CoinsPage = () => <div>Coins Management Page (Placeholder)</div>;
const TradingPairsPage = () => <div>Trading Pairs Management Page (Placeholder)</div>;
const AdminSettingsPage = () => <div>Admin Settings Page (Placeholder)</div>;
const WithdrawalsPage = () => <div>Withdrawals Management Page (Placeholder)</div>;
const AdminTransactionsPage = () => <div>Admin Transactions Page (Placeholder)</div>;
const DepositsPage = () => <div>Deposits Management Page (Placeholder)</div>;
const AdminReferralsPage = () => <div>Admin Referrals Page (Placeholder)</div>;
const MarketPage = () => <div>Market Page (Placeholder)</div>; // Also used here

const AdminDashboard: React.FC = () => {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>This is a placeholder for the main admin dashboard area.</p>
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

