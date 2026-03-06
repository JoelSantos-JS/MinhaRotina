import { supabase } from '../config/supabase';
import { compressAvatar, base64ToUint8Array } from '../utils/imageUtils';
import { extractStoragePath, toStorageRef } from '../utils/storageMedia';
import type { ParentAccount } from '../types/models';

export interface AuthResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  needsEmailConfirmation?: boolean;
}

const PARENT_PHOTOS_BUCKET = 'parent-photos';
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const AUTH_EMAIL_REDIRECT_URL = process.env.EXPO_PUBLIC_AUTH_EMAIL_REDIRECT_URL?.trim() || undefined;

async function createSignedParentPhotoUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PARENT_PHOTOS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

async function hydrateParentPhotoUrl(
  parent: ParentAccount | null | undefined
): Promise<ParentAccount | null> {
  if (!parent) return null;
  if (!parent.photo_url) return parent;

  const storagePath = extractStoragePath(parent.photo_url, PARENT_PHOTOS_BUCKET);
  if (!storagePath) return parent;

  try {
    const signedUrl = await createSignedParentPhotoUrl(storagePath);
    return { ...parent, photo_url: signedUrl };
  } catch {
    return { ...parent, photo_url: null };
  }
}

function mapParentPhotoUploadError(error: unknown): Error {
  const raw = String((error as any)?.message ?? '');
  const msg = raw.toLowerCase();

  const isRls =
    msg.includes('row-level security') ||
    msg.includes('violates row-level security') ||
    msg.includes('policy') ||
    msg.includes('permission denied');

  if (isRls) {
    return new Error(
      'Falha de permissao no Storage (bucket "parent-photos"). Aplique a migration de policies para permitir upload do proprio usuario autenticado.'
    );
  }

  const bucketMissing =
    msg.includes('bucket') && (msg.includes('not found') || msg.includes('does not exist'));

  if (bucketMissing) {
    return new Error(
      'Bucket "parent-photos" nao encontrado no Supabase Storage. Crie o bucket e aplique as policies de upload.'
    );
  }

  if (error instanceof Error) return error;
  return new Error(raw || 'Erro ao enviar foto de perfil');
}

function mapDeleteAccountError(error: unknown): Error {
  const raw = String((error as any)?.message ?? '');
  const msg = raw.toLowerCase();

  if (msg.includes('delete_my_account')) {
    return new Error(
      'Exclusao de conta nao habilitada no banco. Execute a migration de exclusao de conta.'
    );
  }

  if (msg.includes('not authenticated') || msg.includes('jwt')) {
    return new Error('Sessao invalida. Entre novamente e tente excluir a conta.');
  }

  if (error instanceof Error) return error;
  return new Error(raw || 'Erro ao excluir conta');
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

      const hydratedParent = await hydrateParentPhotoUrl(parentData as ParentAccount);
      return { success: true, data: hydratedParent as ParentAccount };
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
      const signUpOptions: {
        data: { name: string };
        emailRedirectTo?: string;
      } = { data: { name } };
      if (AUTH_EMAIL_REDIRECT_URL) {
        signUpOptions.emailRedirectTo = AUTH_EMAIL_REDIRECT_URL;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: signUpOptions,
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
        const hydratedParent = await hydrateParentPhotoUrl(parentData as ParentAccount);
        return { success: true, data: hydratedParent as ParentAccount };
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

      const hydratedParent = await hydrateParentPhotoUrl(newParent as ParentAccount);
      return { success: true, data: hydratedParent as ParentAccount };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao criar conta' };
    }
  },

  async resetPassword(email: string): Promise<AuthResult<null>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: AUTH_EMAIL_REDIRECT_URL,
      });
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
    return (await hydrateParentPhotoUrl(data as ParentAccount | null)) as ParentAccount | null;
  },

  async uploadParentPhoto(parentId: string, localUri: string): Promise<string> {
    try {
      const { base64 } = await compressAvatar(localUri);
      const bytes = base64ToUint8Array(base64);
      const path = `${parentId}.jpg`;
      const { error } = await supabase.storage
        .from(PARENT_PHOTOS_BUCKET)
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      return await createSignedParentPhotoUrl(path);
    } catch (error: unknown) {
      throw mapParentPhotoUploadError(error);
    }
  },

  async updateParentPhotoUrl(parentId: string, photoUrl: string | null): Promise<void> {
    const storageValue = photoUrl
      ? toStorageRef(
          PARENT_PHOTOS_BUCKET,
          extractStoragePath(photoUrl, PARENT_PHOTOS_BUCKET) ?? `${parentId}.jpg`
        )
      : null;

    const { error } = await supabase
      .from('parent_accounts')
      .update({ photo_url: storageValue })
      .eq('id', parentId);
    if (error) throw error;
  },

  async deleteMyAccount(): Promise<void> {
    try {
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
    } catch (error: unknown) {
      throw mapDeleteAccountError(error);
    } finally {
      // Best effort cleanup of local session.
      await supabase.auth.signOut();
    }
  },
};
