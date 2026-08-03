"use client";

import { Ban, Mail, Network, Plus, Search, Trash2 } from "lucide-react";
import * as React from "react";

import type { BanEntry, BanKind } from "~/db/schema/security/types";
import { cn } from "~/lib/cn";

interface BansPageClientProps {
  initialIpBans: BanEntry[];
  initialEmailBans: BanEntry[];
  ipTotal: number;
  emailTotal: number;
}

const IP_RE = /^(?:\d{1,3}(?:\.\d{1,3}){3}|[0-9a-fA-F:]+)$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fmtDate(d: Date | string) {
  try {
    const dd = typeof d === "string" ? new Date(d) : d;
    return dd.toLocaleString("vi-VN");
  } catch {
    return String(d);
  }
}

export function BansPageClient({
  initialIpBans,
  initialEmailBans,
  ipTotal,
  emailTotal,
}: BansPageClientProps) {
  const [tab, setTab] = React.useState<BanKind>("ip");
  const [ipBans, setIpBans] = React.useState(initialIpBans);
  const [emailBans, setEmailBans] = React.useState(initialEmailBans);
  const [search, setSearch] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const [formValue, setFormValue] = React.useState("");
  const [formReason, setFormReason] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  const rows = tab === "ip" ? ipBans : emailBans;
  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.value.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q),
    );
  }, [rows, search]);

  async function reload(kind: BanKind) {
    const res = await fetch(`/api/admin/bans?kind=${kind}&limit=200`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    if (kind === "ip") setIpBans(data.rows ?? []);
    else setEmailBans(data.rows ?? []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const value = formValue.trim();
    if (!value) {
      setFormError("Vui lòng nhập giá trị");
      return;
    }
    if (tab === "ip" && !IP_RE.test(value)) {
      setFormError("IP không hợp lệ");
      return;
    }
    if (tab === "email" && !EMAIL_RE.test(value)) {
      setFormError("Email không hợp lệ");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: tab,
          value,
          reason: formReason.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === "ALREADY_BANNED") {
          setFormError(
            tab === "ip"
              ? "IP này đã bị ban rồi"
              : "Email này đã bị ban rồi",
          );
        } else {
          setFormError(err.message ?? err.error ?? "Không thể ban");
        }
        return;
      }
      setFormValue("");
      setFormReason("");
      await reload(tab);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(entry: BanEntry) {
    if (
      !window.confirm(
        `Bỏ ban ${entry.kind === "ip" ? "IP" : "email"} "${entry.value}"?`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/bans?kind=${entry.kind}&value=${encodeURIComponent(entry.value)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message ?? err.error ?? "Không thể unban");
        return;
      }
      await reload(entry.kind as BanKind);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ban className="size-6 text-red-500" />
          Ban IP / Email
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Chặn IP / email lạm dụng. IP bị ban không vào được site (tự động
          render 403). Email bị ban không đặt được đơn / không active được key.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SummaryCard
          icon={<Network className="size-5" />}
          label="IP đang ban"
          count={ipTotal}
          active={tab === "ip"}
          onClick={() => setTab("ip")}
          colorClass="text-red-600 dark:text-red-400"
        />
        <SummaryCard
          icon={<Mail className="size-5" />}
          label="Email đang ban"
          count={emailTotal}
          active={tab === "email"}
          onClick={() => setTab("email")}
          colorClass="text-orange-600 dark:text-orange-400"
        />
      </div>

      <form
        onSubmit={handleAdd}
        className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      >
        <h2 className="text-base font-semibold mb-3">
          Thêm {tab === "ip" ? "IP" : "Email"} vào ban list
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="text"
            placeholder={
              tab === "ip" ? "203.0.113.42" : "user@example.com"
            }
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            disabled={busy}
            autoComplete="off"
          />
          <input
            type="text"
            placeholder="Lý do (tuỳ chọn)"
            value={formReason}
            onChange={(e) => setFormReason(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 md:col-span-1"
            disabled={busy}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Plus className="size-4" />
            Ban
          </button>
        </div>
        {formError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {formError}
          </p>
        )}
      </form>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo IP / email / lý do"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {filteredRows.length} / {rows.length} bản ghi
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium">
                {tab === "ip" ? "IP" : "Email"}
              </th>
              <th className="px-3 py-2 text-left font-medium">Lý do</th>
              <th className="px-3 py-2 text-left font-medium">Admin ban</th>
              <th className="px-3 py-2 text-left font-medium">Tạo lúc</th>
              <th className="px-3 py-2 text-left font-medium">Hết hạn</th>
              <th className="px-3 py-2 text-right font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  Chưa có {tab === "ip" ? "IP" : "email"} nào bị ban
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-3 py-2 font-mono text-xs">{row.value}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                    {row.reason ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {row.bannedByLabel ?? row.bannedBy ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {fmtDate(row.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {row.bannedUntil ? fmtDate(row.bannedUntil) : "Vĩnh viễn"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleRemove(row)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-red-100 hover:text-red-700 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-red-900 dark:hover:text-red-300"
                      title="Bỏ ban"
                    >
                      <Trash2 className="size-3" />
                      Unban
                    </button>
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

function SummaryCard({
  icon,
  label,
  count,
  active,
  onClick,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  colorClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-lg border bg-white p-4 text-left transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700",
        active
          ? "ring-2 ring-blue-500 border-transparent"
          : "border-gray-200 dark:border-gray-700",
      )}
    >
      <div>
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            colorClass,
          )}
        >
          {icon}
          {label}
        </div>
        <div className="mt-1 text-2xl font-bold">{count}</div>
      </div>
    </button>
  );
}
