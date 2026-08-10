import React, {PropsWithChildren} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {SessionProvider} from '../services/session/SessionContext';
import {colors} from '../theme/tokens';

export function AppProviders({children}: PropsWithChildren): React.JSX.Element {
  return (
    <SessionProvider>
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        {children}
      </View>
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
