import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOrganizations, Organization } from './useOrganizations';
import { useAuth } from './useAuth';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  setCurrentOrganization: (org: Organization) => void;
  loading: boolean;
  refetchOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchUserOrganizations } = useOrganizations();
  const { user } = useAuth();

  const loadOrganizations = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      console.log('OrganizationContext: Loading organizations for user:', user?.email, 'ID:', user?.id);
      const orgs = await fetchUserOrganizations();
      console.log('OrganizationContext: Found organizations:', orgs);
      setOrganizations(orgs);

      // Ensure current organization belongs to the signed-in user
      if (orgs.length > 0) {
        const stillValid = currentOrganization && orgs.some(o => o.id === currentOrganization.id);
        if (!stillValid) {
          console.log('OrganizationContext: Setting current organization to:', orgs[0]);
          setCurrentOrganization(orgs[0]);
        }
      } else {
        console.warn('OrganizationContext: No organizations found for user:', user?.email);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Reset to avoid stale selection when switching accounts
      setCurrentOrganization(null);
      loadOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrganization(null);
      setLoading(false);
    }
  }, [user?.id]);

  const refetchOrganizations = async () => {
    await loadOrganizations();
  };

  return (
    <OrganizationContext.Provider value={{
      currentOrganization,
      organizations,
      setCurrentOrganization,
      loading,
      refetchOrganizations
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
}