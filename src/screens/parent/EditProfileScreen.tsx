import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { BlueyButton } from '../../components/ui/BlueyButton';
import { BlueyInput } from '../../components/ui/BlueyInput';
import { supabase } from '../../config/supabase';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import type { ParentScreenProps } from '../../types/navigation';

export const EditProfileScreen: React.FC<ParentScreenProps<'EditProfile'>> = ({ navigation }) => {
  const parent = useAuthStore((s) => s.parent);
  const setParent = useAuthStore((s) => s.setParent);

  const [name, setName] = useState(parent?.name ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(parent?.photo_url ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const photoChanged = photoUri !== (parent?.photo_url ?? null);
  const hasChanges = name.trim() !== parent?.name || photoChanged;

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const showPhotoPicker = () => {
    Alert.alert('Foto de perfil', 'Escolha uma opção', [
      { text: 'Câmera', onPress: pickFromCamera },
      { text: 'Galeria', onPress: pickFromGallery },
      ...(photoUri ? [{ text: 'Remover foto', style: 'destructive' as const, onPress: () => setPhotoUri(null) }] : []),
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Digite seu nome.'); return; }
    setError('');
    setLoading(true);
    try {
      let newPhotoUrl = parent?.photo_url ?? null;

      // Handle photo changes
      if (photoChanged) {
        if (photoUri === null) {
          // Remove photo
          await authService.updateParentPhotoUrl(parent!.id, null);
          newPhotoUrl = null;
        } else {
          // Upload new photo
          newPhotoUrl = await authService.uploadParentPhoto(parent!.id, photoUri);
          await authService.updateParentPhotoUrl(parent!.id, newPhotoUrl);
        }
      }

      // Update name if changed
      if (name.trim() !== parent?.name) {
        const { error: dbError } = await supabase
          .from('parent_accounts')
          .update({ name: name.trim() })
          .eq('id', parent!.id);
        if (dbError) throw dbError;
      }

      setParent({ ...parent!, name: name.trim(), photo_url: newPhotoUrl });
      Alert.alert('✅ Salvo!', 'Seu perfil foi atualizado.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{ width: 60 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={showPhotoPicker} style={styles.avatarPhotoWrap} activeOpacity={0.8}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarPhoto} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarEmoji}>👤</Text>
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Text style={styles.avatarEditBadgeText}>📷</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarName}>{parent?.name}</Text>
              <Text style={styles.avatarEmail}>{parent?.email}</Text>
              <Text style={styles.avatarPhotoHint}>Toque na foto para alterar</Text>
            </View>

            <View style={styles.card}>
              <BlueyInput
                label="Seu nome"
                value={name}
                onChangeText={setName}
                placeholder="Ex: Maria Silva"
                autoCapitalize="words"
              />

              <View style={styles.emailBox}>
                <Text style={styles.emailLabel}>Email</Text>
                <Text style={styles.emailValue}>{parent?.email}</Text>
                <Text style={styles.emailHint}>O email não pode ser alterado aqui.</Text>
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <BlueyButton
              title="✅ Salvar Alterações"
              onPress={handleSave}
              loading={loading}
              disabled={!name.trim() || !hasChanges}
              style={styles.btn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backText: { ...Typography.titleMedium, color: BlueyColors.blueyDark },
  headerTitle: { ...Typography.titleLarge, color: BlueyColors.textPrimary },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 28,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
  },
  avatarPhotoWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarPhoto: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: BlueyColors.blueyMain,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BlueyColors.backgroundBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: BlueyColors.borderMedium,
  },
  avatarEmoji: { fontSize: 52 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BlueyColors.blueyMain,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarEditBadgeText: { fontSize: 14 },
  avatarName: { ...Typography.titleLarge, color: BlueyColors.textPrimary, marginBottom: 4 },
  avatarEmail: { ...Typography.bodySmall, color: BlueyColors.textSecondary, marginBottom: 4 },
  avatarPhotoHint: { ...Typography.bodySmall, color: BlueyColors.textPlaceholder },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    padding: 20,
    marginBottom: 16,
  },
  emailBox: {
    backgroundColor: BlueyColors.backgroundBlue,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  emailLabel: { ...Typography.labelSmall, color: BlueyColors.textSecondary, marginBottom: 4 },
  emailValue: { ...Typography.bodyMedium, color: BlueyColors.textPrimary, marginBottom: 4 },
  emailHint: { ...Typography.bodySmall, color: BlueyColors.textPlaceholder },
  error: {
    ...Typography.bodySmall,
    color: BlueyColors.errorRed,
    textAlign: 'center',
    marginBottom: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 10,
  },
  btn: { marginTop: 8 },
});
