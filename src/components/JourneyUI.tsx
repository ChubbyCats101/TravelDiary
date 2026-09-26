import { useId, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', padding: 20, gap: 16, paddingBottom: 40 },
  card: { padding: 20, borderRadius: 24, gap: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DEE4E9' },
  hero: { padding: 26, gap: 16, borderRadius: 28, backgroundColor: '#1D3557', overflow: 'hidden' },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 2, color: '#617084' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#F5E8D8', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  title: { fontSize: 28, fontWeight: '800', color: '#1D3557' },
  heading: { fontSize: 20, fontWeight: '700', color: '#1D3557' },
  text: { fontSize: 16, color: '#34465C', lineHeight: 25 },
  muted: { fontSize: 14, color: '#617084', lineHeight: 22 },
  error: { fontSize: 14, color: '#AC2424', lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#A6B3C1', borderRadius: 16, padding: 16, minHeight: 54, backgroundColor: '#FFFFFF', color: '#1D3557', fontSize: 16 },
  button: { minHeight: 50, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 16, borderWidth: 1, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center', backgroundColor: '#E76F51' },
  photo: { width: '100%', height: 240, borderRadius: 14, backgroundColor: '#E8EFF4' },
});
export function Action({ title, onPress, disabled = false, secondary = false, accessibilityLabel = title, selected }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean; accessibilityLabel?: string; selected?: boolean }) {
  return <Pressable accessibilityRole={selected === undefined ? "button" : "checkbox"} accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled, checked: selected }} aria-checked={selected} aria-disabled={disabled} disabled={disabled} onPress={onPress} style={({ pressed }) => [ui.button, { maxWidth: '100%', flexShrink: 1, minWidth: 48 }, secondary && { backgroundColor: '#EDF2F6', borderColor: '#D8E2EB' }, selected && { backgroundColor: '#1D3557', borderColor: '#1D3557' }, { opacity: disabled ? 0.55 : pressed ? 0.8 : 1 }]}><Text style={{ fontSize: 15, fontWeight: '700', color: selected ? '#FFF' : secondary ? '#1D3557' : '#172B46', textAlign: 'center', flexShrink: 1 }}>{selected ? '✓  ' : ''}{title}</Text></Pressable>;
}
export function Field({ label, error, style, onFocus, onBlur, ...props }: TextInputProps & { label: string; error?: string }) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  return <View style={{ gap: 8 }}><Text nativeID={`${id}-label`} style={[ui.text, { fontSize: 14, fontWeight: '600' }]}>{label}</Text><TextInput accessibilityLabel={label} accessibilityHint={error || undefined} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} placeholderTextColor="#617084" {...props} style={[ui.input, props.multiline && { minHeight: 144, textAlignVertical: 'top', lineHeight: 26 }, focused && { borderColor: '#1D3557', backgroundColor: '#F0F5FA' }, error ? { borderColor: '#AC2424' } : undefined, style]} onFocus={event => { setFocused(true); onFocus?.(event); }} onBlur={event => { setFocused(false); onBlur?.(event); }} />{error ? <Text nativeID={`${id}-error`} accessibilityRole="alert" accessibilityLiveRegion="polite" style={ui.error}>{error}</Text> : null}</View>;
}
export function Message({ text }: { text: string }) { return text ? <Text accessibilityLiveRegion="polite" style={ui.error}>{text}</Text> : null; }
