import React, { PropsWithChildren } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '../services/session/SessionContext';
import { colors } from '../theme/tokens';

export function AppProviders({
  children,
}: PropsWithChildren): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <View style={styles.root}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
          {children}
        </View>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
