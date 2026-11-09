// react-native Text yerine kullanılır: stildeki fontWeight'e göre doğru font
// dosyasını seçer (Fraunces / Plus Jakarta Sans). Uygulamada metin için her yerde
// bu bileşen (ya da onu kullanan AppText) kullanılmalı.
import { StyleSheet, Text as RNText, TextInput as RNTextInput, type TextProps } from "react-native";
import { resolveFontFamily } from "@/lib/fonts";

type InputProps = React.ComponentProps<typeof RNTextInput>;

function withFont<S>(style: S) {
  const flat = (StyleSheet.flatten(style as any) ?? {}) as { fontFamily?: string; fontWeight?: unknown };
  return [
    style,
    // Seçilen dosya zaten o ağırlıkta; ek fontWeight iOS/Android'de sahte kalınlık üretir
    { fontFamily: resolveFontFamily(flat.fontFamily, flat.fontWeight), fontWeight: "normal" as const },
  ];
}

export function Text({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={withFont(style)} />;
}

export function TextInput({ style, ...rest }: InputProps) {
  return <RNTextInput {...rest} style={withFont(style)} />;
}
