import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {Camera, ImagePlus, Trash2} from 'lucide-react-native';
import {colors, radii, spacing, typography} from '../../../theme/tokens';
import {SelectedCourtImage} from '../courtImage';

type CourtImageFieldProps = {
  value?: SelectedCourtImage;
  disabled?: boolean;
  progress?: number;
  onPick: () => void;
  onRemove: () => void;
};

export function CourtImageField({
  value,
  disabled,
  progress = 0,
  onPick,
  onRemove,
}: CourtImageFieldProps): React.JSX.Element {
  return (
    <View style={styles.field}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Camera color={colors.brand} size={20} />
          <Text style={styles.label}>Court photo</Text>
        </View>
        <Text style={styles.help}>Show players the actual court they will reserve.</Text>
      </View>
      {value ? (
        <View style={styles.previewWrap}>
          <Image source={{uri: value.uri}} style={styles.preview} resizeMode="cover" />
          <View style={styles.previewFooter}>
            <Text style={styles.fileName} numberOfLines={1}>{value.name}</Text>
            <Pressable
              accessibilityLabel="Remove court image"
              accessibilityRole="button"
              disabled={disabled}
              onPress={onRemove}
              hitSlop={8}>
              <Trash2 color={colors.danger} size={20} />
            </Pressable>
          </View>
          {progress > 0 && progress < 1 ? (
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, {width: `${Math.round(progress * 100)}%`}]} />
            </View>
          ) : null}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onPick}
          style={({pressed}) => [styles.picker, pressed && styles.pressed, disabled && styles.disabled]}>
          <ImagePlus color={colors.brand} size={26} />
          <Text style={styles.pickerTitle}>Choose court photo</Text>
          <Text style={styles.help}>JPEG or PNG, up to 5 MB</Text>
        </Pressable>
      )}
      {value ? (
        <Pressable disabled={disabled} onPress={onPick} style={styles.replace}>
          <Text style={styles.replaceText}>Replace photo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {gap: spacing.sm},
  header: {gap: spacing.xs},
  titleRow: {alignItems: 'center', flexDirection: 'row', gap: spacing.sm},
  label: {...typography.button, color: colors.text},
  help: {...typography.caption, color: colors.muted},
  picker: {
    alignItems: 'center',
    backgroundColor: colors.brandSoft,
    borderColor: colors.brandBorder,
    borderRadius: radii.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 142,
    padding: spacing.lg,
  },
  pickerTitle: {...typography.button, color: colors.brand},
  previewWrap: {borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, overflow: 'hidden'},
  preview: {aspectRatio: 16 / 9, width: '100%'},
  previewFooter: {alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.md},
  fileName: {...typography.caption, color: colors.text, flex: 1},
  progressTrack: {backgroundColor: colors.brandSoft, height: 4},
  progressBar: {backgroundColor: colors.brand, height: 4},
  replace: {alignSelf: 'flex-start', paddingVertical: spacing.xs},
  replaceText: {...typography.button, color: colors.brand},
  pressed: {opacity: 0.72},
  disabled: {opacity: 0.45},
});
