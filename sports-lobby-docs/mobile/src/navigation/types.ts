export type AppTabParamList = {
  Explore: undefined;
  Bookings: undefined;
  Vendor: undefined;
  Admin: undefined;
  Profile: undefined;
};

export type AppTabName = keyof AppTabParamList;

export type AuthenticatedStackParamList = {
  MainTabs: undefined;
  LobbyDetails: {lobbyId: string};
};
