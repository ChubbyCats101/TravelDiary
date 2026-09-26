import { useId } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5F2E9' },
  content: { width: '100%', maxWidth: 1000, alignSelf: 'center', padding: 20, gap: 16, paddingBottom: 40 },
  card: { padding: 20, borderRadius: 20, gap: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7E2D7' },
  hero: { padding: 26, gap: 12, borderRadius: 24, backgroundColor: '#183F38' },
  title: { fontSize: 28, fontWeight: '800', color: '#183F38' },
  heading: { fontSize: 20, fontWeight: '700', color: '#203A35' },
  text: { fontSize: 16, color: '#344F49', lineHeight: 25 },
  muted: { fontSize: 14, color: '#5C6963', lineHeight: 22 },
  error: { fontSize: 14, color: '#AC2424', lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#929E95', borderRadius: 12, padding: 14, minHeight: 48, backgroundColor: '#FFF', color: '#19382F', fontSize: 16 },
  button: { minHeight: 48, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#21584B' },
  photo: { width: '100%', height: 240, borderRadius: 14, backgroundColor: '#DCE8DF' },
});
export function Action({ title, onPress, disabled = false, secondary = false, accessibilityLabel = title, selected }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean; accessibilityLabel?: string; selected?: boolean }) {
  return <Pressable accessibilityRole={selected === undefined ? "button" : "checkbox"} accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled, checked: selected }} aria-checked={selected} aria-disabled={disabled} disabled={disabled} onPress={onPress} style={({ pressed }) => [ui.button, { maxWidth: '100%', flexShrink: 1, minWidth: 48 }, secondary && { backgroundColor: '#E5EEE8' }, { opacity: disabled || pressed ? 0.55 : 1 }]}><Text style={{ fontSize: 15, fontWeight: '700', color: secondary ? '#214B3E' : '#FFF', textAlign: 'center', flexShrink: 1 }}>{title}</Text></Pressable>;
}
export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const id = useId();
  return <View style={{ gap: 6 }}><Text nativeID={`${id}-label`} style={ui.text}>{label}</Text><TextInput accessibilityLabel={label} accessibilityHint={error || undefined} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} placeholderTextColor="#687A72" style={ui.input} {...props} />{error ? <Text nativeID={`${id}-error`} accessibilityRole="alert" accessibilityLiveRegion="polite" style={ui.error}>{error}</Text> : null}</View>;
}
export function Message({ text }: { text: string }) { return text ? <Text accessibilityLiveRegion="polite" style={ui.error}>{text}</Text> : null; }
