import React, { useState, useEffect } from 'react';

export const useLocalStorage = (storageKey, fallbackState) => {
  const [value, setValue] = useState(() => {
    try {
      return storageKey === 'refreshToken' || storageKey === 'accessToken'
          ? localStorage.getItem(storageKey)
          : JSON.parse(localStorage.getItem(storageKey))
    } catch (error) {
      return fallbackState;
    }
  });

  useEffect(() => {
    if (
      value !== null &&
      value !== 'null' &&
      value !== undefined &&
      value !== 'undefined'
    ) {
      localStorage.setItem(storageKey, typeof value !== 'string' ? JSON.stringify(value) : value);
    }
  }, [value, storageKey]);

  return [value, setValue];
};
