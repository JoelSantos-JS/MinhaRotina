export interface ParentAccount {
  id: string;
  email: string;
  name: string;
  photo_url?: string | null;
  subscription_tier: 'free' | 'pro' | 'family';
  max_children: number;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export type VisualSupportType = 'images_text' | 'reduced_text' | 'images_only';

export interface ChildAccount {
  id: string;
  name: string;
  age: number;
  photo_url?: string | null;
  access_pin: string;
  pin_hash: string;
  qr_code_hash?: string | null;
  color_theme: string;
  icon_emoji: string;
  visual_support_type?: VisualSupportType | null;
  sensory_profile?: SensoryProfile | null;
  notes?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export interface SensoryProfile {
  auditory: 'hyper-reactive' | 'typical' | 'hypo-reactive';
  tactile: 'hyper-reactive' | 'typical' | 'hypo-reactive';
  visual: 'hyper-reactive' | 'typical' | 'hypo-reactive';
}

export interface Routine {
  id: string;
  child_id: string;
  name: string;
  type: 'morning' | 'afternoon' | 'night' | 'custom';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  routine_id: string;
  name: string;
  icon_emoji: string;
  order_index: number;
  estimated_minutes: number;
  has_sensory_issues: boolean;
  sensory_category?: 'teeth' | 'bath' | 'bathroom' | 'clothes' | 'hair' | 'food' | null;
  photo_url?: string | null;
  description?: string | null;
  video_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskProgress {
  id: string;
  child_id: string;
  routine_id: string;
  task_id?: string | null;
  completed_at: string;
  completion_date: string;
  took_minutes?: number | null;
  mood?: string | null;
}

export interface EducationalStrategy {
  id: string;
  category: string;
  problem_type: string;
  title: string;
  description: string;
  tips?: string[] | null;
  video_url?: string | null;
  order_index?: number | null;
  created_at: string;
}
