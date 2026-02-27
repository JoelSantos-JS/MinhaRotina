import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChildHomeScreen } from '../screens/child/ChildHomeScreen';
import { CurrentTaskScreen } from '../screens/child/CurrentTaskScreen';
import { CelebrationScreen } from '../screens/child/CelebrationScreen';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import type { ChildStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<ChildStackParamList>();

export const ChildNavigator: React.FC = () => {
  const child = useAuthStore((s) => s.child);
  const { loadThemeForChild, resetToDefault } = useThemeStore();

  useEffect(() => {
    if (child?.id) {
      loadThemeForChild(child.id);
    }
    return () => {
      resetToDefault();
    };
  }, [child?.id]);

  if (!child) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ChildHome"
        component={ChildHomeScreen}
        initialParams={{ childId: child.id }}
      />
      <Stack.Screen name="CurrentTask" component={CurrentTaskScreen} />
      <Stack.Screen name="Celebration" component={CelebrationScreen} />
    </Stack.Navigator>
  );
};
