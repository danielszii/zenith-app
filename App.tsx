import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { ConnectionBanner } from './src/components/ConnectionBanner';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { database } from './src/database';
import { RootStackParamList } from './src/navigation/types';
import { LoginScreen } from './src/screens/LoginScreen';
import { MatchesScreen } from './src/screens/MatchesScreen';
import { MatchDetailsScreen } from './src/screens/MatchDetailsScreen';
import { PreGameScreen } from './src/screens/PreGameScreen';
import { LiveMatchScreen } from './src/screens/LiveMatchScreen';
import { PostGameScreen } from './src/screens/PostGameScreen';
import { SyncScreen } from './src/screens/SyncScreen';
import { startAutoSync } from './src/services/sync';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.background, border: colors.borderSoft, text: colors.text, primary: colors.primary } };

function Root() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <><StatusBar barStyle="light-content" /><LoginScreen /></>;
  return <><StatusBar barStyle="light-content" /><NavigationContainer theme={theme}><ConnectionBanner /><Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerTitleStyle: { fontSize: 12, fontWeight: '900' }, headerBackTitle: 'Voltar', headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="Matches" component={MatchesScreen} options={{ title: 'ZENITH  /  SÚMULA' }} /><Stack.Screen name="MatchDetails" component={MatchDetailsScreen} options={{ title: 'PARTIDA' }} /><Stack.Screen name="PreGame" component={PreGameScreen} options={{ title: 'PRÉ-JOGO' }} /><Stack.Screen name="LiveMatch" component={LiveMatchScreen} options={{ title: 'OPERAÇÃO AO VIVO' }} /><Stack.Screen name="PostGame" component={PostGameScreen} options={{ title: 'FECHAMENTO' }} /><Stack.Screen name="Sync" component={SyncScreen} options={{ title: 'SINCRONIZAÇÃO' }} /></Stack.Navigator></NavigationContainer></>;
}

export default function App() {
  useEffect(() => startAutoSync(), []);
  return <DatabaseProvider database={database}><AuthProvider><Root /></AuthProvider></DatabaseProvider>;
}
