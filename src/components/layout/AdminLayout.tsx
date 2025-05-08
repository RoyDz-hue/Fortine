import React from 'react';
import { Outlet } from 'react-router-dom';

// You might want to add a specific Admin Navbar or Sidebar here later
// import AdminNavbar from './AdminNavbar'; 

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout">
      {/* <AdminNavbar /> */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

