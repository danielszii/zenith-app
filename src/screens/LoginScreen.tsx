import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Button } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../services/api';
import { colors, radius, spacing } from '../theme';

export function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const compact = height < 700;
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { getApiUrl().then(setUrl); }, []);
  const submit = async () => {
    if (!email || !password || !url) return Alert.alert('Preencha todos os campos');
    setBusy(true);
    try { await signIn(email.trim(), password, url.trim()); }
    catch (error) { Alert.alert('Nao foi possivel entrar', error instanceof Error ? error.message : 'Erro desconhecido'); }
    finally { setBusy(false); }
  };

  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={[styles.page, landscape ? styles.pageLandscape : styles.pagePortrait, compact && styles.pageCompact]}>
      <View style={styles.topbar}><Brand /><View style={styles.topbarStatus}><View style={styles.statusDot} /><Text style={styles.statusText}>OFFLINE-FIRST</Text></View></View>
      <View style={[styles.content, landscape ? styles.contentLandscape : styles.contentPortrait]}>
        <View style={[styles.hero, landscape ? styles.heroLandscape : styles.heroPortrait]}><Text style={styles.eyebrow}>OPERACAO OFICIAL ZENITH</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={[styles.title, landscape ? styles.titleLandscape : styles.titlePortrait, compact && styles.titleCompact]}>{'SUMULA OFFLINE'}</Text></View>
        <View style={[styles.panel, landscape ? styles.panelLandscape : styles.panelPortrait, compact && styles.panelCompact]}>
          <View style={styles.formHeader}><Text style={styles.formTitle}>ENTRAR</Text><Text style={styles.formSubtitle}>Acesse as partidas vinculadas a sua conta.</Text></View>
          <View style={styles.fields}><Field label="ENDERECO DA API" value={url} onChangeText={setUrl} placeholder="http://192.168.0.8:3000" /><Field label="E-MAIL" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="voce@zenith.com" /><Field label="SENHA" value={password} onChangeText={setPassword} secureTextEntry placeholder="Sua senha" onSubmitEditing={submit} /></View>
          <Button label={busy ? 'Entrando...' : 'Entrar no Zenith'} disabled={busy} onPress={submit} />
          <View style={styles.helpRow}><Text style={styles.helpIcon}>i</Text><Text style={styles.help}>Use o IP do computador conectado a mesma rede Wi-Fi.</Text></View>
        </View>
      </View>
    </View>
  </KeyboardAvoidingView></SafeAreaView>;
}

function Brand() { return <View style={styles.brand}><View style={styles.mark}><Text style={styles.markText}>Z</Text></View><View><Text style={styles.wordmark}>ZENITH</Text><Text style={styles.submark}>SPORTS OS</Text></View></View>; }
function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) { const { label, ...inputProps } = props; return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...inputProps} autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors.muted} style={styles.input} /></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, page: { flex: 1, width: '100%', maxWidth: 1180, alignSelf: 'center' },
  pageLandscape: { paddingHorizontal: 32, paddingVertical: 20 }, pagePortrait: { paddingHorizontal: 28, paddingVertical: 24 }, pageCompact: { paddingVertical: 14 },
  topbar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, topbarStatus: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' }, contentLandscape: { flexDirection: 'row', gap: 52 }, contentPortrait: { flexDirection: 'column', gap: 22 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 }, mark: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.text }, markText: { color: colors.background, fontSize: 16, fontWeight: '900', fontStyle: 'italic' },
  wordmark: { color: colors.text, fontSize: 22, lineHeight: 23, fontWeight: '900', letterSpacing: 1.5 }, submark: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 2.1 },
  hero: { alignItems: 'center', justifyContent: 'center', gap: 9 }, heroLandscape: { flex: 1 }, heroPortrait: { width: '100%' }, eyebrow: { color: colors.primary, fontSize: 9, lineHeight: 13, fontWeight: '900', letterSpacing: 1.7 },
  title: { width: '100%', color: colors.text, fontWeight: '900', letterSpacing: -2, textAlign: 'center' }, titleLandscape: { fontSize: 58, lineHeight: 64 }, titlePortrait: { fontSize: 47, lineHeight: 53 }, titleCompact: { fontSize: 42, lineHeight: 47 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }, statusText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  panel: { alignSelf: 'center', width: '100%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderTopColor: colors.primary, borderTopWidth: 3, borderRadius: radius.lg, padding: spacing.lg, gap: 16 }, panelLandscape: { flex: .8, maxWidth: 460 }, panelPortrait: { maxWidth: 590 }, panelCompact: { paddingVertical: 16, gap: 11 },
  formHeader: { gap: 4 }, formTitle: { color: colors.text, fontSize: 22, lineHeight: 26, fontWeight: '900' }, formSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 18 }, fields: { gap: 12 }, field: { gap: 6 }, label: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.15 },
  input: { height: 48, color: colors.text, backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 14, fontSize: 13 }, helpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, helpIcon: { width: 18, height: 18, textAlign: 'center', color: colors.primary, borderWidth: 1, borderColor: colors.primary, borderRadius: 9, fontSize: 11, fontWeight: '900' }, help: { flex: 1, color: colors.muted, fontSize: 9, lineHeight: 14 },
});