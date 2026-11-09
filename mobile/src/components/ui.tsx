// Uygulama genelinde kullanılan temel bileşenler (web'deki components/ui karşılığı).
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/theme";

export function Screen({
  children,
  scroll = true,
  edges = ["top", "bottom"],
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.screenContent, contentStyle]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.screenContent, contentStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type TextVariant = "title" | "heading" | "body" | "muted" | "small" | "label";

export function AppText({
  children,
  variant = "body",
  style,
  ...rest
}: {
  children: ReactNode;
  variant?: TextVariant;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  selectable?: boolean;
}) {
  return (
    <Text style={[textStyles[variant], style]} {...rest}>
      {children}
    </Text>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;
  const v = buttonVariants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && !isDisabled && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <Text style={[styles.buttonText, { color: v.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Input({ label, error, style, ...rest }: TextInputProps & { label?: string; error?: string | null }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={textStyles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.text3}
        selectionColor={colors.accent}
        style={[styles.input, error ? { borderColor: colors.red } : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ErrorBanner({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner} accessibilityRole="alert">
      <Text style={{ color: colors.red, fontSize: 14 }}>{message}</Text>
    </View>
  );
}

export function InfoBanner({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <View style={styles.infoBanner}>
      <Text style={{ color: colors.accent, fontSize: 14 }}>{message}</Text>
    </View>
  );
}

export function LinkText({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <Text accessibilityRole="link" onPress={onPress} style={{ color: colors.accent, fontWeight: "600" }}>
      {children}
    </Text>
  );
}

export function Loading() {
  return (
    <View style={[styles.flex, { alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }]}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

export function Brand({ subtitle }: { subtitle?: string }) {
  return (
    <View style={{ alignItems: "center", marginBottom: spacing.xxl }}>
      <View style={styles.logo}>
        <Text style={{ fontSize: 26 }}>✂</Text>
      </View>
      <Text style={textStyles.title}>BerberBot</Text>
      {subtitle ? <Text style={[textStyles.muted, { marginTop: spacing.xs }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={{ color: active ? colors.onAccent : colors.text2, fontWeight: "700", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

/** Menü / liste satırı: başlık, alt metin, sağda değer veya ok */
export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  danger,
}: {
  title: string;
  subtitle?: string | null;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const content = (
    <View style={styles.listRow}>
      <View style={{ flex: 1 }}>
        <Text style={[textStyles.body, { fontWeight: "600" }, danger && { color: colors.red }]}>{title}</Text>
        {subtitle ? <Text style={[textStyles.small, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Text style={{ color: colors.text3, fontSize: 20 }}>›</Text> : null)}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {content}
    </Pressable>
  );
}

export function SwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.listRow}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={[textStyles.body, { fontWeight: "600" }]}>{title}</Text>
        {subtitle ? <Text style={[textStyles.small, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.bg4, true: colors.accent2 }}
        thumbColor={value ? colors.accent : colors.text2}
      />
    </View>
  );
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.xs }}>
      <Text style={[textStyles.body, { color: colors.text2, fontWeight: "600" }]}>{title}</Text>
      {description ? <Text style={[textStyles.small, { textAlign: "center" }]}>{description}</Text> : null}
    </View>
  );
}

/** Seçim alanı görünümünde buton (tarih, saat, hizmet seçimi) */
export function SelectField({ label, value, placeholder, onPress }: { label?: string; value?: string | null; placeholder: string; onPress: () => void }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={textStyles.label}>{label}</Text> : null}
      <Pressable accessibilityRole="button" onPress={onPress} style={[styles.input, { justifyContent: "center" }]}>
        <Text style={{ color: value ? colors.text : colors.text3, fontSize: 16 }}>{value || placeholder}</Text>
      </Pressable>
    </View>
  );
}

const buttonVariants = {
  primary: { bg: colors.accent, border: colors.accent, text: colors.onAccent },
  secondary: { bg: colors.bg3, border: colors.border2, text: colors.text },
  ghost: { bg: "transparent", border: "transparent", text: colors.text2 },
  danger: { bg: "rgba(255, 95, 87, 0.12)", border: "rgba(255, 95, 87, 0.35)", text: colors.red },
};

export const textStyles = StyleSheet.create({
  title: { color: colors.text, fontSize: 26, fontWeight: "800" },
  heading: { color: colors.text, fontSize: 18, fontWeight: "700" },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  muted: { color: colors.text2, fontSize: 14, lineHeight: 20 },
  small: { color: colors.text3, fontSize: 12, lineHeight: 17 },
  label: { color: colors.text2, fontSize: 13, fontWeight: "600", marginBottom: 6 },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: spacing.xl, gap: spacing.lg, flexGrow: 1 },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
  field: { width: "100%" },
  input: {
    minHeight: 50,
    backgroundColor: colors.bg2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 16,
  },
  fieldError: { color: colors.red, fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: colors.bg2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  errorBanner: {
    backgroundColor: "rgba(255, 95, 87, 0.1)",
    borderColor: "rgba(255, 95, 87, 0.3)",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoBanner: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accentDim2,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.bg3,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  listRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.md, gap: spacing.md, minHeight: 52 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accentDim2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
});
