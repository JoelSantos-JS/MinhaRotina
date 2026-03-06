import { supabase } from '../config/supabase';
import { compressImage, base64ToUint8Array } from '../utils/imageUtils';
import { extractStoragePath, toStorageRef } from '../utils/storageMedia';
import type { RoutineTemplate } from '../utils/routineTemplates';
import type {
  Routine,
  RoutinesConfig,
  Task,
  TaskProgress,
  TaskProgressWithRelations,
  TaskStep,
} from '../types/models';

const TASK_PHOTOS_BUCKET = 'task-photos';
const TASK_VIDEOS_BUCKET = 'task-videos';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function createSignedMediaUrl(bucket: string, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

function normalizeTaskPhotoStorageValue(taskId: string, photoUrl: string | null): string | null {
  if (!photoUrl) return null;
  const path = extractStoragePath(photoUrl, TASK_PHOTOS_BUCKET) ?? `${taskId}.jpg`;
  return toStorageRef(TASK_PHOTOS_BUCKET, path);
}

function normalizeTaskVideoStorageValue(videoUrl: string | null): string | null {
  if (!videoUrl) return null;
  const path = extractStoragePath(videoUrl, TASK_VIDEOS_BUCKET);
  if (!path) return videoUrl;
  return toStorageRef(TASK_VIDEOS_BUCKET, path);
}

async function hydrateTaskMedia(task: Task): Promise<Task> {
  const next: Task = { ...task };

  const photoPath = extractStoragePath(task.photo_url ?? null, TASK_PHOTOS_BUCKET);
  if (photoPath) {
    try {
      next.photo_url = await createSignedMediaUrl(TASK_PHOTOS_BUCKET, photoPath);
    } catch {
      next.photo_url = null;
    }
  }

  const videoPath = extractStoragePath(task.video_url ?? null, TASK_VIDEOS_BUCKET);
  if (videoPath) {
    try {
      next.video_url = await createSignedMediaUrl(TASK_VIDEOS_BUCKET, videoPath);
    } catch {
      next.video_url = null;
    }
  }

  return next;
}

export const routineService = {
  async getRoutinesByChild(childId: string): Promise<Routine[]> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Routine[];
  },

  async getRoutineById(routineId: string): Promise<Routine | null> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('id', routineId)
      .maybeSingle();

    if (error) throw error;
    return (data as Routine | null) ?? null;
  },

  async getActiveRoutine(childId: string): Promise<Routine | null> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('child_id', childId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Routine | null;
  },

  async createRoutine(
    childId: string,
    name: string,
    type: Routine['type']
  ): Promise<Routine> {
    const { data, error } = await supabase
      .from('routines')
      .insert({ child_id: childId, name, type, is_active: true })
      .select()
      .single();

    if (error) throw error;
    return data as Routine;
  },

  async toggleRoutine(routineId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('routines')
      .update({ is_active: isActive })
      .eq('id', routineId);

    if (error) throw error;
  },

  async deleteRoutine(routineId: string): Promise<void> {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', routineId);

    if (error) throw error;
  },

  async applyTemplate(childId: string, template: RoutineTemplate): Promise<Routine> {
    const routine = await routineService.createRoutine(childId, template.name, template.type);

    const taskRows = template.tasks.map((t, index) => ({
      routine_id: routine.id,
      name: t.name,
      icon_emoji: t.icon_emoji,
      order_index: index,
      estimated_minutes: t.estimated_minutes,
      has_sensory_issues: t.has_sensory_issues ?? false,
      sensory_category: t.sensory_category ?? null,
      steps: t.steps.length > 0 ? t.steps : null,
    }));

    const { error } = await supabase.from('tasks').insert(taskRows);
    if (error) throw error;

    return routine;
  },
};

export const taskService = {
  async getTasksByRoutine(routineId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('routine_id', routineId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    const tasks = (data ?? []) as Task[];
    return Promise.all(tasks.map((task) => hydrateTaskMedia(task)));
  },

  async uploadTaskPhoto(taskId: string, localUri: string): Promise<string> {
    const { base64 } = await compressImage(localUri);
    const bytes = base64ToUint8Array(base64);
    const path = `${taskId}.jpg`;
    const { error } = await supabase.storage
      .from(TASK_PHOTOS_BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    return createSignedMediaUrl(TASK_PHOTOS_BUCKET, path);
  },

  async updateTaskPhoto(taskId: string, photoUrl: string | null): Promise<void> {
    const storageValue = normalizeTaskPhotoStorageValue(taskId, photoUrl);
    const { error } = await supabase
      .from('tasks')
      .update({ photo_url: storageValue })
      .eq('id', taskId);
    if (error) throw error;
  },

  async uploadTaskVideo(taskId: string, localUri: string): Promise<string> {
    const ext = localUri.split('.').pop()?.toLowerCase() || 'mp4';
    const path = `${taskId}.${ext}`;
    const response = await fetch(localUri);
    const blob = await response.blob();
    const { error } = await supabase.storage
      .from(TASK_VIDEOS_BUCKET)
      .upload(path, blob, { contentType: 'video/mp4', upsert: true });
    if (error) throw error;
    return createSignedMediaUrl(TASK_VIDEOS_BUCKET, path);
  },

  async updateTaskVideo(taskId: string, videoUrl: string | null): Promise<void> {
    const storageValue = normalizeTaskVideoStorageValue(videoUrl);
    const { error } = await supabase
      .from('tasks')
      .update({ video_url: storageValue })
      .eq('id', taskId);
    if (error) throw error;
  },

  async createTask(
    routineId: string,
    name: string,
    iconEmoji: string,
    orderIndex: number,
    options?: {
      estimatedMinutes?: number;
      hasSensoryIssues?: boolean;
      sensoryCategory?: Task['sensory_category'];
      photoLocalUri?: string;
      description?: string;
      videoLocalUri?: string;
      routinesConfig?: RoutinesConfig;
      steps?: TaskStep[];
    }
  ): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        routine_id: routineId,
        name,
        icon_emoji: iconEmoji,
        order_index: orderIndex,
        estimated_minutes: options?.estimatedMinutes ?? 5,
        has_sensory_issues: options?.hasSensoryIssues ?? false,
        sensory_category: options?.sensoryCategory ?? null,
        description: options?.description ?? null,
        routines_config: options?.routinesConfig ?? null,
        steps: options?.steps ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    let task = data as Task;

    if (options?.photoLocalUri) {
      const publicUrl = await taskService.uploadTaskPhoto(task.id, options.photoLocalUri);
      await taskService.updateTaskPhoto(task.id, publicUrl);
      task = { ...task, photo_url: publicUrl };
    }

    if (options?.videoLocalUri) {
      const videoUrl = await taskService.uploadTaskVideo(task.id, options.videoLocalUri);
      await taskService.updateTaskVideo(task.id, videoUrl);
      task = { ...task, video_url: videoUrl };
    }

    return hydrateTaskMedia(task);
  },

  async updateTask(
    taskId: string,
    updates: {
      name?: string;
      iconEmoji?: string;
      estimatedMinutes?: number;
      hasSensoryIssues?: boolean;
      sensoryCategory?: Task['sensory_category'];
      photoLocalUri?: string | null;
      description?: string | null;
      videoLocalUri?: string | null;
      routinesConfig?: RoutinesConfig;
      steps?: TaskStep[] | null;
    }
  ): Promise<Task> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.iconEmoji !== undefined) payload.icon_emoji = updates.iconEmoji;
    if (updates.estimatedMinutes !== undefined) payload.estimated_minutes = updates.estimatedMinutes;
    if (updates.hasSensoryIssues !== undefined) payload.has_sensory_issues = updates.hasSensoryIssues;
    if ('sensoryCategory' in updates) payload.sensory_category = updates.sensoryCategory ?? null;
    if ('description' in updates) payload.description = updates.description ?? null;
    if ('steps' in updates) payload.steps = updates.steps ?? null;
    if (updates.routinesConfig !== undefined) payload.routines_config = updates.routinesConfig;

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    let task = data as Task;

    if (updates.photoLocalUri === null) {
      await taskService.updateTaskPhoto(taskId, null);
      task = { ...task, photo_url: null };
    } else if (updates.photoLocalUri) {
      const url = await taskService.uploadTaskPhoto(taskId, updates.photoLocalUri);
      await taskService.updateTaskPhoto(taskId, url);
      task = { ...task, photo_url: url };
    }

    if (updates.videoLocalUri === null) {
      await taskService.updateTaskVideo(taskId, null);
      task = { ...task, video_url: null };
    } else if (updates.videoLocalUri) {
      const url = await taskService.uploadTaskVideo(taskId, updates.videoLocalUri);
      await taskService.updateTaskVideo(taskId, url);
      task = { ...task, video_url: url };
    }

    return hydrateTaskMedia(task);
  },

  async recordSkip(
    childId: string,
    routineId: string,
    taskId: string,
    reason: 'skip_now' | 'try_later'
  ): Promise<void> {
    const { error } = await supabase.from('task_skips').insert({
      child_id: childId,
      routine_id: routineId,
      task_id: taskId,
      reason,
    });
    if (error) throw error;
  },

  async updateTaskOrder(tasks: { id: string; order_index: number }[]): Promise<void> {
    const updates = tasks.map((t) =>
      supabase.from('tasks').update({ order_index: t.order_index }).eq('id', t.id)
    );
    await Promise.all(updates);
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
  },

  async recordCompletion(
    childId: string,
    routineId: string,
    taskId: string,
    tookMinutes?: number,
    note?: string
  ): Promise<void> {
    const { error } = await supabase.from('task_progress').insert({
      child_id: childId,
      routine_id: routineId,
      task_id: taskId,
      took_minutes: tookMinutes ?? null,
      note: note ?? null,
    });
    if (error) throw error;
  },

  async getCompletedTaskIdsToday(childId: string, routineId: string): Promise<string[]> {
    const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const { data } = await supabase
      .from('task_progress')
      .select('task_id')
      .eq('child_id', childId)
      .eq('routine_id', routineId)
      .gte('completed_at', todayStart)
      .not('task_id', 'is', null);
    return (data ?? []).map((r: { task_id: string }) => r.task_id);
  },
};

export const progressService = {
  async getChildProgress(childId: string, limitDays = 7) {
    const since = new Date();
    since.setDate(since.getDate() - limitDays);

    const { data, error } = await supabase
      .from('task_progress')
      .select('*, tasks(name, icon_emoji), routines(name)')
      .eq('child_id', childId)
      .gte('completed_at', since.toISOString())
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as TaskProgressWithRelations[];
  },

  async getChildSkips(childId: string, limitDays = 7) {
    const since = new Date();
    since.setDate(since.getDate() - limitDays);
    const { data, error } = await supabase
      .from('task_skips')
      .select('*, tasks(name, icon_emoji), routines(name)')
      .eq('child_id', childId)
      .gte('skipped_at', since.toISOString())
      .order('skipped_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Array<{
      id: string;
      child_id: string;
      routine_id: string;
      task_id: string;
      reason: 'skip_now' | 'try_later';
      skipped_at: string;
      tasks: { name: string; icon_emoji: string } | null;
      routines: { name: string } | null;
    }>;
  },

  async saveProgressNote(progressId: string, note: string): Promise<void> {
    const { error } = await supabase
      .from('task_progress')
      .update({ note: note.trim() || null })
      .eq('id', progressId);
    if (error) throw error;
  },

  async saveSkipNote(skipId: string, note: string): Promise<void> {
    const { error } = await supabase
      .from('task_skips')
      .update({ note: note.trim() || null })
      .eq('id', skipId);
    if (error) throw error;
  },

  async getRoutineCompletionCount(childId: string, routineId: string): Promise<number> {
    const { count, error } = await supabase
      .from('task_progress')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('routine_id', routineId);

    if (error) throw error;
    return count ?? 0;
  },
};
