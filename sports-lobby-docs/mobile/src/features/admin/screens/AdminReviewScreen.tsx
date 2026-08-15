import React, {useCallback, useEffect, useState} from 'react';
import {Linking, Platform, StyleSheet, Text, View} from 'react-native';
import FileText from 'lucide-react-native/icons/file-text';
import ExternalLink from 'lucide-react-native/icons/external-link';
import {
  AppButton,
  AppScreen,
  AppTextField,
  Badge,
  EmptyState,
  FormSection,
  Notice,
} from '../../../components';
import {apiClient} from '../../../services/api/apiClient';
import {AuthenticatedSession} from '../../../services/session/sessionTypes';
import {colors, radii, spacing, typography} from '../../../theme/tokens';
import {showError} from '../../auth/utils/authErrors';
import {AdminVendorReview, Vendor, vendorApi} from '../../vendor/api';

type AdminReviewScreenProps = {session: AuthenticatedSession};
type NoticeValue = {
  title?: string;
  message?: string;
  tone?: 'info' | 'success' | 'error' | 'warning';
};

export function AdminReviewScreen({session}: AdminReviewScreenProps): React.JSX.Element {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [review, setReview] = useState<AdminVendorReview>();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [openingFileId, setOpeningFileId] = useState('');
  const [notice, setNotice] = useState<NoticeValue>({});

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const pending = await vendorApi.listPending(apiClient, session.tokens.accessToken);
      setVendors(pending);
      setSelectedVendorId(current =>
        pending.some(vendor => vendor.id === current) ? current : pending[0]?.id || '',
      );
      setNotice({});
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  }, [session.tokens.accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedVendorId) {
      setReview(undefined);
      return;
    }
    let active = true;
    setReviewBusy(true);
    vendorApi
      .adminReview(apiClient, session.tokens.accessToken, selectedVendorId)
      .then(nextReview => {
        if (active) {
          setReview(nextReview);
          setReason('');
        }
      })
      .catch(error => {
        if (active) {
          setReview(undefined);
          showError(error, setNotice);
        }
      })
      .finally(() => {
        if (active) {
          setReviewBusy(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selectedVendorId, session.tokens.accessToken]);

  const openDocument = async (fileId: string) => {
    setOpeningFileId(fileId);
    setNotice({});
    try {
      const signed = await vendorApi.adminDocumentDownload(
        apiClient,
        session.tokens.accessToken,
        fileId,
      );
      await Linking.openURL(reachableSignedUrl(signed.downloadUrl));
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setOpeningFileId('');
    }
  };

  const decide = async (decision: 'approve' | 'reject') => {
    if (!review) {
      return;
    }
    setBusy(true);
    setNotice({});
    try {
      const updated = decision === 'approve'
        ? await vendorApi.approve(
            apiClient,
            session.tokens.accessToken,
            review.vendor.id,
            reason.trim() || 'KYC evidence reviewed.',
          )
        : await vendorApi.reject(
            apiClient,
            session.tokens.accessToken,
            review.vendor.id,
            reason.trim(),
          );
      const remaining = vendors.filter(vendor => vendor.id !== updated.id);
      setVendors(remaining);
      setSelectedVendorId(remaining[0]?.id || '');
      setReview(undefined);
      setReason('');
      setNotice({
        title: decision === 'approve' ? 'Vendor approved' : 'Vendor rejected',
        message: updated.businessName,
        tone: decision === 'approve' ? 'success' : 'warning',
      });
    } catch (error) {
      showError(error, setNotice);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen
      title="Vendor KYC reviews"
      subtitle="Inspect the submitted identity and business evidence before making a decision.">
      <Notice
        title={notice.title}
        message={notice.message}
        tone={notice.tone}
        onDismiss={() => setNotice({})}
      />

      <View style={styles.queueHeader}>
        <Text style={styles.sectionTitle}>Pending applications ({vendors.length})</Text>
        <AppButton label="Refresh" onPress={load} disabled={busy} variant="secondary" />
      </View>

      <View style={styles.list}>
        {vendors.length === 0 ? (
          <EmptyState title="No pending vendors" message="New vendor KYC submissions will appear here." />
        ) : (
          vendors.map(vendor => (
            <View
              key={vendor.id}
              style={[styles.vendor, selectedVendorId === vendor.id && styles.selected]}>
              <View style={styles.grow}>
                <Text style={styles.title}>{vendor.businessName}</Text>
                <Text style={styles.meta}>{vendor.city} · {vendor.contactEmail}</Text>
              </View>
              <AppButton
                label={selectedVendorId === vendor.id ? 'Selected' : 'Review'}
                onPress={() => setSelectedVendorId(vendor.id)}
                disabled={busy || selectedVendorId === vendor.id}
                variant="secondary"
              />
            </View>
          ))
        )}
      </View>

      {reviewBusy ? <Text style={styles.loading}>Loading complete application…</Text> : null}

      {review ? (
        <>
          <FormSection title="Owner identity" subtitle="The person responsible for this vendor account.">
            <InfoRow label="Name" value={`${review.owner.firstName} ${review.owner.lastName}`} />
            <InfoRow label="Login email" value={review.owner.email} />
            <InfoRow label="Login phone" value={review.owner.phoneE164} />
            <InfoRow
              label="Phone verification"
              value={review.owner.phoneVerified ? 'Verified' : 'Not verified'}
              warning={!review.owner.phoneVerified}
            />
          </FormSection>

          <FormSection
            title="Submitted business information"
            subtitle={`Submission #${review.submission.submissionNumber} · ${formatDate(review.submission.submittedAt)}`}>
            <InfoRow label="Business" value={review.submission.businessName} />
            <InfoRow label="Business email" value={review.submission.contactEmail} />
            <InfoRow label="Business phone" value={review.submission.contactPhone} />
            <InfoRow
              label="Address"
              value={[
                review.submission.addressLine,
                review.submission.area,
                review.submission.city,
                review.submission.countryCode,
              ].filter(Boolean).join(', ')}
            />
            <InfoRow label="Sports" value={review.submission.supportedSports || 'Not supplied'} />
            <InfoRow label="Opening hours" value={review.submission.openingHours || 'Not supplied'} />
          </FormSection>

          <FormSection
            title={`Evidence (${review.documents.length})`}
            subtitle="Open every uploaded file and compare it with the owner and business information above.">
            {review.documents.length === 0 ? (
              <Notice title="No evidence attached" message="This application cannot be approved." tone="error" />
            ) : (
              review.documents.map(document => {
                const uploaded = document.uploadStatus === 'UPLOADED';
                return (
                  <View key={document.id} style={styles.document}>
                    <View style={styles.documentIcon}>
                      <FileText color={uploaded ? colors.brand : colors.danger} size={22} />
                    </View>
                    <View style={styles.grow}>
                      <Text style={styles.documentType}>{friendlyType(document.documentType)}</Text>
                      <Text style={styles.fileName}>{document.fileName}</Text>
                      <Text style={styles.meta}>{document.contentType} · {formatBytes(document.sizeBytes)}</Text>
                    </View>
                    <View style={styles.documentAction}>
                      <Badge label={uploaded ? 'Uploaded' : 'Incomplete'} tone={uploaded ? 'success' : 'danger'} />
                      <AppButton
                        label="Open"
                        icon={<ExternalLink color={colors.text} size={16} />}
                        onPress={() => openDocument(document.fileId)}
                        loading={openingFileId === document.fileId}
                        disabled={!uploaded || Boolean(openingFileId)}
                        variant="secondary"
                      />
                    </View>
                  </View>
                );
              })
            )}
            {!review.readyForDecision ? (
              <Notice
                title="Approval blocked"
                message="A successfully uploaded business license and completed attachment uploads are required. You may reject this submission with instructions for the vendor."
                tone="warning"
              />
            ) : null}
          </FormSection>

          <FormSection title="Decision" subtitle="A rejection must include a clear reason the vendor can act on.">
            <AppTextField
              label="Review note / rejection reason"
              value={reason}
              onChangeText={setReason}
              multiline
            />
            <View style={styles.actions}>
              <AppButton
                label="Approve application"
                onPress={() => decide('approve')}
                loading={busy}
                disabled={busy || !review.readyForDecision}
              />
              <AppButton
                label="Reject and request changes"
                onPress={() => decide('reject')}
                disabled={busy || reason.trim().length === 0}
                variant="danger"
              />
            </View>
          </FormSection>
        </>
      ) : null}
    </AppScreen>
  );
}

function InfoRow({label, value, warning = false}: {label: string; value: string; warning?: boolean}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, warning && styles.warningText]}>{value}</Text>
    </View>
  );
}

function reachableSignedUrl(url: string): string {
  return Platform.OS === 'android'
    ? url.replace(/^(https?:\/\/)localhost(?=[:/])/, '$110.0.2.2')
    : url;
}

function friendlyType(value: string): string {
  return value.toLowerCase().split('_').map(word => `${word[0].toUpperCase()}${word.slice(1)}`).join(' ');
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

const styles = StyleSheet.create({
  actions: {gap: spacing.sm},
  document: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  documentAction: {alignItems: 'flex-end', gap: spacing.sm},
  documentIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  documentType: {...typography.button, color: colors.text},
  fileName: {...typography.caption, color: colors.text},
  grow: {flex: 1, gap: spacing.xs},
  infoLabel: {...typography.caption, color: colors.muted, flex: 1},
  infoRow: {
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoValue: {...typography.body, color: colors.text, flex: 2, textAlign: 'right'},
  list: {gap: spacing.sm},
  loading: {...typography.body, color: colors.muted, textAlign: 'center'},
  meta: {...typography.caption, color: colors.muted},
  queueHeader: {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'},
  sectionTitle: {...typography.sectionTitle, color: colors.text},
  selected: {borderColor: colors.accent, borderWidth: 2},
  title: {...typography.sectionTitle, color: colors.text},
  vendor: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  warningText: {color: colors.danger},
});
