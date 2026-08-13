import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

export type MultiSelectOption = {
  key: string;
  label: string;
};

type MultiSelectChipsProps = {
  label: string;
  options: MultiSelectOption[];
  selectedKeys: string[];
  onChange: (selectedKeys: string[]) => void;
  emptyText?: string;
  errorText?: string;
  onBlur?: () => void;
};

export function MultiSelectChips({
  label,
  options,
  selectedKeys,
  onChange,
  emptyText = 'No options available',
  errorText,
  onBlur,
}: MultiSelectChipsProps): React.JSX.Element {
  const selected = new Set(selectedKeys);

  const toggle = (key: string) => {
    if (selected.has(key)) {
      onChange(selectedKeys.filter(selectedKey => selectedKey !== key));
      return;
    }
    onChange([...selectedKeys, key]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {options.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : null}
      <View style={styles.chips}>
        {options.map(option => {
          const isSelected = selected.has(option.key);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              key={option.key}
              onPress={() => {
                toggle(option.key);
                onBlur?.();
              }}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.selectedChip,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[styles.chipText, isSelected && styles.selectedChipText]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
  },
  empty: {
    ...typography.caption,
    color: colors.subtle,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedChip: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
  chipText: {
    ...typography.button,
    color: colors.muted,
  },
  selectedChipText: {
    color: colors.surface,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
