"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext({
  user: null,
  loading: true,
  isAdmin: false,
  isBoardAdmin: false,
  district: null,
  unreadCount: 0,
  refreshUnreadCount: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBoardAdmin, setIsBoardAdmin] = useState(false);
  const [district, setDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  const channelRef = useRef(null);

  async function loadProfile(currentUser) {
    if (!currentUser) {
      setIsAdmin(false);
      setIsBoardAdmin(false);
      setDistrict(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("is_admin, is_board_admin, is_suspended, district")
      .eq("id", currentUser.id)
      .single();

    if (data?.is_suspended) {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setIsBoardAdmin(false);
      setDistrict(null);
      setUser(null);
      window.alert("이용이 정지된 계정입니다. 문의사항은 교회 사무실로 연락해주세요.");
      return;
    }

    setIsAdmin(data?.is_admin ?? false);
    setIsBoardAdmin(data?.is_board_admin ?? false);
    setDistrict(data?.district ?? null);
  }

  async function refreshUnreadCount(currentUser) {
    const u = currentUser ?? user;
    if (!u) {
      setUnreadCount(0);
      return;
    }
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", u.id)
      .is("read_at", null);
    setUnreadCount(count ?? 0);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      await loadProfile(currentUser);
      await refreshUnreadCount(currentUser);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await loadProfile(currentUser);
      await refreshUnreadCount(currentUser);
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (!user) return;

    const channel = supabase
      .channel(`messages-to-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          setUnreadCount((c) => c + 1);
          const { data: sender } = await supabase
            .from("member_directory")
            .select("display_name")
            .eq("id", payload.new.sender_id)
            .single();
          setToast({
            name: sender?.display_name ?? "누군가",
            body: payload.new.body,
            senderId: payload.new.sender_id,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isBoardAdmin,
        district,
        unreadCount,
        refreshUnreadCount: () => refreshUnreadCount(),
      }}
    >
      {children}
      {toast && (
        <a
          href={`/messages/${toast.senderId}`}
          className="fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-black/10 bg-background p-4 shadow-lg transition-opacity dark:border-white/10"
        >
          <p className="text-sm font-semibold text-foreground">💬 {toast.name}님의 새 쪽지</p>
          <p className="mt-1 truncate text-sm text-foreground/60">{toast.body}</p>
        </a>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
