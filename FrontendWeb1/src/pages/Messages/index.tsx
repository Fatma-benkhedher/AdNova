import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import { fetchMessages, fetchMessage, fetchReplies, postReply, type Message } from "../../services/messages";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

// ─── TYPE MAPPING ───────────────────────────────────────────────────────────
const REQUEST_TYPE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  support: { label: "Technical Support", icon: "🔧", color: "#60A5FA" },
  technical_support: { label: "Technical Support", icon: "🔧", color: "#60A5FA" },
  information: { label: "Information Request", icon: "ℹ️", color: "#A78BFA" },
  information_request: { label: "Information Request", icon: "ℹ️", color: "#A78BFA" },
  complaint: { label: "Complaint", icon: "⚠️", color: "#F87171" },
  feedback: { label: "Feedback", icon: "💬", color: "#34D399" },
};

function getTypeInfo(requestType: string) {
  const key = (requestType || "").toLowerCase().replace(/\s+/g, "_");
  return REQUEST_TYPE_MAP[key] ?? { label: requestType || "Other", icon: "📩", color: "#94A3B8" };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
/** Full date: weekday, day month at time (e.g. "Monday 28 November at 09:42") */
const fmtFull = (d: Date) =>
  d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) + " at " + fmtTime(d);
// ─── ICONS ───────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
    <polyline points="15,18 9,12 15,6" />
  </svg>
);
const InboxIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="22,12 16,12 14,15 10,15 8,12 2,12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);
const ChevronRight = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
    <polyline points="9,18 15,12 9,6" />
  </svg>
);
const SendIcon = () => (
  <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22,2 15,22 11,13 2,9" />
  </svg>
);

// ─── TICKET TYPE (transformed from API) ──────────────────────────────────────
type Ticket = {
  messageId: number;
  id: string;
  subject: string;
  type: { label: string; icon: string; color: string };
  user: { name: string; initials: string };
  userId?: number;
  messages: { from: "user" | "agent"; text: string; time: Date; senderName?: string }[];
};

function messageToTicket(
  m: Message,
  replies?: { content: string; createdAt: string; responder?: { firstName?: string; lastName?: string } }[],
): Ticket {
  // Créer le nom à partir de firstName et lastName, avec fallback sur email
  const name = m.user
    ? `${m.user.firstName || ""} ${m.user.lastName || ""}`.trim() || m.user.email || "User"
    : "User";
  const initials =
    m.user?.firstName && m.user?.lastName
      ? `${m.user.firstName[0]}${m.user.lastName[0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  const typeInfo = getTypeInfo(m.requestType);
  const time = m.createdAt ? new Date(m.createdAt) : new Date();
  const agentMessages = (replies || []).map((r) => {
    const responderName = r.responder
      ? `${r.responder.firstName || ""} ${r.responder.lastName || ""}`.trim() || "Support Agent"
      : "Support Agent";
    return {
      from: "agent" as const,
      text: r.content,
      time: new Date(r.createdAt),
      senderName: responderName,
    };
  });
  // Assurer que le premier message contient le senderName avec firstName et lastName si disponibles
  const userSenderName = m.user
    ? `${m.user.firstName || ""} ${m.user.lastName || ""}`.trim() || m.user.email || "User"
    : "User";
  return {
    messageId: m.id,
    id: `#${m.id}`,
    subject: m.subject || "No subject",
    type: typeInfo,
    user: { name, initials },
    userId: m.user?.id,
    messages: [{ from: "user" as const, text: m.content || "", time, senderName: userSenderName }, ...agentMessages],
  };
}

// ─── INBOX LIST ───────────────────────────────────────────────────────────────
function InboxList({
  tickets,
  onSelect,
  loading,
  isOperator,
}: {
  tickets: Ticket[];
  onSelect: (t: Ticket) => void;
  loading: boolean;
  isOperator: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "replied" | "pending">("all");

  const filters = [
    { k: "all" as const, label: "All" },
    { k: "replied" as const, label: isOperator ? "Handled" : "Replied" },
    { k: "pending" as const, label: isOperator ? "To handle" : "Pending" },
  ];

  const displayed = tickets
    .slice()
    .sort((a, b) => b.messages[b.messages.length - 1]!.time.getTime() - a.messages[a.messages.length - 1]!.time.getTime())
    .filter((t) => {
      const hasReply = t.messages.some((m) => m.from === "agent");
      if (filter === "replied") return hasReply;
      if (filter === "pending") return !hasReply;
      return true;
    });

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center dark:bg-gray-900/50 rounded-2xl">
        <span className="text-gray-500 dark:text-gray-400">Loading messages...</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50 overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white">
              <InboxIcon />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Messages</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your support requests & responses</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {tickets.filter((t) => t.messages.some((m) => m.from === "agent")).length} replied
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {filters.map((f) => {
            const count =
              f.k === "all"
                ? tickets.length
                : f.k === "replied"
                  ? tickets.filter((t) => t.messages.some((m) => m.from === "agent")).length
                  : tickets.filter((t) => !t.messages.some((m) => m.from === "agent")).length;
            const active = filter === f.k;
            return (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  active
                    ? "bg-blue-500/15 text-blue-500 border border-blue-500/30"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800" />
      <div className="p-4 md:p-6 space-y-3 max-h-[600px] overflow-y-auto">
        {displayed.length === 0 ? (
          <p className="text-center py-12 text-gray-500 dark:text-gray-400">No messages yet.</p>
        ) : (
          displayed.map((t) => {
            const lastMsg = t.messages[t.messages.length - 1];
            const hasReply = t.messages.some((m) => m.from === "agent");
            const replyCount = t.messages.filter((m) => m.from === "agent").length;
            const pendingLabel = isOperator ? "TO HANDLE" : "PENDING";

            return (
              <div
                key={t.id}
                onClick={() => onSelect(t)}
                className="relative flex items-center gap-4 p-4 pl-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                  style={{ background: t.type.color }}
                />
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: `${t.type.color}25`, color: t.type.color }}
                >
                  {t.user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {t.subject}
                    </span>
                    <span
                      className={`shrink-0 w-2.5 h-2.5 rounded-full ${
                        hasReply ? "bg-green-500" : "bg-amber-500"
                      }`}
                      title={hasReply ? (isOperator ? "Handled" : "Replied") : (isOperator ? "To handle" : "Pending")}
                    />
                    {!hasReply && (
                      <span className="shrink-0 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                        {pendingLabel}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    <span style={lastMsg.from === "agent" ? { color: t.type.color } : undefined}>
                      {lastMsg.from === "agent" ? "Support: " : (isOperator ? `${t.user.name}: ` : "You: ")}
                    </span>
                    {lastMsg.text}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {fmtFull(lastMsg.time)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${t.type.color}15`, color: t.type.color }}
                    >
                      {t.type.icon} {t.type.label}
                    </span>
                    {hasReply && (
                      <span className="text-[10px] font-semibold text-green-500 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full">
                        {replyCount} reply
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0"><ChevronRight /></span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── CONVERSATION DETAIL ─────────────────────────────────────────────────────
function ConversationDetail({
  ticket,
  onBack,
  isOperator,
  currentUserId,
}: {
  ticket: Ticket;
  onBack: () => void;
  isOperator?: boolean;
  currentUserId?: number;
}) {
  const { type } = ticket;
  const [messages, setMessages] = useState(ticket.messages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(ticket.messages.some((m) => m.from === "agent"));
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasReply = messages.some((m) => m.from === "agent");
  const lastIsAgent = messages[messages.length - 1]?.from === "agent";
  const canReply = isOperator ? true : hasReply;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const repliesToMessages = (
    replies: { content: string; createdAt: string; responder?: { id: number; role?: string | null; firstName?: string; lastName?: string } }[],
  ) =>
    replies.map((r) => {
      const responderRole = (r.responder?.role ?? "").toLowerCase();
      const from: "user" | "agent" =
        responderRole === "operator" ? "agent" : (r.responder?.id === currentUserId ? "user" : "user");
      const responderName = r.responder
        ? `${r.responder.firstName || ""} ${r.responder.lastName || ""}`.trim() || "Support Agent"
        : "Support Agent";
      return {
        from,
        text: r.content,
        time: new Date(r.createdAt),
        senderName: responderName,
      };
    });

  useEffect(() => {
    if (!ticket.messageId) return;
    setRepliesLoaded(false);
    fetchReplies(ticket.messageId)
      .then((replies) => {
        const replyMessages = repliesToMessages(replies);
        setMessages((prev) => (prev.length === 1 ? [prev[0], ...replyMessages] : prev));
      })
      .catch(() => {})
      .finally(() => setRepliesLoaded(true));
  }, [ticket.messageId, currentUserId]);

  const sendReply = async () => {
    if (!text.trim() || currentUserId == null || !ticket.messageId) return;
    const contentToSend = text.trim();
    setText("");
    const from: "user" | "agent" = isOperator ? "agent" : "user";
    const optimisticMsg = { from, text: contentToSend, time: new Date() };
    setMessages((prev) => [...prev, optimisticMsg]);
    if (isOperator) {
      setSending(true);
      try {
        await postReply(ticket.messageId, contentToSend, currentUserId);
        const replies = await fetchReplies(ticket.messageId);
        setMessages((prev) => [prev[0], ...repliesToMessages(replies)]);
      } finally {
        setSending(false);
      }
      return;
    }
    if (hasReply) {
      setSending(true);
      try {
        await postReply(ticket.messageId, contentToSend, currentUserId);
        const replies = await fetchReplies(ticket.messageId);
        setMessages((prev) => [prev[0], ...repliesToMessages(replies)]);
      } finally {
        setSending(false);
      }
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50 min-h-[70vh]">
      <div className="px-4 md:px-6 h-16 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
        >
          <BackIcon />
        </button>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0" style={{ background: `${type.color}20` }}>
          {type.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{ticket.subject}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {ticket.user.name} · <span style={{ color: type.color }}>{type.label}</span>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${
            hasReply ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${hasReply ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
          {hasReply ? "Replied" : "Pending"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-[320px]">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 mb-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                {ticket.user.initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{ticket.user.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{messages.length} message{messages.length > 1 ? "s" : ""}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Opened {fmtDate(messages[0].time)}</div>
          </div>

          {messages.map((msg, i) => {
            const isUser = msg.from === "user";
            const showSender = i === 0 || messages[i - 1]?.from !== msg.from;
            const rowAlign = isUser ? "justify-start" : "justify-end";
            const bubbleBg = isUser ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500" : "bg-gray-50 dark:bg-gray-800/50";
            return (
              <div key={i} className={`flex ${rowAlign} mb-1.5`}>
                <div className="max-w-[760px] w-full">
                  {showSender && (
                    <div className={`flex items-center gap-2 mb-1.5 ${i > 0 ? "mt-5" : ""} ${isUser ? "" : "justify-end"}`}>
                      {isUser && (
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-br from-blue-600 to-blue-500 text-white">
                          {ticket.user.initials}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {msg.senderName || (isUser ? ticket.user.name : "Support Agent")}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{fmtFull(msg.time)}</span>
                      {!isUser && (
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: `${type.color}25`, color: type.color }}
                        >
                          🤖
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`flex ${rowAlign}`}>
                    <div
                      className={`rounded-lg px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-l-4 ${bubbleBg}`}
                      style={!isUser ? { borderLeftColor: type.color } : undefined}
                    >
                      <span className="whitespace-pre-wrap break-words block">{msg.text}</span>
                      <div className={`mt-2 flex ${isUser ? "justify-end" : "justify-start"} text-xs text-gray-500 dark:text-gray-400`}>
                        {fmtTime(msg.time)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!isOperator && repliesLoaded && !hasReply && (
            <div className="mt-6 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 p-4 flex items-center gap-3">
              <span className="text-xl">⏳</span>
              <div>
                <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">Awaiting response</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Our team will reply within 24 hours.</div>
              </div>
            </div>
          )}

          {hasReply && lastIsAgent && (
            <div className="mt-7 flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full whitespace-nowrap">
                ✓ You can reply below
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {canReply && (
        <div className="border-t border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-dark-card/90 dark:border-dark-card p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                {ticket.user.initials}
              </div>
              <span className="text-xs text-gray-500 dark:text-dark-text-secondary font-medium">Reply as {isOperator ? "Support Agent" : ticket.user.name}</span>
            </div>
            <div className="flex gap-2 items-end">
              <div className={`flex-1 rounded-xl border p-3 transition-colors ${text.trim() ? "border-blue-400 dark:border-adbot-orange-border" : "border-gray-200 dark:border-white/20"}`}>
                <textarea
                  placeholder="Write your reply..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  rows={2}
                  className="w-full bg-transparent border-none text-gray-900 dark:text-white text-sm outline-none resize-none leading-relaxed max-h-28 overflow-y-auto"
                />
              </div>
              <button
                type="button"
                onClick={() => sendReply()}
                disabled={!text.trim() || sending}
                className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  text.trim() && !sending
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }`}
              >
                <SendIcon />
              </button>
            </div>
            <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 text-center">Enter to send · Shift+Enter for new line</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("open");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; role?: string } | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr) as { id?: number; role?: string };
        if (u.id) setCurrentUser({ id: u.id, role: u.role });
      } catch {}
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const userStr = localStorage.getItem("user");
        const user = userStr ? (JSON.parse(userStr) as { id?: number; role?: string }) : null;
        const isOperator = user?.role?.toLowerCase() === "operator";
        const data = await fetchMessages(isOperator ? undefined : user?.id);
        const settled = await Promise.allSettled(
          (data || []).map(async (m) => {
            try {
              const replies = await fetchReplies(m.id);
              return messageToTicket(m, replies);
            } catch {
              return messageToTicket(m);
            }
          })
        );
        let list = settled
          .filter((r): r is PromiseFulfilledResult<Ticket> => r.status === "fulfilled")
          .map((r) => r.value);
        if (!isOperator && user?.id) {
          list = list.filter((t) => t.userId == null || t.userId === user.id);
        }
        list.sort((a, b) => b.messages[b.messages.length - 1]!.time.getTime() - a.messages[a.messages.length - 1]!.time.getTime());
        setTickets(list);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // When openId is in URL: load that message and show conversation (or find in already-loaded list)
  useEffect(() => {
    if (!openId || openId.trim() === "") {
      setLoadingOpen(false);
      setOpenError(false);
      return;
    }
    const id = parseInt(openId.trim(), 10);
    if (isNaN(id)) {
      setLoadingOpen(false);
      setOpenError(true);
      return;
    }
    setOpenError(false);
    setLoadingOpen(true);
    let cancelled = false;
    const loadOne = async () => {
      // First try to find in already-loaded tickets (e.g. operator has all messages)
      const fromList = tickets.find((t) => t.messageId === id);
      if (fromList && !cancelled) {
        setSelected(fromList);
        setOpenError(false);
        setLoadingOpen(false);
        return;
      }
      try {
        const msg = await fetchMessage(id);
        if (cancelled) return;
        if (!msg) {
          setOpenError(true);
          return;
        }
        const replies = await fetchReplies(id);
        if (cancelled) return;
        const ticket = messageToTicket(msg, replies);
        setSelected(ticket);
      } catch {
        if (!cancelled) setOpenError(true);
      } finally {
        if (!cancelled) setLoadingOpen(false);
      }
    };
    loadOne();
    return () => { cancelled = true; };
  }, [openId, tickets]);

  const handleBack = () => {
    setSelected(null);
    setOpenError(false);
    setSearchParams((p) => {
      p.delete("open");
      return p;
    });
  };

  const clearOpenAndShowList = () => {
    setOpenError(false);
    setLoadingOpen(false);
    setSearchParams((p) => {
      p.delete("open");
      return p;
    });
  };

  if (selected) {
    const isOperator = currentUser?.role?.toLowerCase() === "operator";
    return (
      <>
        <PageMeta title="Message box | Support" description="Your support messages and tickets" />
        <PageBreadcrumb pageTitle="Message box" />
        <div className="space-y-4">
          <ConversationDetail
            ticket={selected}
            onBack={handleBack}
            isOperator={isOperator}
            currentUserId={currentUser?.id}
          />
        </div>
      </>
    );
  }

  if (openId && (loadingOpen || openError)) {
    return (
      <>
        <PageMeta title="Message box | Support" description="Your support messages and tickets" />
        <PageBreadcrumb pageTitle="Message box" />
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 text-center">
          {loadingOpen && <p className="text-gray-500 dark:text-gray-400">Loading conversation...</p>}
          {openError && !loadingOpen && (
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">Message not found or unable to load.</p>
              <button
                type="button"
                onClick={clearOpenAndShowList}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                Back to list
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Message box | Support" description="Your support messages and tickets" />
      <PageBreadcrumb pageTitle="Message box" />
      <div className="space-y-4">
        <InboxList
          tickets={tickets}
          onSelect={(t) => setSelected(t)}
          loading={loading}
          isOperator={currentUser?.role?.toLowerCase() === "operator"}
        />
      </div>
    </>
  );
}
