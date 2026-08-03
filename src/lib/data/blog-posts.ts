/**
 * mock data cho blog posts về cursor pro ai
 * sử dụng trực tiếp trong blog page mà không cần database
 */

import { SEO_CONFIG } from "~/app";

// hình ảnh từ unsplash (free to use)
const IMAGES = {
  cursorIntro: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop",
  comparison: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop",
  tips: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=630&fit=crop",
  workflow: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=630&fit=crop",
  aiModels: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop",
  productivity: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&h=630&fit=crop",
  future: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=630&fit=crop",
  setup: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1200&h=630&fit=crop",
};

export interface StaticBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featuredImage: string;
  authorName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  isFeatured: boolean;
  status: "published" | "draft";
  publishedAt: Date;
  readTime: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const STATIC_BLOG_POSTS: StaticBlogPost[] = [
  {
    id: "static-1",
    title: "Cursor Pro là gì? Hướng dẫn toàn diện cho Developer Việt Nam 2024",
    slug: "cursor-pro-la-gi-huong-dan-toan-dien-2024",
    excerpt: "Tìm hiểu về Cursor Pro - AI code editor mạnh mẽ nhất hiện nay. Khám phá các tính năng, lợi ích và cách sử dụng Cursor Pro để tăng năng suất coding lên 10 lần.",
    content: `
<h2>Cursor Pro là gì?</h2>

<p><strong>Cursor Pro</strong> là một <em>AI-powered code editor</em> được xây dựng dựa trên nền tảng VS Code, tích hợp các mô hình AI tiên tiến nhất như GPT-4, Claude 3.5 Sonnet để hỗ trợ developer viết code nhanh hơn, thông minh hơn và hiệu quả hơn.</p>

<p>Ra mắt vào năm 2023, Cursor nhanh chóng trở thành công cụ được yêu thích bởi hàng triệu developer trên toàn thế giới nhờ khả năng:</p>

<ul>
  <li><strong>Hiểu ngữ cảnh code</strong> - AI có thể đọc và hiểu toàn bộ codebase của bạn</li>
  <li><strong>Gợi ý code thông minh</strong> - Autocomplete với độ chính xác cao</li>
  <li><strong>Chat với AI</strong> - Hỏi đáp trực tiếp về code, debug và refactor</li>
  <li><strong>Inline editing</strong> - Sửa code ngay tại chỗ với AI assistance</li>
</ul>

<h2>Tại sao Developer Việt Nam nên dùng Cursor Pro?</h2>

<h3>1. Tăng năng suất coding lên 10x</h3>

<p>Theo khảo sát từ Cursor, developer sử dụng Cursor Pro có thể:</p>

<ul>
  <li>Viết code nhanh hơn <strong>40-60%</strong></li>
  <li>Giảm thời gian debug xuống <strong>50%</strong></li>
  <li>Học framework mới nhanh hơn <strong>3x</strong></li>
</ul>

<h3>2. Hỗ trợ đa ngôn ngữ</h3>

<p>Cursor Pro hỗ trợ tất cả các ngôn ngữ lập trình phổ biến:</p>

<ul>
  <li>JavaScript/TypeScript</li>
  <li>Python</li>
  <li>Java, C#, Go</li>
  <li>Rust, C++</li>
  <li>PHP, Ruby</li>
  <li>Và nhiều hơn nữa...</li>
</ul>

<h3>3. Tích hợp AI Models mạnh mẽ</h3>

<p>Cursor Pro cho phép bạn truy cập các AI model tiên tiến nhất:</p>

<ul>
  <li><strong>GPT-4o</strong> - OpenAI's flagship model</li>
  <li><strong>Claude 3.5 Sonnet</strong> - Anthropic's best coding model</li>
  <li><strong>GPT-4 Turbo</strong> - Fast and capable</li>
</ul>

<h2>Các tính năng chính của Cursor Pro</h2>

<h3>⌘ + K: Inline Code Generation</h3>

<p>Nhấn <code>⌘ + K</code> (Mac) hoặc <code>Ctrl + K</code> (Windows/Linux) để mở inline generation. Mô tả những gì bạn muốn, AI sẽ viết code cho bạn ngay tại cursor.</p>

<h3>⌘ + L: Chat với Codebase</h3>

<p>Mở chat panel để hỏi AI về code của bạn. AI có thể:</p>

<ul>
  <li>Giải thích code phức tạp</li>
  <li>Đề xuất cách refactor</li>
  <li>Tìm và fix bugs</li>
  <li>Viết tests</li>
</ul>

<h3>Tab Autocomplete</h3>

<p>Cursor Pro có hệ thống autocomplete thông minh nhất, hiểu ngữ cảnh của cả project để đưa ra gợi ý chính xác.</p>

<h2>So sánh Cursor Free vs Cursor Pro</h2>

<table>
  <thead>
    <tr>
      <th>Tính năng</th>
      <th>Free</th>
      <th>Pro</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>AI completions</td>
      <td>2000/tháng</td>
      <td>Unlimited</td>
    </tr>
    <tr>
      <td>Premium models (GPT-4, Claude)</td>
      <td>50 requests</td>
      <td>500 fast requests</td>
    </tr>
    <tr>
      <td>Unlimited slow requests</td>
      <td>❌</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>Priority support</td>
      <td>❌</td>
      <td>✅</td>
    </tr>
  </tbody>
</table>

<h2>Giá Cursor Pro tại Việt Nam</h2>

<p>Cursor Pro có giá <strong>$20/tháng</strong> nếu mua trực tiếp. Tuy nhiên, tại <strong>${SEO_CONFIG.name}</strong>, chúng tôi cung cấp:</p>

<ul>
  <li><strong>Giá ưu đãi</strong> cho developer Việt Nam</li>
  <li><strong>Thanh toán dễ dàng</strong> qua chuyển khoản ngân hàng</li>
  <li><strong>Hỗ trợ 24/7</strong> bằng tiếng Việt</li>
  <li><strong>Bảo hành</strong> và hỗ trợ kỹ thuật</li>
</ul>

<h2>Kết luận</h2>

<p>Cursor Pro là công cụ không thể thiếu cho mọi developer muốn tăng năng suất và viết code chất lượng hơn. Với sự hỗ trợ của AI, bạn có thể tập trung vào việc giải quyết vấn đề thay vì viết code boilerplate.</p>

<p><strong>Bắt đầu trải nghiệm Cursor Pro ngay hôm nay!</strong></p>
    `.trim(),
    category: "Tutorial",
    tags: ["cursor pro", "ai coding", "developer tools", "productivity", "vietnam"],
    featuredImage: IMAGES.cursorIntro,
    authorName: SEO_CONFIG.name,
    metaTitle: "Cursor Pro là gì? Hướng dẫn toàn diện cho Developer 2024",
    metaDescription: "Tìm hiểu về Cursor Pro - AI code editor mạnh mẽ nhất. Khám phá tính năng, giá cả và cách mua Cursor Pro tại Việt Nam với giá ưu đãi.",
    metaKeywords: ["cursor pro", "cursor pro là gì", "ai code editor", "mua cursor pro", "cursor pro vietnam", "cursor ai"],
    isFeatured: true,
    status: "published",
    publishedAt: new Date("2024-12-01"),
    readTime: 5,
    viewCount: 1250,
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date("2024-12-01"),
  },
  {
    id: "static-2",
    title: "So sánh Cursor Pro vs GitHub Copilot: Ai là vua AI Coding 2024?",
    slug: "so-sanh-cursor-pro-vs-github-copilot-2024",
    excerpt: "Phân tích chi tiết sự khác biệt giữa Cursor Pro và GitHub Copilot. Công cụ nào phù hợp hơn cho workflow của bạn?",
    content: `
<h2>Tổng quan về Cursor Pro và GitHub Copilot</h2>

<p>Trong thế giới AI coding tools, <strong>Cursor Pro</strong> và <strong>GitHub Copilot</strong> là hai cái tên được nhắc đến nhiều nhất. Cả hai đều hứa hẹn giúp developer viết code nhanh hơn, nhưng cách tiếp cận của chúng hoàn toàn khác nhau.</p>

<h2>GitHub Copilot là gì?</h2>

<p>GitHub Copilot là sản phẩm của Microsoft/GitHub, ra mắt năm 2021. Copilot hoạt động như một <em>extension</em> trong VS Code, JetBrains và các IDE khác.</p>

<p><strong>Ưu điểm của Copilot:</strong></p>
<ul>
  <li>Tích hợp sẵn với GitHub</li>
  <li>Hoạt động trong nhiều IDE</li>
  <li>Autocomplete tốt cho single-line</li>
</ul>

<h2>Cursor Pro khác gì?</h2>

<p>Cursor Pro là một <strong>IDE hoàn chỉnh</strong> được xây dựng từ đầu với AI là trọng tâm. Thay vì là extension, AI được tích hợp sâu vào mọi khía cạnh của editor.</p>

<p><strong>Điểm mạnh vượt trội của Cursor Pro:</strong></p>

<h3>1. Codebase Understanding</h3>
<p>Cursor có thể index và hiểu <strong>toàn bộ codebase</strong> của bạn, không chỉ file đang mở. Điều này giúp AI đưa ra gợi ý chính xác hơn nhiều.</p>

<h3>2. Multi-file Editing</h3>
<p>Cursor có thể chỉnh sửa <strong>nhiều files cùng lúc</strong>. Ví dụ: "Add authentication to all API routes" - Cursor sẽ tự động tìm và sửa tất cả các files liên quan.</p>

<h3>3. Chat with Context</h3>
<p>Khi chat với AI trong Cursor, bạn có thể <code>@mention</code> files, folders, hoặc symbols để AI hiểu context tốt hơn.</p>

<h3>4. Premium AI Models</h3>
<p>Cursor Pro cho phép dùng <strong>GPT-4o</strong> và <strong>Claude 3.5 Sonnet</strong> - những model mạnh nhất hiện nay, trong khi Copilot chỉ dùng model riêng của GitHub.</p>

<h2>Bảng so sánh chi tiết</h2>

<table>
  <thead>
    <tr>
      <th>Tiêu chí</th>
      <th>Cursor Pro</th>
      <th>GitHub Copilot</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Loại sản phẩm</td>
      <td>Full IDE</td>
      <td>Extension</td>
    </tr>
    <tr>
      <td>AI Models</td>
      <td>GPT-4o, Claude 3.5, GPT-4 Turbo</td>
      <td>GitHub model</td>
    </tr>
    <tr>
      <td>Codebase context</td>
      <td>Toàn bộ project</td>
      <td>File hiện tại + tabs mở</td>
    </tr>
    <tr>
      <td>Multi-file editing</td>
      <td>✅ Có</td>
      <td>❌ Không</td>
    </tr>
    <tr>
      <td>Chat functionality</td>
      <td>✅ Mạnh mẽ, @mentions</td>
      <td>⚠️ Cơ bản</td>
    </tr>
    <tr>
      <td>Inline generation</td>
      <td>✅ ⌘+K</td>
      <td>❌ Chỉ autocomplete</td>
    </tr>
    <tr>
      <td>Giá/tháng</td>
      <td>$20</td>
      <td>$10</td>
    </tr>
    <tr>
      <td>Free tier</td>
      <td>✅ 2000 completions</td>
      <td>❌ Chỉ 60 ngày trial</td>
    </tr>
  </tbody>
</table>

<h2>Khi nào nên dùng Cursor Pro?</h2>

<p>Cursor Pro phù hợp nếu bạn:</p>
<ul>
  <li>Làm việc với codebase lớn</li>
  <li>Cần refactor hoặc modify nhiều files</li>
  <li>Muốn dùng các AI model tốt nhất</li>
  <li>Thường xuyên cần giải thích/debug code phức tạp</li>
  <li>Làm full-stack development</li>
</ul>

<h2>Khi nào GitHub Copilot đủ dùng?</h2>

<p>Copilot có thể đủ nếu bạn:</p>
<ul>
  <li>Chỉ cần autocomplete cơ bản</li>
  <li>Làm việc với files độc lập</li>
  <li>Đã quen với IDE khác và không muốn đổi</li>
  <li>Budget hạn chế</li>
</ul>

<h2>Verdict: Cursor Pro chiến thắng</h2>

<p>Nếu bạn nghiêm túc về việc <strong>tăng năng suất coding</strong>, Cursor Pro là lựa chọn tốt hơn. $20/tháng có vẻ nhiều hơn $10 của Copilot, nhưng khả năng của Cursor Pro vượt trội hơn nhiều.</p>

<p>Đặc biệt với developer Việt Nam, <strong>${SEO_CONFIG.name}</strong> cung cấp giá ưu đãi và thanh toán dễ dàng, giúp bạn tiếp cận công cụ này dễ dàng hơn.</p>

<blockquote>
<p>"Sau 2 tuần dùng Cursor Pro, tôi không thể quay lại Copilot được nữa. Khả năng hiểu codebase của Cursor quá tốt." - Senior Developer, FPT Software</p>
</blockquote>
    `.trim(),
    category: "Comparison",
    tags: ["cursor pro", "github copilot", "so sanh", "ai tools", "comparison"],
    featuredImage: IMAGES.comparison,
    authorName: SEO_CONFIG.name,
    metaTitle: "So sánh Cursor Pro vs GitHub Copilot 2024 - Ai tốt hơn?",
    metaDescription: "Phân tích chi tiết Cursor Pro vs GitHub Copilot. So sánh tính năng, giá cả, hiệu suất. Công cụ AI coding nào phù hợp cho bạn?",
    metaKeywords: ["cursor pro vs copilot", "so sanh cursor copilot", "ai coding tools", "github copilot", "cursor pro"],
    isFeatured: false,
    status: "published",
    publishedAt: new Date("2024-11-28"),
    readTime: 6,
    viewCount: 890,
    createdAt: new Date("2024-11-28"),
    updatedAt: new Date("2024-11-28"),
  },
  {
    id: "static-3",
    title: "10 Tips sử dụng Cursor Pro như một Pro Developer",
    slug: "10-tips-su-dung-cursor-pro-nhu-pro-developer",
    excerpt: "Khám phá 10 tips và tricks giúp bạn khai thác tối đa sức mạnh của Cursor Pro. Từ shortcuts đến advanced features.",
    content: `
<h2>Master Cursor Pro với 10 Tips này</h2>

<p>Cursor Pro có rất nhiều tính năng ẩn mà không phải ai cũng biết. Sau đây là 10 tips giúp bạn sử dụng Cursor Pro hiệu quả hơn.</p>

<h2>Tip #1: Sử dụng @-mentions trong Chat</h2>

<p>Khi chat với AI (<code>⌘+L</code>), bạn có thể mention:</p>

<ul>
  <li><code>@files</code> - Reference file cụ thể</li>
  <li><code>@folders</code> - Reference cả folder</li>
  <li><code>@code</code> - Reference đoạn code đang chọn</li>
  <li><code>@docs</code> - Reference documentation</li>
  <li><code>@web</code> - Cho phép AI search web</li>
</ul>

<p><strong>Ví dụ:</strong> "Explain how @files:src/auth.ts handles authentication and compare with @docs:next-auth"</p>

<h2>Tip #2: Composer Mode cho Multi-file Editing</h2>

<p>Nhấn <code>⌘+Shift+I</code> để mở <strong>Composer</strong> - chế độ mạnh mẽ nhất của Cursor. Bạn có thể yêu cầu AI:</p>

<ul>
  <li>Tạo feature mới với nhiều files</li>
  <li>Refactor toàn bộ module</li>
  <li>Add tests cho cả project</li>
</ul>

<p>Composer sẽ tự động tạo/sửa tất cả files cần thiết.</p>

<h2>Tip #3: Custom Instructions</h2>

<p>Vào <code>Settings → Cursor → Rules for AI</code> để set custom instructions. Ví dụ:</p>

<pre><code>- Always use TypeScript strict mode
- Prefer functional components with hooks
- Use Vietnamese comments for business logic
- Follow clean code principles</code></pre>

<p>AI sẽ luôn tuân theo các rules này khi generate code.</p>

<h2>Tip #4: Inline Edit với Selection</h2>

<p>Thay vì dùng <code>⌘+K</code> ở vị trí cursor, bạn có thể:</p>

<ol>
  <li>Select đoạn code cần sửa</li>
  <li>Nhấn <code>⌘+K</code></li>
  <li>Describe những gì cần thay đổi</li>
</ol>

<p>AI sẽ chỉ modify đoạn code đã chọn.</p>

<h2>Tip #5: Tab để Accept, Escape để Cancel</h2>

<p>Khi AI gợi ý code:</p>
<ul>
  <li><code>Tab</code> - Accept toàn bộ suggestion</li>
  <li><code>⌘+→</code> - Accept từng word</li>
  <li><code>Escape</code> - Cancel suggestion</li>
</ul>

<h2>Tip #6: Dùng Claude 3.5 Sonnet cho Coding</h2>

<p>Trong Cursor Settings, chọn <strong>Claude 3.5 Sonnet</strong> làm model mặc định cho chat. Đây là model tốt nhất cho coding tasks hiện tại.</p>

<p>Dùng GPT-4o cho:</p>
<ul>
  <li>Explain complex concepts</li>
  <li>Writing documentation</li>
  <li>Creative tasks</li>
</ul>

<h2>Tip #7: Index Large Codebases</h2>

<p>Cursor có thể index codebase để AI hiểu context tốt hơn. Vào:</p>

<p><code>Settings → Cursor → Codebase Indexing → Index this project</code></p>

<p>Sau khi index, AI có thể tìm và reference code từ bất kỳ file nào trong project.</p>

<h2>Tip #8: Terminal Integration</h2>

<p>Trong terminal của Cursor, bạn có thể:</p>
<ul>
  <li>Nhấn <code>⌘+K</code> để describe command bằng natural language</li>
  <li>AI sẽ generate command cho bạn</li>
</ul>

<p><strong>Ví dụ:</strong> "find all tsx files modified in last 7 days" → AI generates: <code>find . -name "*.tsx" -mtime -7</code></p>

<h2>Tip #9: Git Integration</h2>

<p>Cursor có AI-powered git features:</p>
<ul>
  <li>Tự động generate commit messages</li>
  <li>Explain diff changes</li>
  <li>Help resolve merge conflicts</li>
</ul>

<h2>Tip #10: Learn từ Generated Code</h2>

<p>Đừng chỉ copy code AI tạo. Hãy:</p>
<ol>
  <li>Đọc và hiểu code</li>
  <li>Hỏi AI giải thích nếu chưa hiểu</li>
  <li>Learn best practices từ code suggestions</li>
</ol>

<p>Cursor Pro là công cụ tuyệt vời để <strong>học programming</strong> vì bạn có thể hỏi AI bất cứ điều gì về code.</p>

<h2>Bonus: Keyboard Shortcuts Cheat Sheet</h2>

<table>
  <thead>
    <tr>
      <th>Shortcut</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>⌘+K</code></td>
      <td>Inline generation/edit</td>
    </tr>
    <tr>
      <td><code>⌘+L</code></td>
      <td>Open chat</td>
    </tr>
    <tr>
      <td><code>⌘+Shift+I</code></td>
      <td>Open Composer</td>
    </tr>
    <tr>
      <td><code>⌘+.</code></td>
      <td>Quick fix với AI</td>
    </tr>
    <tr>
      <td><code>Tab</code></td>
      <td>Accept suggestion</td>
    </tr>
    <tr>
      <td><code>Escape</code></td>
      <td>Dismiss suggestion</td>
    </tr>
  </tbody>
</table>

<h2>Kết luận</h2>

<p>Cursor Pro có tiềm năng lớn, nhưng chỉ khi bạn biết cách sử dụng đúng. Áp dụng 10 tips này và bạn sẽ thấy productivity tăng đáng kể!</p>
    `.trim(),
    category: "Tutorial",
    tags: ["cursor pro", "tips", "productivity", "shortcuts", "tutorial"],
    featuredImage: IMAGES.tips,
    authorName: SEO_CONFIG.name,
    metaTitle: "10 Tips sử dụng Cursor Pro hiệu quả nhất 2024",
    metaDescription: "Khám phá 10 tips và tricks để master Cursor Pro. Từ shortcuts, @mentions đến Composer mode - tất cả bí quyết tăng năng suất coding.",
    metaKeywords: ["cursor pro tips", "cursor pro shortcuts", "cursor tutorial", "ai coding tips", "cursor pro tricks"],
    isFeatured: false,
    status: "published",
    publishedAt: new Date("2024-11-25"),
    readTime: 7,
    viewCount: 1580,
    createdAt: new Date("2024-11-25"),
    updatedAt: new Date("2024-11-25"),
  },
  {
    id: "static-4",
    title: "Các mô hình AI trong Cursor Pro: GPT-4, Claude và hơn thế nữa",
    slug: "cac-mo-hinh-ai-trong-cursor-pro-gpt4-claude",
    excerpt: "Tìm hiểu về các AI models có trong Cursor Pro: GPT-4o, Claude 3.5 Sonnet, GPT-4 Turbo. Khi nào dùng model nào?",
    content: `
<h2>AI Models - Trái tim của Cursor Pro</h2>

<p>Một trong những điểm mạnh nhất của Cursor Pro là khả năng truy cập <strong>nhiều AI models</strong> khác nhau. Mỗi model có strengths riêng, và việc biết khi nào dùng model nào sẽ giúp bạn làm việc hiệu quả hơn.</p>

<h2>Các AI Models có trong Cursor Pro</h2>

<h3>1. Claude 3.5 Sonnet (Anthropic)</h3>

<p><strong>Đặc điểm:</strong></p>
<ul>
  <li>Model tốt nhất cho coding tasks</li>
  <li>Excellent code understanding</li>
  <li>Ít hallucinate hơn các model khác</li>
  <li>Tuân theo instructions rất tốt</li>
</ul>

<p><strong>Nên dùng khi:</strong></p>
<ul>
  <li>Viết code phức tạp</li>
  <li>Refactoring</li>
  <li>Debug và fix bugs</li>
  <li>Code review</li>
</ul>

<h3>2. GPT-4o (OpenAI)</h3>

<p><strong>Đặc điểm:</strong></p>
<ul>
  <li>Multimodal - hiểu cả text và images</li>
  <li>Kiến thức rộng</li>
  <li>Creative và flexible</li>
  <li>Fast response</li>
</ul>

<p><strong>Nên dùng khi:</strong></p>
<ul>
  <li>Cần AI analyze screenshots/mockups</li>
  <li>Viết documentation</li>
  <li>Explain concepts</li>
  <li>Creative problem solving</li>
</ul>

<h3>3. GPT-4 Turbo</h3>

<p><strong>Đặc điểm:</strong></p>
<ul>
  <li>Context window 128K tokens</li>
  <li>Nhanh hơn GPT-4 gốc</li>
  <li>Giá rẻ hơn GPT-4</li>
</ul>

<p><strong>Nên dùng khi:</strong></p>
<ul>
  <li>Cần analyze large files</li>
  <li>Long conversations</li>
  <li>Complex prompts với nhiều context</li>
</ul>

<h3>4. cursor-small</h3>

<p><strong>Đặc điểm:</strong></p>
<ul>
  <li>Model riêng của Cursor</li>
  <li>Optimized cho autocomplete</li>
  <li>Rất nhanh</li>
  <li>Không tốn fast requests</li>
</ul>

<p><strong>Nên dùng khi:</strong></p>
<ul>
  <li>Tab completion</li>
  <li>Quick suggestions</li>
  <li>Simple code tasks</li>
</ul>

<h2>So sánh Performance các Models</h2>

<table>
  <thead>
    <tr>
      <th>Model</th>
      <th>Coding</th>
      <th>Speed</th>
      <th>Creativity</th>
      <th>Cost</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Claude 3.5 Sonnet</td>
      <td>⭐⭐⭐⭐⭐</td>
      <td>⭐⭐⭐⭐</td>
      <td>⭐⭐⭐⭐</td>
      <td>$$</td>
    </tr>
    <tr>
      <td>GPT-4o</td>
      <td>⭐⭐⭐⭐</td>
      <td>⭐⭐⭐⭐⭐</td>
      <td>⭐⭐⭐⭐⭐</td>
      <td>$$</td>
    </tr>
    <tr>
      <td>GPT-4 Turbo</td>
      <td>⭐⭐⭐⭐</td>
      <td>⭐⭐⭐⭐</td>
      <td>⭐⭐⭐⭐</td>
      <td>$$</td>
    </tr>
    <tr>
      <td>cursor-small</td>
      <td>⭐⭐⭐</td>
      <td>⭐⭐⭐⭐⭐</td>
      <td>⭐⭐</td>
      <td>Free</td>
    </tr>
  </tbody>
</table>

<h2>Cách chọn Model phù hợp</h2>

<h3>Workflow đề xuất:</h3>

<ol>
  <li><strong>Tab completion:</strong> cursor-small (default)</li>
  <li><strong>Chat/Discussion:</strong> Claude 3.5 Sonnet</li>
  <li><strong>Code generation:</strong> Claude 3.5 Sonnet</li>
  <li><strong>Debug complex issues:</strong> GPT-4 Turbo (context lớn)</li>
  <li><strong>UI/Design tasks:</strong> GPT-4o (multimodal)</li>
</ol>

<h2>Fast Requests vs Slow Requests</h2>

<p>Cursor Pro có hệ thống <strong>fast/slow requests</strong>:</p>

<ul>
  <li><strong>Fast requests:</strong> 500/tháng, response nhanh</li>
  <li><strong>Slow requests:</strong> Unlimited, có thể queue khi đông</li>
</ul>

<p><strong>Tip:</strong> Dùng fast requests cho tasks quan trọng, slow requests cho tasks không urgent.</p>

<h2>Kết luận</h2>

<p>Hiểu và chọn đúng AI model là chìa khóa để sử dụng Cursor Pro hiệu quả. Với Cursor Pro, bạn không bị giới hạn bởi một model duy nhất - bạn có toàn bộ bộ sưu tập AI mạnh mẽ nhất.</p>
    `.trim(),
    category: "AI Models",
    tags: ["ai models", "gpt-4", "claude", "cursor pro", "anthropic", "openai"],
    featuredImage: IMAGES.aiModels,
    authorName: SEO_CONFIG.name,
    metaTitle: "Các AI Models trong Cursor Pro: GPT-4, Claude - Hướng dẫn chọn",
    metaDescription: "Tìm hiểu về GPT-4o, Claude 3.5 Sonnet, GPT-4 Turbo trong Cursor Pro. Hướng dẫn chọn model phù hợp cho từng task coding.",
    metaKeywords: ["cursor pro ai models", "gpt-4 cursor", "claude cursor pro", "ai coding models", "anthropic claude"],
    isFeatured: false,
    status: "published",
    publishedAt: new Date("2024-11-20"),
    readTime: 5,
    viewCount: 720,
    createdAt: new Date("2024-11-20"),
    updatedAt: new Date("2024-11-20"),
  },
  {
    id: "static-5",
    title: "Cách tối ưu Workflow Coding với AI: Guide cho Developer 2024",
    slug: "cach-toi-uu-workflow-coding-voi-ai-2024",
    excerpt: "Hướng dẫn chi tiết cách tích hợp AI vào quy trình làm việc hàng ngày. Từ planning đến deployment, AI có thể giúp gì?",
    content: `
<h2>AI-First Development Workflow</h2>

<p>Năm 2024, AI không còn là "nice to have" - nó là <strong>game changer</strong> cho developer. Bài viết này sẽ hướng dẫn bạn cách tích hợp AI vào mọi giai đoạn của development workflow.</p>

<h2>Giai đoạn 1: Planning & Design</h2>

<h3>Brainstorm với AI</h3>

<p>Trước khi code, dùng AI để:</p>

<ul>
  <li>Phân tích requirements</li>
  <li>Suggest architecture patterns</li>
  <li>Identify potential challenges</li>
  <li>Estimate complexity</li>
</ul>

<h2>Giai đoạn 2: Development</h2>

<h3>Scaffolding với AI</h3>

<p>Dùng Cursor Composer để:</p>
<ul>
  <li>Generate project structure</li>
  <li>Create boilerplate code</li>
  <li>Setup configuration files</li>
</ul>

<h3>Feature Development</h3>

<p>Workflow đề xuất:</p>

<ol>
  <li><strong>Describe feature</strong> cho AI bằng natural language</li>
  <li><strong>Review code</strong> AI tạo ra</li>
  <li><strong>Iterate</strong> với feedback cụ thể</li>
  <li><strong>Test</strong> và refine</li>
</ol>

<h2>Giai đoạn 3: Testing</h2>

<h3>Generate Tests với AI</h3>

<p>AI excel at writing tests:</p>

<ul>
  <li>Unit tests</li>
  <li>Integration tests</li>
  <li>Edge cases</li>
</ul>

<h2>Giai đoạn 4: Code Review</h2>

<h3>Self-Review với AI</h3>

<p>Trước khi tạo PR, ask AI review code cho:</p>
<ul>
  <li>Security vulnerabilities</li>
  <li>Performance issues</li>
  <li>Best practices</li>
  <li>Code quality</li>
</ul>

<h2>Best Practices cho AI-Assisted Development</h2>

<h3>DO:</h3>
<ul>
  <li>✅ Provide clear, specific instructions</li>
  <li>✅ Include context about your project</li>
  <li>✅ Review and understand AI-generated code</li>
  <li>✅ Iterate với feedback cụ thể</li>
  <li>✅ Learn từ code suggestions</li>
</ul>

<h3>DON'T:</h3>
<ul>
  <li>❌ Blindly copy-paste code</li>
  <li>❌ Skip testing AI-generated code</li>
  <li>❌ Ignore security implications</li>
  <li>❌ Over-rely on AI for complex logic</li>
</ul>

<h2>Productivity Metrics</h2>

<p>Developer sử dụng AI-first workflow report:</p>

<table>
  <thead>
    <tr>
      <th>Metric</th>
      <th>Improvement</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Code writing speed</td>
      <td>+55%</td>
    </tr>
    <tr>
      <td>Bug fix time</td>
      <td>-40%</td>
    </tr>
    <tr>
      <td>Documentation time</td>
      <td>-70%</td>
    </tr>
    <tr>
      <td>Learning new tech</td>
      <td>+3x faster</td>
    </tr>
  </tbody>
</table>

<h2>Kết luận</h2>

<p>AI không replace developers - nó <strong>amplifies</strong> developers. Bằng cách tích hợp AI vào mọi giai đoạn workflow, bạn có thể:</p>

<ul>
  <li>Ship features nhanh hơn</li>
  <li>Viết code chất lượng hơn</li>
  <li>Focus vào solving problems thay vì typing code</li>
</ul>

<p><strong>Cursor Pro</strong> là công cụ lý tưởng để bắt đầu AI-first workflow.</p>
    `.trim(),
    category: "Insights",
    tags: ["workflow", "productivity", "ai development", "best practices", "tutorial"],
    featuredImage: IMAGES.workflow,
    authorName: SEO_CONFIG.name,
    metaTitle: "Tối ưu Workflow Coding với AI - Guide Developer 2024",
    metaDescription: "Hướng dẫn chi tiết cách tích hợp AI vào quy trình phát triển phần mềm. Từ planning đến deployment với Cursor Pro.",
    metaKeywords: ["ai workflow", "coding with ai", "developer productivity", "cursor pro workflow", "ai development"],
    isFeatured: false,
    status: "published",
    publishedAt: new Date("2024-11-15"),
    readTime: 6,
    viewCount: 650,
    createdAt: new Date("2024-11-15"),
    updatedAt: new Date("2024-11-15"),
  },
  {
    id: "static-6",
    title: "Hướng dẫn cài đặt và Setup Cursor Pro từ A-Z",
    slug: "huong-dan-cai-dat-setup-cursor-pro-a-z",
    excerpt: "Step-by-step guide cài đặt Cursor Pro, activate license, và configure settings tối ưu cho developer Việt Nam.",
    content: `
<h2>Bước 1: Download Cursor</h2>

<p>Truy cập <a href="https://cursor.sh" target="_blank">cursor.sh</a> và download phiên bản phù hợp:</p>

<ul>
  <li><strong>Windows:</strong> .exe installer</li>
  <li><strong>macOS:</strong> .dmg (Intel hoặc Apple Silicon)</li>
  <li><strong>Linux:</strong> .AppImage hoặc .deb</li>
</ul>

<h2>Bước 2: Cài đặt</h2>

<h3>Windows:</h3>
<ol>
  <li>Double-click file .exe đã download</li>
  <li>Chọn install location (recommend: default)</li>
  <li>Complete installation</li>
</ol>

<h3>macOS:</h3>
<ol>
  <li>Double-click file .dmg</li>
  <li>Drag Cursor vào Applications folder</li>
  <li>First run: Right-click → Open (bypass Gatekeeper)</li>
</ol>

<h3>Linux:</h3>
<pre><code># AppImage
chmod +x Cursor-*.AppImage
./Cursor-*.AppImage

# Debian/Ubuntu
sudo dpkg -i cursor-*.deb</code></pre>

<h2>Bước 3: Import Settings từ VS Code</h2>

<p>Khi mở Cursor lần đầu, bạn sẽ được hỏi import settings từ VS Code:</p>

<ul>
  <li><strong>Extensions:</strong> Tất cả VS Code extensions compatible</li>
  <li><strong>Settings:</strong> keybindings, themes, preferences</li>
  <li><strong>Snippets:</strong> Custom snippets</li>
</ul>

<p><strong>Recommend:</strong> Import everything - Cursor hoàn toàn compatible với VS Code ecosystem.</p>

<h2>Bước 4: Đăng nhập/Tạo Account</h2>

<ol>
  <li>Click "Sign In" ở góc phải</li>
  <li>Đăng nhập bằng: GitHub, Google, hoặc Email</li>
</ol>

<h2>Bước 5: Activate Cursor Pro License</h2>

<p>Nếu bạn mua license từ <strong>${SEO_CONFIG.name}</strong>:</p>

<ol>
  <li>Bạn sẽ nhận được email/credentials</li>
  <li>Đăng nhập bằng credentials đó</li>
  <li>License tự động activate</li>
</ol>

<h2>Bước 6: Configure AI Settings</h2>

<p>Mở Settings (<code>⌘+,</code> hoặc <code>Ctrl+,</code>) và navigate đến Cursor section:</p>

<h3>Recommended Settings:</h3>

<pre><code>{
  "cursor.chat.defaultModel": "claude-3.5-sonnet",
  "cursor.codebaseIndexing.enabled": true,
  "cursor.cpp.enablePartialAccepts": true,
  "cursor.inlineSuggest.enabled": true
}</code></pre>

<h2>Bước 7: Setup Custom Rules</h2>

<p>Vào <code>Settings → Cursor → Rules for AI</code> và thêm rules phù hợp với style của bạn.</p>

<h2>Bước 8: Index Codebase</h2>

<p>Để AI hiểu project tốt hơn:</p>

<ol>
  <li>Mở project trong Cursor</li>
  <li><code>Settings → Cursor → Codebase Indexing</code></li>
  <li>Click "Index this project"</li>
</ol>

<h2>Bước 9: Install Essential Extensions</h2>

<p>Cursor hỗ trợ tất cả VS Code extensions. Recommend:</p>

<ul>
  <li><strong>Prettier</strong> - Code formatter</li>
  <li><strong>ESLint</strong> - Linting</li>
  <li><strong>GitLens</strong> - Git insights</li>
  <li><strong>Error Lens</strong> - Inline error display</li>
</ul>

<h2>Bước 10: Verify Setup</h2>

<p>Test AI features:</p>

<ol>
  <li><strong>Test Chat:</strong> <code>⌘+L</code> → "Hello, explain what you can do"</li>
  <li><strong>Test Inline:</strong> <code>⌘+K</code> → "Create a simple React component"</li>
  <li><strong>Test Autocomplete:</strong> Start typing code, watch for suggestions</li>
</ol>

<p>Chúc bạn có trải nghiệm tuyệt vời với Cursor Pro! 🚀</p>
    `.trim(),
    category: "Tutorial",
    tags: ["cursor pro", "setup", "installation", "guide", "tutorial"],
    featuredImage: IMAGES.setup,
    authorName: SEO_CONFIG.name,
    metaTitle: "Hướng dẫn cài đặt Cursor Pro từ A-Z - Setup Guide 2024",
    metaDescription: "Step-by-step guide cài đặt và setup Cursor Pro. Download, install, configure settings tối ưu cho developer Việt Nam.",
    metaKeywords: ["cai dat cursor pro", "cursor pro setup", "huong dan cursor", "cursor installation", "cursor config"],
    isFeatured: false,
    status: "published",
    publishedAt: new Date("2024-11-10"),
    readTime: 5,
    viewCount: 980,
    createdAt: new Date("2024-11-10"),
    updatedAt: new Date("2024-11-10"),
  },
  {
    id: "static-7",
    title: "Tương lai của AI Coding: Dự đoán và Xu hướng 2024-2025",
    slug: "tuong-lai-ai-coding-du-doan-xu-huong-2024-2025",
    excerpt: "Khám phá các xu hướng AI coding sắp tới: autonomous coding agents, multi-modal AI, và cách developer cần chuẩn bị.",
    content: `
<h2>AI Coding đang thay đổi ngành công nghiệp</h2>

<p>Năm 2024 đánh dấu bước ngoặt quan trọng trong AI-assisted development. Với sự ra đời của các models như <strong>GPT-4o</strong> và <strong>Claude 3.5</strong>, AI không còn chỉ là autocomplete tool - nó đang trở thành <em>coding partner</em> thực sự.</p>

<h2>Xu hướng 1: Autonomous Coding Agents</h2>

<h3>Từ Assistant đến Agent</h3>

<p>AI đang evolve từ "assistant" sang "agent":</p>

<ul>
  <li><strong>Assistant:</strong> Bạn hỏi, AI trả lời</li>
  <li><strong>Agent:</strong> Bạn describe goal, AI tự plan và execute</li>
</ul>

<p><strong>Cursor Composer</strong> là bước đầu tiên hướng tới autonomous agents.</p>

<h2>Xu hướng 2: Multi-Modal AI</h2>

<h3>Từ Text đến Everything</h3>

<p>AI models ngày càng "đa năng":</p>

<ul>
  <li><strong>GPT-4o:</strong> Hiểu images, có thể generate UI từ mockups</li>
  <li><strong>Future models:</strong> Video understanding, voice commands</li>
</ul>

<h2>Xu hướng 3: Specialized AI Models</h2>

<p>Thay vì một AI model cho tất cả, chúng ta sẽ thấy:</p>

<ul>
  <li><strong>Frontend AI:</strong> Optimized cho React, CSS, accessibility</li>
  <li><strong>Backend AI:</strong> Database optimization, API design</li>
  <li><strong>DevOps AI:</strong> Infrastructure, deployment, monitoring</li>
  <li><strong>Security AI:</strong> Vulnerability detection, secure coding</li>
</ul>

<h2>Tác động đến Developer Career</h2>

<h3>Skills sẽ cần thiết:</h3>

<ol>
  <li><strong>AI Prompting:</strong> Biết cách communicate với AI hiệu quả</li>
  <li><strong>Code Review:</strong> Verify và improve AI-generated code</li>
  <li><strong>System Design:</strong> AI tốt ở implementation, human cần ở architecture</li>
  <li><strong>Problem Definition:</strong> Define đúng problem là 80% solution</li>
</ol>

<h2>Predictions cho 2025</h2>

<ol>
  <li><strong>50% code</strong> sẽ được AI generate hoặc assist</li>
  <li><strong>AI agents</strong> sẽ handle basic bug fixes autonomously</li>
  <li><strong>New job roles:</strong> AI Code Reviewer, Prompt Engineer</li>
  <li><strong>Cursor</strong> hoặc similar tools sẽ trở thành standard dev tool</li>
</ol>

<h2>Cách chuẩn bị</h2>

<h3>Cho Individual Developers:</h3>

<ul>
  <li>✅ Start using AI tools ngay bây giờ</li>
  <li>✅ Learn prompt engineering</li>
  <li>✅ Focus vào problem-solving, không phải typing</li>
  <li>✅ Keep learning system design</li>
</ul>

<h2>Kết luận</h2>

<p>AI coding không phải threat - nó là <strong>opportunity</strong>. Developers biết leverage AI sẽ productive hơn 10x so với những người không.</p>

<p><strong>The future is AI-augmented, not AI-replaced.</strong></p>
    `.trim(),
    category: "Trends",
    tags: ["ai future", "trends", "predictions", "ai agents", "developer career"],
    featuredImage: IMAGES.future,
    authorName: SEO_CONFIG.name,
    metaTitle: "Tương lai AI Coding 2024-2025: Xu hướng và Dự đoán",
    metaDescription: "Khám phá xu hướng AI coding: autonomous agents, multi-modal AI. Cách developer Việt Nam chuẩn bị cho tương lai AI-first.",
    metaKeywords: ["ai coding future", "ai trends 2024", "autonomous coding", "developer career ai", "cursor pro future"],
    isFeatured: false,
    status: "published",
    publishedAt: new Date("2024-11-05"),
    readTime: 6,
    viewCount: 540,
    createdAt: new Date("2024-11-05"),
    updatedAt: new Date("2024-11-05"),
  },
  {
    id: "static-8",
    title: "Tăng năng suất Developer lên 10x với Cursor Pro: Case Study thực tế",
    slug: "tang-nang-suat-developer-10x-cursor-pro-case-study",
    excerpt: "Case study từ các team development thực tế: họ đã tăng productivity như thế nào với Cursor Pro? Số liệu và insights.",
    content: `
<h2>Từ Skeptic đến Believer</h2>

<p>Khi AI coding tools mới xuất hiện, nhiều developer skeptical: "AI không thể thay thế real coding". Nhưng sau khi dùng <strong>Cursor Pro</strong>, hầu hết đều thay đổi suy nghĩ.</p>

<h2>Case Study 1: Startup Fintech - Vietnam</h2>

<h3>Background:</h3>
<ul>
  <li><strong>Team size:</strong> 5 developers</li>
  <li><strong>Stack:</strong> Next.js, TypeScript, PostgreSQL</li>
  <li><strong>Challenge:</strong> Cần ship features nhanh với limited resources</li>
</ul>

<h3>After 3 tháng với Cursor Pro:</h3>
<ul>
  <li>Average feature: <strong>1-2 ngày</strong> (-60%)</li>
  <li>Test coverage: <strong>70%+</strong> (từ ~20%)</li>
  <li>Documentation: Comprehensive (AI-assisted)</li>
</ul>

<blockquote>
<p>"Cursor Pro không chỉ giúp code nhanh hơn, mà còn cho chúng tôi confidence để viết tests và docs." - Tech Lead</p>
</blockquote>

<h2>Case Study 2: Enterprise - Media Company</h2>

<h3>Key Results:</h3>

<table>
  <thead>
    <tr>
      <th>Metric</th>
      <th>Before</th>
      <th>After</th>
      <th>Improvement</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Code review time</td>
      <td>4 hours/PR</td>
      <td>1.5 hours/PR</td>
      <td>-62%</td>
    </tr>
    <tr>
      <td>Bug fix time</td>
      <td>8 hours avg</td>
      <td>3 hours avg</td>
      <td>-62%</td>
    </tr>
    <tr>
      <td>New developer onboarding</td>
      <td>3 weeks</td>
      <td>1 week</td>
      <td>-66%</td>
    </tr>
  </tbody>
</table>

<h2>Case Study 3: Freelancer</h2>

<h3>Income Impact:</h3>
<ul>
  <li>Có thể nhận thêm 1-2 clients</li>
  <li>Deliver faster → better reviews → more referrals</li>
  <li><strong>Monthly income tăng ~40%</strong></li>
</ul>

<blockquote>
<p>"$20/tháng cho Cursor Pro là best investment. ROI chỉ trong 2 giờ làm việc." - Freelancer</p>
</blockquote>

<h2>Common Patterns from All Cases</h2>

<h3>Fastest Impact Areas:</h3>
<ul>
  <li>Boilerplate code generation</li>
  <li>Test writing</li>
  <li>Documentation</li>
  <li>Bug debugging</li>
</ul>

<h3>Learning Curve:</h3>
<ul>
  <li>Week 1: Basic usage, ~20% productivity gain</li>
  <li>Week 2-4: Advanced features, ~40% gain</li>
  <li>Month 2+: Mastery, ~50-60% sustained gain</li>
</ul>

<h2>ROI Calculator</h2>

<ul>
  <li><strong>Cursor Pro cost:</strong> $20/month = ~500,000 VND</li>
  <li><strong>Developer hourly rate (Vietnam):</strong> ~200,000 VND</li>
  <li><strong>Time saved per month:</strong> 10-20 hours (conservative)</li>
  <li><strong>Value generated:</strong> 2,000,000 - 4,000,000 VND</li>
  <li><strong>ROI:</strong> 4x - 8x</li>
</ul>

<h2>Conclusion</h2>

<p>Các case studies cho thấy pattern rõ ràng: <strong>Cursor Pro pays for itself</strong> rất nhanh. Dù bạn là solo developer hay part of large team, AI-assisted development là competitive advantage.</p>
    `.trim(),
    category: "Insights",
    tags: ["productivity", "case study", "cursor pro", "developer", "roi"],
    featuredImage: IMAGES.productivity,
    authorName: SEO_CONFIG.name,
    metaTitle: "Tăng năng suất 10x với Cursor Pro: Case Study Developer",
    metaDescription: "Case study thực tế: các team development đã tăng productivity với Cursor Pro như thế nào. Số liệu, insights và best practices.",
    metaKeywords: ["cursor pro productivity", "developer case study", "ai coding productivity", "cursor pro roi", "coding efficiency"],
    isFeatured: true,
    status: "published",
    publishedAt: new Date("2024-11-01"),
    readTime: 7,
    viewCount: 1120,
    createdAt: new Date("2024-11-01"),
    updatedAt: new Date("2024-11-01"),
  },
];

// helper functions
export function getStaticBlogPostBySlug(slug: string): StaticBlogPost | undefined {
  return STATIC_BLOG_POSTS.find((post) => post.slug === slug);
}

export function getStaticFeaturedPosts(limit = 3): StaticBlogPost[] {
  return STATIC_BLOG_POSTS
    .filter((post) => post.isFeatured && post.status === "published")
    .slice(0, limit);
}

export function getStaticPublishedPosts(options: {
  page?: number;
  limit?: number;
  category?: string;
} = {}): {
  posts: StaticBlogPost[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const { page = 1, limit = 12, category } = options;

  let filteredPosts = STATIC_BLOG_POSTS.filter((post) => post.status === "published");

  if (category && category !== "All") {
    filteredPosts = filteredPosts.filter((post) => post.category === category);
  }

  // sort by publishedAt desc
  filteredPosts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  const total = filteredPosts.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const posts = filteredPosts.slice(offset, offset + limit);

  return {
    posts,
    total,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function getStaticCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  STATIC_BLOG_POSTS
    .filter((post) => post.status === "published")
    .forEach((post) => {
      counts[post.category] = (counts[post.category] || 0) + 1;
    });
  return counts;
}

