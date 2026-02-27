import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Auth Stack
export type AuthStackParamList = {
  LoginParent: undefined;
  LoginChild: undefined;
};

// Parent Tab Navigator (bottom tabs)
export type ParentTabParamList = {
  Resumo: undefined;
  Filhos: undefined;
  Diario: undefined;
  Biblioteca: undefined;
  Ajustes: undefined;
  Ajuda: undefined;
};

// Parent Stack (wraps tabs + pushes modal screens above tabs)
export type ParentStackParamList = {
  ParentTabs: undefined;
  // kept for type compat with existing screens
  Dashboard: undefined;
  Settings: undefined;
  // sub-screens pushed above tabs (tab bar hidden)
  CreateChild: undefined;
  EditChild: { childId: string };
  ManageRoutines: { childId: string };
  AddTask: { routineId: string; childId: string };
  Strategies: { category?: string } | undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  About: undefined;
  Terms: undefined;
  Progress: { childId: string };
  ThemePicker: { childId: string };
  ChildLogin: { childId: string };
};

// Child Stack
export type ChildStackParamList = {
  ChildHome: { childId: string };
  CurrentTask: { childId: string; routineId: string };
  Celebration: { childId: string; routineName: string };
};

// Root Navigator
export type RootStackParamList = {
  Auth: undefined;
  Parent: undefined;
  Child: undefined;
};

// Screen props helpers
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type ParentScreenProps<T extends keyof ParentStackParamList> =
  NativeStackScreenProps<ParentStackParamList, T>;

export type ChildScreenProps<T extends keyof ChildStackParamList> =
  NativeStackScreenProps<ChildStackParamList, T>;
