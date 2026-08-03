"use client";

import { MessageCircle, Minimize2, X, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { SEO_CONFIG } from "~/app";
import { cn } from "~/lib/cn";
import {
  getQuickActions,
  getWelcomeMessage,
  type ChatMessage as ChatMessageType,
  type SupportedLocale,
} from "~/lib/chat-context";
import { Button } from "~/ui/primitives/button";

import { ChatInput } from "./chat-input";
import { ChatMessage, TypingIndicator } from "./chat-message";

const TELEGRAM_URL = SEO_CONFIG.supportContacts.telegram
  ? `https://t.me/${SEO_CONFIG.supportContacts.telegram.replace(/^@/, "")}`
  : "";
const MESSENGER_URL =
  SEO_CONFIG.supportContacts.messenger || SEO_CONFIG.supportContacts.facebook;

type Message = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

type StoredMessage = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string; // ISO string for storage
};

const STORAGE_KEY = "cursor-pro-chat-history";
const MAX_STORED_MESSAGES = 50;
const NOTIFICATION_SHOWN_KEY = "cursor-pro-chat-notification-shown";

export function ChatWidget() {
  const t = useTranslations("ChatWidget");
  const locale = useLocale() as SupportedLocale;

  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [showAnimation, setShowAnimation] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  // show bounce animation after delay (only once per session)
  React.useEffect(() => {
    const hasShown = sessionStorage.getItem(NOTIFICATION_SHOWN_KEY);
    if (hasShown || isOpen) return;

    const timerId = setTimeout(() => {
      setShowAnimation(true);
      sessionStorage.setItem(NOTIFICATION_SHOWN_KEY, "true");
      setTimeout(() => setShowAnimation(false), 15000);
    }, 8000);

    return () => clearTimeout(timerId);
  }, [isOpen]);

  // load messages from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredMessage[];
        const restored: Message[] = parsed.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(restored);
        if (restored.length > 0) {
          setHasInteracted(true);
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
    setIsInitialized(true);
  }, []);

  // save messages to localStorage whenever they change
  React.useEffect(() => {
    if (!isInitialized) return;
    
    try {
      // filter out welcome message and limit stored messages
      const toStore: StoredMessage[] = messages
        .filter((m) => m.id !== "welcome")
        .slice(-MAX_STORED_MESSAGES)
        .map((m) => ({
          id: m.id,
          content: m.content,
          isUser: m.isUser,
          timestamp: m.timestamp.toISOString(),
        }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  }, [messages, isInitialized]);

  // scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // add welcome message when chat opens for the first time (no history)
  React.useEffect(() => {
    if (isOpen && isInitialized && !hasInteracted && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          content: getWelcomeMessage(locale),
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, isInitialized, hasInteracted, messages.length, locale]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setHasInteracted(true);

    // add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // build chat history for API
      const chatHistory: ChatMessageType[] = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.isUser ? "user" : "assistant",
          content: m.content,
        }));

      chatHistory.push({ role: "user", content });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, locale }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json() as { message: string };

      // add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.message,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      // add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: t("error"),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (message: string) => {
    sendMessage(message);
  };

  const handleClearHistory = () => {
    setMessages([]);
    setHasInteracted(false);
    localStorage.removeItem(STORAGE_KEY);
    // add welcome message again
    setMessages([
      {
        id: "welcome",
        content: getWelcomeMessage(locale),
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  const quickActions = getQuickActions(locale);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
        {/* telegram contact button */}
        {TELEGRAM_URL && (
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full shadow-lg",
            "bg-[#26A5E4] hover:bg-[#1e8ec8]",
            "transition-all duration-300 hover:scale-110"
          )}
          aria-label="Telegram"
        >
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        </a>
        )}

        {/* messenger contact button */}
        {MESSENGER_URL && (
        <a
          href={MESSENGER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full shadow-lg",
            "bg-gradient-to-br from-[#00B2FF] via-[#006AFF] to-[#A033FF]",
            "hover:from-[#00A0E6] hover:via-[#005CE6] hover:to-[#8F2DE6]",
            "transition-all duration-300 hover:scale-110"
          )}
          aria-label="Messenger"
        >
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.733 8.2l3.131 3.259L19.752 8.2l-6.559 6.763z" />
          </svg>
        </a>
        )}

        {/* chat button with animations */}
        <div className="relative">
          <Button
            onClick={() => {
              setIsOpen(true);
              setShowAnimation(false);
            }}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg relative",
              "bg-primary",
              "",
              "transition-all duration-300 hover:scale-110",
              showAnimation && "animate-bounce"
            )}
            size="icon"
            aria-label={t("open")}
          >
            {showAnimation && (
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/40" />
            )}
            <MessageCircle className="h-6 w-6 relative z-10" />
          </Button>

          {/* notification dot */}
          {showAnimation && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl",
        "transition-all duration-300",
        // mobile: full screen with some margin
        "bottom-0 right-0 left-0 top-0 m-2 sm:m-0",
        // desktop: fixed size at bottom-right
        "sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto",
        "sm:h-[600px] sm:w-[400px]",
        isMinimized && "sm:h-14"
      )}
    >
      {/* header */}
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-3",
          "bg-primary text-primary-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold">{t("title")}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* clear history button */}
          {messages.filter(m => m.id !== "welcome").length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearHistory}
              className="h-8 w-8 text-primary-foreground hover:bg-white/20"
              aria-label={t("clearHistory")}
              title={t("clearHistory")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 text-primary-foreground hover:bg-white/20 hidden sm:flex"
            aria-label={isMinimized ? t("expand") : t("minimize")}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-primary-foreground hover:bg-white/20"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* chat content - hidden when minimized */}
      {!isMinimized && (
        <>
          {/* messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto"
          >
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                isUser={message.isUser}
                timestamp={message.timestamp}
              />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* quick actions - show only when few messages */}
          {messages.length <= 1 && !isLoading && (
            <div className="flex flex-wrap gap-2 px-3 pb-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.message)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs",
                    "bg-muted/50 hover:bg-muted transition-colors",
                    "text-muted-foreground hover:text-foreground"
                  )}
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* input */}
          <ChatInput
            onSend={sendMessage}
            disabled={isLoading}
            placeholder={t("placeholder")}
          />
        </>
      )}
    </div>
  );
}
