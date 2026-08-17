import React from 'react';
import { StyleSheet } from 'react-native';
import {
  BottomTabNavigationOptions,
  BottomTabOptionsArgs,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CalendarDays,
  Compass,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react-native';
import { AdminReviewScreen } from '../features/admin/screens/AdminReviewScreen';
import { ExploreScreen } from '../features/player/screens/ExploreScreen';
import { LobbyDetailsScreen } from '../features/player/screens/LobbyDetailsScreen';
import { MyReservationsScreen } from '../features/player/screens/MyReservationsScreen';
import { ProfileScreen } from '../features/player/screens/ProfileScreen';
import { VendorWorkspaceScreen } from '../features/vendor/screens/VendorWorkspaceScreen';
import { AuthenticatedSession } from '../services/session/sessionTypes';
import { colors, spacing, typography } from '../theme/tokens';
import { tabRoutesForRoles } from './roleTabs';
import {
  AppTabName,
  AppTabParamList,
  AuthenticatedStackParamList,
} from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AuthenticatedStackParamList>();

type AuthenticatedNavigatorProps = {
  session: AuthenticatedSession;
  onLogout: () => void;
};

type RoleTabsProps = AuthenticatedNavigatorProps & {
  onOpenLobby: (lobbyId: string) => void;
};

type TabIconProps = {
  color: string;
  focused: boolean;
  name: AppTabName;
  size: number;
};

function TabIcon({
  color,
  focused,
  name,
  size,
}: TabIconProps): React.JSX.Element {
  const iconProps = {
    color,
    size,
    strokeWidth: focused ? 2.5 : 2,
  };

  switch (name) {
    case 'Explore':
      return <Compass {...iconProps} />;
    case 'Bookings':
      return <CalendarDays {...iconProps} />;
    case 'Vendor':
      return <Store {...iconProps} />;
    case 'Admin':
      return <ShieldCheck {...iconProps} />;
    case 'Profile':
      return <UserRound {...iconProps} />;
  }
}

function getTabScreenOptions({
  route,
}: BottomTabOptionsArgs<AppTabParamList>): BottomTabNavigationOptions {
  return {
    headerShown: false,
    sceneStyle: styles.scene,
    tabBarActiveTintColor: colors.brand,
    tabBarHideOnKeyboard: true,
    tabBarIcon: ({ color, focused, size }) => (
      <TabIcon color={color} focused={focused} name={route.name} size={size} />
    ),
    tabBarInactiveTintColor: colors.muted,
    tabBarItemStyle: styles.tabBarItem,
    tabBarLabelStyle: styles.tabBarLabel,
    tabBarStyle: styles.tabBar,
  };
}

function RoleTabs({
  session,
  onLogout,
  onOpenLobby,
}: RoleTabsProps): React.JSX.Element {
  const availableRoutes = new Set(tabRoutesForRoles(session.user.roles));

  return (
    <Tab.Navigator screenOptions={getTabScreenOptions}>
      {availableRoutes.has('Explore') ? (
        <Tab.Screen name="Explore">
          {() => <ExploreScreen onOpenLobby={onOpenLobby} />}
        </Tab.Screen>
      ) : null}
      {availableRoutes.has('Bookings') ? (
        <Tab.Screen name="Bookings">
          {() => <MyReservationsScreen session={session} />}
        </Tab.Screen>
      ) : null}
      {availableRoutes.has('Vendor') ? (
        <Tab.Screen name="Vendor">
          {() => <VendorWorkspaceScreen session={session} />}
        </Tab.Screen>
      ) : null}
      {availableRoutes.has('Admin') ? (
        <Tab.Screen name="Admin">
          {() => <AdminReviewScreen session={session} />}
        </Tab.Screen>
      ) : null}
      <Tab.Screen name="Profile">
        {() => <ProfileScreen session={session} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export function AuthenticatedNavigator(
  props: AuthenticatedNavigatorProps,
): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: styles.scene,
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs">
        {({navigation}) => (
          <RoleTabs
            {...props}
            onOpenLobby={lobbyId => navigation.navigate('LobbyDetails', {lobbyId})}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="LobbyDetails">
        {({navigation, route}) => (
          <LobbyDetailsScreen
            lobbyId={route.params.lobbyId}
            onBack={navigation.goBack}
            session={props.session}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tabBarItem: {
    minHeight: 48,
  },
  tabBarLabel: {
    ...typography.caption,
    fontSize: 12,
  },
});
