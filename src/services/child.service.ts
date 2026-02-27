import { supabase } from '../config/supabase';
import { hashPin, verifyPin, generateRandomPin } from '../utils/pinUtils';
import type { ChildAccount, SensoryProfile, VisualSupportType } from '../types/models';

export interface CreateChildData {
  name: string;
  age: number;
  pin: string;
  color_theme?: string;
  icon_emoji?: string;
  visual_support_type?: VisualSupportType;
  sensory_profile?: SensoryProfile;
  notes?: string;
}

const PIN_PATTERN = /^[0-9]{4}$/;
const DUPLICATE_PIN_MESSAGE =
  'Este PIN ja esta sendo usado por outro filho(a). Escolha um PIN diferente.';
const INVALID_PIN_MESSAGE = 'O PIN deve ter exatamente 4 digitos numericos.';

function assertValidPin(pin: string) {
  if (!PIN_PATTERN.test(pin)) {
    throw new Error(INVALID_PIN_MESSAGE);
  }
}

function mapWriteError(error: any): Error {
  const code = error?.code;
  const message = String(error?.message ?? '');
  const constraint = String(error?.constraint ?? '');

  if (
    code === '23505' &&
    (constraint.includes('idx_child_parent_pin_hash_unique') ||
      message.includes('idx_child_parent_pin_hash_unique'))
  ) {
    return new Error(DUPLICATE_PIN_MESSAGE);
  }

  if (
    code === '23514' &&
    (constraint.includes('child_accounts_access_pin_4_digits') ||
      message.includes('child_accounts_access_pin_4_digits'))
  ) {
    return new Error(INVALID_PIN_MESSAGE);
  }

  if (error instanceof Error) return error;
  return new Error(message || 'Erro ao salvar crianca');
}

export const childService = {
  async getChildrenByParent(parentId: string): Promise<ChildAccount[]> {
    const { data, error } = await supabase
      .from('child_accounts')
      .select('*')
      .eq('created_by', parentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as ChildAccount[];
  },

  /** Returns true if the PIN is already used by another child of the same parent. */
  async isPinUsedBySibling(
    parentId: string,
    pin: string,
    excludeChildId?: string
  ): Promise<boolean> {
    const siblings = await childService.getChildrenByParent(parentId);

    for (const sibling of siblings) {
      if (excludeChildId && sibling.id === excludeChildId) continue;
      if (await verifyPin(pin, sibling.pin_hash)) return true;
    }

    return false;
  },

  async createChild(parentId: string, childData: CreateChildData): Promise<ChildAccount> {
    assertValidPin(childData.pin);

    const pinInUse = await childService.isPinUsedBySibling(parentId, childData.pin);
    if (pinInUse) {
      throw new Error(DUPLICATE_PIN_MESSAGE);
    }

    const pin_hash = await hashPin(childData.pin);

    const { data, error } = await supabase
      .from('child_accounts')
      .insert({
        name: childData.name,
        age: childData.age,
        access_pin: childData.pin,
        pin_hash,
        color_theme: childData.color_theme ?? '#88CAFC',
        icon_emoji: childData.icon_emoji ?? '🌸',
        visual_support_type: childData.visual_support_type ?? null,
        sensory_profile: childData.sensory_profile ?? null,
        notes: childData.notes ?? null,
        created_by: parentId,
      })
      .select()
      .single();

    if (error) throw mapWriteError(error);
    return data as ChildAccount;
  },

  async updateChild(
    childId: string,
    updates: Partial<CreateChildData>,
    parentId?: string
  ): Promise<ChildAccount> {
    const payload: Record<string, unknown> = { ...updates };

    if (typeof updates.pin === 'string') {
      assertValidPin(updates.pin);

      if (parentId) {
        const pinInUse = await childService.isPinUsedBySibling(parentId, updates.pin, childId);
        if (pinInUse) {
          throw new Error(DUPLICATE_PIN_MESSAGE);
        }
      }

      payload.pin_hash = await hashPin(updates.pin);
      payload.access_pin = updates.pin;
      delete payload.pin;
    }

    const { data, error } = await supabase
      .from('child_accounts')
      .update(payload)
      .eq('id', childId)
      .select()
      .single();

    if (error) throw mapWriteError(error);
    return data as ChildAccount;
  },

  async regeneratePin(
    childId: string,
    parentId?: string
  ): Promise<{ child: ChildAccount; newPin: string }> {
    const newPin = generateRandomPin();
    const updated = await childService.updateChild(childId, { pin: newPin }, parentId);
    return { child: updated, newPin };
  },

  async deleteChild(childId: string): Promise<void> {
    const { error } = await supabase.from('child_accounts').delete().eq('id', childId);
    if (error) throw error;
  },
};

