import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Button, Eyebrow, Muted } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../services/api';
import { colors, radius } from '../theme';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { getApiUrl().then(setUrl); }, []);
  const submit = async () => { if (!email || !password || !url) return Alert.alert('Preencha todos os campos'); setBusy(true); try { await signIn(email.trim(), password, url.trim()); } catch (error) { Alert.alert('Não foi possível entrar', error instanceof Error ? error.message : 'Erro desconhecido'); } finally { setBusy(false); } };

  return <Screen><KeyboardAvoidingView style={styles.layout} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.brand}><View style={styles.mark}><Text style={styles.markText}>Z</Text></View><View><Text style={styles.wordmark}>ZENITH</Text><Text style={styles.submark}>SPORTS OS</Text></View></View>
    <View style={styles.hero}><Eyebrow>Operação oficial</Eyebrow><Text style={styles.title}>SÚMULA{`\n`}OFFLINE.</Text><Muted>Controle a partida com segurança, mesmo sem conexão. Seus dados permanecem salvos neste aparelho.</Muted></View>
    <View style={styles.form}><Field label="ENDEREÇO DA API" value={url} onChangeText={setUrl} placeholder="http://192.168.1.10:3000" /><Field label="E-MAIL" value={email} onChangeText={setEmail} keyboardType="email-address" /><Field label="SENHA" value={password} onChangeText={setPassword} secureTextEntry /><Button label={busy ? 'ENTRANDO…' : 'ENTRAR NO ZENITH'} disabled={busy} onPress={submit} /></View>
    <Text style={styles.help}>CELULAR FÍSICO: use o IP do computador na mesma rede Wi-Fi.{`\n`}EMULADOR ANDROID: use 10.0.2.2.</Text>
  </KeyboardAvoidingView></Screen>;
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) { const { label, ...inputProps } = props; return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...inputProps} autoCapitalize="none" placeholderTextColor={colors.muted} style={styles.input} /></View>; }

const styles = StyleSheet.create({
  layout: { flex: 1, justifyContent: 'center', gap: 28, paddingVertical: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.text },
  markText: { color: colors.background, fontWeight: '900', fontStyle: 'italic' },
  wordmark: { color: colors.text, fontSize: 24, lineHeight: 25, fontWeight: '900', letterSpacing: 1.5 },
  submark: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 2.2 },
  hero: { gap: 10 },
  title: { color: colors.text, fontSize: 52, lineHeight: 48, fontWeight: '900', letterSpacing: -2 },
  form: { gap: 14, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border },
  field: { gap: 7 },
  label: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  input: { minHeight: 50, color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 14, fontSize: 14 },
  help: { color: colors.muted, fontSize: 9, lineHeight: 15, letterSpacing: .35 },
});
