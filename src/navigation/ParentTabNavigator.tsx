import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/parent/DashboardScreen';
import { FilhosScreen } from '../screens/parent/FilhosScreen';
import { DiarioScreen } from '../screens/parent/DiarioScreen';
import { StrategiesScreen } from '../screens/parent/StrategiesScreen';
import { SettingsScreen } from '../screens/parent/SettingsScreen';
import { AjudaScreen } from '../screens/parent/AjudaScreen';
import { BlueyColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import type { ParentTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<ParentTabParamList>();

const TAB_ICONS: Record<keyof ParentTabParamList, string> = {
  Resumo: '🏠',
  Filhos: '👨‍👧‍👦',
  Diario: '📖',
  Biblioteca: '💡',
  Ajustes: '⚙️',
  Ajuda: '❓',
};

const TAB_LABELS: Record<keyof ParentTabParamList, string> = {
  Resumo: 'RESUMO',
  Filhos: 'FILHOS',
  Diario: 'DIÁRIO',
  Biblioteca: 'BIBLIOTECA',
  Ajustes: 'AJUSTES',
  Ajuda: 'AJUDA',
};

function TabIcon({
  name,
  focused,
}: {
  name: keyof ParentTabParamList;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={styles.iconEmoji}>{TAB_ICONS[name]}</Text>
    </View>
  );
}

export const ParentTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  // Height = content (icon + label) + top padding + bottom safe area
  const tabBarHeight = 58 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name as keyof ParentTabParamList} focused={focused} />
        ),
        tabBarLabel: ({ focused }) => (
          <Text
            style={[
              styles.tabLabel,
              focused ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
            numberOfLines={1}
          >
            {TAB_LABELS[route.name as keyof ParentTabParamList]}
          </Text>
        ),
        tabBarStyle: [styles.tabBar, { height: tabBarHeight, paddingBottom: insets.bottom + 6 }],
        tabBarItemStyle: styles.tabItem,
      })}
    >
      <Tab.Screen name="Resumo" component={DashboardScreen as React.ComponentType<any>} />
      <Tab.Screen name="Filhos" component={FilhosScreen} />
      <Tab.Screen name="Diario" component={DiarioScreen} />
      <Tab.Screen name="Biblioteca" component={StrategiesScreen as React.ComponentType<any>} />
      <Tab.Screen name="Ajustes" component={SettingsScreen as React.ComponentType<any>} />
      <Tab.Screen name="Ajuda" component={AjudaScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: BlueyColors.borderMedium,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    paddingTop: 0,
  },
  iconContainer: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: BlueyColors.backgroundBlue,
  },
  iconEmoji: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  tabLabelActive: {
    ...Typography.labelSmall,
    fontSize: 9,
    color: BlueyColors.blueyDark,
    fontWeight: '800',
  },
  tabLabelInactive: {
    ...Typography.labelSmall,
    fontSize: 9,
    color: BlueyColors.textSecondary,
    fontWeight: '600',
  },
});
