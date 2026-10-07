import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

export const Eyebrow = ({ children }: PropsWithChildren) => <Text style={styles.eyebrow}>{children}</Text>;
export const Title = ({ children }: PropsWithChildren) => <Text style={styles.title}>{children}</Text>;
export const Muted = ({ children }: PropsWithChildren) => <Text style={styles.muted}>{children}</Text>;
export const Card = ({ children }: PropsWithChildren) => <View style={styles.card}>{children}</View>;
export const SectionTitle = ({ children }: PropsWithChildren) => <Text style={styles.sectionTitle}>{children}</Text>;

export function Button({ label, onPress, tone = 'primary', disabled }: { label: string; onPress: () => void; tone?: 'primary' | 'secondary' | 'danger'; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} android_ripple={{ color: '#FFFFFF18' }} style={({ pressed }) => [styles.button, styles[tone], pressed && styles.pressed, disabled && styles.disabled]}><Text style={[styles.buttonText, tone !== 'primary' && styles.lightText]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 10, lineHeight: 14, fontWeight: '900', letterSpacing: 1.8, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1.1 },
  sectionTitle: { color: colors.text, fontSize: 18, lineHeight: 23, fontWeight: '900', letterSpacing: -.25 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderColor: colors.borderSoft, borderWidth: 1, borderRadius: radius.md, padding: 16, gap: 12 },
  button: { minHeight: 48, paddingHorizontal: 18, paddingVertical: 13, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1 },
  danger: { backgroundColor: '#351719', borderColor: '#69292D', borderWidth: 1 },
  disabled: { opacity: .38 },
  pressed: { opacity: .78, transform: [{ scale: .99 }] },
  buttonText: { color: colors.primaryText, fontSize: 13, fontWeight: '900', letterSpacing: .2 },
  lightText: { color: colors.text },
});
