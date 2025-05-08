import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar'; // Assuming Navbar is in the same directory

const AppLayout: React.FC = () => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-content" style={{ border: '2px solid red', minHeight: '100px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

