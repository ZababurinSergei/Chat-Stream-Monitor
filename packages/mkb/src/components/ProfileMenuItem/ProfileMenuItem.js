import React from 'react';
import './ProfileMenuItem.style.css';

function ProfileMenuItem({ children, title}) {
  return (
    <div className="profile-menu-item__wrapper">
      { children }
      <p className="profile-menu-item__title">{ title }</p>
    </div>
  );
}

export default ProfileMenuItem;
