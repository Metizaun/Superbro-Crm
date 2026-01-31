import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';
import { toast } from 'sonner';

export interface ComposerTemplate {
  id?: string;
  name: string;
  content_type: 'linkedin' | 'email' | 'sms' | 'custom';
  title: string;
  content: string;
  metadata?: Record<string, any>;
  user_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ComposerSequence {
  id?: string;
  name: string;
  content_type: 'linkedin' | 'email' | 'sms' | 'custom';
  description?: string;
  steps: Array<{
    title: string;
    content: string;
    delay?: number;
    metadata?: Record<string, any>;
  }>;
  user_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const useComposer = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [templates, setTemplates] = useState<ComposerTemplate[]>([]);
  const [sequences, setSequences] = useState<ComposerSequence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { currentOrganization } = useOrganizationContext();

  const generateContent = async (
    prompt: string, 
    contentType: 'linkedin' | 'email' | 'sms' | 'custom',
    context?: string,
    crmData?: Record<string, any>
  ) => {
    if (!user || !currentOrganization) {
      toast.error('Please log in to use the composer');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('composer-ai', {
        body: {
          message: prompt,
          contentType,
          context,
          crmData
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate content');
      }

      setGeneratedContent(data.content);
      return data.content;
    } catch (error) {
      console.error('Content generation error:', error);
      toast.error('Failed to generate content. Please try again.');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const saveTemplate = async (template: Omit<ComposerTemplate, 'id'>) => {
    if (!user || !currentOrganization) {
      toast.error('Please log in to save templates');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('composer_templates')
        .insert({
          ...template,
          user_id: user.id,
          organization_id: currentOrganization.id
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [...prev, data as ComposerTemplate]);
      toast.success('Template saved successfully');
      return data;
    } catch (error) {
      console.error('Save template error:', error);
      toast.error('Failed to save template');
      throw error;
    }
  };

  const loadTemplates = async () => {
    if (!currentOrganization) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('composer_templates')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as ComposerTemplate[]);
    } catch (error) {
      console.error('Load templates error:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSequence = async (sequence: Omit<ComposerSequence, 'id'>) => {
    if (!user || !currentOrganization) {
      toast.error('Please log in to save sequences');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('composer_sequences')
        .insert({
          ...sequence,
          user_id: user.id,
          organization_id: currentOrganization.id
        })
        .select()
        .single();

      if (error) throw error;

      setSequences(prev => [...prev, data as ComposerSequence]);
      toast.success('Sequence saved successfully');
      return data;
    } catch (error) {
      console.error('Save sequence error:', error);
      toast.error('Failed to save sequence');
      throw error;
    }
  };

  const loadSequences = async () => {
    if (!currentOrganization) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('composer_sequences')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSequences((data || []) as ComposerSequence[]);
    } catch (error) {
      console.error('Load sequences error:', error);
      toast.error('Failed to load sequences');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('composer_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Delete template error:', error);
      toast.error('Failed to delete template');
    }
  };

  const deleteSequence = async (id: string) => {
    try {
      const { error } = await supabase
        .from('composer_sequences')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSequences(prev => prev.filter(s => s.id !== id));
      toast.success('Sequence deleted successfully');
    } catch (error) {
      console.error('Delete sequence error:', error);
      toast.error('Failed to delete sequence');
    }
  };

  // Auto-load data when organization changes
  useEffect(() => {
    if (currentOrganization?.id) {
      loadTemplates();
      loadSequences();
    }
  }, [currentOrganization?.id]); // Only depend on organization ID

  return {
    isGenerating,
    generatedContent,
    setGeneratedContent,
    templates,
    sequences,
    isLoading,
    generateContent,
    saveTemplate,
    loadTemplates,
    saveSequence,
    loadSequences,
    deleteTemplate,
    deleteSequence
  };
};