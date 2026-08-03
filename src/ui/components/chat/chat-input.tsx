"use client";

import { Send } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/cn";
import { Button } from "~/ui/primitives/button";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [message, setMessage] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      // reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 border-t">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-xl border bg-background px-4 py-2.5",
          "text-sm placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "max-h-[120px] min-h-[42px]"
        )}
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !message.trim()}
        className="h-[42px] w-[42px] shrink-0 rounded-xl"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Gửi</span>
      </Button>
    </form>
  );
}
