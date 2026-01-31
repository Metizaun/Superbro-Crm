import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string | null;
  };
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  profiles: {
    display_name: string | null;
  };
}

export type OrganizationInsert = Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
export type UserRoleInsert = Omit<UserRole, 'id' | 'created_at' | 'updated_at'>;

export function useOrganizations() {
  const { user } = useAuth();

  const fetchUserOrganizations = async (): Promise<Organization[]> => {
    if (!user) throw new Error('User not authenticated');

    console.log('useOrganizations: Fetching organizations for user:', user.email, 'ID:', user.id);

    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        organizations (
          id,
          name,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('useOrganizations: Error fetching user organizations:', error);
      throw error;
    }
    
    console.log('useOrganizations: Raw organization data:', data);
    const organizations = data.map((item: any) => item.organizations).filter(Boolean);
    console.log('useOrganizations: Filtered organizations:', organizations);
    return organizations;
  };

  const fetchOrganizationMembers = async (organizationId: string): Promise<OrganizationMember[]> => {
    if (!user) throw new Error('User not authenticated');

    // First get user roles, then fetch profiles separately to avoid relation issues
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('id, user_id, role')
      .eq('organization_id', organizationId);

    if (rolesError) throw rolesError;

    if (!userRoles || userRoles.length === 0) return [];

    // Fetch profiles for all user_ids
    const userIds = userRoles.map(ur => ur.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', userIds);

    if (profilesError) throw profilesError;

    // Combine the data
    return userRoles.map(userRole => ({
      id: userRole.id,
      user_id: userRole.user_id,
      role: userRole.role,
      profiles: {
        display_name: profiles?.find(p => p.user_id === userRole.user_id)?.display_name || null
      }
    }));
  };

  const getUserRole = async (organizationId: string): Promise<UserRole['role'] | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (error) return null;
    return data?.role || null;
  };

  const createOrganization = async (organization: OrganizationInsert): Promise<Organization> => {
    if (!user) throw new Error('User not authenticated');

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert(organization)
      .select()
      .single();

    if (orgError) throw orgError;

    // Make the user the owner of the new organization
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        organization_id: orgData.id,
        role: 'owner'
      });

    if (roleError) throw roleError;

    return orgData;
  };

  const updateOrganization = async (id: string, updates: Partial<OrganizationInsert>): Promise<Organization> => {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const createUser = async (organizationId: string, email: string, password: string, displayName: string, role: UserRole['role']): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email,
        password,
        displayName,
        role,
        organizationId
      }
    });

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    if (data.error) throw new Error(`Failed to create user: ${data.error}`);
  };

  const updateUserRole = async (userRoleId: string, role: UserRole['role']): Promise<void> => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('id', userRoleId);

    if (error) throw error;
  };

  const removeUser = async (userRoleId: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: {
        userRoleId
      }
    });

    if (error) throw new Error(`Failed to remove user: ${error.message}`);
    if (data.error) throw new Error(`Failed to remove user: ${data.error}`);
  };

  return {
    fetchUserOrganizations,
    fetchOrganizationMembers,
    getUserRole,
    createOrganization,
    updateOrganization,
    createUser,
    updateUserRole,
    removeUser
  };
}