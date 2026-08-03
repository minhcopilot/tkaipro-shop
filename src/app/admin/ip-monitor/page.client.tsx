"use client";

import {
  Activity,
  Ban,
  LogIn,
  Mail,
  Network,
  Search,
  ShieldAlert,
  ShoppingCart,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { cn } from "~/lib/cn";

// Local mirrors of the server-only lib shapes (kept here so this client module
// never imports the "server-only" ip-log module).
interface SharedIpRow {
  ip: string;
  accountCount: number;
  eventCount: number;
  emails: string[];
  lastSeen: string;
}

interface SharedFpRow {
  fingerprint: string;
  accountCount: number;
  eventCount: number;
  emails: string[];
  countries: string[];
  lastSeen: string;
}

interface IpLogRow {
  id: string;
  userId: string | null;
  email: string | null;
  eventType: string;
  ip: string;
  userAgent: string | null;
  orderId: string | null;
  country: string | null;
  fingerprint: string | null;
  did: string | null;
  path: string | null;
  createdAt: string;
}

interface BanLogRow {
  id: string;
  kind: string;
  value: string;
  reason: string | null;
  bannedByLabel: string | null;
  bannedUntil: string | null;
  createdAt: string;
}

interface BanStats {
  total: number;
  active: number;
  byKind: { ip: number; email: number; fingerprint: number };
  auto: number;
  manual: number;
  last24h: number;
  last7d: number;
  activeSet: { ips: string[]; emails: string[]; fingerprints: string[] };
}

interface BannedSet {
  ips: Set<string>;
  emails: Set<string>;
  fingerprints: Set<string>;
}

interface SuspectRow {
  type: "ip" | "fingerprint";
  value: string;
  accountCount: number;
  eventCount: number;
  emails: string[];
  countries: string[];
  lastSeen: string;
}

interface SuspectReport {
  date: string;
  ips: SuspectRow[];
  fingerprints: SuspectRow[];
}

type BanKindUI = "ip" | "email" | "fingerprint";
type ViewKey =
  | "shared"
  | "shared-fp"
  | "user"
  | "ip"
  | "stats"
  | "banlog"
  | "suspects";

interface IpMonitorClientProps {
  initialSharedIps: SharedIpRow[];
}

function fmtDate(d: Date | string) {
  try {
    return new Date(d).toLocaleString("vi-VN");
  } catch {
    return String(d);
  }
}

const EVENT_META: Record<
  string,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  register: {
    label: "Đăng ký",
    icon: <UserPlus className="size-3" />,
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  login: {
    label: "Đăng nhập",
    icon: <LogIn className="size-3" />,
    cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  order: {
    label: "Tạo đơn",
    icon: <ShoppingCart className="size-3" />,
    cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
};

function EventBadge({ type }: { type: string }) {
  const meta = EVENT_META[type] ?? {
    label: type,
    icon: <Activity className="size-3" />,
    cls: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        meta.cls,
      )}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

export function IpMonitorClient({ initialSharedIps }: IpMonitorClientProps) {
  const [view, setView] = React.useState<ViewKey>("shared");
  const [sharedIps, setSharedIps] =
    React.useState<SharedIpRow[]>(initialSharedIps);
  const [sharedFps, setSharedFps] = React.useState<SharedFpRow[]>([]);
  const [stats, setStats] = React.useState<BanStats | null>(null);
  const [banLog, setBanLog] = React.useState<BanLogRow[]>([]);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [suspectDate, setSuspectDate] = React.useState<string>(todayStr);
  const [suspectReport, setSuspectReport] = React.useState<SuspectReport | null>(null);
  const [bannedSet, setBannedSet] = React.useState<BannedSet>({
    ips: new Set(),
    emails: new Set(),
    fingerprints: new Set(),
  });
  const [query, setQuery] = React.useState("");
  const [logRows, setLogRows] = React.useState<IpLogRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const [busyBan, setBusyBan] = React.useState<string | null>(null);

  // Load tập giá trị đang bị ban (để nút hiển thị "Đã ban") + thống kê.
  const loadStats = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ip-monitor?view=stats", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const s: BanStats | undefined = data.stats;
        if (s) {
          setStats(s);
          setBannedSet({
            ips: new Set(s.activeSet.ips),
            emails: new Set(s.activeSet.emails),
            fingerprints: new Set(s.activeSet.fingerprints),
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const reloadSuspects = React.useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/ip-monitor?view=suspects&date=${encodeURIComponent(date)}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = await res.json();
        setSuspectReport(data.report ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  async function reloadBanLog() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ip-monitor?view=banlog&limit=200", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setBanLog(data.rows ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function reloadShared() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ip-monitor?view=shared&limit=100", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setSharedIps(data.rows ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function reloadSharedFp() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ip-monitor?view=shared-fp&limit=100", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setSharedFps(data.rows ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/admin/ip-monitor?view=${view}&q=${encodeURIComponent(q)}&limit=300`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = await res.json();
        setLogRows(data.rows ?? []);
      } else {
        setLogRows([]);
      }
    } finally {
      setLoading(false);
    }
  }

  // 1-click ban — reuses the existing /api/admin/bans endpoint.
  async function handleBan(kind: BanKindUI, value: string) {
    const label = kind === "ip" ? "IP" : kind === "email" ? "email" : "thiết bị";
    if (!window.confirm(`Ban ${label} "${value}"?`)) {
      return;
    }
    setBusyBan(`${kind}:${value}`);
    try {
      const res = await fetch("/api/admin/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          value,
          reason: "IP monitor: nghi ngờ bypass / multi-account",
        }),
      });
      if (res.ok) {
        // Cập nhật ngay tập đã-ban để nút đổi sang "Đã ban".
        setBannedSet((prev) => {
          const next = {
            ips: new Set(prev.ips),
            emails: new Set(prev.emails),
            fingerprints: new Set(prev.fingerprints),
          };
          if (kind === "ip") next.ips.add(value);
          else if (kind === "email") next.emails.add(value);
          else if (kind === "fingerprint") next.fingerprints.add(value);
          return next;
        });
        window.alert(`Đã ban ${label}: ${value}`);
      } else {
        const err = await res.json().catch(() => ({}));
        window.alert(
          err.error === "ALREADY_BANNED"
            ? "Đã bị ban từ trước"
            : (err.message ?? err.error ?? "Không thể ban"),
        );
      }
    } finally {
      setBusyBan(null);
    }
  }

  async function handleUnban(kind: BanKindUI, value: string) {
    if (!window.confirm(`Gỡ ban "${value}"?`)) return;
    setBusyBan(`${kind}:${value}`);
    try {
      const res = await fetch(
        `/api/admin/bans?kind=${encodeURIComponent(kind)}&value=${encodeURIComponent(value)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setBannedSet((prev) => {
          const next = {
            ips: new Set(prev.ips),
            emails: new Set(prev.emails),
            fingerprints: new Set(prev.fingerprints),
          };
          if (kind === "ip") next.ips.delete(value);
          else if (kind === "email") next.emails.delete(value);
          else if (kind === "fingerprint") next.fingerprints.delete(value);
          return next;
        });
        setBanLog((prev) =>
          prev.filter((r) => !(r.kind === kind && r.value === value)),
        );
      } else {
        window.alert("Không thể gỡ ban");
      }
    } finally {
      setBusyBan(null);
    }
  }

  function switchView(v: ViewKey) {
    setView(v);
    setSearched(false);
    setLogRows([]);
    setQuery("");
    if (v === "shared-fp" && sharedFps.length === 0) {
      void reloadSharedFp();
    }
    if (v === "stats") {
      void loadStats();
    }
    if (v === "banlog") {
      void reloadBanLog();
    }
    if (v === "suspects") {
      void reloadSuspects(suspectDate);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShieldAlert className="size-6 text-red-500" />
          Giám sát IP
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Theo dõi IP đăng ký / đăng nhập / tạo đơn. Phát hiện nhiều tài khoản
          dùng chung 1 IP (dấu hiệu cố tình bypass) và ban nhanh IP / email.
        </p>
      </div>

      {/* View switcher */}
      <div className="flex flex-wrap gap-2">
        <TabButton
          active={view === "shared"}
          onClick={() => switchView("shared")}
          icon={<Network className="size-4" />}
          label="IP dùng chung"
        />
        <TabButton
          active={view === "shared-fp"}
          onClick={() => switchView("shared-fp")}
          icon={<ShieldAlert className="size-4" />}
          label="Thiết bị dùng chung"
        />
        <TabButton
          active={view === "user"}
          onClick={() => switchView("user")}
          icon={<Mail className="size-4" />}
          label="Tra theo user"
        />
        <TabButton
          active={view === "ip"}
          onClick={() => switchView("ip")}
          icon={<Activity className="size-4" />}
          label="Tra theo IP"
        />
        <TabButton
          active={view === "suspects"}
          onClick={() => switchView("suspects")}
          icon={<ShieldAlert className="size-4" />}
          label="Nghi ngờ theo ngày"
        />
        <TabButton
          active={view === "stats"}
          onClick={() => switchView("stats")}
          icon={<Activity className="size-4" />}
          label="Báo cáo"
        />
        <TabButton
          active={view === "banlog"}
          onClick={() => switchView("banlog")}
          icon={<Ban className="size-4" />}
          label="Lịch sử ban"
        />
      </div>

      {view === "shared" ? (
        <SharedView
          rows={sharedIps}
          loading={loading}
          busyBan={busyBan}
          bannedSet={bannedSet}
          onRefresh={reloadShared}
          onBan={handleBan}
          onInspectIp={(ip) => {
            setView("ip");
            setQuery(ip);
            setSearched(false);
          }}
        />
      ) : view === "shared-fp" ? (
        <SharedFpView
          rows={sharedFps}
          loading={loading}
          busyBan={busyBan}
          bannedSet={bannedSet}
          onRefresh={reloadSharedFp}
          onBan={handleBan}
        />
      ) : view === "suspects" ? (
        <SuspectsView
          report={suspectReport}
          date={suspectDate}
          setDate={setSuspectDate}
          loading={loading}
          busyBan={busyBan}
          bannedSet={bannedSet}
          onReload={reloadSuspects}
          onBan={handleBan}
        />
      ) : view === "stats" ? (
        <StatsView stats={stats} loading={loading} onRefresh={loadStats} />
      ) : view === "banlog" ? (
        <BanLogView
          rows={banLog}
          loading={loading}
          onRefresh={reloadBanLog}
          onUnban={handleUnban}
          busyBan={busyBan}
        />
      ) : (
        <SearchView
          view={view}
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          rows={logRows}
          loading={loading}
          searched={searched}
          busyBan={busyBan}
          bannedSet={bannedSet}
          onBan={handleBan}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-transparent bg-blue-600 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function BannedTag({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/50 dark:text-red-300"
      title="Đã bị ban"
    >
      <Ban className="size-3" />
      Đã ban {label}
    </span>
  );
}

function BanButtons({
  ip,
  email,
  fingerprint,
  busyBan,
  bannedSet,
  onBan,
}: {
  ip?: string | null;
  email?: string | null;
  fingerprint?: string | null;
  busyBan: string | null;
  bannedSet?: BannedSet;
  onBan: (kind: BanKindUI, value: string) => void;
}) {
  const btn =
    "inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-red-100 hover:text-red-700 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-red-900 dark:hover:text-red-300";
  const ipBanned = !!(ip && bannedSet?.ips.has(ip));
  const emailBanned = !!(email && bannedSet?.emails.has(email));
  const fpBanned = !!(fingerprint && bannedSet?.fingerprints.has(fingerprint));
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {ip && ip !== "unknown" ? (
        ipBanned ? (
          <BannedTag label="IP" />
        ) : (
          <button
            onClick={() => onBan("ip", ip)}
            disabled={busyBan === `ip:${ip}`}
            className={btn}
            title="Ban IP này"
          >
            <Ban className="size-3" />
            Ban IP
          </button>
        )
      ) : null}
      {email ? (
        emailBanned ? (
          <BannedTag label="email" />
        ) : (
          <button
            onClick={() => onBan("email", email)}
            disabled={busyBan === `email:${email}`}
            className={btn}
            title="Ban email này"
          >
            <Mail className="size-3" />
            Ban email
          </button>
        )
      ) : null}
      {fingerprint ? (
        fpBanned ? (
          <BannedTag label="thiết bị" />
        ) : (
          <button
            onClick={() => onBan("fingerprint", fingerprint)}
            disabled={busyBan === `fingerprint:${fingerprint}`}
            className={btn}
            title="Ban thiết bị (fingerprint) này"
          >
            <ShieldAlert className="size-3" />
            Ban thiết bị
          </button>
        )
      ) : null}
    </div>
  );
}

function SharedView({
  rows,
  loading,
  busyBan,
  bannedSet,
  onRefresh,
  onBan,
  onInspectIp,
}: {
  rows: SharedIpRow[];
  loading: boolean;
  busyBan: string | null;
  bannedSet: BannedSet;
  onRefresh: () => void;
  onBan: (kind: BanKindUI, value: string) => void;
  onInspectIp: (ip: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          IP có từ 2 tài khoản trở lên. Số account càng cao càng đáng ngờ.
        </p>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">IP</th>
              <th className="px-3 py-2 text-left font-medium">Số account</th>
              <th className="px-3 py-2 text-left font-medium">Số sự kiện</th>
              <th className="px-3 py-2 text-left font-medium">Email liên quan</th>
              <th className="px-3 py-2 text-left font-medium">Gần nhất</th>
              <th className="px-3 py-2 text-right font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  Chưa phát hiện IP dùng chung nhiều account
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.ip}
                  className="border-t hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <td className="px-3 py-2">
                    <button
                      onClick={() => onInspectIp(row.ip)}
                      className="font-mono text-xs text-blue-600 hover:underline dark:text-blue-400"
                      title="Xem chi tiết IP này"
                    >
                      {row.ip}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                        row.accountCount >= 3
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
                      )}
                    >
                      {row.accountCount}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{row.eventCount}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                    <div className="flex flex-wrap gap-1">
                      {row.emails.slice(0, 6).map((em) => (
                        <span
                          key={em}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700"
                        >
                          {em}
                        </span>
                      ))}
                      {row.emails.length > 6 ? (
                        <span className="text-xs text-gray-400">
                          +{row.emails.length - 6}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {fmtDate(row.lastSeen)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <BanButtons
                      ip={row.ip}
                      busyBan={busyBan}
                      bannedSet={bannedSet}
                      onBan={onBan}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SuspectTable({
  title,
  rows,
  kind,
  busyBan,
  bannedSet,
  onBan,
}: {
  title: string;
  rows: SuspectRow[];
  kind: BanKindUI;
  busyBan: string | null;
  bannedSet: BannedSet;
  onBan: (kind: BanKindUI, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title} ({rows.length})</h3>
      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{kind === "ip" ? "IP" : "Thiết bị (FP)"}</th>
              <th className="px-3 py-2 text-left font-medium">Số account</th>
              <th className="px-3 py-2 text-left font-medium">Quốc gia</th>
              <th className="px-3 py-2 text-left font-medium">Email liên quan</th>
              <th className="px-3 py-2 text-right font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                  Không có mục nghi ngờ
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.value} className="border-t hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-2 font-mono text-xs break-all" title={row.value}>
                    {kind === "fingerprint" && row.value.length > 16
                      ? `${row.value.slice(0, 16)}…`
                      : row.value}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                        row.accountCount >= 3
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
                      )}
                    >
                      {row.accountCount}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {(row.countries ?? []).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                    <div className="flex flex-wrap gap-1">
                      {row.emails.slice(0, 6).map((em) => (
                        <span key={em} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                          {em}
                        </span>
                      ))}
                      {row.emails.length > 6 ? (
                        <span className="text-xs text-gray-400">+{row.emails.length - 6}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {kind === "ip" ? (
                      <BanButtons ip={row.value} busyBan={busyBan} bannedSet={bannedSet} onBan={onBan} />
                    ) : (
                      <BanButtons fingerprint={row.value} busyBan={busyBan} bannedSet={bannedSet} onBan={onBan} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SuspectsView({
  report,
  date,
  setDate,
  loading,
  busyBan,
  bannedSet,
  onReload,
  onBan,
}: {
  report: SuspectReport | null;
  date: string;
  setDate: (d: string) => void;
  loading: boolean;
  busyBan: string | null;
  bannedSet: BannedSet;
  onReload: (date: string) => void;
  onBan: (kind: BanKindUI, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          IP / thiết bị có từ 2 tài khoản khác nhau hoạt động trong ngày — xem xét để ban.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <button
            onClick={() => onReload(date)}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "Xem"}
          </button>
        </div>
      </div>
      {report ? (
        <div className="space-y-5">
          <SuspectTable
            title="IP nghi ngờ trong ngày"
            rows={report.ips}
            kind="ip"
            busyBan={busyBan}
            bannedSet={bannedSet}
            onBan={onBan}
          />
          <SuspectTable
            title="Thiết bị nghi ngờ trong ngày"
            rows={report.fingerprints}
            kind="fingerprint"
            busyBan={busyBan}
            bannedSet={bannedSet}
            onBan={onBan}
          />
        </div>
      ) : (
        <p className="text-sm text-gray-500">Chọn ngày và bấm Xem.</p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-4 dark:border-gray-700">
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function StatsView({
  stats,
  loading,
  onRefresh,
}: {
  stats: BanStats | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Thống kê ban (đang hiệu lực) + hoạt động gần đây.
        </p>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>
      {!stats ? (
        <p className="text-sm text-gray-500">Đang tải thống kê...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Tổng đang ban" value={stats.active} />
          <StatCard label="Ban tự động (auto)" value={stats.auto} />
          <StatCard label="Ban thủ công" value={stats.manual} />
          <StatCard label="Ban 24h qua" value={stats.last24h} />
          <StatCard label="Ban IP" value={stats.byKind.ip} />
          <StatCard label="Ban Email" value={stats.byKind.email} />
          <StatCard label="Ban Thiết bị" value={stats.byKind.fingerprint} />
          <StatCard label="Ban 7 ngày qua" value={stats.last7d} />
        </div>
      )}
    </div>
  );
}

function BanLogView({
  rows,
  loading,
  busyBan,
  onRefresh,
  onUnban,
}: {
  rows: BanLogRow[];
  loading: boolean;
  busyBan: string | null;
  onRefresh: () => void;
  onUnban: (kind: BanKindUI, value: string) => void;
}) {
  const kindLabel: Record<string, string> = {
    ip: "IP",
    email: "Email",
    fingerprint: "Thiết bị",
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Lịch sử ban (auto + thủ công). IP ban tạm sẽ tự hết hạn theo "Hết hạn".
        </p>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Loại</th>
              <th className="px-3 py-2 text-left font-medium">Giá trị</th>
              <th className="px-3 py-2 text-left font-medium">Nguồn</th>
              <th className="px-3 py-2 text-left font-medium">Lý do</th>
              <th className="px-3 py-2 text-left font-medium">Hết hạn</th>
              <th className="px-3 py-2 text-left font-medium">Tạo lúc</th>
              <th className="px-3 py-2 text-right font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                  Chưa có bản ghi ban nào
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isAuto = (row.bannedByLabel ?? "").toLowerCase() === "auto-detect";
                return (
                  <tr key={row.id} className="border-t hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2">{kindLabel[row.kind] ?? row.kind}</td>
                    <td className="px-3 py-2 font-mono text-xs break-all" title={row.value}>
                      {row.value.length > 28 ? `${row.value.slice(0, 28)}…` : row.value}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          isAuto
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
                        )}
                      >
                        {isAuto ? "Tự động" : "Thủ công"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500 max-w-xs truncate" title={row.reason ?? ""}>
                      {row.reason ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {row.bannedUntil ? fmtDate(row.bannedUntil) : "Vĩnh viễn"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">{fmtDate(row.createdAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => onUnban(row.kind as BanKindUI, row.value)}
                        disabled={busyBan === `${row.kind}:${row.value}`}
                        className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-green-100 hover:text-green-700 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200"
                      >
                        Gỡ ban
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SharedFpView({
  rows,
  loading,
  busyBan,
  bannedSet,
  onRefresh,
  onBan,
}: {
  rows: SharedFpRow[];
  loading: boolean;
  busyBan: string | null;
  bannedSet: BannedSet;
  onRefresh: () => void;
  onBan: (kind: BanKindUI, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Thiết bị (fingerprint) được nhiều account dùng chung — kể cả khi đổi
          IP/VPN. Số account càng cao càng đáng ngờ.
        </p>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Thiết bị (FP)</th>
              <th className="px-3 py-2 text-left font-medium">Số account</th>
              <th className="px-3 py-2 text-left font-medium">Quốc gia</th>
              <th className="px-3 py-2 text-left font-medium">Email liên quan</th>
              <th className="px-3 py-2 text-left font-medium">Gần nhất</th>
              <th className="px-3 py-2 text-right font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  Chưa phát hiện thiết bị dùng chung nhiều account
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.fingerprint}
                  className="border-t hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <td className="px-3 py-2 font-mono text-xs" title={row.fingerprint}>
                    {row.fingerprint.slice(0, 16)}…
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                        row.accountCount >= 3
                          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
                      )}
                    >
                      {row.accountCount}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {(row.countries ?? []).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                    <div className="flex flex-wrap gap-1">
                      {row.emails.slice(0, 6).map((em) => (
                        <span
                          key={em}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700"
                        >
                          {em}
                        </span>
                      ))}
                      {row.emails.length > 6 ? (
                        <span className="text-xs text-gray-400">
                          +{row.emails.length - 6}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {fmtDate(row.lastSeen)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <BanButtons
                      fingerprint={row.fingerprint}
                      busyBan={busyBan}
                      bannedSet={bannedSet}
                      onBan={onBan}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SearchView({
  view,
  query,
  setQuery,
  onSearch,
  rows,
  loading,
  searched,
  busyBan,
  bannedSet,
  onBan,
}: {
  view: "user" | "ip";
  query: string;
  setQuery: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  rows: IpLogRow[];
  loading: boolean;
  searched: boolean;
  busyBan: string | null;
  bannedSet: BannedSet;
  onBan: (kind: BanKindUI, value: string) => void;
}) {
  const placeholder =
    view === "user" ? "Nhập email hoặc userId" : "Nhập địa chỉ IP";

  return (
    <div className="space-y-3">
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Đang tra..." : "Tra cứu"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Sự kiện</th>
              <th className="px-3 py-2 text-left font-medium">IP</th>
              <th className="px-3 py-2 text-left font-medium">Quốc gia</th>
              <th className="px-3 py-2 text-left font-medium">Thiết bị (FP)</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Đường dẫn / Hành động</th>
              <th className="px-3 py-2 text-left font-medium">User / Đơn</th>
              <th className="px-3 py-2 text-left font-medium">Thời gian</th>
              <th className="px-3 py-2 text-right font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {!searched ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  Nhập từ khoá và bấm Tra cứu
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  Không tìm thấy log nào
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <td className="px-3 py-2">
                    <EventBadge type={row.eventType} />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.ip}</td>
                  <td className="px-3 py-2 text-xs">{row.country ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs" title={row.fingerprint ?? ""}>
                    {row.fingerprint ? `${row.fingerprint.slice(0, 10)}…` : "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                    {row.email ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 max-w-[180px] truncate" title={row.path ?? ""}>
                    {row.path ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {row.orderId ? (
                      <Link
                        href={`/admin/orders?q=${encodeURIComponent(row.orderId)}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        đơn {row.orderId.slice(0, 8)}
                      </Link>
                    ) : (
                      (row.userId?.slice(0, 12) ?? "—")
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {fmtDate(row.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <BanButtons
                      ip={row.ip}
                      email={row.email}
                      fingerprint={row.fingerprint}
                      busyBan={busyBan}
                      bannedSet={bannedSet}
                      onBan={onBan}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
