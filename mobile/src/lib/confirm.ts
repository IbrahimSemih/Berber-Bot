// Onay penceresi: telefonda Alert, tarayıcı önizlemesinde window.confirm
// (react-native-web'de Alert.alert butonları desteklenmez).
import { Alert, Platform } from "react-native";

export function confirmAction(opts: {
  title: string;
  message?: string;
  confirmText: string;
  destructive?: boolean;
}): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm([opts.title, opts.message].filter(Boolean).join("\n\n")));
  }
  return new Promise((resolve) => {
    Alert.alert(
      opts.title,
      opts.message,
      [
        { text: "Vazgeç", style: "cancel", onPress: () => resolve(false) },
        { text: opts.confirmText, style: opts.destructive ? "destructive" : "default", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
