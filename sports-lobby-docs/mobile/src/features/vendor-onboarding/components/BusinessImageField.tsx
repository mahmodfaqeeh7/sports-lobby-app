import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import CheckCircle from 'lucide-react-native/icons/circle-check';
import Image from 'lucide-react-native/icons/image';
import Trash2 from 'lucide-react-native/icons/trash-2';
import {AppButton} from '../../../components';
import {colors, radii, spacing, typography} from '../../../theme/tokens';
import {formatDocumentSize, SelectedVerificationDocument} from '../documentUpload';

type Props = {
  label: string;
  help: string;
  document?: SelectedVerificationDocument;
  busy?: boolean;
  errorText?: string;
  onPick: () => void;
  onRemove: () => void;
};

export function BusinessImageField({label, help, document, busy, errorText, onPick, onRemove}: Props): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Image color={colors.brand} size={25} strokeWidth={1.8} />
        <View style={styles.copy}><Text style={styles.title}>{label}</Text><Text style={styles.help}>{help}</Text></View>
      </View>
      {document ? (
        <View style={styles.file}>
          <CheckCircle color={colors.brand} size={22} />
          <View style={styles.copy}><Text style={styles.fileName} numberOfLines={1}>{document.name}</Text><Text style={styles.help}>{formatDocumentSize(document.sizeBytes)}</Text></View>
          <AppButton label="Replace" onPress={onPick} disabled={busy} variant="secondary" />
          <AppButton label="Remove" onPress={onRemove} disabled={busy} variant="ghost" icon={<Trash2 color={colors.danger} size={18} />} />
        </View>
      ) : (
        <AppButton label={`Choose ${label.toLowerCase()}`} onPress={onPick} disabled={busy} loading={busy} variant="brandOutline" />
      )}
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg},
  heading: {alignItems: 'center', flexDirection: 'row', gap: spacing.md},
  copy: {flex: 1, gap: spacing.xs},
  title: {...typography.button, color: colors.text},
  help: {...typography.caption, color: colors.muted},
  file: {alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  fileName: {...typography.button, color: colors.text},
  error: {...typography.caption, color: colors.danger},
});
