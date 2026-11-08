import { withUser, serviceResponse } from "@/lib/mobile-api";
import { deleteAccount } from "@/lib/services/account";

export const dynamic = "force-dynamic";

/**
 * Hesabı ve dükkanı kalıcı olarak siler (Apple 5.1.1(v) uygulama içinden silme şartı).
 * Mağaza aboneliği bununla iptal olmaz; uygulama silmeden önce uyarı gösterir.
 */
export async function DELETE(req: Request) {
  return withUser(req, async (user) => serviceResponse(await deleteAccount(user.id)));
}
