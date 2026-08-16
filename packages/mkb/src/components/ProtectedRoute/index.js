import React from 'react';

export const ProtectedRoute = ({ isAllowed, redirectComponent, children }) => {
  if (!isAllowed) {
    return redirectComponent;
  }

  return children;
};
