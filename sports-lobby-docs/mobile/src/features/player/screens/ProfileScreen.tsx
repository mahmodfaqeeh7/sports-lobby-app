import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {AppButton, AppScreen, FormSection} from '../../../components';
import {apiClient} from '../../../services/api/apiClient';
import {AuthenticatedSession} from '../../../services/session/sessionTypes';
import {colors, spacing, typography} from '../../../theme/tokens';
import {authApi} from '../../auth/api';

type ProfileScreenProps = {
  session: AuthenticatedSession;
  onLogout: () => void;
};

export function ProfileScreen({session, onLogout}: ProfileScreenProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await authApi.logout(apiClient, session.tokens.refreshToken, false);
    } catch {
      // Local logout should still clear an expired or revoked session.
    } finally {
      setBusy(false);
      onLogout();
    }
  };

  return (
    <AppScreen title="Profile" subtitle="Manage your account and session.">
      <FormSection title={`${session.user.firstName} ${session.user.lastName}`}>
        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{session.user.phoneE164}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{session.user.phoneVerified ? 'Verified' : 'Needs verification'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Roles</Text>
          <Text style={styles.value}>{session.user.roles.join(', ')}</Text>
        </View>
      </FormSection>
      <AppButton label="Logout" onPress={logout} disabled={busy} variant="danger" />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
  },
  value: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
});
