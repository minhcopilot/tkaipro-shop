"use client";

import { useRef } from "react";
import { cn } from "~/lib/cn";

// enhanced syntax highlighting for javascript/typescript
function highlightCode(code: string): string {
  // escape html first
  let highlighted = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // keywords
  highlighted = highlighted.replace(
    /\b(async|await|function|const|let|var|return|if|else|throw|new|try|catch|export|import|from|class|extends|this|type|interface|typeof|instanceof|void)\b/g,
    '<span class="text-pink-400 font-medium">$1</span>'
  );

  // strings (single and double quotes, template literals)
  highlighted = highlighted.replace(
    /(['"`])(?:(?!\1)[^\\]|\\.)*?\1/g,
    '<span class="text-emerald-400">$&</span>'
  );

  // comments
  highlighted = highlighted.replace(
    /(\/\/.*$)/gm,
    '<span class="text-slate-500 italic">$1</span>'
  );

  // numbers
  highlighted = highlighted.replace(
    /\b(\d+)\b/g,
    '<span class="text-amber-400">$1</span>'
  );

  // function names
  highlighted = highlighted.replace(
    /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    '<span class="text-sky-400">$1</span>('
  );

  // special values
  highlighted = highlighted.replace(
    /\b(true|false|null|undefined)\b/g,
    '<span class="text-violet-400">$1</span>'
  );

  // object properties after dot
  highlighted = highlighted.replace(
    /\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
    '.<span class="text-cyan-300">$1</span>'
  );

  // arrow functions
  highlighted = highlighted.replace(
    /=&gt;/g,
    '<span class="text-pink-400">=&gt;</span>'
  );

  return highlighted;
}

type CodeEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  showLineNumbers?: boolean;
  cursorVisible?: boolean;
  ghostText?: string;
  label?: string;
  labelIcon?: React.ReactNode;
  variant?: "default" | "ai";
};

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = "",
  className,
  showLineNumbers = true,
  cursorVisible = false,
  ghostText,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // sync scroll between textarea and highlighted overlay
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // calculate line numbers
  const lines = value.split("\n");
  const lineCount = Math.max(lines.length, 10);

  // highlighted code with ghost text
  let displayCode = highlightCode(value);
  if (ghostText && !value.includes(ghostText)) {
    displayCode += `<span class="text-slate-600/60 italic">${highlightCode(ghostText)}</span>`;
  }

  // add blinking cursor if enabled
  if (cursorVisible) {
    displayCode += '<span class="inline-block w-2 h-5 bg-green-400 animate-blink ml-0.5 align-middle"></span>';
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="relative flex bg-slate-950">
        {/* line numbers */}
        {showLineNumbers && (
          <div className="flex-shrink-0 select-none bg-slate-950/80 border-r border-slate-800/50 text-slate-600 text-xs font-mono py-4 px-3 text-right min-w-[3rem]">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className="leading-6 h-6">
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* code area */}
        <div className="relative flex-1 overflow-hidden">
          {/* highlighted overlay */}
          <pre
            ref={preRef}
            className={cn(
              "absolute inset-0 p-4 font-mono text-sm leading-6 whitespace-pre-wrap break-words overflow-auto pointer-events-none",
              "text-slate-300"
            )}
            dangerouslySetInnerHTML={{ __html: displayCode || "&nbsp;" }}
          />

          {/* actual textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onScroll={handleScroll}
            readOnly={readOnly}
            placeholder={placeholder}
            spellCheck={false}
            className={cn(
              "relative w-full h-full min-h-[280px] p-4 font-mono text-sm leading-6",
              "bg-transparent text-transparent caret-green-400",
              "resize-none outline-none",
              "placeholder:text-slate-700",
              readOnly && "cursor-default"
            )}
          />
        </div>
      </div>

      {/* CSS for cursor blink */}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
}
