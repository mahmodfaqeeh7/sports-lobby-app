import React, { useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type OtpCodeInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  errorText?: string;
  length?: number;
  autoFocus?: boolean;
};

export function OtpCodeInput({
  value,
  onChangeText,
  onBlur,
  errorText,
  length = 6,
  autoFocus = true,
}: OtpCodeInputProps): React.JSX.Element {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const normalizedValue = digitsOnly(value).slice(0, length);
  const activeIndex = Math.min(normalizedValue.length, length - 1);

  const focusInput = () => inputRef.current?.focus();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Verification code</Text>
      <Pressable
        accessibilityLabel="Verification code"
        accessibilityHint={`Enter the ${length}-digit code sent to your phone`}
        accessibilityRole="none"
        onPress={focusInput}
        style={styles.codeRow}
      >
        {Array.from({ length }, (_, index) => {
          const digit = normalizedValue[index] ?? '';
          const active = focused && index === activeIndex;

          return (
            <View
              key={index}
              testID={`otp-digit-${index}`}
              style={[
                styles.digitBox,
                active && styles.digitBoxActive,
                errorText && styles.digitBoxError,
              ]}
            >
              <Text style={styles.digit}>{digit}</Text>
              {active && !digit ? <View style={styles.cursor} /> : null}
            </View>
          );
        })}
        <TextInput
          ref={inputRef}
          autoComplete="sms-otp"
          autoFocus={autoFocus}
          caretHidden
          contextMenuHidden={false}
          keyboardType="number-pad"
          maxLength={length}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onChangeText={nextValue =>
            onChangeText(digitsOnly(nextValue).slice(0, length))
          }
          onFocus={() => setFocused(true)}
          onKeyPress={(
            event: NativeSyntheticEvent<TextInputKeyPressEventData>,
          ) => {
            if (event.nativeEvent.key === 'Backspace' && !normalizedValue) {
              onChangeText('');
            }
          }}
          style={styles.hiddenInput}
          textContentType="oneTimeCode"
          value={normalizedValue}
        />
      </Pressable>
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.text,
  },
  codeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    position: 'relative',
  },
  digitBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    height: 58,
    justifyContent: 'center',
    minWidth: 0,
  },
  digitBoxActive: {
    borderColor: colors.brand,
    borderWidth: 1.5,
  },
  digitBoxError: {
    borderColor: colors.danger,
  },
  digit: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
  },
  cursor: {
    backgroundColor: colors.text,
    height: 26,
    width: 1.5,
  },
  hiddenInput: {
    height: 1,
    opacity: 0,
    position: 'absolute',
    width: 1,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
