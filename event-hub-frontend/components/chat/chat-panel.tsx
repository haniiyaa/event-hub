"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, apiFetch } from "@/lib/api-client";
import { formatRelative } from "@/lib/date";
import type { ChatMessageSummary, ChatThreadPayload } from "@/lib/types";
import { useSession } from "@/providers/session-provider";

interface ChatPanelProps {
  resourceType: "club" | "event";
  resourceId: number;
  title?: string;
  className?: string;
  disabledReason?: string;
}

const POLL_INTERVAL_MS = 7000;

export function ChatPanel({ resourceType, resourceId, title = "Chat", className, disabledReason }: ChatPanelProps) {
  const { user } = useSession();
  const [messages, setMessages] = useState<ChatMessageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [canPost, setCanPost] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const lastMessageIdRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accessDeniedRef = useRef(false);

  const endpoint = useMemo(() => {
    const base = resourceType === "club" ? "/api/chat/clubs" : "/api/chat/events";
    return `${base}/${resourceId}/messages`;
  }, [resourceType, resourceId]);

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, []);

  const mergeMessages = useCallback((incoming: ChatMessageSummary[]) => {
    if (incoming.length === 0) {
      return;
    }
    setMessages((previous) => {
      const seen = new Set(previous.map((message) => message.id));
      const merged = [...previous];
      incoming.forEach((message) => {
        if (!seen.has(message.id)) {
          merged.push(message);
        }
      });
      return merged;
    });
  }, []);

  const handleSuccessfulFetch = useCallback((payload: ChatThreadPayload, mode: "initial" | "incremental") => {
    setCanPost(Boolean(payload.canPost));
    const nextMessages = payload.messages ?? [];
    if (mode === "initial") {
      setMessages(nextMessages);
    } else {
      mergeMessages(nextMessages);
    }
    if (typeof payload.lastMessageId === "number") {
      lastMessageIdRef.current = payload.lastMessageId;
    } else if (mode === "initial" && nextMessages.length > 0) {
      lastMessageIdRef.current = nextMessages[nextMessages.length - 1].id;
    }
  }, [mergeMessages]);

  const fetchMessages = useCallback(async (mode: "initial" | "incremental" | "manual" = "initial") => {
    if (mode === "incremental" && accessDeniedRef.current) {
      return;
    }

    if (mode === "initial") {
      setLoading(true);
      setError(null);
    }
    if (mode === "manual") {
      setRefreshing(true);
      setError(null);
    }

    try {
      const searchParams = mode !== "initial" && lastMessageIdRef.current
        ? { after: lastMessageIdRef.current }
        : undefined;
      const payload = await apiFetch<ChatThreadPayload>(endpoint, searchParams ? { searchParams } : undefined);
      if (accessDeniedRef.current) {
        accessDeniedRef.current = false;
        setAccessDenied(false);
        setAccessMessage(null);
      }
      handleSuccessfulFetch(payload, mode === "initial" ? "initial" : "incremental");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setAccessDenied(true);
          setAccessMessage(err.message || "You do not have access to this chat yet.");
        } else if (err.status === 404) {
          setError("Chat is unavailable right now.");
        } else {
          setError(err.message || "Unable to load chat messages.");
        }
      } else {
        setError("Unable to load chat messages.");
      }
    } finally {
      if (mode === "initial") {
        setLoading(false);
      }
      if (mode === "manual") {
        setRefreshing(false);
      }
    }
  }, [endpoint, handleSuccessfulFetch]);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
    pollTimerRef.current = setInterval(() => {
      fetchMessages("incremental").catch(() => {
        // handled in fetchMessages
      });
    }, POLL_INTERVAL_MS);
  }, [fetchMessages]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setMessages([]);
    lastMessageIdRef.current = null;
    setError(null);
    setAccessDenied(false);
    accessDeniedRef.current = false;
    setAccessMessage(null);
    fetchMessages("initial").catch(() => undefined);
    return () => {
      stopPolling();
    };
  }, [endpoint, fetchMessages, stopPolling]);

  useEffect(() => {
    if (loading || accessDenied) {
      stopPolling();
      return;
    }
    startPolling();
    return () => {
      stopPolling();
    };
  }, [accessDenied, loading, startPolling, stopPolling]);

  useEffect(() => {
    accessDeniedRef.current = accessDenied;
  }, [accessDenied]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || sending || !canPost) {
      return;
    }
    setComposerError(null);
    setSending(true);
    try {
      const payload = await apiFetch<ChatMessageSummary>(endpoint, {
        method: "POST",
        body: JSON.stringify({ content: draft.trim() }),
      });
      mergeMessages([payload]);
      lastMessageIdRef.current = payload.id;
      setDraft("");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setAccessDenied(true);
          setAccessMessage(err.message || "You do not have access to post in this chat.");
        } else {
          setComposerError(err.message || "Unable to send message.");
        }
      } else {
        setComposerError("Unable to send message.");
      }
    } finally {
      setSending(false);
    }
  };

  const headerIndicator = useMemo(() => {
    if (refreshing) {
      return <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Refreshing…</span>;
    }
    if (loading) {
  return <Spinner />;
    }
    return null;
  }, [loading, refreshing]);

  const effectiveDisabledReason = useMemo(() => {
    if (disabledReason) {
      return disabledReason;
    }
    if (!canPost && !accessDenied) {
      return "You can read messages, but you do not have permission to post.";
    }
    if (accessDenied) {
      return accessMessage ?? "You do not have access to this chat.";
    }
    return null;
  }, [accessDenied, accessMessage, canPost, disabledReason]);

  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-950/40 p-4 ${className ?? ""}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Live discussion</p>
        </div>
        <div className="flex items-center gap-3">
          {headerIndicator}
          <Button variant="secondary" size="sm" onClick={() => fetchMessages("manual").catch(() => undefined)} disabled={refreshing || loading || accessDenied}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {error ? <Alert variant="error" title="Unable to load chat" description={error} /> : null}
      {accessDenied && effectiveDisabledReason ? (
        <Alert variant="warning" title="Chat unavailable" description={effectiveDisabledReason} />
      ) : null}

      <div
        ref={scrollContainerRef}
        className="mt-4 flex h-72 flex-col gap-3 overflow-y-auto rounded-xl border border-white/5 bg-slate-950/60 p-4"
      >
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-400">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message) => {
            const displayName = message.author?.fullName?.trim() || message.author?.username || "Unknown";
            const timestamp = message.createdAt ? formatRelative(message.createdAt) : "Just now";
            const isSelf = user && message.author?.id === user.id;
            return (
              <div
                key={message.id}
                className={`flex flex-col gap-1 rounded-xl border border-white/5 bg-slate-900/80 p-3 ${isSelf ? "self-end" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">{displayName}{isSelf ? " (You)" : ""}</span>
                  <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">{timestamp}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-200">{message.content}</p>
              </div>
            );
          })
        )}
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        {composerError ? <Alert variant="error" description={composerError} /> : null}
        {effectiveDisabledReason && !canPost ? (
          <p className="text-xs text-slate-500">{effectiveDisabledReason}</p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder={accessDenied ? "Chat access required" : "Write a message"}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={sending || !canPost || accessDenied}
          />
          <Button type="submit" disabled={sending || !canPost || accessDenied || !draft.trim()}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
