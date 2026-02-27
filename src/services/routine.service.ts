import { supabase } from '../config/supabase';
import type { Routine, Task, TaskProgress } from '../types/models';

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
};

export const taskService = {
  async getTasksByRoutine(routineId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('routine_id', routineId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Task[];
  },

  async uploadTaskPhoto(taskId: string, localUri: string): Promise<string> {
    const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${taskId}.${ext}`;
    const response = await fetch(localUri);
    const blob = await response.blob();
    const { error } = await supabase.storage
      .from('task-photos')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('task-photos').getPublicUrl(path);
    return data.publicUrl;
  },

  async updateTaskPhoto(taskId: string, photoUrl: string | null): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ photo_url: photoUrl })
      .eq('id', taskId);
    if (error) throw error;
  },

  async uploadTaskVideo(taskId: string, localUri: string): Promise<string> {
    const ext = localUri.split('.').pop()?.toLowerCase() || 'mp4';
    const path = `${taskId}.${ext}`;
    const response = await fetch(localUri);
    const blob = await response.blob();
    const { error } = await supabase.storage
      .from('task-videos')
      .upload(path, blob, { contentType: 'video/mp4', upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('task-videos').getPublicUrl(path);
    return data.publicUrl;
  },

  async updateTaskVideo(taskId: string, videoUrl: string | null): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ video_url: videoUrl })
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
      })
      .select()
      .single();

    if (error) throw error;
    let task = data as Task;

    if (options?.photoLocalUri) {
      try {
        const publicUrl = await taskService.uploadTaskPhoto(task.id, options.photoLocalUri);
        await taskService.updateTaskPhoto(task.id, publicUrl);
        task = { ...task, photo_url: publicUrl };
      } catch {
        // photo upload failed — task still created, just without photo
      }
    }

    if (options?.videoLocalUri) {
      try {
        const videoUrl = await taskService.uploadTaskVideo(task.id, options.videoLocalUri);
        await taskService.updateTaskVideo(task.id, videoUrl);
        task = { ...task, video_url: videoUrl };
      } catch {
        // video upload failed — task still created, just without video
      }
    }

    return task;
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
    }
  ): Promise<Task> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.iconEmoji !== undefined) payload.icon_emoji = updates.iconEmoji;
    if (updates.estimatedMinutes !== undefined) payload.estimated_minutes = updates.estimatedMinutes;
    if (updates.hasSensoryIssues !== undefined) payload.has_sensory_issues = updates.hasSensoryIssues;
    if ('sensoryCategory' in updates) payload.sensory_category = updates.sensoryCategory ?? null;
    if ('description' in updates) payload.description = updates.description ?? null;

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

    return task;
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
    tookMinutes?: number
  ): Promise<void> {
    const { error } = await supabase.from('task_progress').insert({
      child_id: childId,
      routine_id: routineId,
      task_id: taskId,
      took_minutes: tookMinutes ?? null,
    });
    if (error) throw error;
  },
};

export const progressService = {
  async getChildProgress(childId: string, limitDays = 7) {
    const since = new Date();
    since.setDate(since.getDate() - limitDays);

    const { data, error } = await supabase
      .from('task_progress')
      .select('*')
      .eq('child_id', childId)
      .gte('completed_at', since.toISOString())
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as TaskProgress[];
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
