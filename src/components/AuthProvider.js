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
  displayName: null,
  roles: new Set(),
  hasRole: () => false,
  hasRoleScope: () => false,
  unreadCount: 0,
  refreshUnreadCount: () => {},
  boardNewCount: 0,
  markBoardSeen: () => {},
  groupUnreadCount: 0,
  refreshGroupUnreadCount: () => {},
  refreshGroupConversationIds: () => {},
  onlineUserIds: new Set(),
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBoardAdmin, setIsBoardAdmin] = useState(false);
  const [district, setDistrict] = useState(null);
  const [memberTitle, setMemberTitle] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [roles, setRoles] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [boardNewCount, setBoardNewCount] = useState(0);
  const [boardLastSeenAt, setBoardLastSeenAt] = useState(null);
  const [groupUnreadCount, setGroupUnreadCount] = useState(0);
  const [groupConversationIds, setGroupConversationIds] = useState([]);
  const [toast, setToast] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const channelRef = useRef(null);
  const boardChannelRef = useRef(null);
  const groupChannelRef = useRef(null);
  const presenceChannelRef = useRef(null);

  async function loadProfile(currentUser) {
    if (!currentUser) {
      setIsAdmin(false);
      setIsBoardAdmin(false);
      setDistrict(null);
      setMemberTitle(null);
      setDisplayName(null);
      setRoles(new Set());
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("is_admin, is_board_admin, is_suspended, district, board_last_seen_at, title, display_name")
      .eq("id", currentUser.id)
      .single();

    if (data?.is_suspended) {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setIsBoardAdmin(false);
      setDistrict(null);
      setMemberTitle(null);
      setDisplayName(null);
      setRoles(new Set());
      setUser(null);
      window.alert("이용이 정지된 계정입니다. 문의사항은 교회 사무실로 연락해주세요.");
      return;
    }

    setIsAdmin(data?.is_admin ?? false);
    setIsBoardAdmin(data?.is_board_admin ?? false);
    setDistrict(data?.district ?? null);
    setMemberTitle(data?.title ?? null);
    setDisplayName(data?.display_name ?? null);
    setBoardLastSeenAt(data?.board_last_seen_at ?? null);

    const { data: roleRows } = await supabase
      .from("member_roles")
      .select("role_key, scope")
      .eq("user_id", currentUser.id);
    setRoles(new Set((roleRows ?? []).map((r) => `${r.role_key}:${r.scope}`)));

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
      .is("read_at", null)
      .is("deleted_at", null);
    setUnreadCount(count ?? 0);
  }

  async function refreshGroupConversationIds(currentUser) {
    const u = currentUser ?? user;
    if (!u) {
      setGroupConversationIds([]);
      return [];
    }
    const { data } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", u.id);
    const ids = (data ?? []).map((r) => r.conversation_id);
    setGroupConversationIds(ids);
    return ids;
  }

  async function refreshGroupUnreadCount(currentUser) {
    const u = currentUser ?? user;
    if (!u) {
      setGroupUnreadCount(0);
      return;
    }
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", u.id);
    if (!participants?.length) {
      setGroupUnreadCount(0);
      return;
    }
    const ids = participants.map((p) => p.conversation_id);
    const { data: msgs } = await supabase
      .from("conversation_messages")
      .select("conversation_id, sender_id, created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false });

    const latestByConv = new Map();
    for (const m of msgs ?? []) {
      if (!latestByConv.has(m.conversation_id)) latestByConv.set(m.conversation_id, m);
    }

    let count = 0;
    for (const p of participants) {
      const last = latestByConv.get(p.conversation_id);
      if (!last || last.sender_id === u.id) continue;
      if (!p.last_read_at || new Date(last.created_at) > new Date(p.last_read_at)) count++;
    }
    setGroupUnreadCount(count);
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
      await refreshGroupConversationIds(currentUser);
      await refreshGroupUnreadCount(currentUser);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      const lastSeen = await loadProfile(currentUser);
      await refreshUnreadCount(currentUser);
      await refreshBoardNewCount(currentUser, lastSeen);
      await refreshGroupConversationIds(currentUser);
      await refreshGroupUnreadCount(currentUser);
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
            title: `✉️ ${sender?.display_name ?? "누군가"}`,
            body: payload.new.body,
            href: `/messages/${payload.new.sender_id}`,
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
    if (groupChannelRef.current) {
      supabase.removeChannel(groupChannelRef.current);
      groupChannelRef.current = null;
    }
    if (!user || groupConversationIds.length === 0) return;

    const channel = supabase
      .channel(`group-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=in.(${groupConversationIds.join(",")})`,
        },
        async (payload) => {
          if (payload.new.sender_id === user.id) return;
          refreshGroupUnreadCount();
          const [{ data: conv }, { data: sender }] = await Promise.all([
            supabase.from("conversations").select("name").eq("id", payload.new.conversation_id).single(),
            supabase.from("member_directory").select("display_name").eq("id", payload.new.sender_id).single(),
          ]);
          setToast({
            title: conv?.name
              ? `👥 ${conv.name} · ${sender?.display_name ?? "누군가"}`
              : `👥 ${sender?.display_name ?? "누군가"}님의 새 그룹 메시지`,
            body: payload.new.body,
            href: `/messages/group/${payload.new.conversation_id}`,
          });
        }
      )
      .subscribe();

    groupChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, groupConversationIds]);

  // 관리자 회원관리 화면에서 "지금 앱을 켜놓은 회원"을 보여주기 위한 접속 현황.
  // Supabase Presence는 채널 단위로 상태를 공유하므로 별도 테이블 없이,
  // 로그인한 사람은 누구나 자신을 이 채널에 등록하고 전체 목록을 함께 받는다.
  useEffect(() => {
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
    if (!user) {
      setOnlineUserIds(new Set());
      return;
    }

    const channel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });

    channel.on("presence", { event: "sync" }, () => {
      setOnlineUserIds(new Set(Object.keys(channel.presenceState())));
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

    presenceChannelRef.current = channel;
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
    const total = unreadCount + groupUnreadCount;
    if (total > 0) {
      if ("setAppBadge" in navigator) navigator.setAppBadge(total).catch(() => {});
      return;
    }
    if ("setAppBadge" in navigator) navigator.clearAppBadge().catch(() => {});
    // 안드로이드 일부 런처는 앱 배지를 "알림창에 안 지워진 알림이 있는지"로도
    // 판단해서, setAppBadge만 지워도 예전에 뜬 알림이 남아있으면 아이콘 점이
    // 안 사라질 수 있다. 다 읽은 시점(총 안읽음 0)엔 남은 알림도 같이 지운다.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.getNotifications())
        .then((notifications) => notifications.forEach((n) => n.close()))
        .catch(() => {});
    }
  }, [unreadCount, groupUnreadCount]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isBoardAdmin,
        district,
        memberTitle,
        displayName,
        roles,
        hasRole: (key) => roles.has(`${key}:`),
        hasRoleScope: (key, scope) => roles.has(`${key}:${scope ?? ""}`),
        unreadCount,
        refreshUnreadCount: () => refreshUnreadCount(),
        boardNewCount,
        markBoardSeen,
        groupUnreadCount,
        refreshGroupUnreadCount: () => refreshGroupUnreadCount(),
        refreshGroupConversationIds: () => refreshGroupConversationIds(),
        onlineUserIds,
      }}
    >
      {children}
      {toast && (
        <a
          href={toast.href}
          className="fixed bottom-4 right-4 z-50 max-w-xs rounded-xl border border-black/10 bg-background p-4 shadow-lg transition-opacity dark:border-white/10"
        >
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          <p className="mt-1 truncate text-sm text-foreground/60">{toast.body}</p>
        </a>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
