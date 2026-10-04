import { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export const Title = ({ children }: PropsWithChildren) => (
  <Text style={styles.title}>{children}</Text>
);
export const Muted = ({ children }: PropsWithChildren) => (
  <Text style={styles.muted}>{children}</Text>
);
export const Card = ({ children }: PropsWithChildren) => (
  <View style={styles.card}>{children}</View>
);
export function Button({
  label,
  onPress,
  tone = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, styles[tone], disabled && styles.disabled]}
    >
      <Text style={[styles.buttonText, tone !== 'primary' && styles.lightText]}>
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 27, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
  },
  danger: { backgroundColor: '#391C20' },
  disabled: { opacity: 0.45 },
  buttonText: { color: colors.primaryText, fontWeight: '700' },
  lightText: { color: colors.text },
});
