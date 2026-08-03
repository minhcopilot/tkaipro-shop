/**
 * converts plain text blog content to html format
 * if content already has html tags, returns as-is
 * if plain text, converts:
 * - line breaks to <br> or <p> tags
 * - lines starting with "- " to list items
 * - text wrapped in backticks to <code>
 * - URLs to clickable links
 */
export function formatBlogContent(content: string): string {
  if (!content) return "";

  // check if content already has html tags (basic detection)
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);

  // if content already has significant html structure, return as-is
  if (
    hasHtmlTags &&
    (content.includes("<p>") ||
      content.includes("<div>") ||
      content.includes("<ul>") ||
      content.includes("<ol>") ||
      content.includes("<h1>") ||
      content.includes("<h2>") ||
      content.includes("<h3>") ||
      content.includes("<br"))
  ) {
    return content;
  }

  // process plain text content
  let result = escapeHtml(content);

  // convert URLs to clickable links (before other processing)
  result = result.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline break-all">$1</a>'
  );

  // convert inline code (backticks)
  result = result.replace(
    /`([^`]+)`/g,
    '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
  );

  // split by double newlines (paragraphs)
  const paragraphs = result.split(/\n\n+/);

  const processedParagraphs = paragraphs.map((paragraph) => {
    const lines = paragraph.split("\n");

    // check if this paragraph is a list (lines starting with - or bullet points)
    const isListBlock = lines.every(
      (line) =>
        line.trim().startsWith("- ") ||
        line.trim().startsWith("• ") ||
        line.trim() === ""
    );

    if (
      isListBlock &&
      lines.some(
        (line) => line.trim().startsWith("- ") || line.trim().startsWith("• ")
      )
    ) {
      const listItems = lines
        .filter(
          (line) =>
            line.trim().startsWith("- ") || line.trim().startsWith("• ")
        )
        .map((line) => {
          const listContent = line.trim().replace(/^[-•]\s*/, "");
          return `<li class="ml-4">${listContent}</li>`;
        })
        .join("\n");
      return `<ul class="list-disc list-inside space-y-1 my-2">\n${listItems}\n</ul>`;
    }

    // regular paragraph - convert single newlines to <br>
    const processedLines = lines.map((line) => line.trim()).join("<br>\n");
    return `<p class="mb-4">${processedLines}</p>`;
  });

  return processedParagraphs.join("\n");
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
  };

  // don't escape quotes as they're fine in text content
  return text.replace(/[&<>]/g, (char) => map[char] || char);
}
