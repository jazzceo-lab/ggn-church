"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext({
  user: null,
  loading: true,
  isAdmin: false,
  isBoardAdmin: false,
  district: null,
  memberTitle: null,
  roles: new Set(),
  hasRole: () => false,
  unreadCount: 0,
  refreshUnreadCount: () => {},
  boardNewCount: 0,
  markBoardSeen: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBoardAdmin, setIsBoardAdmin] = useState(false);
  const [district, setDistrict] = useState(null);
  const [memberTitle, setMemberTitle] = useState(null);
  const [roles, setRoles] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [boardNewCount, setBoardNewCount] = useState(0);
  const [boardLastSeenAt, setBoardLastSeenAt] = useState(null);
  const [toast, setToast] = useState(null);
  const channelRef = useRef(null);
  const boardChannelRef = useRef(null);

  async function loadProfile(currentUser) {
    if (!currentUser) {
      setIsAdmin(false);
      setIsBoardAdmin(false);
      setDistrict(null);
      setMemberTitle(null);
      setRoles(new Set());
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("is_admin, is_board_admin, is_suspended, district, board_last_seen_at, title")
      .eq("id", currentUser.id)
      .single();

    if (data?.is_suspended) {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setIsBoardAdmin(false);
      setDistrict(null);
      setMemberTitle(null);
      setRoles(new Set());
      setUser(null);
      window.alert("이용이 정지된 계정입니다. 문의사항은 교회 사무실로 연락해주세요.");
      return;
    }

    setIsAdmin(data?.is_admin ?? false);
    setIsBoardAdmin(data?.is_board_admin ?? false);
    setDistrict(data?.district ?? null);
    setMemberTitle(data?.title ?? null);
    setBoardLastSeenAt(data?.board_last_seen_at ?? null);

    const { data: roleRows } = await supabase
      .from("member_roles")
      .select("role_key")
      .eq("user_id", currentUser.id);
    setRoles(new Set((roleRows ?? []).map((r) => r.role_key)));

    return data?.board_last_seen_at ?? null;
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

  async function refreshBoardNewCount(currentUser, lastSeenOverride) {
    const u = currentUser ?? user;
    if (!u) {
      setBoardNewCount(0);
      return;
    }
    const lastSeen = lastSeenOverride !== undefined ? lastSeenOverride : boardLastSeenAt;
    if (!lastSeen) {
      await markBoardSeen(u);
      return;
    }
    const { count } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .gt("created_at", lastSeen)
      .neq("user_id", u.id);
    setBoardNewCount(count ?? 0);
  }

  async function markBoardSeen(currentUser) {
    const u = currentUser ?? user;
    if (!u) return;
    const now = new Date().toISOString();
    setBoardLastSeenAt(now);
    setBoardNewCount(0);
    await supabase.from("profiles").update({ board_last_seen_at: now }).eq("id", u.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      const lastSeen = await loadProfile(currentUser);
      await refreshUnreadCount(currentUser);
      await refreshBoardNewCount(currentUser, lastSeen);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      const lastSeen = await loadProfile(currentUser);
      await refreshUnreadCount(currentUser);
      await refreshBoardNewCount(currentUser, lastSeen);
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
    if (boardChannelRef.current) {
      supabase.removeChannel(boardChannelRef.current);
      boardChannelRef.current = null;
    }
    if (!user) return;

    const channel = supabase
      .channel(`board-posts-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          if (payload.new.user_id === user.id) return;
          setBoardNewCount((c) => c + 1);
        }
      )
      .subscribe();

    boardChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;
    if (unreadCount > 0) {
      navigator.setAppBadge(unreadCount).catch(() => {});
    } else {
      navigator.clearAppBadge().catch(() => {});
    }
  }, [unreadCount]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isBoardAdmin,
        district,
        memberTitle,
        roles,
        hasRole: (key) => roles.has(key),
        unreadCount,
        refreshUnreadCount: () => refreshUnreadCount(),
        boardNewCount,
        markBoardSeen,
      }}
    >
      {children}
      {toast && (
        <a
          href={`/messages/${toast.senderId}`}
          className="fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-black/10 bg-background p-4 shadow-lg transition-opacity dark:border-white/10"
        >
          <p className="text-sm font-semibold text-foreground">✉️ {toast.name}님의 새 쪽지</p>
          <p className="mt-1 truncate text-sm text-foreground/60">{toast.body}</p>
        </a>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
