import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, radii, spacing, typography} from '../../theme/tokens';

type NoticeProps = {
  title?: string;
  message?: string;
  tone?: 'info' | 'success' | 'error' | 'warning';
  onDismiss?: () => void;
};

export function Notice({title, message, tone = 'info', onDismiss}: NoticeProps): React.JSX.Element | null {
  if (!title && !message) {
    return null;
  }

  return (
    <View style={[styles.notice, styles[tone]]}>
      <View style={styles.row}>
        <View style={styles.copy}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
        {onDismiss ? (
          <Pressable accessibilityRole="button" onPress={onDismiss} style={styles.close}>
            <Text style={styles.closeText}>x</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  info: {
    backgroundColor: '#EEF2F7',
    borderColor: colors.border,
  },
  success: {
    backgroundColor: '#ECFDF3',
    borderColor: colors.accent,
  },
  error: {
    backgroundColor: '#FFF1F0',
    borderColor: colors.danger,
  },
  warning: {
    backgroundColor: '#FFF7E6',
    borderColor: '#D97706',
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.button,
    color: colors.text,
  },
  message: {
    ...typography.caption,
    color: colors.muted,
  },
  close: {
    alignItems: 'center',
    borderRadius: radii.sm,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  closeText: {
    ...typography.button,
    color: colors.muted,
  },
});
