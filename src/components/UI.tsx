import { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme';

export const Eyebrow = ({ children }: PropsWithChildren) => <Text style={styles.eyebrow}>{children}</Text>;
export const Title = ({ children }: PropsWithChildren) => <Text style={styles.title}>{children}</Text>;
export const Muted = ({ children }: PropsWithChildren) => <Text style={styles.muted}>{children}</Text>;
export const SectionTitle = ({ children }: PropsWithChildren) => <Text style={styles.sectionTitle}>{children}</Text>;

export function Card({ children, accent, style }: PropsWithChildren<{ accent?: boolean; style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, accent && styles.cardAccent, style]}>{children}</View>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <View style={styles.pageHeader}><View style={styles.pageCopy}>{eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}<Text style={styles.pageTitle}>{title}</Text>{description ? <Muted>{description}</Muted> : null}</View>{action}</View>;
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' }) {
  return <View style={[styles.badge, styles[`badge_${tone}`]]}><View style={[styles.badgeDot, styles[`dot_${tone}`]]} /><Text style={styles.badgeText}>{label}</Text></View>;
}

export function Button({ label, onPress, tone = 'primary', disabled, compact = false, style }: { label: string; onPress: () => void; tone?: 'primary' | 'secondary' | 'danger' | 'ghost'; disabled?: boolean; compact?: boolean; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} android_ripple={{ color: '#FFFFFF18' }} style={({ pressed }) => [styles.button, styles[`button_${tone}`], compact && styles.compact, pressed && styles.pressed, disabled && styles.disabled, style]}><Text style={[styles.buttonText, tone === 'primary' && styles.darkText]}>{label}</Text></Pressable>;
}

export function SegmentedControl<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <View style={styles.segmented}>{options.map(option => <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.segment, value === option.value && styles.segmentActive]}><Text style={[styles.segmentText, value === option.value && styles.segmentTextActive]}>{option.label}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 10, lineHeight: 14, fontWeight: '900', letterSpacing: 1.8, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1.1 },
  sectionTitle: { color: colors.text, fontSize: 19, lineHeight: 24, fontWeight: '900', letterSpacing: -.3 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: 12 },
  cardAccent: { borderTopColor: colors.primary, borderTopWidth: 3, ...shadow },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.lg, paddingBottom: spacing.sm },
  pageCopy: { flex: 1, gap: 6 },
  pageTitle: { color: colors.text, fontSize: 40, lineHeight: 43, fontWeight: '900', letterSpacing: -1.4, textTransform: 'uppercase' },
  badge: { minHeight: 30, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 11, backgroundColor: colors.surfaceSoft },
  badge_neutral: { borderColor: colors.border }, badge_primary: { borderColor: colors.primary }, badge_success: { borderColor: colors.success }, badge_warning: { borderColor: colors.warning }, badge_danger: { borderColor: colors.danger },
  badgeDot: { width: 6, height: 6, borderRadius: 3 }, dot_neutral: { backgroundColor: colors.muted }, dot_primary: { backgroundColor: colors.primary }, dot_success: { backgroundColor: colors.success }, dot_warning: { backgroundColor: colors.warning }, dot_danger: { backgroundColor: colors.danger },
  badgeText: { color: colors.textSoft, fontSize: 9, fontWeight: '900', letterSpacing: .9 },
  button: { minHeight: 50, paddingHorizontal: 18, paddingVertical: 13, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  compact: { minHeight: 40, paddingVertical: 9, paddingHorizontal: 14 },
  button_primary: { backgroundColor: colors.primary },
  button_secondary: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1 },
  button_danger: { backgroundColor: colors.dangerSoft, borderColor: '#69292D', borderWidth: 1 },
  button_ghost: { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1 },
  disabled: { opacity: .38 }, pressed: { opacity: .78, transform: [{ scale: .99 }] },
  buttonText: { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: .45, textTransform: 'uppercase' }, darkText: { color: colors.primaryText },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 5, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.borderSoft },
  segment: { minHeight: 38, flexGrow: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: .7 },
  segmentTextActive: { color: colors.primaryText },
});
