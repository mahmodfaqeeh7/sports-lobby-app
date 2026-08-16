import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthScreen } from '../features/auth/screens/AuthScreen';
import { AuthenticatedNavigator } from '../navigation/AuthenticatedNavigator';
import { appNavigationTheme } from '../navigation/theme';
import { useSession } from '../services/session/SessionContext';
import { colors } from '../theme/tokens';

export function SportsLobbyApp(): React.JSX.Element {
  const { session, isHydrating, setSession, clearSession } = useSession();

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
    <NavigationContainer theme={appNavigationTheme}>
      <AuthenticatedNavigator session={session} onLogout={clearSession} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
