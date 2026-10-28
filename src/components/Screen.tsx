import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { colors, layout, spacing } from '../theme';

export function Screen({ children, scroll = true, narrow = false }: PropsWithChildren<{ scroll?: boolean; narrow?: boolean }>) {
  const { width } = useWindowDimensions();
  const tablet = width >= layout.tabletBreakpoint;
  const contentStyle = [styles.content, { paddingHorizontal: tablet ? layout.tabletPadding : layout.phonePadding, maxWidth: narrow ? 720 : layout.contentMax }];
  const body = scroll
    ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={contentStyle}>{children}</ScrollView>
    : <View style={contentStyle}>{children}</View>;
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{body}</KeyboardAvoidingView></SafeAreaView>;
}

export function ResponsiveRow({ children, breakpoint = layout.tabletBreakpoint }: PropsWithChildren<{ breakpoint?: number }>) {
  const { width } = useWindowDimensions();
  return <View style={[styles.row, width < breakpoint && styles.rowStack]}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', alignSelf: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: 14, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md },
  rowStack: { flexDirection: 'column' },
});
