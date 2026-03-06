import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlueyColors } from '../../theme/colors';
import { FAB_ACTIONS } from '../../utils/fabActions';
import type { ParentStackParamList, ParentTabParamList } from '../../types/navigation';

// Tab bar height defined in ParentTabNavigator
const TAB_BAR_BASE = 58;

type Nav = NativeStackNavigationProp<ParentStackParamList>;

export const ParentFAB: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    Animated.spring(anim, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [open, anim]);

  const handleAction = useCallback(
    (tab: keyof ParentTabParamList) => {
      setOpen(false);
      Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      navigation.navigate('ParentTabs', { screen: tab });
    },
    [anim, navigation],
  );

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const actionsOpacity = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  const actionsTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const bottomOffset = TAB_BAR_BASE + insets.bottom + 16;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay — fecha o menu ao tocar fora */}
      {open && (
        <Pressable style={StyleSheet.absoluteFill} onPress={toggle} />
      )}

      {/* FAB + ações */}
      <View
        style={[styles.wrapper, { bottom: bottomOffset }]}
        pointerEvents="box-none"
      >
        {/* Lista de ações (acima do botão) */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: actionsOpacity,
              transform: [{ translateY: actionsTranslateY }],
            },
          ]}
          pointerEvents={open ? 'auto' : 'none'}
        >
          {FAB_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionRow}
              onPress={() => handleAction(action.tab)}
              activeOpacity={0.8}
            >
              <View style={styles.actionLabel}>
                <Text style={styles.actionLabelText}>{action.label}</Text>
              </View>
              <View style={styles.actionBtn}>
                <Text style={styles.actionBtnEmoji}>{action.emoji}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Botão principal ⚡ */}
        <TouchableOpacity
          style={[styles.fab, open && styles.fabOpen]}
          onPress={toggle}
          activeOpacity={0.85}
        >
          <Animated.Text style={[styles.fabEmoji, { transform: [{ rotate }] }]}>
            {'⚡'}
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
  },
  actionsContainer: {
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionLabel: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BlueyColors.borderMedium,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabelText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: BlueyColors.textPrimary,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  actionBtnEmoji: { fontSize: 20 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BlueyColors.blueyMain,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  fabOpen: {
    backgroundColor: BlueyColors.blueyDark,
  },
  fabEmoji: { fontSize: 24 },
});
