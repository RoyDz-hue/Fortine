import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="p-4 text-white text-center mt-12">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-6">Sorry, the page you are looking for does not exist.</p>
      <Link to="/" className="text-fortunesly-primary hover:underline">
        Go to Home Page
      </Link>
    </div>
  );
};

export default NotFoundPage;

