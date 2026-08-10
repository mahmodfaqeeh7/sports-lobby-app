import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AppButton, AppScreen, AppTextField, Badge, EmptyState, FormSection, Notice} from '../../../components';
import {apiClient} from '../../../services/api/apiClient';
import {AuthenticatedSession} from '../../../services/session/sessionTypes';
import {colors, radii, spacing, typography} from '../../../theme/tokens';
import {showError} from '../../auth/screens/AuthScreen';
import {Vendor, vendorApi} from '../../vendor/api';

type AdminReviewScreenProps = {
  session: AuthenticatedSession;
};

export function AdminReviewScreen({session}: AdminReviewScreenProps): React.JSX.Element {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [reason, setReason] = useState('Documents reviewed.');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{title?: string; message?: string; tone?: 'info' | 'success' | 'error' | 'warning'}>({});

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const pending = await vendorApi.listPending(apiClient, session.tokens.accessToken);
      setVendors(pending);
      setSelectedVendorId(current => current || pending[0]?.id || '');
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

  const decide = async (decision: 'approve' | 'reject') => {
    setBusy(true);
    try {
      if (!selectedVendorId) {
        throw new Error('Select a vendor first.');
      }
      const updated =
        decision === 'approve'
          ? await vendorApi.approve(apiClient, session.tokens.accessToken, selectedVendorId, reason)
          : await vendorApi.reject(apiClient, session.tokens.accessToken, selectedVendorId, reason);
      setVendors(current => current.filter(vendor => vendor.id !== updated.id));
      setSelectedVendorId('');
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
    <AppScreen title="Vendor Reviews" subtitle="Approve or reject pending vendor applications.">
      <Notice title={notice.title} message={notice.message} tone={notice.tone} onDismiss={() => setNotice({})} />
      <FormSection title="Decision">
        <AppTextField label="Reason" value={reason} onChangeText={setReason} />
        <View style={styles.actions}>
          <AppButton label="Refresh" onPress={load} disabled={busy} variant="secondary" />
          <AppButton label="Approve" onPress={() => decide('approve')} disabled={busy || !selectedVendorId} />
          <AppButton label="Reject" onPress={() => decide('reject')} disabled={busy || !selectedVendorId} variant="danger" />
        </View>
      </FormSection>
      <View style={styles.list}>
        {vendors.length === 0 ? (
          <EmptyState title="No pending vendors" message="New vendor KYC submissions will appear here." />
        ) : (
          vendors.map(vendor => (
            <View key={vendor.id} style={[styles.vendor, selectedVendorId === vendor.id && styles.selected]}>
              <Text style={styles.title}>{vendor.businessName}</Text>
              <Text style={styles.meta}>{vendor.city} - {vendor.contactEmail}</Text>
              <View style={styles.footer}>
                <Badge label={vendor.verificationStatus} tone="warning" />
                <AppButton label="Select" onPress={() => setSelectedVendorId(vendor.id)} disabled={busy} variant="secondary" />
              </View>
            </View>
          ))
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  vendor: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  selected: {
    borderColor: colors.accent,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
