import { extractStoragePath, toStorageRef } from '../utils/storageMedia';

describe('storageMedia utils', () => {
  it('toStorageRef cria referencia storage:// normalizada', () => {
    expect(toStorageRef('task-photos', '/abc/def.jpg')).toBe('storage://task-photos/abc/def.jpg');
  });

  it('extractStoragePath le referencia storage://', () => {
    const value = 'storage://task-photos/abc/def.jpg';
    expect(extractStoragePath(value, 'task-photos')).toBe('abc/def.jpg');
  });

  it('extractStoragePath le URL publica legada do Supabase', () => {
    const value =
      'https://project.supabase.co/storage/v1/object/public/task-photos/abc%2Fdef.jpg';
    expect(extractStoragePath(value, 'task-photos')).toBe('abc/def.jpg');
  });

  it('extractStoragePath le URL signed do Supabase', () => {
    const value =
      'https://project.supabase.co/storage/v1/object/sign/task-videos/video-1.mp4?token=123';
    expect(extractStoragePath(value, 'task-videos')).toBe('video-1.mp4');
  });

  it('extractStoragePath preserva URL externa (retorna null)', () => {
    const value = 'https://youtube.com/watch?v=abc';
    expect(extractStoragePath(value, 'task-videos')).toBeNull();
  });

  it('extractStoragePath aceita plain path legado', () => {
    expect(extractStoragePath('task-uuid.jpg', 'task-photos')).toBe('task-uuid.jpg');
  });
});

