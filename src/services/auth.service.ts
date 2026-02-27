import { supabase } from '../config/supabase';
import type { ParentAccount } from '../types/models';

export interface AuthResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  needsEmailConfirmation?: boolean;
}

export const authService = {
  async loginParent(email: string, password: string): Promise<AuthResult<ParentAccount>> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      let { data: parentData, error: parentError } = await supabase
        .from('parent_accounts')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      // First login after email confirmation: create parent row if missing.
      if (parentError && parentError.code === 'PGRST116') {
        const { data: newParent, error: createError } = await supabase
          .from('parent_accounts')
          .insert({
            id: authData.user.id,
            email: authData.user.email ?? email,
            name: authData.user.user_metadata?.name ?? email.split('@')[0],
            subscription_tier: 'free',
            max_children: 2,
          })
          .select()
          .single();
        if (createError) throw createError;
        parentData = newParent;
      } else if (parentError) {
        throw parentError;
      }

      await supabase
        .from('parent_accounts')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', authData.user.id);

      return { success: true, data: parentData as ParentAccount };
    } catch (error: any) {
      const msg: string = error.message ?? '';
      if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
        return { success: false, error: 'Email ou senha incorretos.' };
      }
      if (msg.includes('Email not confirmed')) {
        return { success: false, error: 'Confirme seu email antes de entrar.' };
      }
      return { success: false, error: msg || 'Erro ao fazer login' };
    }
  },

  async createParentAccount(
    email: string,
    password: string,
    name: string
  ): Promise<AuthResult<ParentAccount>> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (authError) {
        const msg = authError.message;
        if (msg.includes('already registered') || msg.includes('User already registered')) {
          throw new Error('Este email ja esta cadastrado. Tente fazer login.');
        }
        throw authError;
      }

      if (!authData.user) throw new Error('Erro ao criar usuario. Tente novamente.');

      // No active session means Supabase email confirmation is required.
      if (!authData.session) {
        return {
          success: true,
          needsEmailConfirmation: true,
          error:
            'Link enviado para ' +
            email +
            '!\n\nVerifique sua caixa de entrada e clique no link para ativar. Depois volte e faca login.',
        };
      }

      // Session exists: try parent row created by trigger.
      const { data: parentData } = await supabase
        .from('parent_accounts')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (parentData) {
        if (parentData.name !== name) {
          await supabase.from('parent_accounts').update({ name }).eq('id', authData.user.id);
          parentData.name = name;
        }
        return { success: true, data: parentData as ParentAccount };
      }

      // Fallback when trigger did not run.
      const { data: newParent, error: insertError } = await supabase
        .from('parent_accounts')
        .insert({
          id: authData.user.id,
          email,
          name,
          subscription_tier: 'free',
          max_children: 2,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      return { success: true, data: newParent as ParentAccount };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao criar conta' };
    }
  },

  async resetPassword(email: string): Promise<AuthResult<null>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw error;
      return { success: true, data: null };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao enviar link de recuperacao' };
    }
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getCurrentParent(): Promise<ParentAccount | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase.from('parent_accounts').select('*').eq('id', user.id).single();

    return data as ParentAccount | null;
  },
};

