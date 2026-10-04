import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { ConnectionBanner } from './src/components/ConnectionBanner';
import { database } from './src/database'; import { RootStackParamList } from './src/navigation/types';
import { MatchesScreen } from './src/screens/MatchesScreen'; import { MatchDetailsScreen } from './src/screens/MatchDetailsScreen'; import { PreGameScreen } from './src/screens/PreGameScreen'; import { LiveMatchScreen } from './src/screens/LiveMatchScreen'; import { PostGameScreen } from './src/screens/PostGameScreen'; import { SyncScreen } from './src/screens/SyncScreen';
import { startAutoSync } from './src/services/sync'; import { colors } from './src/theme';
const Stack = createNativeStackNavigator<RootStackParamList>();
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.surface, border: colors.border, text: colors.text, primary: colors.primary } };
export default function App() {
  useEffect(() => startAutoSync(), []);
  return <DatabaseProvider database={database}><StatusBar barStyle="light-content"/><NavigationContainer theme={theme}><ConnectionBanner/><Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text, headerShadowVisible: false }}>
    <Stack.Screen name="Matches" component={MatchesScreen} options={{ title: 'Zenith' }}/><Stack.Screen name="MatchDetails" component={MatchDetailsScreen} options={{ title: 'Partida' }}/><Stack.Screen name="PreGame" component={PreGameScreen} options={{ title: 'Pré-jogo' }}/><Stack.Screen name="LiveMatch" component={LiveMatchScreen} options={{ title: 'Operação ao vivo' }}/><Stack.Screen name="PostGame" component={PostGameScreen} options={{ title: 'Fechamento' }}/><Stack.Screen name="Sync" component={SyncScreen} options={{ title: 'Sincronização' }}/>
  </Stack.Navigator></NavigationContainer></DatabaseProvider>;
}
