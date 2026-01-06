import { createContext, useContext, useState, useEffect } from 'react';
import { businessesAPI } from '../api';

const BusinessContext = createContext();

export function BusinessProvider({ children }) {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const response = await businessesAPI.getAll();
      setBusinesses(response.data);
      
      // Load selected business from localStorage
      const storedBusinessId = localStorage.getItem('selectedBusinessId');
      if (storedBusinessId && storedBusinessId !== 'null' && storedBusinessId !== 'undefined') {
        const businessId = parseInt(storedBusinessId);
        // Verify the business still exists
        const businessExists = response.data.some(b => b.id === businessId);
        if (businessExists) {
          setSelectedBusiness(businessId);
        } else {
          // Business was deleted, clear selection
          localStorage.removeItem('selectedBusinessId');
          setSelectedBusiness(null);
        }
      } else {
        setSelectedBusiness(null);
      }
    } catch (error) {
      console.error('Failed to load businesses:', error);
      setSelectedBusiness(null);
    } finally {
      setLoading(false);
    }
  };

  const selectBusiness = (businessId) => {
    setSelectedBusiness(businessId);
    localStorage.setItem('selectedBusinessId', businessId ? businessId.toString() : '');
  };

  const getSelectedBusiness = () => {
    return businesses.find(b => b.id === selectedBusiness);
  };

  const value = {
    businesses,
    selectedBusiness,
    selectBusiness,
    getSelectedBusiness,
    loading,
    refreshBusinesses: loadBusinesses
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within BusinessProvider');
  }
  return context;
}

