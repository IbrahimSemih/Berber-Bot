// Oturum + dükkan durumu. Web'deki middleware.ts yönlendirmesinin mobil karşılığı:
// oturum yok → giriş, dükkan yok → onboarding, banlı → banned, kilitli → paywall.
// Kilit kuralı web ile aynı fonksiyondan gelir (shared/plan.ts#computeIsLocked).
// Bu kontrol kullanıcı deneyimi içindir; asıl koruma sunucuda ve RLS'tedir.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { computeIsLocked, getAccessEndDate } from "@shared/plan";
import { supabase } from "./supabase";
import { unregisterPush } from "./push";

export type MobileShop = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  status: string | null;
  subscription_status: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  billing_provider?: string | null;
};

export type AuthStatus = "loading" | "signedOut" | "noShop" | "banned" | "locked" | "ready" | "error";

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  shop: MobileShop | null;
  accessEndsAt: Date | null;
  /** Deneme sürüyorsa kalan gün (yukarı yuvarlanmış), değilse null */
  trialDaysLeft: number | null;
  error: string | null;
  /** Dükkan satırını yeniden okur (onboarding, satın alma sonrası, ön plana gelince). */
  refreshShop: () => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Şifre sıfırlama: kod doğrulanınca oturum açılır ama yeni şifre belirlenene kadar
   * kullanıcı giriş ekranlarında kalmalı. true iken durum "signedOut" gibi davranır.
   */
  setHoldAuthRoutes: (hold: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const BASE_COLUMNS = "id, name, slug, owner_id, status, subscription_status, trial_end, current_period_end";

async function fetchOwnShop(uid: string): Promise<MobileShop | null> {
  let result = await supabase
    .from("shops")
    .select(`${BASE_COLUMNS}, billing_provider`)
    .eq("owner_id", uid)
    .maybeSingle();
  // 2026-11-08c migration'ı çalıştırılmamış bir veritabanında billing_provider sütunu yoksa temel sütunlarla tekrar dene
  if (result.error?.code === "42703") {
    result = (await supabase.from("shops").select(BASE_COLUMNS).eq("owner_id", uid).maybeSingle()) as typeof result;
  }
  if (result.error) throw result.error;
  return (result.data as MobileShop | null) ?? null;
}

export const shopQueryKey = (uid: string | null) => ["own-shop", uid] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [holdAuthRoutes, setHoldAuthRoutes] = useState(false);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    // Not: bu callback içinde başka bir supabase çağrısı await edilmemeli (kilitlenme riski)
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionLoaded(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const shopQuery = useQuery({
    queryKey: shopQueryKey(userId),
    queryFn: () => fetchOwnShop(userId!),
    enabled: !!userId,
    staleTime: 0,
  });
  const { refetch } = shopQuery;

  // Uygulama ön plana gelince dükkanı yeniden oku (abonelik/kilit değişmiş olabilir)
  useEffect(() => {
    if (!userId) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refetch();
    });
    return () => sub.remove();
  }, [userId, refetch]);

  const refreshShop = useCallback(async () => {
    if (userId) await refetch();
  }, [userId, refetch]);

  const signOut = useCallback(async () => {
    await unregisterPush(); // oturum kapanmadan, token hâlâ geçerliyken
    await supabase.auth.signOut();
    queryClient.clear(); // önceki kullanıcının önbelleğe alınmış verisi kalmasın
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    // undefined: henüz okunmadı, null: dükkan yok
    const shop = shopQuery.data;
    // Kilit zamana bağlı: dükkanın okunduğu an esas alınır (her ön plana dönüşte yenilenir)
    const now = shopQuery.dataUpdatedAt;

    let status: AuthStatus;
    if (!sessionLoaded) status = "loading";
    else if (!session || holdAuthRoutes) status = "signedOut";
    else if (shop === undefined) status = shopQuery.isError ? "error" : "loading";
    else if (shop === null) status = "noShop";
    else if (shop.status === "banned") status = "banned";
    else if (computeIsLocked(shop, new Date(now))) status = "locked";
    else status = "ready";

    const accessEndsAt = shop ? getAccessEndDate(shop) : null;
    return {
      status,
      session,
      shop: shop ?? null,
      accessEndsAt,
      trialDaysLeft:
        shop?.subscription_status === "trialing" && accessEndsAt
          ? Math.max(0, Math.ceil((accessEndsAt.getTime() - now) / 86_400_000))
          : null,
      error: shopQuery.isError
        ? "Dükkan bilgileri alınamadı. İnternet bağlantınızı kontrol edip tekrar deneyin."
        : null,
      refreshShop,
      signOut,
      setHoldAuthRoutes,
    };
  }, [
    sessionLoaded,
    session,
    holdAuthRoutes,
    shopQuery.data,
    shopQuery.dataUpdatedAt,
    shopQuery.isError,
    refreshShop,
    signOut,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı.");
  return ctx;
}
