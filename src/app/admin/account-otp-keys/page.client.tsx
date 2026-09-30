"use client";

import {
  Check,
  CheckCircle2,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { cn } from "~/lib/cn";

export interface OtpKeyRow {
  id: string;
  email: string;
  isActive: boolean;
  note: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

interface ApiResponse {
  error?: string;
  message?: string;
  rows?: OtpKeyRow[];
  created?: string[];
  duplicates?: string[];
  invalid?: string[];
}

async function readJson(res: Response): Promise<ApiResponse> {
  return (await res.json().catch(() => ({}))) as ApiResponse;
}

interface AccountOtpKeysPageClientProps {
  initialRows: OtpKeyRow[];
}

const inputClass =
  "rounded-lg border bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900";

function fmtDate(d: string | null) {
  if (!d) return "—";
  const dd = new Date(d);
  return Number.isFinite(dd.getTime()) ? dd.toLocaleString("vi-VN") : d;
}

export function AccountOtpKeysPageClient({
  initialRows,
}: AccountOtpKeysPageClientProps) {
  const [rows, setRows] = React.useState<OtpKeyRow[]>(initialRows);
  const [search, setSearch] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const [singleEmail, setSingleEmail] = React.useState("");
  const [singlePassword, setSinglePassword] = React.useState("");
  const [singleNote, setSingleNote] = React.useState("");
  const [bulkEntries, setBulkEntries] = React.useState("");
  const [bulkNote, setBulkNote] = React.useState("");

  const [saved, setSaved] = React.useState<string[]>([]);
  const [report, setReport] = React.useState<{
    duplicates: string[];
    invalid: string[];
  } | null>(null);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingNote, setEditingNote] = React.useState("");

  const reload = React.useCallback(async (q: string) => {
    const res = await fetch(
      `/api/admin/account-otp-keys?q=${encodeURIComponent(q.trim())}`,
      { cache: "no-store" },
    );
    if (!res.ok) return;
    const data = await readJson(res);
    setRows(data.rows ?? []);
  }, []);

  React.useEffect(() => {
    const handle = setTimeout(() => void reload(search), 300);
    return () => clearTimeout(handle);
  }, [search, reload]);

  async function create(payload: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/account-otp-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await readJson(res);
      const created: string[] = data.created ?? [];
      const duplicates: string[] = data.duplicates ?? [];
      const invalid: string[] = data.invalid ?? [];
      if (duplicates.length || invalid.length) setReport({ duplicates, invalid });
      else setReport(null);
      if (!res.ok && created.length === 0) {
        toast.error(
          data.error === "NO_VALID_ENTRY"
            ? "Không có dòng email|mật khẩu hợp lệ"
            : (data.message ?? data.error ?? "Không lưu được"),
        );
        return false;
      }
      if (created.length > 0) {
        setSaved(created);
        toast.success(`Đã lưu ${created.length} tài khoản`);
      } else {
        toast.info("Không có tài khoản mới (email đã tồn tại)");
      }
      await reload(search);
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function handleAddSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!singleEmail.trim() || !singlePassword.trim()) return;
    const ok = await create({
      email: singleEmail.trim(),
      password: singlePassword,
      note: singleNote.trim() || null,
    });
    if (ok) {
      setSingleEmail("");
      setSinglePassword("");
      setSingleNote("");
    }
  }

  async function handleBulk(e: React.FormEvent) {
    e.preventDefault();
    if (!bulkEntries.trim()) return;
    const ok = await create({
      entries: bulkEntries,
      note: bulkNote.trim() || null,
    });
    if (ok) {
      setBulkEntries("");
      setBulkNote("");
    }
  }

  async function patch(
    row: OtpKeyRow,
    payload: Record<string, unknown>,
  ): Promise<ApiResponse | null> {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/account-otp-keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, ...payload }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        toast.error(data.error ?? "Không cập nhật được");
        return null;
      }
      await reload(search);
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function handleSetPassword(row: OtpKeyRow) {
    const password = window.prompt(
      `Nhập mật khẩu mới cho "${row.email}". Mật khẩu cũ sẽ không dùng được nữa.`,
    );
    if (password === null) return;
    if (!password.trim()) {
      toast.error("Mật khẩu không được để trống");
      return;
    }
    const data = await patch(row, { action: "setPassword", password });
    if (data) toast.success("Đã đổi mật khẩu");
  }

  async function handleSaveNote(row: OtpKeyRow) {
    const data = await patch(row, { note: editingNote });
    if (data) setEditingId(null);
  }

  async function handleDelete(row: OtpKeyRow) {
    if (!window.confirm(`Xoá key của "${row.email}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/account-otp-keys?id=${encodeURIComponent(row.id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await readJson(res);
        toast.error(data.error ?? "Không xoá được");
        return;
      }
      await reload(search);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <KeyRound className="size-6 text-amber-500" />
          Mã lấy OTP
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Mỗi email tài khoản dùng chính mật khẩu tài khoản làm key. Khách nhập
          email + mật khẩu ở trang
          <code className="mx-1 rounded bg-gray-100 px-1 dark:bg-gray-800">
            /lay-ma
          </code>
          để lấy mã đăng nhập mới nhất. Chỉ lưu hash, mật khẩu phân biệt hoa
          thường.
        </p>
      </div>

      {saved.length > 0 && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/40">
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="flex items-start gap-2 text-sm font-medium text-green-900 dark:text-green-200">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              Đã lưu {saved.length} tài khoản. Mật khẩu bạn vừa nhập chính là
              key khách dùng ở /lay-ma.
            </p>
            <button
              type="button"
              onClick={() => setSaved([])}
              className="shrink-0 rounded-lg p-1 hover:bg-green-100 dark:hover:bg-green-900"
              aria-label="Đóng"
            >
              <X className="size-4" />
            </button>
          </div>
          <ul className="max-h-80 space-y-1 overflow-auto">
            {saved.map((email) => (
              <li
                key={email}
                className="truncate rounded bg-white px-3 py-1.5 text-sm dark:bg-gray-900"
              >
                {email}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report && (
        <div className="rounded-lg border bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
          {report.duplicates.length > 0 && (
            <p>
              <span className="font-medium">Đã tồn tại / trùng</span> (
              {report.duplicates.length}): {report.duplicates.join(", ")}
            </p>
          )}
          {report.invalid.length > 0 && (
            <p className="text-red-600 dark:text-red-400">
              <span className="font-medium">
                Không hợp lệ (email sai / thiếu mật khẩu)
              </span>{" "}
              (
              {report.invalid.length}): {report.invalid.join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form
          onSubmit={handleAddSingle}
          className="space-y-3 rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <h2 className="text-base font-semibold">Thêm 1 tài khoản</h2>
          <input
            type="email"
            placeholder="user@example.com"
            value={singleEmail}
            onChange={(e) => setSingleEmail(e.target.value)}
            className={cn(inputClass, "w-full")}
            disabled={busy}
            autoComplete="off"
          />
          <input
            type="text"
            placeholder="Mật khẩu (chính là key)"
            value={singlePassword}
            onChange={(e) => setSinglePassword(e.target.value)}
            className={cn(inputClass, "w-full font-mono")}
            disabled={busy}
            autoComplete="off"
            spellCheck={false}
          />
          <input
            type="text"
            placeholder="Ghi chú (tuỳ chọn)"
            value={singleNote}
            onChange={(e) => setSingleNote(e.target.value)}
            className={cn(inputClass, "w-full")}
            disabled={busy}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={busy || !singleEmail.trim() || !singlePassword.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            <Plus className="size-4" />
            Lưu tài khoản
          </button>
        </form>

        <form
          onSubmit={handleBulk}
          className="space-y-3 rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <h2 className="text-base font-semibold">
            Dán nhiều dòng email|mật khẩu
          </h2>
          <textarea
            placeholder={"a@example.com|matkhau1\nb@example.com|matkhau2"}
            value={bulkEntries}
            onChange={(e) => setBulkEntries(e.target.value)}
            rows={4}
            className={cn(inputClass, "w-full font-mono")}
            disabled={busy}
            spellCheck={false}
          />
          <input
            type="text"
            placeholder="Ghi chú chung (tuỳ chọn)"
            value={bulkNote}
            onChange={(e) => setBulkNote(e.target.value)}
            className={cn(inputClass, "w-full")}
            disabled={busy}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={busy || !bulkEntries.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            <Plus className="size-4" />
            Lưu hàng loạt
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo email / ghi chú"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {rows.length} bản ghi
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2">Ghi chú</th>
              <th className="px-3 py-2">Tạo lúc</th>
              <th className="px-3 py-2">Dùng lần cuối</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  Chưa có key nào
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-t dark:border-gray-700"
              >
                <td className="px-3 py-2 font-medium">{row.email}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void patch(row, { isActive: !row.isActive })}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium disabled:opacity-50",
                      row.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                    )}
                    title="Bấm để bật / tắt"
                  >
                    {row.isActive ? "Đang bật" : "Đã tắt"}
                  </button>
                </td>
                <td className="px-3 py-2">
                  {editingId === row.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingNote}
                        onChange={(e) => setEditingNote(e.target.value)}
                        className={cn(inputClass, "py-1")}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleSaveNote(row);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleSaveNote(row)}
                        className="rounded p-1 text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Lưu"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Huỷ"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(row.id);
                        setEditingNote(row.note ?? "");
                      }}
                      className="group flex items-center gap-1 text-left text-gray-600 dark:text-gray-300"
                    >
                      <span>{row.note || "—"}</span>
                      <Pencil className="size-3 opacity-0 group-hover:opacity-100" />
                    </button>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-500 dark:text-gray-400">
                  {fmtDate(row.createdAt)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-500 dark:text-gray-400">
                  {fmtDate(row.lastUsedAt)}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleSetPassword(row)}
                      className="rounded p-1.5 text-amber-600 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"
                      title="Đổi mật khẩu"
                    >
                      <RefreshCw className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleDelete(row)}
                      className="rounded p-1.5 text-red-600 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"
                      title="Xoá"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
