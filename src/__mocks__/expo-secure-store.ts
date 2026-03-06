const secureStore: Record<string, string> = {};

const SecureStore = {
  getItemAsync: jest.fn(async (key: string) => secureStore[key] ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    secureStore[key] = value;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    delete secureStore[key];
  }),
};

export default SecureStore;
export const getItemAsync = SecureStore.getItemAsync;
export const setItemAsync = SecureStore.setItemAsync;
export const deleteItemAsync = SecureStore.deleteItemAsync;

