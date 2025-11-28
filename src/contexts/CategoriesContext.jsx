import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCategories, forceRefreshCategories } from '../services/categories';

const CategoriesContext = createContext();

export const useCategoriesContext = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategoriesContext must be used within CategoriesProvider');
  }
  return context;
};

export const CategoriesProvider = ({ children }) => {
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const categoriesData = await useCategories();
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = async () => {
    try {
      setLoading(true);
      await forceRefreshCategories();
      await loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        loading,
        error,
        loadCategories,
        refreshCategories,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
};