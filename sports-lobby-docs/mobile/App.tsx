import React from 'react';
import {AppProviders} from './src/app/AppProviders';
import {SportsLobbyApp} from './src/app/SportsLobbyApp';

export default function App(): React.JSX.Element {
  return (
    <AppProviders>
      <SportsLobbyApp />
    </AppProviders>
  );
}
