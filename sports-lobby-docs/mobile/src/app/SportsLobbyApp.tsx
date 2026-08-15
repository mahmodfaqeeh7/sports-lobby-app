import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import {AuthScreen} from '../features/auth/screens/AuthScreen';
import {AdminReviewScreen} from '../features/admin/screens/AdminReviewScreen';
import {ExploreScreen} from '../features/player/screens/ExploreScreen';
import {MyReservationsScreen} from '../features/player/screens/MyReservationsScreen';
import {ProfileScreen} from '../features/player/screens/ProfileScreen';
import {VendorWorkspaceScreen} from '../features/vendor/screens/VendorWorkspaceScreen';
import {useSession} from '../services/session/SessionContext';
import {colors, spacing, typography} from '../theme/tokens';

type TabKey = 'explore' | 'reservations' | 'vendor' | 'admin' | 'profile';

type TabItem = {
  key: TabKey;
  label: string;
};

export function SportsLobbyApp(): React.JSX.Element {
  const {session, isHydrating, setSession, clearSession} = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>('explore');

  const tabs = useMemo<TabItem[]>(() => {
    if (!session) {
      return [];
    }
    const items: TabItem[] = [
      {key: 'explore', label: 'Explore'},
      {key: 'reservations', label: 'Bookings'},
    ];
    if (session.user.roles.includes('VENDOR')) {
      items.push({key: 'vendor', label: 'Vendor'});
    }
    if (session.user.roles.includes('ADMIN')) {
      items.push({key: 'admin', label: 'Admin'});
    }
    items.push({key: 'profile', label: 'Profile'});
    return items;
  }, [session]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(tab => tab.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [activeTab, tabs]);

  if (isHydrating) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen onAuthenticated={setSession} />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {activeTab === 'explore' ? <ExploreScreen session={session} /> : null}
        {activeTab === 'reservations' ? <MyReservationsScreen session={session} /> : null}
        {activeTab === 'vendor' ? <VendorWorkspaceScreen session={session} /> : null}
        {activeTab === 'admin' ? <AdminReviewScreen session={session} /> : null}
        {activeTab === 'profile' ? <ProfileScreen session={session} onLogout={clearSession} /> : null}
      </View>
      <View style={styles.nav}>
        {tabs.map(tab => {
          const selected = activeTab === tab.key;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{selected}}
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={styles.navItem}>
              <Text style={[styles.navText, selected && styles.navTextSelected]}>{tab.label}</Text>
              <View style={[styles.indicator, selected && styles.indicatorSelected]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  nav: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  navText: {
    ...typography.caption,
    color: colors.muted,
  },
  navTextSelected: {
    color: colors.text,
    fontWeight: '700',
  },
  indicator: {
    backgroundColor: 'transparent',
    borderRadius: 2,
    height: 3,
    width: 24,
  },
  indicatorSelected: {
    backgroundColor: colors.accent,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
