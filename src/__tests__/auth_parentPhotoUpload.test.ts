import { authService } from '../services/auth.service';
import { compressAvatar, base64ToUint8Array } from '../utils/imageUtils';

const PARENT_ID = 'parent-uuid-123';
const LOCAL_URI = 'file:///data/user/0/com.minhar/cache/avatar.jpg';
const B64 = 'aGVsbG8=';
const BYTES = new Uint8Array([104, 101, 108, 108, 111]);
const SIGNED_URL =
  'https://odgiljvvmglmmncbbupl.supabase.co/storage/v1/object/sign/parent-photos/parent-uuid-123.jpg?token=abc';

const mockStorageUpload = jest.fn();
const mockStorageCreateSignedUrl = jest.fn();
const mockRpc = jest.fn();
const mockSignOut = jest.fn();
const mockStorageBucket = {
  upload: mockStorageUpload,
  createSignedUrl: mockStorageCreateSignedUrl,
};
const mockStorageFrom = jest.fn().mockReturnValue(mockStorageBucket);

jest.mock('../config/supabase', () => ({
  supabase: {
    storage: {
      from: (...a: any[]) => mockStorageFrom(...a),
    },
    rpc: (...a: any[]) => mockRpc(...a),
    auth: {
      signOut: (...a: any[]) => mockSignOut(...a),
    },
  },
}));

jest.mock('../utils/imageUtils', () => ({
  compressAvatar: jest.fn(),
  base64ToUint8Array: jest.fn(),
}));

const mockCompressAvatar = compressAvatar as jest.MockedFunction<typeof compressAvatar>;
const mockBase64ToUint8Array = base64ToUint8Array as jest.MockedFunction<
  typeof base64ToUint8Array
>;

beforeEach(() => {
  jest.clearAllMocks();
  mockCompressAvatar.mockResolvedValue({ uri: LOCAL_URI, base64: B64 });
  mockBase64ToUint8Array.mockReturnValue(BYTES);
  mockStorageUpload.mockResolvedValue({ error: null });
  mockStorageCreateSignedUrl.mockResolvedValue({ data: { signedUrl: SIGNED_URL }, error: null });
  mockRpc.mockResolvedValue({ error: null });
  mockSignOut.mockResolvedValue({});
});

describe('authService.uploadParentPhoto', () => {
  it('faz upload para o bucket parent-photos com path {parentId}.jpg', async () => {
    await authService.uploadParentPhoto(PARENT_ID, LOCAL_URI);

    expect(mockStorageFrom).toHaveBeenCalledWith('parent-photos');
    expect(mockStorageUpload).toHaveBeenCalledWith(`${PARENT_ID}.jpg`, BYTES, {
      contentType: 'image/jpeg',
      upsert: true,
    });
  });

  it('retorna a url publica do arquivo enviado', async () => {
    const url = await authService.uploadParentPhoto(PARENT_ID, LOCAL_URI);
    expect(url).toBe(SIGNED_URL);
  });

  it('converte erro de RLS em mensagem acionavel', async () => {
    mockStorageUpload.mockResolvedValueOnce({
      error: { message: 'new row violates row-level security policy' },
    });

    await expect(authService.uploadParentPhoto(PARENT_ID, LOCAL_URI)).rejects.toThrow(
      'Falha de permissao no Storage'
    );
  });

  it('converte erro de bucket ausente em mensagem acionavel', async () => {
    mockStorageUpload.mockResolvedValueOnce({
      error: { message: 'Bucket not found' },
    });

    await expect(authService.uploadParentPhoto(PARENT_ID, LOCAL_URI)).rejects.toThrow(
      'Bucket "parent-photos" nao encontrado'
    );
  });
});

describe('authService.deleteMyAccount', () => {
  it('chama RPC delete_my_account e limpa sessao local', async () => {
    await authService.deleteMyAccount();

    expect(mockRpc).toHaveBeenCalledWith('delete_my_account');
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('converte erro de RPC ausente em mensagem acionavel', async () => {
    mockRpc.mockResolvedValueOnce({
      error: { message: 'function delete_my_account() does not exist' },
    });

    await expect(authService.deleteMyAccount()).rejects.toThrow(
      'Exclusao de conta nao habilitada no banco'
    );
    expect(mockSignOut).toHaveBeenCalled();
  });
});
