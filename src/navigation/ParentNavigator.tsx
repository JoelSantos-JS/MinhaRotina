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
import { AboutScreen } from '../screens/parent/AboutScreen';
import { TermsScreen } from '../screens/parent/TermsScreen';
import { ProgressScreen } from '../screens/parent/ProgressScreen';
import { ThemePickerScreen } from '../screens/parent/ThemePickerScreen';
import { ChildLoginScreen } from '../screens/parent/ChildLoginScreen';
import type { ParentStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<ParentStackParamList>();

export const ParentNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Progress" component={ProgressScreen} />
      <Stack.Screen name="ThemePicker" component={ThemePickerScreen} />
      <Stack.Screen name="ChildLogin" component={ChildLoginScreen} />
    </Stack.Navigator>
  );
};
