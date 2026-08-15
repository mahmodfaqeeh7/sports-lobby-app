import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import CheckCircle from 'lucide-react-native/icons/circle-check';
import CircleX from 'lucide-react-native/icons/circle-x';
import FileText from 'lucide-react-native/icons/file-text';
import FileUp from 'lucide-react-native/icons/file-up';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import Trash2 from 'lucide-react-native/icons/trash-2';
import { AppButton } from '../../../components';
import { colors, radii, spacing, typography } from '../../../theme/tokens';
import {
  formatDocumentSize,
  SelectedVerificationDocument,
} from '../documentUpload';

export type VerificationDocumentStatus =
  'idle' | 'selecting' | 'ready' | 'uploading' | 'failed' | 'uploaded';

type VerificationDocumentFieldProps = {
  document?: SelectedVerificationDocument;
  status: VerificationDocumentStatus;
  progress: number;
  errorText?: string;
  locked?: boolean;
  onPick: () => void;
  onRemove: () => void;
  onRetry: () => void;
};

export function VerificationDocumentField({
  document,
  status,
  progress,
  errorText,
  locked = false,
  onPick,
  onRemove,
  onRetry,
}: VerificationDocumentFieldProps): React.JSX.Element {
  const uploading = status === 'uploading';

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Text style={styles.title}>Verification document</Text>
          <Text style={styles.help}>PDF, JPEG or PNG · maximum 5 MB</Text>
        </View>
        <View style={styles.uploadIcon}>
          <FileUp color={colors.brand} size={26} strokeWidth={1.8} />
        </View>
      </View>

      {document ? (
        <View style={styles.fileBox}>
          <FileText color={colors.icon} size={23} strokeWidth={1.8} />
          <View style={styles.fileCopy}>
            <Text numberOfLines={1} style={styles.fileName}>
              {document.name}
            </Text>
            <Text style={styles.fileMeta}>
              {formatDocumentSize(document.sizeBytes)}
            </Text>
          </View>
          {status === 'uploaded' ? (
            <CheckCircle color={colors.brand} size={24} strokeWidth={2} />
          ) : status === 'failed' ? (
            <CircleX color={colors.danger} size={24} strokeWidth={2} />
          ) : null}
        </View>
      ) : (
        <AppButton
          label={status === 'selecting' ? 'Opening files…' : 'Choose document'}
          onPress={onPick}
          disabled={status === 'selecting'}
          loading={status === 'selecting'}
          variant="brandOutline"
          icon={<FileUp color={colors.brand} size={20} strokeWidth={1.8} />}
        />
      )}

      {uploading ? (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Uploading… {Math.round(progress * 100)}%
          </Text>
        </View>
      ) : null}

      {status === 'uploaded' ? (
        <Text style={styles.successText}>Upload completed successfully.</Text>
      ) : null}
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      {document && !uploading && status !== 'uploaded' ? (
        <View style={styles.actions}>
          {status === 'failed' ? (
            <AppButton
              label="Retry"
              onPress={onRetry}
              variant="brandOutline"
              icon={
                <RefreshCw color={colors.brand} size={18} strokeWidth={2} />
              }
              style={styles.action}
            />
          ) : null}
          {!locked ? (
            <>
              <AppButton
                label="Replace"
                onPress={onPick}
                variant="secondary"
                style={styles.action}
              />
              <Pressable
                accessibilityLabel="Remove verification document"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onRemove}
                style={styles.removeButton}
              >
                <Trash2 color={colors.danger} size={20} strokeWidth={1.8} />
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.button,
    color: colors.text,
  },
  help: {
    ...typography.caption,
    color: colors.muted,
  },
  uploadIcon: {
    alignItems: 'center',
    backgroundColor: colors.brandSoft,
    borderRadius: radii.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  fileBox: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  fileCopy: {
    flex: 1,
  },
  fileName: {
    ...typography.button,
    color: colors.text,
  },
  fileMeta: {
    ...typography.caption,
    color: colors.muted,
  },
  progressWrap: {
    gap: spacing.xs,
  },
  progressTrack: {
    backgroundColor: colors.brandBorder,
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.brand,
    borderRadius: 4,
    height: 8,
  },
  progressText: {
    ...typography.caption,
    color: colors.muted,
  },
  successText: {
    ...typography.caption,
    color: colors.brand,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
  removeButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
});
