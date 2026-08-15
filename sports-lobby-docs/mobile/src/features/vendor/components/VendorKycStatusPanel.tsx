import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import BadgeCheck from 'lucide-react-native/icons/badge-check';
import Clock3 from 'lucide-react-native/icons/clock-3';
import ShieldAlert from 'lucide-react-native/icons/shield-alert';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import {AppButton, InfoBanner} from '../../../components';
import {apiClient} from '../../../services/api/apiClient';
import {colors, radii, spacing, typography} from '../../../theme/tokens';
import {showError} from '../../auth/utils/authErrors';
import {VerificationDocumentField} from '../../vendor-onboarding/components/VerificationDocumentField';
import {
  pickVerificationDocument,
  removeLocalDocument,
  SelectedVerificationDocument,
  uploadVerificationDocument,
} from '../../vendor-onboarding/documentUpload';
import {VendorKyc, VendorVerificationDocument, vendorApi} from '../api';

type Props = {
  kyc: VendorKyc;
  accessToken: string;
  onRefresh: () => Promise<void>;
};

export function VendorKycStatusPanel({kyc, accessToken, onRefresh}: Props): React.JSX.Element {
  const [document, setDocument] = useState<SelectedVerificationDocument>();
  const [status, setStatus] = useState<'idle' | 'selecting' | 'ready' | 'uploading' | 'failed' | 'uploaded'>('idle');
  const [progress, setProgress] = useState(0);
  const [errorText, setErrorText] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<VendorVerificationDocument>();
  const statusName = kyc.vendor.verificationStatus;
  // Older backend processes and previously cached responses do not include
  // `documents`. Keep the vendor workspace usable while the API is upgraded.
  const incompleteDocuments = (kyc.documents ?? []).filter(
    item => item.uploadStatus !== 'UPLOADED',
  );

  const pickDocument = async () => {
    setStatus('selecting');
    setErrorText(undefined);
    try {
      const next = await pickVerificationDocument();
      if (!next) {
        setStatus(document ? 'ready' : 'idle');
        return;
      }
      await removeLocalDocument(document);
      setDocument(next);
      setStatus('ready');
      setProgress(0);
    } catch (error) {
      setStatus(document ? 'ready' : 'idle');
      setErrorText(messageFrom(error));
    }
  };

  const removeDocument = async () => {
    const previous = document;
    setDocument(undefined);
    setStatus('idle');
    setErrorText(undefined);
    setPendingTarget(undefined);
    await removeLocalDocument(previous).catch(() => undefined);
  };

  const choosePendingDocument = async (target: VendorVerificationDocument) => {
    setPendingTarget(target);
    setStatus('selecting');
    setErrorText(undefined);
    try {
      const next = await pickVerificationDocument();
      if (!next) {
        setStatus(document ? 'ready' : 'idle');
        return;
      }
      await removeLocalDocument(document);
      setDocument(next);
      setStatus('ready');
      setProgress(0);
    } catch (error) {
      setStatus('idle');
      setErrorText(messageFrom(error));
    }
  };

  const continuePendingUpload = async () => {
    if (!document || !pendingTarget || busy) {
      setErrorText('Choose the document you want to upload.');
      return;
    }
    setBusy(true);
    setErrorText(undefined);
    try {
      const instructions = await vendorApi.continueDocumentUpload(
        apiClient,
        accessToken,
        pendingTarget.fileId,
        {
          fileName: document.name,
          contentType: document.contentType,
          sizeBytes: document.sizeBytes,
        },
      );
      setStatus('uploading');
      await uploadVerificationDocument(document, instructions, setProgress);
      await vendorApi.completeDocumentUpload(apiClient, accessToken, instructions.fileId);
      setStatus('uploaded');
      await removeLocalDocument(document);
      setDocument(undefined);
      setPendingTarget(undefined);
      await onRefresh();
    } catch (error) {
      setStatus('failed');
      setErrorText(messageFrom(error));
    } finally {
      setBusy(false);
    }
  };

  const resubmit = async () => {
    if (!document || busy) {
      setErrorText('Choose a new readable document before resubmitting.');
      return;
    }
    setBusy(true);
    setErrorText(undefined);
    try {
      const response = await vendorApi.resubmit(apiClient, accessToken, [{
        documentType: 'BUSINESS_LICENSE',
        fileName: document.name,
        contentType: document.contentType,
        sizeBytes: document.sizeBytes,
      }]);
      const instructions = response.documentUploads[0];
      if (!instructions) {
        throw new Error('The server did not return upload instructions.');
      }
      setStatus('uploading');
      await uploadVerificationDocument(document, instructions, setProgress);
      await vendorApi.completeDocumentUpload(apiClient, accessToken, instructions.fileId);
      setStatus('uploaded');
      await removeLocalDocument(document);
      setDocument(undefined);
      await onRefresh();
    } catch (error) {
      setStatus('failed');
      const notice: {message?: string} = {};
      showError(error, next => Object.assign(notice, next));
      setErrorText(notice.message ?? messageFrom(error));
    } finally {
      setBusy(false);
    }
  };

  if (statusName === 'APPROVED') {
    return (
      <StatusCard tone="success" icon={<BadgeCheck color={colors.brand} size={30} />} title="Business approved">
        <Text style={styles.body}>Your verification is complete. Publishing and all vendor tools are available.</Text>
      </StatusCard>
    );
  }

  if (statusName === 'SUSPENDED') {
    return (
      <StatusCard tone="danger" icon={<ShieldAlert color={colors.danger} size={30} />} title="Vendor account suspended">
        <Text style={styles.body}>{kyc.vendor.statusReason || 'Publishing is paused while the account is under administrative review.'}</Text>
        <InfoBanner message="You can still review existing information, but publishing remains disabled. Contact support if you need clarification." />
      </StatusCard>
    );
  }

  if (statusName === 'REJECTED') {
    return (
      <StatusCard tone="danger" icon={<TriangleAlert color={colors.danger} size={30} />} title="Changes are required">
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Reviewer’s reason</Text>
          <Text style={styles.reasonText}>{kyc.latestSubmission.decisionReason || kyc.vendor.statusReason || 'The submitted documents could not be approved.'}</Text>
        </View>
        <Text style={styles.body}>Replace the requested document below. Resubmitting creates a new review while preserving the previous decision.</Text>
        <VerificationDocumentField
          document={document}
          status={status}
          progress={progress}
          errorText={errorText}
          onPick={pickDocument}
          onRemove={removeDocument}
          onRetry={resubmit}
        />
        <AppButton label="Resubmit for review" onPress={resubmit} disabled={busy || !document} loading={busy} />
      </StatusCard>
    );
  }

  if (incompleteDocuments.length > 0) {
    return (
      <StatusCard tone="warning" icon={<Clock3 color="#A66A00" size={30} />} title="Finish your application">
        <Text style={styles.body}>
          Your account was created, but {incompleteDocuments.length === 1 ? 'one file still needs' : `${incompleteDocuments.length} files still need`} to be uploaded before review can begin.
        </Text>
        {incompleteDocuments.map(item => (
          <View key={item.id} style={styles.pendingFile}>
            <View style={styles.pendingCopy}>
              <Text style={styles.pendingName}>{friendlyType(item.documentType)}</Text>
              <Text style={styles.meta}>{item.fileName} · {formatBytes(item.sizeBytes)}</Text>
            </View>
            <AppButton
              label={pendingTarget?.fileId === item.fileId ? 'Selected' : 'Choose file'}
              onPress={() => choosePendingDocument(item)}
              disabled={busy}
              variant="secondary"
            />
          </View>
        ))}
        {pendingTarget ? (
          <>
            <VerificationDocumentField
              document={document}
              status={status}
              progress={progress}
              errorText={errorText}
              onPick={() => choosePendingDocument(pendingTarget)}
              onRemove={removeDocument}
              onRetry={continuePendingUpload}
            />
            <AppButton
              label="Upload and continue"
              onPress={continuePendingUpload}
              disabled={busy || !document}
              loading={busy}
            />
          </>
        ) : null}
      </StatusCard>
    );
  }

  return (
    <StatusCard tone="warning" icon={<Clock3 color="#A66A00" size={30} />} title="Application submitted">
      <Text style={styles.body}>Submission #{kyc.latestSubmission.submissionNumber} is pending review. You can prepare venue and lobby drafts while publishing remains locked.</Text>
      <Text style={styles.meta}>Submitted {formatDate(kyc.latestSubmission.submittedAt)}</Text>
    </StatusCard>
  );
}

function StatusCard({tone, icon, title, children}: {tone: 'success' | 'warning' | 'danger'; icon: React.ReactNode; title: string; children: React.ReactNode}): React.JSX.Element {
  return (
    <View style={[styles.card, tone === 'success' ? styles.success : tone === 'danger' ? styles.danger : styles.warning]}>
      <View style={styles.heading}><View>{icon}</View><Text style={styles.title}>{title}</Text></View>
      {children}
    </View>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'The operation failed. Please try again.';
}

function friendlyType(value: string): string {
  return value.toLowerCase().split('_').map(word => `${word[0].toUpperCase()}${word.slice(1)}`).join(' ');
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const styles = StyleSheet.create({
  card: {borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg},
  success: {backgroundColor: colors.brandSoft, borderColor: colors.brandBorder},
  warning: {backgroundColor: '#FFF9E8', borderColor: '#E8D28B'},
  danger: {backgroundColor: '#FFF4F4', borderColor: '#E8B4B4'},
  heading: {alignItems: 'center', flexDirection: 'row', gap: spacing.md},
  title: {...typography.sectionTitle, color: colors.ink, flex: 1},
  body: {...typography.body, color: colors.text},
  meta: {...typography.caption, color: colors.muted},
  reasonBox: {backgroundColor: colors.surface, borderRadius: radii.md, gap: spacing.xs, padding: spacing.md},
  reasonLabel: {...typography.caption, color: colors.muted},
  reasonText: {...typography.body, color: colors.danger},
  pendingFile: {alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: 'row', gap: spacing.md, padding: spacing.md},
  pendingCopy: {flex: 1, gap: spacing.xs},
  pendingName: {...typography.button, color: colors.text},
});
