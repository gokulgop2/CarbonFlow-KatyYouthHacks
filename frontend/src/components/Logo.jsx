// frontend/src/components/Logo.jsx

import React from 'react';
import { FaFeatherAlt } from 'react-icons/fa'; // A nice, lightweight icon

function Logo({ onClick }) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="logo-container" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <FaFeatherAlt className="logo-icon" />
      <span className="logo-text">CarbonFlow</span>
    </div>
  );
}

export default Logo;