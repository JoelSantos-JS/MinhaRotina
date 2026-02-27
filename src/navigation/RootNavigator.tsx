import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from '../config/supabase';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AuthNavigator } from './AuthNavigator';
import { ParentNavigator } from './ParentNavigator';
import { ChildNavigator } from './ChildNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { parent, child, isLoading, setParent, setLoading } = useAuthStore();

  useEffect(() => {
    // Check existing session on app start
    const checkSession = async () => {
      try {
        const session = await authService.getSession();
        if (session) {
          const parentData = await authService.getCurrentParent();
          if (parentData) setParent(parentData);
        }
      } catch {
        // Erro de rede ou Supabase — continua para a tela de login
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        useAuthStore.getState().logout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Carregando Minha Rotina..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {child ? (
          <Stack.Screen name="Child" component={ChildNavigator} />
        ) : parent ? (
          <Stack.Screen name="Parent" component={ParentNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
