import { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Button } from './UI';
import { colors } from '../theme';

type Point = { x: number; y: number };
export function SignaturePad({ onSave }: { onSave: (pathData: string) => void }) {
  const [strokes, setStrokes] = useState<Point[][]>([]); const [size, setSize] = useState({ width: 1, height: 1 }); const current = useRef<Point[]>([]);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: e => { current.current = [{ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }]; setStrokes(s => [...s, current.current]); },
    onPanResponderMove: e => { current.current.push({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }); setStrokes(s => [...s.slice(0, -1), [...current.current]]); },
  }), []);
  const paths = strokes.map(stroke => stroke.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  const serialized = JSON.stringify({ width: size.width, height: size.height, paths });
  const layout = (e: LayoutChangeEvent) => setSize(e.nativeEvent.layout);
  return <View style={styles.wrap}>
    <View style={styles.pad} onLayout={layout} {...responder.panHandlers}>
      {!strokes.length && <Text style={styles.hint}>Assine aqui</Text>}
      <Svg width="100%" height="100%" pointerEvents="none">{paths.map((d, i) => <Path key={`${i}-${d.length}`} d={d} stroke={colors.text} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}</Svg>
    </View>
    <View style={styles.actions}><Button label="Limpar" tone="secondary" style={styles.action} onPress={() => setStrokes([])} /><Button label="Salvar assinatura" style={styles.action} disabled={!strokes.length} onPress={() => onSave(serialized)} /></View>
  </View>;
}
const styles = StyleSheet.create({ wrap: { gap: 10 }, pad: { height: 220, backgroundColor: '#F4F7F5', borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, hint: { position: 'absolute', alignSelf: 'center', top: 96, color: '#657068', fontSize: 12, fontWeight: '700' }, actions: { flexDirection: 'row', gap: 8 }, action: { flex: 1 } });
