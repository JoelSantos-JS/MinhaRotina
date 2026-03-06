import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlueyButton } from '../../components/ui/BlueyButton';
import { BlueyColors, BlueyGradients } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { suggestionService } from '../../services/suggestion.service';
import type { ParentScreenProps } from '../../types/navigation';

const CATEGORY_OPTIONS = [
  'Nova funcionalidade',
  'Melhoria em tela existente',
  'Bug ou comportamento estranho',
  'Outro',
] as const;

type CategoryOption = typeof CATEGORY_OPTIONS[number];

export const SuggestionsScreen: React.FC<ParentScreenProps<'Suggestions'>> = ({ navigation }) => {
  const [category, setCategory] = useState<CategoryOption>('Nova funcionalidade');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    setError('');
    setLoading(true);

    try {
      await suggestionService.submitSuggestion({
        category,
        title,
        message,
      });

      setTitle('');
      setMessage('');
      setCategory('Nova funcionalidade');

      Alert.alert(
        'Sugestão enviada',
        'Obrigado! Sua ideia foi enviada para nossa equipe de produto.'
      );
    } catch (err: any) {
      setError(err?.message || 'Não foi possível enviar sua sugestão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={BlueyGradients.blueVertical} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>{'< Voltar'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sugestões e melhorias</Text>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.title}>Ajude a evoluir o app</Text>
              <Text style={styles.subtitle}>
                Envie ideias de melhorias e novas funcionalidades. Sua mensagem vai direto para nosso
                canal interno.
              </Text>

              <Text style={styles.label}>Categoria</Text>
              <View style={styles.chipWrap}>
                {CATEGORY_OPTIONS.map((option) => {
                  const active = option === category;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[styles.chip, active ? styles.chipActive : null]}
                      onPress={() => setCategory(option)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Título</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Melhorar tela de tarefas"
                placeholderTextColor={BlueyColors.textPlaceholder}
                style={styles.input}
                maxLength={120}
              />

              <Text style={styles.label}>Sua sugestão</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Descreva com detalhes sua ideia e o beneficio para as familias."
                placeholderTextColor={BlueyColors.textPlaceholder}
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
                maxLength={2000}
              />

              <Text style={styles.counter}>{message.trim().length}/2000</Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <BlueyButton
                title="Enviar sugestão"
                onPress={handleSend}
                loading={loading}
                disabled={loading}
                style={styles.sendBtn}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  gradient: { flex: 1 },
  kav: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  backText: {
    ...Typography.titleMedium,
    color: BlueyColors.textSecondary,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: BlueyColors.textPrimary,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BlueyColors.borderLight,
    padding: 18,
  },
  title: {
    ...Typography.titleLarge,
    color: BlueyColors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 20,
  },
  label: {
    ...Typography.titleMedium,
    color: BlueyColors.textPrimary,
    marginBottom: 8,
    marginTop: 6,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BlueyColors.borderMedium,
    backgroundColor: BlueyColors.backgroundMain,
  },
  chipActive: {
    borderColor: BlueyColors.blueyMain,
    backgroundColor: BlueyColors.backgroundBlue,
  },
  chipText: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
  },
  chipTextActive: {
    color: BlueyColors.blueyDark,
  },
  input: {
    borderWidth: 2,
    borderColor: BlueyColors.borderMedium,
    borderRadius: 14,
    backgroundColor: BlueyColors.backgroundMain,
    color: BlueyColors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...Typography.bodyMedium,
  },
  textArea: {
    minHeight: 150,
  },
  counter: {
    ...Typography.bodySmall,
    color: BlueyColors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 4,
  },
  error: {
    ...Typography.bodySmall,
    color: BlueyColors.errorRed,
    marginBottom: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sendBtn: {
    marginTop: 8,
  },
});

