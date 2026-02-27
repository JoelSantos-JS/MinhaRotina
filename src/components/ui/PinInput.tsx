import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Dimensions } from 'react-native';
import { BlueyColors } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive: cabe em qualquer tela. Assumindo padding horizontal de ~32px
// em cada lado no pai, sobram (SCREEN_WIDTH - 64) px de largura.
// 4 boxes + 3 gaps de 14 = fit garantido.
const PIN_BOX_SIZE = Math.min(80, Math.floor((SCREEN_WIDTH - 64 - 42) / 4));
const PIN_BOX_HEIGHT = Math.max(64, Math.floor(PIN_BOX_SIZE * 1.1));
const PIN_FONT_SIZE = Math.max(28, Math.floor(PIN_BOX_SIZE * 0.55));

interface PinInputProps {
  onComplete: (pin: string) => void;
  onPinChange?: (pin: string) => void;
  error?: boolean;
}

export const PinInput: React.FC<PinInputProps> = ({ onComplete, onPinChange, error }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    if (text && !/^\d+$/.test(text)) return;

    const newPin = [...pin];
    newPin[index] = text.slice(-1);
    setPin(newPin);

    const fullPin = newPin.join('');
    onPinChange?.(fullPin);

    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (fullPin.length === 4 && newPin.every((d) => d !== '')) {
      onComplete(fullPin);
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {pin.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputRefs.current[index] = ref; }}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          style={[
            styles.input,
            digit ? styles.inputFilled : null,
            error ? styles.inputError : null,
          ]}
          autoFocus={index === 0}
          caretHidden
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  input: {
    width: PIN_BOX_SIZE,
    height: PIN_BOX_HEIGHT,
    borderWidth: 3,
    borderColor: BlueyColors.borderActive,
    borderRadius: 16,
    backgroundColor: BlueyColors.backgroundBlue,
    fontSize: PIN_FONT_SIZE,
    fontFamily: 'Nunito_900Black',
    color: BlueyColors.textPrimary,
    textAlign: 'center',
  },
  inputFilled: {
    backgroundColor: BlueyColors.blueyMain,
    borderColor: BlueyColors.blueyDark,
    color: '#fff',
  },
  inputError: {
    borderColor: BlueyColors.errorRed,
    backgroundColor: '#FFEBEE',
  },
});
