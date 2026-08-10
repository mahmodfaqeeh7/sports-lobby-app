import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text} from 'react-native';
import {colors, radii, spacing, typography} from '../../theme/tokens';

type Segment = {
  key: string;
  label: string;
};

type SegmentTabsProps = {
  items: Segment[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentTabs({items, value, onChange}: SegmentTabsProps): React.JSX.Element {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map(item => {
        const selected = item.key === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{selected}}
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[styles.item, selected && styles.selected]}>
            <Text style={[styles.label, selected && styles.selectedLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
  },
  item: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  label: {
    ...typography.button,
    color: colors.muted,
  },
  selectedLabel: {
    color: colors.surface,
  },
});
