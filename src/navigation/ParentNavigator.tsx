import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ParentTabNavigator } from './ParentTabNavigator';
import { CreateChildScreen } from '../screens/parent/CreateChildScreen';
import { EditChildScreen } from '../screens/parent/EditChildScreen';
import { ManageRoutinesScreen } from '../screens/parent/ManageRoutinesScreen';
import { AddTaskScreen } from '../screens/parent/AddTaskScreen';
import { StrategiesScreen } from '../screens/parent/StrategiesScreen';
import { EditProfileScreen } from '../screens/parent/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/parent/ChangePasswordScreen';
import { SuggestionsScreen } from '../screens/parent/SuggestionsScreen';
import { AboutScreen } from '../screens/parent/AboutScreen';
import { TermsScreen } from '../screens/parent/TermsScreen';
import { PrivacyPolicyScreen } from '../screens/parent/PrivacyPolicyScreen';
import { ProgressScreen } from '../screens/parent/ProgressScreen';
import { ThemePickerScreen } from '../screens/parent/ThemePickerScreen';
import { ChildLoginScreen } from '../screens/parent/ChildLoginScreen';
import { OnboardingScreen } from '../screens/parent/OnboardingScreen';
import { RewardsScreen } from '../screens/parent/RewardsScreen';
import { RoutineTemplatesScreen } from '../screens/parent/RoutineTemplatesScreen';
import { useAuthStore } from '../stores/authStore';
import type { ParentStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<ParentStackParamList>();

export const ParentNavigator: React.FC = () => {
  const showOnboarding = useAuthStore((s) => s.showOnboarding);

  return (
    <Stack.Navigator
      initialRouteName={showOnboarding ? 'Onboarding' : 'ParentTabs'}
      screenOptions={{ headerShown: false }}
    >
      {/* Onboarding — shown once on first launch */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

      {/* Tab navigator is the root — tab bar always visible here */}
      <Stack.Screen name="ParentTabs" component={ParentTabNavigator} />

      {/* Sub-screens pushed above tabs — tab bar disappears */}
      <Stack.Screen name="CreateChild" component={CreateChildScreen} />
      <Stack.Screen name="EditChild" component={EditChildScreen} />
      <Stack.Screen name="ManageRoutines" component={ManageRoutinesScreen} />
      <Stack.Screen name="AddTask" component={AddTaskScreen} />
      <Stack.Screen name="Strategies" component={StrategiesScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Suggestions" component={SuggestionsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="Progress" component={ProgressScreen} />
      <Stack.Screen name="ThemePicker" component={ThemePickerScreen} />
      <Stack.Screen name="ChildLogin" component={ChildLoginScreen} />
      <Stack.Screen name="Rewards" component={RewardsScreen} />
      <Stack.Screen name="RoutineTemplates" component={RoutineTemplatesScreen} />
    </Stack.Navigator>
  );
};
