"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { 
  X, 
  Package, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  Edit,
  Save,
  KeyRound,
  ArrowUpCircle,
  Copy,
  Check,
  MessageCircle,
  Send,
  AlertTriangle,
  Ban,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import type { Order } from "~/db/schema/orders/types";

import { SEO_CONFIG } from "~/app";
import { Button } from "~/ui/primitives/button";
import { UserOrderCredentials } from "~/ui/components/orders/user-order-credentials";
import { Badge } from "~/ui/primitives/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "~/ui/primitives/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";
import { Textarea } from "~/ui/primitives/textarea";
import { Separator } from "~/ui/primitives/separator";

interface OrderDetailsModalProps {
  order: Order;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status?: string, paymentStatus?: string) => Promise<void>;
}

export function OrderDetailsModal({ 
  order, 
  open, 
  onClose, 
  onStatusUpdate 
}: OrderDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [notes, setNotes] = useState(order.notes || "");
  const [saving, setSaving] = useState(false);
  const [copiedCredential, setCopiedCredential] = useState<string | null>(null);
  const [copiedContact, setCopiedContact] = useState<string | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedUpgradeItem, setSelectedUpgradeItem] = useState<{
    productName: string;
    upgradeEmail: string;
  } | null>(null);
  
  // state cho email liên hệ nhận tài khoản (account type)
  const [showAccountEmailDialog, setShowAccountEmailDialog] = useState(false);
  const [accountEmailMessage, setAccountEmailMessage] = useState("");
  const [selectedAccountItem, setSelectedAccountItem] = useState<{
    productName: string;
  } | null>(null);

  // state cho activation code (cho phép update UI sau khi admin reset / regen)
  const [activationCode, setActivationCode] = useState<string | null>(
    order.activationCode ?? null,
  );
  const [activationSlots, setActivationSlots] = useState<{
    total: number;
    used: number;
    remaining: number;
  } | null>(null);
  // Job breakdown để admin trace slot nào đang giữ acc nào (account email,
  // status, thời điểm). Lazy fetch từ GET /api/admin/orders/activation khi
  // mở modal cho đơn login_link đã paid.
  const [activationJobs, setActivationJobs] = useState<Array<{
    id: string;
    status: string;
    assignedAccountEmail: string | null;
    planDays: number;
    createdAt: string | Date | null;
    completedAt: string | Date | null;
    lastError: string | null;
  }> | null>(null);
  const [loadingActivationInfo, setLoadingActivationInfo] = useState(false);
  const [resettingSlot, setResettingSlot] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);
  const [disablingActivation, setDisablingActivation] = useState(false);
  const [enablingActivation, setEnablingActivation] = useState(false);

  // Trạng thái disable đơn - init từ order, cập nhật sau khi gọi disable/enable API
  const [activationDisabled, setActivationDisabled] = useState<boolean>(
    order.activationDisabled ?? false,
  );
  const [activationDisabledInfo, setActivationDisabledInfo] = useState<{
    reason: string | null;
    at: string | null;
    by: string | null;
  }>({
    reason: order.activationDisabledReason ?? null,
    at: order.activationDisabledAt
      ? new Date(order.activationDisabledAt).toLocaleString("vi-VN")
      : null,
    by: order.activationDisabledBy ?? null,
  });

  // dialog xác nhận cho reset slot / regen code / disable / enable
  const [activationDialog, setActivationDialog] = useState<{
    mode:
      | "free_slot"
      | "regenerate_code"
      | "disable_activation"
      | "enable_activation";
  } | null>(null);
  const [dialogResendEmail, setDialogResendEmail] = useState(false);
  const [dialogCleanupManager, setDialogCleanupManager] = useState(true);
  const [dialogDisableReason, setDialogDisableReason] = useState("");
  // free_slot: job id của các slot admin chọn reset (partial reset). Mặc định
  // chọn tất cả slot đang chiếm khi mở dialog.
  const [selectedResetJobIds, setSelectedResetJobIds] = useState<string[]>([]);

  // lấy sản phẩm upgrade đầu tiên (nếu có)
  const upgradeItems = order.items?.filter(item => item.productType === "upgrade" && item.upgradeCredentials) || [];
  const hasUpgradeItems = upgradeItems.length > 0;
  
  // lấy sản phẩm login_link
  const loginLinkItems = order.items?.filter(item => item.productType === "login_link") || [];
  const hasLoginLinkItems = loginLinkItems.length > 0;

  // Khi mở modal cho đơn login_link đã paid, fetch slot info ngay để admin
  // thấy "X/Y slot đã active" mà không phải bấm reset/regen trước. Re-fetch
  // mỗi khi orderId/open đổi (mở lại modal cho đơn khác).
  useEffect(() => {
    if (!open) return;
    if (!hasLoginLinkItems) return;
    if (order.paymentStatus !== "paid") return;

    let cancelled = false;
    setLoadingActivationInfo(true);
    fetch(`/api/admin/orders/activation?orderId=${order.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data?.success) return;
        if (
          typeof data.totalSlots === "number" &&
          typeof data.usedSlots === "number" &&
          typeof data.remainingSlots === "number"
        ) {
          setActivationSlots({
            total: data.totalSlots,
            used: data.usedSlots,
            remaining: data.remainingSlots,
          });
        }
        if (Array.isArray(data.jobs)) {
          setActivationJobs(data.jobs);
        }
      })
      .catch(() => {
        // Bỏ qua lỗi GET - admin vẫn có thể bấm reset/regen để force fetch.
      })
      .finally(() => {
        if (!cancelled) setLoadingActivationInfo(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order.id, hasLoginLinkItems, order.paymentStatus]);

  // lấy sản phẩm cấp tài khoản (account hoặc license type, không phải upgrade hay login_link)
  const accountItems = order.items?.filter(item => item.productType !== "upgrade" && item.productType !== "login_link") || [];
  const hasAccountItems = accountItems.length > 0;

  // template mặc định cho email thông báo lỗi (upgrade)
  const defaultIssueMessage = `Chúng tôi không thể đăng nhập vào tài khoản của bạn với thông tin đã cung cấp.

Vui lòng kiểm tra lại:
• Email đăng nhập
• Mật khẩu tài khoản

Sau đó liên hệ với chúng tôi qua Facebook hoặc Telegram để được hỗ trợ tiếp.`;

  // template mặc định cho email liên hệ nhận tài khoản (account/license)
  const defaultAccountContactMessage = `Cảm ơn bạn đã đặt hàng tại ${SEO_CONFIG.name}!

Để nhận tài khoản, vui lòng thực hiện các bước sau:

1️⃣ Mở Cursor IDE trên máy logout tài khoản hiện tại
2️⃣ Bấm "Sign in" trong app 
3️⃣ Cursor sẽ mở trình duyệt với hiện link đăng nhập dạng: 
https://cursor.com/loginDeepControl?challenge=xxxxx&uuid=xxxxx&mode=login
📌 Link mẫu: 
https://cursor.com/loginDeepControl?challenge=MSRaQkEV0jtMmGIF3sHeaZzyq0UYFI8upPZfL-XjQKI&uuid=74ca14ed-e841-4a8f-b619-d11656e633e4&mode=login
4️⃣ Copy NGAY link này gửi cho shop
⚠️ Không bấm đăng nhập trên trình duyệt web 
⚠️ Không lấy link đã tự chuyển trang sang https://authenticator.cursor.sh/?client_id nếu chuyển trang làm lại thao tác "Sign in" từ đầu
👉 Chỉ cần copy link và gửi cho mình là xong ✅

Xem video hướng dẫn youtube: https://www.youtube.com/watch?v=v1UmbhPN8uA

Vui lòng liên hệ với chúng tôi qua Facebook hoặc Telegram để gửi link và nhận tài khoản.`;

  const openIssueEmailDialog = (productName: string, upgradeEmail: string) => {
    setSelectedUpgradeItem({ productName, upgradeEmail });
    setEmailMessage(defaultIssueMessage);
    setShowEmailDialog(true);
  };

  const openAccountEmailDialog = (productName: string) => {
    setSelectedAccountItem({ productName });
    setAccountEmailMessage(defaultAccountContactMessage);
    setShowAccountEmailDialog(true);
  };

  const sendAccountContactEmail = async () => {
    if (!selectedAccountItem || !accountEmailMessage.trim()) return;
    
    setSendingEmail(true);
    try {
      const response = await fetch("/api/admin/orders/send-account-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          productName: selectedAccountItem.productName,
          customMessage: accountEmailMessage,
        }),
      });

      if (response.ok) {
        toast.success("Đã gửi email yêu cầu liên hệ nhận tài khoản!");
        setShowAccountEmailDialog(false);
        setAccountEmailMessage("");
        setSelectedAccountItem(null);
      } else {
        toast.error("Không thể gửi email. Vui lòng thử lại.");
      }
    } catch {
      toast.error("Lỗi khi gửi email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const sendCompletedEmail = async (productName: string, upgradeEmail: string) => {
    setSendingEmail(true);
    try {
      const response = await fetch("/api/admin/orders/send-upgrade-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "completed",
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          productName,
          upgradeEmail,
        }),
      });

      if (response.ok) {
        toast.success("Đã gửi email thông báo nâng cấp thành công!");
      } else {
        toast.error("Không thể gửi email. Vui lòng thử lại.");
      }
    } catch {
      toast.error("Lỗi khi gửi email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const sendIssueEmail = async () => {
    if (!selectedUpgradeItem || !emailMessage.trim()) return;
    
    setSendingEmail(true);
    try {
      const response = await fetch("/api/admin/orders/send-upgrade-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "issue",
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          productName: selectedUpgradeItem.productName,
          upgradeEmail: selectedUpgradeItem.upgradeEmail,
          customMessage: emailMessage,
        }),
      });

      if (response.ok) {
        toast.success("Đã gửi email thông báo đến khách hàng!");
        setShowEmailDialog(false);
        setEmailMessage("");
        setSelectedUpgradeItem(null);
      } else {
        toast.error("Không thể gửi email. Vui lòng thử lại.");
      }
    } catch {
      toast.error("Lỗi khi gửi email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const callActivationAdminAction = async (params: {
    action:
      | "free_slot"
      | "regenerate_code"
      | "disable_activation"
      | "enable_activation";
    resendEmail?: boolean;
    includeSuccess?: boolean;
    jobIds?: string[];
    reason?: string;
    cleanupManager?: boolean;
  }) => {
    const response = await fetch("/api/admin/orders/activation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        action: params.action,
        resendEmail: params.resendEmail,
        includeSuccess: params.includeSuccess,
        jobIds: params.jobIds,
        reason: params.reason,
        cleanupManager: params.cleanupManager,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
      newActivationCode?: string | null;
      resetCount?: number;
      emailSent?: boolean;
      totalSlots?: number;
      usedSlots?: number;
      remainingSlots?: number;
      activationDisabled?: boolean;
      activationDisabledReason?: string | null;
      activationDisabledAt?: string | null;
      activationDisabledBy?: string | null;
      removedSessions?: Array<{
        jobId: string;
        accountEmail: string;
        customerEmail: string;
        planDays: number;
      }>;
      jobs?: Array<{
        id: string;
        status: string;
        assignedAccountEmail: string | null;
        createdAt: string | Date | null;
        completedAt: string | Date | null;
        lastError: string | null;
      }>;
    };
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Thao tác thất bại");
    }
    if (data.newActivationCode) setActivationCode(data.newActivationCode);
    if (
      typeof data.totalSlots === "number" &&
      typeof data.usedSlots === "number" &&
      typeof data.remainingSlots === "number"
    ) {
      setActivationSlots({
        total: data.totalSlots,
        used: data.usedSlots,
        remaining: data.remainingSlots,
      });
    }
    if (Array.isArray(data.jobs)) {
      setActivationJobs(
        data.jobs.map((j) => ({
          id: j.id,
          status: j.status,
          assignedAccountEmail: j.assignedAccountEmail,
          // POST response không có planDays, giữ nguyên job hiện tại nếu có,
          // không thì fallback 0 (UI sẽ ẩn nếu là 0).
          planDays:
            activationJobs?.find((aj) => aj.id === j.id)?.planDays ?? 0,
          createdAt: j.createdAt,
          completedAt: j.completedAt,
          lastError: j.lastError,
        })),
      );
    }
    return data;
  };

  // Gọi Manager (chạy localhost:3005 ở máy admin) để xoá customer record
  // khỏi Cookie.customers[] sau khi đã reset slot bên Shop.
  const cleanupCustomerOnManager = async (
    sessions: Array<{
      accountEmail: string;
      customerEmail: string;
      planDays: number;
    }>,
  ): Promise<{
    totalRemoved: number;
    errors: string[];
    // Aggregated reopen stats per pool group sau khi Manager tự relaunch acc.
    reopened: {
      scheduled: { "6d": number; "30d": number };
      alreadyActive: number;
      errorAccounts: Array<{ accountEmail?: string; error?: string }>;
    };
  }> => {
    if (!sessions.length) {
      return {
        totalRemoved: 0,
        errors: [],
        reopened: {
          scheduled: { "6d": 0, "30d": 0 },
          alreadyActive: 0,
          errorAccounts: [],
        },
      };
    }

    const managerUrl =
      (process.env.NEXT_PUBLIC_MANAGER_URL || "http://localhost:3005").replace(
        /\/$/,
        "",
      );

    let totalRemoved = 0;
    const errors: string[] = [];
    const reopened = {
      scheduled: { "6d": 0, "30d": 0 } as { "6d": number; "30d": number },
      alreadyActive: 0,
      errorAccounts: [] as Array<{ accountEmail?: string; error?: string }>,
    };

    await Promise.all(
      sessions.map(async (s) => {
        try {
          const res = await fetch(
            `${managerUrl}/api/cookies/remove-customer-by-account`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accountEmail: s.accountEmail,
                customerEmail: s.customerEmail,
                planDays: s.planDays,
              }),
            },
          );
          const json = (await res.json().catch(() => ({}))) as {
            success?: boolean;
            removedCount?: number;
            error?: string;
            reopened?: {
              attempted?: boolean;
              status?: string;
              group?: string | null;
              accountEmail?: string;
              error?: string;
            };
          };
          if (!res.ok || !json.success) {
            errors.push(json.error || `HTTP ${res.status}`);
            return;
          }
          totalRemoved += json.removedCount ?? 0;

          const r = json.reopened;
          if (r && r.attempted) {
            if (r.status === "scheduled" && (r.group === "6d" || r.group === "30d")) {
              reopened.scheduled[r.group] += 1;
            } else if (r.status === "already-active") {
              reopened.alreadyActive += 1;
            } else if (r.status === "error" || r.status === "account-not-found") {
              reopened.errorAccounts.push({
                accountEmail: r.accountEmail ?? s.accountEmail,
                error: r.error || r.status,
              });
            }
          }
        } catch (err: any) {
          errors.push(
            `Không gọi được Manager (${managerUrl}): ${err?.message || err}`,
          );
        }
      }),
    );

    return { totalRemoved, errors, reopened };
  };

  // Slot đang chiếm (có thể reset): job ở trạng thái occupied, sort mới nhất
  // trước để admin dễ chọn slot vừa active.
  const occupiedJobs = useMemo(() => {
    const occupiedStatuses = ["success", "pending", "processing"];
    return (activationJobs ?? [])
      .filter((j) => occupiedStatuses.includes(j.status))
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
  }, [activationJobs]);

  const openActivationResetDialog = () => {
    setDialogResendEmail(false);
    setDialogCleanupManager(true);
    // Default: chọn tất cả slot đang chiếm (giữ nguyên hành vi reset all cũ).
    setSelectedResetJobIds(occupiedJobs.map((j) => j.id));
    setActivationDialog({ mode: "free_slot" });
  };

  const openRegenerateCodeDialog = () => {
    setDialogResendEmail(true);
    setDialogCleanupManager(true);
    setActivationDialog({ mode: "regenerate_code" });
  };

  const openDisableActivationDialog = () => {
    setDialogResendEmail(false);
    setDialogCleanupManager(true);
    setDialogDisableReason("");
    setActivationDialog({ mode: "disable_activation" });
  };

  const openEnableActivationDialog = () => {
    setDialogResendEmail(false);
    setDialogCleanupManager(false);
    setActivationDialog({ mode: "enable_activation" });
  };

  // Flag chung để disable tương tác khi bất kỳ action nào đang chạy
  const anyActivationActionRunning =
    resettingSlot ||
    regeneratingCode ||
    disablingActivation ||
    enablingActivation;

  const confirmActivationAction = async () => {
    if (!activationDialog) return;
    const mode = activationDialog.mode;
    const resend = dialogResendEmail;
    const cleanup = dialogCleanupManager;

    // Partial reset chỉ áp dụng khi đơn >=2 slot và đang có slot chiếm.
    const partialResetShown =
      mode === "free_slot" &&
      (activationSlots?.total ?? 0) >= 2 &&
      occupiedJobs.length > 0;
    if (partialResetShown && selectedResetJobIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 slot để reset");
      return;
    }

    if (mode === "free_slot") setResettingSlot(true);
    else if (mode === "regenerate_code") setRegeneratingCode(true);
    else if (mode === "disable_activation") setDisablingActivation(true);
    else if (mode === "enable_activation") setEnablingActivation(true);

    try {
      const data = await callActivationAdminAction({
        action: mode,
        includeSuccess: true,
        // Chỉ gửi jobIds cho free_slot; rỗng → backend reset toàn bộ.
        jobIds: mode === "free_slot" ? selectedResetJobIds : undefined,
        resendEmail: resend,
        reason:
          mode === "disable_activation"
            ? dialogDisableReason.trim() || undefined
            : undefined,
        cleanupManager: mode === "disable_activation" ? cleanup : undefined,
      });

      let cleanupMsg = "";
      // Cleanup Manager áp dụng cho free_slot/regenerate_code/disable_activation.
      // enable_activation không có removedSessions.
      if (cleanup && data.removedSessions && data.removedSessions.length > 0) {
        const { totalRemoved, errors, reopened } =
          await cleanupCustomerOnManager(data.removedSessions);
        if (totalRemoved > 0) {
          cleanupMsg = ` – Đã xoá ${totalRemoved} customer record trên Manager.`;

          // Append note về acc được relaunch vào pool (nếu có).
          const reopenParts: string[] = [];
          const s6 = reopened.scheduled["6d"];
          const s30 = reopened.scheduled["30d"];
          if (s6 > 0 && s30 > 0) {
            reopenParts.push(
              `Đang mở lại ${s6 + s30} account (pool 6d: ${s6}, 30d: ${s30})`,
            );
          } else if (s6 > 0) {
            reopenParts.push(
              `Đang mở lại ${s6} account trong pool 6d`,
            );
          } else if (s30 > 0) {
            reopenParts.push(
              `Đang mở lại ${s30} account trong pool 30d`,
            );
          }
          if (reopened.alreadyActive > 0 && reopenParts.length === 0) {
            reopenParts.push(
              `${reopened.alreadyActive} account vẫn đang active trong pool`,
            );
          }
          if (reopenParts.length > 0) {
            cleanupMsg += ` ${reopenParts.join("; ")}.`;
          }

          if (reopened.errorAccounts.length > 0) {
            const first = reopened.errorAccounts[0];
            toast.warning(
              `⚠️ Không mở lại được pool cho ${first?.accountEmail ?? "acc"}: ${first?.error ?? "unknown"}${
                reopened.errorAccounts.length > 1
                  ? ` (+${reopened.errorAccounts.length - 1} acc khác)`
                  : ""
              }`,
            );
          }
        }
        if (errors.length > 0) {
          toast.warning(
            `Cleanup Manager có lỗi: ${errors.slice(0, 2).join("; ")}`,
          );
        }
      }

      // Đồng bộ trạng thái disable từ response (cả disable/enable đều trả về).
      if (typeof data.activationDisabled === "boolean") {
        setActivationDisabled(data.activationDisabled);
        setActivationDisabledInfo({
          reason: data.activationDisabledReason ?? null,
          at: data.activationDisabledAt
            ? new Date(data.activationDisabledAt).toLocaleString("vi-VN")
            : null,
          by: data.activationDisabledBy ?? null,
        });
      }

      if (mode === "free_slot") {
        toast.success(
          `Đã reset ${data.resetCount ?? 0} job. Slot còn trống: ${data.remainingSlots ?? "?"}/${data.totalSlots ?? "?"}${
            resend && data.emailSent ? " – Email đã gửi." : ""
          }${cleanupMsg}`,
        );
      } else if (mode === "regenerate_code") {
        toast.success(
          `Đã tạo mã mới: ${data.newActivationCode}${
            resend && data.emailSent ? " – Email đã gửi." : ""
          }${cleanupMsg}`,
        );
      } else if (mode === "disable_activation") {
        toast.success(
          `Đã vô hiệu hoá đơn. ${data.resetCount ?? 0} job bị cancel.${cleanupMsg}`,
        );
      } else if (mode === "enable_activation") {
        toast.success("Đã bỏ vô hiệu hoá. Khách có thể active lại bình thường.");
      }
      setActivationDialog(null);
    } catch (err: any) {
      toast.error(err?.message || "Thao tác thất bại");
    } finally {
      setResettingSlot(false);
      setRegeneratingCode(false);
      setDisablingActivation(false);
      setEnablingActivation(false);
    }
  };

  const sendLoginLinkEmail = async () => {
    setSendingEmail(true);
    try {
      const response = await fetch("/api/admin/orders/send-login-link-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          total: order.total,
          items: order.items,
        }),
      });

      if (response.ok) {
        toast.success("Đã gửi email hướng dẫn login bằng link!");
      } else {
        toast.error("Không thể gửi email. Vui lòng thử lại.");
      }
    } catch {
      toast.error("Lỗi khi gửi email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleQuickCompleteLoginLink = async () => {
    setSaving(true);
    try {
      await onStatusUpdate(order.id, "completed", "paid");
      await sendLoginLinkEmail();
      toast.success("Đã hoàn thành đơn hàng và gửi email!");
    } catch {
      toast.error("Lỗi khi xử lý đơn hàng.");
    } finally {
      setSaving(false);
    }
  };

  const copyUpgradeCredentials = async (email: string, password: string, itemId: string) => {
    // Khi password rỗng (chế độ chỉ cần email) → chỉ copy email, tránh copy
    // dòng trống vô nghĩa.
    const text = password ? `${email}\n${password}` : email;
    await navigator.clipboard.writeText(text);
    setCopiedCredential(itemId);
    setTimeout(() => setCopiedCredential(null), 2000);
  };

  const copyContactInfo = async (contactInfo: string, itemId: string) => {
    await navigator.clipboard.writeText(contactInfo);
    setCopiedContact(itemId);
    setTimeout(() => setCopiedContact(null), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onStatusUpdate(
        order.id,
        status !== order.status ? status : undefined,
        paymentStatus !== order.paymentStatus ? paymentStatus : undefined
      );
      
      // tự động gửi email khi chuyển sang trạng thái hoàn thành cho đơn upgrade
      if (status === "completed" && order.status !== "completed" && hasUpgradeItems) {
        for (const item of upgradeItems) {
          if (item.upgradeCredentials?.email) {
            await sendCompletedEmail(item.name, item.upgradeCredentials.email);
          }
        }
      }

      // tự động gửi email khi chuyển sang trạng thái hoàn thành cho đơn login_link
      if (status === "completed" && order.status !== "completed" && hasLoginLinkItems) {
        await sendLoginLinkEmail();
      }
      
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setStatus(order.status);
    setPaymentStatus(order.paymentStatus);
    setNotes(order.notes || "");
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5" />
              <span>Chi tiết đơn hàng {order.orderNumber}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Đang lưu..." : "Lưu"}
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Thông tin khách hàng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Tên:</span>
                  <div className="font-medium">{order.customerName}</div>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <div className="font-medium">{order.customerEmail}</div>
                </div>
                {order.customerPhone && (
                  <div>
                    <span className="text-gray-500">Số điện thoại:</span>
                    <div className="font-medium">{order.customerPhone}</div>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Ngày đặt:</span>
                  <div className="font-medium">
                    {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Sản phẩm ({order.items?.length || 0})
              </h3>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div 
                    key={item.id || index} 
                    className="p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative h-12 w-12 rounded overflow-hidden">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {item.name}
                          {item.productType === "upgrade" && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              <ArrowUpCircle className="h-3 w-3 mr-1" />
                              Nâng cấp
                            </Badge>
                          )}
                          {item.productType === "login_link" && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              🔗 Login by Link
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.category} × {item.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.price.toLocaleString('vi-VN')}₫/item
                        </div>
                      </div>
                    </div>

                    {/* Upgrade Credentials - hiển thị thông tin tài khoản khách hàng cần nâng cấp */}
                    {item.productType === "upgrade" && item.upgradeCredentials && (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center justify-between gap-2 text-amber-700 dark:text-amber-400 font-medium mb-2">
                          <span className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4" />
                            Tài khoản cần nâng cấp
                          </span>
                          {item.upgradeEmailOnly && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold whitespace-nowrap">
                              Chỉ cần email
                            </span>
                          )}
                        </div>

                        {/* Email & Password section */}
                        <div className={`grid ${item.upgradeEmailOnly ? "grid-cols-1" : "grid-cols-2"} gap-2 text-sm mb-3`}>
                          <div>
                            <span className="text-amber-600 dark:text-amber-500">Email:</span>
                            <div className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded mt-1 break-all">
                              {item.upgradeCredentials.email}
                            </div>
                          </div>
                          {!item.upgradeEmailOnly && item.upgradeCredentials.password && (
                            <div>
                              <span className="text-amber-600 dark:text-amber-500">Mật khẩu:</span>
                              <div className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded mt-1 break-all">
                                {item.upgradeCredentials.password}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-3 mb-3 text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/40"
                          onClick={() => copyUpgradeCredentials(
                            item.upgradeCredentials!.email,
                            item.upgradeCredentials!.password ?? "",
                            item.id
                          )}
                        >
                          {copiedCredential === item.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Đã copy {item.upgradeEmailOnly ? "email" : "tài khoản"}
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              {item.upgradeEmailOnly ? "Copy email" : "Copy email & mật khẩu"}
                            </>
                          )}
                        </Button>

                        {/* Contact info section */}
                        {item.upgradeCredentials.contactInfo && (
                          <>
                            <div className="border-t border-amber-200 dark:border-amber-700 pt-3">
                              <div className="text-sm">
                                <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  Liên hệ:
                                </span>
                                <div className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded mt-1 break-all">
                                  {item.upgradeCredentials.contactInfo}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 mt-2 text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/40"
                                onClick={() => copyContactInfo(
                                  item.upgradeCredentials!.contactInfo!,
                                  item.id
                                )}
                              >
                                {copiedContact === item.id ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 mr-1" />
                                    Đã copy liên hệ
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5 mr-1" />
                                    Copy liên hệ
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        )}

                        {/* Email Actions */}
                        <div className="border-t border-amber-200 dark:border-amber-700 pt-3 mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-green-700 border-green-300 hover:bg-green-100 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/40"
                            onClick={() => sendCompletedEmail(item.name, item.upgradeCredentials!.email)}
                            disabled={sendingEmail}
                          >
                            {sendingEmail ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5 mr-1" />
                            )}
                            Gửi email hoàn thành
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-orange-700 border-orange-300 hover:bg-orange-100 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-900/40"
                            onClick={() => openIssueEmailDialog(item.name, item.upgradeCredentials!.email)}
                            disabled={sendingEmail}
                          >
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            Gửi email yêu cầu liên hệ
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Login Link Info - cho đơn login bằng link */}
                    {item.productType === "login_link" && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium">
                            <Mail className="h-4 w-4" />
                            🔗 Login bằng Link
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/40"
                            onClick={sendLoginLinkEmail}
                            disabled={sendingEmail}
                          >
                            {sendingEmail ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5 mr-1" />
                            )}
                            Gửi email hướng dẫn login
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Account/License Contact Email - cho đơn cấp tài khoản */}
                    {item.productType !== "upgrade" && item.productType !== "login_link" && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium">
                            <Mail className="h-4 w-4" />
                            {item.productType === "license" ? "Cấp license key" : "Cấp tài khoản"}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/40"
                            onClick={() => openAccountEmailDialog(item.name)}
                            disabled={sendingEmail}
                          >
                            {sendingEmail ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5 mr-1" />
                            )}
                            Gửi email liên hệ nhận tài khoản
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )) || <div className="text-gray-500">Không có sản phẩm</div>}
              </div>
            </div>

            {/* Order Notes */}
            {(order.notes || isEditing) && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Ghi chú
                </h3>
                {isEditing ? (
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Thêm ghi chú cho đơn hàng..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <div className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    {order.notes || "Không có ghi chú"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status & Payment Info */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white dark:bg-gray-700 border p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Trạng thái</h3>
              
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Trạng thái đơn hàng
                    </label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                        <SelectItem value="processing">Đang xử lý</SelectItem>
                        <SelectItem value="completed">Hoàn thành</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Trạng thái thanh toán
                    </label>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Chờ thanh toán</SelectItem>
                        <SelectItem value="paid">Đã thanh toán</SelectItem>
                        <SelectItem value="failed">Thanh toán lỗi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Đơn hàng:</span>
                    <Badge 
                      className={
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {order.status === 'pending' ? 'Chờ xử lý' :
                       order.status === 'processing' ? 'Đang xử lý' :
                       order.status === 'completed' ? 'Hoàn thành' :
                       'Đã hủy'}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Thanh toán:</span>
                    <Badge 
                      className={
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }
                    >
                      {order.paymentStatus === 'paid' ? 'Đã thanh toán' :
                       order.paymentStatus === 'failed' ? 'Thanh toán lỗi' :
                       'Chờ thanh toán'}
                    </Badge>
                  </div>

                  {/* nút nhanh: hoàn thành + gửi email cho đơn login_link chưa hoàn thành */}
                  {hasLoginLinkItems && order.status !== "completed" && (
                    <div className="pt-3 border-t">
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleQuickCompleteLoginLink}
                        disabled={saving || sendingEmail}
                      >
                        {saving || sendingEmail ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Hoàn thành + Gửi email login
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="bg-white dark:bg-gray-700 border p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Chi tiết thanh toán
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 shrink-0">Mã đơn:</span>
                  <span className="font-mono font-medium text-right break-all">
                    {order.orderNumber}
                  </span>
                </div>
                {order.paymentMemo && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 shrink-0">Nội dung CK:</span>
                    <span className="font-mono font-medium text-right break-all">
                      {order.paymentMemo}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{order.subtotal?.toLocaleString('vi-VN')}₫</span>
                </div>
                {order.discount && order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span>-{order.discount?.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Tổng cộng:</span>
                  <span>{order.total.toLocaleString('vi-VN')}₫</span>
                </div>
                
                {order.paidAt && (
                  <div className="mt-3 text-xs text-green-600">
                    Đã thanh toán: {format(new Date(order.paidAt), 'dd/MM/yyyy HH:mm')}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Credentials */}
            {order.assignedCredentials && order.assignedCredentials.length > 0 && (
              <UserOrderCredentials
                credentials={order.assignedCredentials}
                orderNumber={order.orderNumber}
                customerEmail={order.customerEmail}
              />
            )}

            {order.items?.some((it) => it.productType === "account") &&
              order.paymentStatus === "paid" && (
                <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20 text-xs text-indigo-800 dark:text-indigo-300">
                  Khách lấy mã OTP xác thực Cursor tại{" "}
                  <code className="font-mono">/vi/verification-code</code> (xác minh
                  email mua hàng trước khi lấy mã).
                </div>
              )}

            {/* Activation Code (cho đơn login_link đã paid) */}
            {order.items?.some((it: any) => it.productType === "login_link") &&
              order.paymentStatus === "paid" && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2 flex-wrap">
                    <span>🔐 Mã active khách hàng</span>
                    {activationDisabled && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-xs font-medium border border-red-300 dark:border-red-800"
                        title={[
                          activationDisabledInfo.reason
                            ? `Lý do: ${activationDisabledInfo.reason}`
                            : null,
                          activationDisabledInfo.by
                            ? `Bởi: ${activationDisabledInfo.by}`
                            : null,
                          activationDisabledInfo.at
                            ? `Lúc: ${activationDisabledInfo.at}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      >
                        <Ban className="h-3 w-3" />
                        Đã vô hiệu hoá
                      </span>
                    )}
                  </h3>

                  {activationDisabled && (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-2 text-xs text-red-700 dark:text-red-300 space-y-0.5">
                      {activationDisabledInfo.reason && (
                        <div>
                          <span className="font-medium">Lý do:</span>{" "}
                          {activationDisabledInfo.reason}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] opacity-80">
                        {activationDisabledInfo.by && (
                          <span>Bởi {activationDisabledInfo.by}</span>
                        )}
                        {activationDisabledInfo.at && (
                          <span>Lúc {activationDisabledInfo.at}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {activationCode ? (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 rounded border text-lg font-mono font-bold tracking-[3px] text-emerald-700 dark:text-emerald-300">
                        {activationCode}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(activationCode);
                          toast.success("Đã copy mã active");
                        }}
                        className="px-3 py-2 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const activateLink = `${window.location.origin}/${order.locale ?? "vi"}/activate?order=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.customerEmail)}&code=${encodeURIComponent(activationCode)}`;
                          navigator.clipboard.writeText(activateLink);
                          toast.success("Đã copy link kích hoạt");
                        }}
                        className="px-3 py-2 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors whitespace-nowrap"
                      >
                        Copy link kích hoạt
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Chưa được cấp (khách xem đơn lần đầu sẽ tự gen).
                    </p>
                  )}

                  {/* Slot summary - luôn hiển thị (auto fetch khi mở modal) */}
                  <div className="mt-3 rounded-md border border-emerald-200 dark:border-emerald-800 bg-white/60 dark:bg-emerald-950/40 p-2.5 text-xs">
                    {loadingActivationInfo && !activationSlots ? (
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Đang tải thông tin slot...
                      </div>
                    ) : activationSlots ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-emerald-800 dark:text-emerald-200">
                          <span className="font-medium">Slot đã active:</span>
                          <span>
                            <span className="font-bold text-base text-emerald-700 dark:text-emerald-300">
                              {activationSlots.used}
                            </span>
                            <span className="text-emerald-700 dark:text-emerald-400">
                              /{activationSlots.total}
                            </span>
                            <span className="ml-2 text-gray-500">
                              (còn trống {activationSlots.remaining})
                            </span>
                          </span>
                        </div>
                        {/* Progress bar trực quan */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                          <div
                            className={
                              activationSlots.used >= activationSlots.total
                                ? "h-full rounded-full bg-red-500 transition-all"
                                : activationSlots.used > 0
                                  ? "h-full rounded-full bg-emerald-500 transition-all"
                                  : "h-full rounded-full bg-gray-300 transition-all"
                            }
                            style={{
                              width: `${
                                activationSlots.total > 0
                                  ? Math.min(
                                      100,
                                      (activationSlots.used /
                                        activationSlots.total) *
                                        100,
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-emerald-700 dark:text-emerald-300">
                        Chưa có thông tin slot. Bấm "Reset" hoặc mở lại modal để tải.
                      </div>
                    )}
                  </div>

                  {/* Breakdown các slot - account nào đang giữ slot nào */}
                  {activationJobs && activationJobs.length > 0 && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-emerald-700 dark:text-emerald-300 font-medium select-none">
                        📋 Chi tiết {activationJobs.length} slot đã active
                      </summary>
                      <div className="mt-2 space-y-1.5 max-h-60 overflow-y-auto">
                        {activationJobs.map((job, idx) => {
                          const statusLabel =
                            job.status === "success"
                              ? "Đã active"
                              : job.status === "processing"
                                ? "Đang xử lý"
                                : job.status === "pending"
                                  ? "Chờ xử lý"
                                  : job.status === "expired"
                                    ? "Hết hạn"
                                    : job.status === "failed"
                                      ? "Lỗi"
                                      : job.status === "cancelled"
                                        ? "Đã huỷ"
                                        : job.status;
                          const statusClass =
                            job.status === "success"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : job.status === "processing" ||
                                  job.status === "pending"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                : job.status === "failed"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
                          return (
                            <div
                              key={job.id}
                              className="rounded border border-emerald-100 dark:border-emerald-900 bg-white dark:bg-gray-800/60 p-2"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-mono text-[11px] text-gray-500">
                                  #{idx + 1}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusClass}`}
                                >
                                  {statusLabel}
                                </span>
                              </div>
                              {job.assignedAccountEmail && (
                                <div className="break-all">
                                  <span className="text-gray-500">Acc:</span>{" "}
                                  <code className="font-mono text-[11px]">
                                    {job.assignedAccountEmail}
                                  </code>
                                </div>
                              )}
                              {job.completedAt && (
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                  Active lúc:{" "}
                                  {format(
                                    new Date(job.completedAt),
                                    "dd/MM/yyyy HH:mm",
                                  )}
                                </div>
                              )}
                              {!job.completedAt && job.createdAt && (
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                  Bắt đầu:{" "}
                                  {format(
                                    new Date(job.createdAt),
                                    "dd/MM/yyyy HH:mm",
                                  )}
                                </div>
                              )}
                              {job.lastError && (
                                <div className="text-[10px] text-red-500 mt-0.5 break-all">
                                  Lỗi: {job.lastError}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}

                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                    Khách cần nhập mã này cùng login link ở trang{" "}
                    <code className="font-mono">/activate</code> để auto-login.
                  </p>

                  {/* Admin actions: reset slot / regen code / disable / enable */}
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-900/40"
                      onClick={openActivationResetDialog}
                      disabled={anyActivationActionRunning || activationDisabled}
                      title={
                        activationDisabled
                          ? "Đơn đã bị vô hiệu hoá - bỏ vô hiệu hoá trước"
                          : "Giải phóng slot để khách active lại với cùng mã cũ"
                      }
                    >
                      {resettingSlot ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      )}
                      Reset & cho login lại
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/40"
                      onClick={openRegenerateCodeDialog}
                      disabled={anyActivationActionRunning || activationDisabled}
                      title={
                        activationDisabled
                          ? "Đơn đã bị vô hiệu hoá - bỏ vô hiệu hoá trước"
                          : "Sinh mã active mới (mã cũ mất hiệu lực) và reset slot"
                      }
                    >
                      {regeneratingCode ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                      )}
                      Tạo mã active mới
                    </Button>

                    {activationDisabled ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-900/40"
                        onClick={openEnableActivationDialog}
                        disabled={anyActivationActionRunning}
                        title="Bỏ vô hiệu hoá - khách có thể active lại bình thường"
                      >
                        {enablingActivation ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                        )}
                        Bỏ vô hiệu hoá
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-red-700 border-red-300 hover:bg-red-100 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/40"
                        onClick={openDisableActivationDialog}
                        disabled={anyActivationActionRunning}
                        title="Vô hiệu hoá key active của đơn (dùng khi duyệt nhầm)"
                      >
                        {disablingActivation ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Ban className="h-3.5 w-3.5 mr-1" />
                        )}
                        Vô hiệu hoá key active
                      </Button>
                    )}
                  </div>
                </div>
              )}

            {/* SEPAY Info */}
            {(order.sepayTransactionId || order.sepayReference) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-300">
                  SEPAY Transaction
                </h3>
                <div className="space-y-1 text-sm">
                  {order.sepayTransactionId && (
                    <div>
                      <span className="text-blue-600">Transaction ID:</span>
                      <div className="font-mono text-xs break-all">
                        {order.sepayTransactionId}
                      </div>
                    </div>
                  )}
                  {order.sepayReference && (
                    <div>
                      <span className="text-blue-600">Reference:</span>
                      <div className="font-mono text-xs">
                        {order.sepayReference}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Email Issue Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Gửi email yêu cầu liên hệ
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Khách hàng:</span>
                  <div className="font-medium">{order.customerName}</div>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <div className="font-medium">{order.customerEmail}</div>
                </div>
                <div>
                  <span className="text-gray-500">Sản phẩm:</span>
                  <div className="font-medium">{selectedUpgradeItem?.productName}</div>
                </div>
                <div>
                  <span className="text-gray-500">TK nâng cấp:</span>
                  <div className="font-mono text-xs">{selectedUpgradeItem?.upgradeEmail}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Nội dung email (có thể chỉnh sửa):
              </label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={8}
                placeholder="Nhập nội dung email..."
                className="resize-none"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">📌 Thông tin liên hệ sẽ được gửi kèm:</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                {SEO_CONFIG.supportContacts.facebook && (
                  <li>Facebook: {SEO_CONFIG.supportContacts.facebook}</li>
                )}
                {SEO_CONFIG.supportContacts.telegram && (
                  <li>Telegram: {SEO_CONFIG.supportContacts.telegram}</li>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(false)}
              disabled={sendingEmail}
            >
              Hủy
            </Button>
            <Button
              onClick={sendIssueEmail}
              disabled={sendingEmail || !emailMessage.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Contact Email Dialog - cho đơn cấp tài khoản */}
      <Dialog open={showAccountEmailDialog} onOpenChange={setShowAccountEmailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              Gửi email liên hệ nhận tài khoản
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Khách hàng:</span>
                  <div className="font-medium">{order.customerName}</div>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <div className="font-medium">{order.customerEmail}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Sản phẩm:</span>
                  <div className="font-medium">{selectedAccountItem?.productName}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Nội dung email (có thể chỉnh sửa):
              </label>
              <Textarea
                value={accountEmailMessage}
                onChange={(e) => setAccountEmailMessage(e.target.value)}
                rows={8}
                placeholder="Nhập nội dung email..."
                className="resize-none"
              />
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm text-green-700 dark:text-green-300">
              <p className="font-medium mb-1">📌 Thông tin liên hệ sẽ được gửi kèm:</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                {SEO_CONFIG.supportContacts.facebook && (
                  <li>Fanpage Facebook: {SEO_CONFIG.supportContacts.facebook}</li>
                )}
                {SEO_CONFIG.supportContacts.telegram && (
                  <li>Telegram: {SEO_CONFIG.supportContacts.telegram}</li>
                )}
                {SEO_CONFIG.supportContacts.email && (
                  <li>Email: {SEO_CONFIG.supportContacts.email}</li>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAccountEmailDialog(false)}
              disabled={sendingEmail}
            >
              Hủy
            </Button>
            <Button
              onClick={sendAccountContactEmail}
              disabled={sendingEmail || !accountEmailMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activation Admin Confirm Dialog (reset slot / regenerate code / disable / enable) */}
      <Dialog
        open={!!activationDialog}
        onOpenChange={(o) => {
          if (!o && !anyActivationActionRunning) setActivationDialog(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activationDialog?.mode === "regenerate_code" && (
                <>
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Tạo mã active mới
                </>
              )}
              {activationDialog?.mode === "free_slot" && (
                <>
                  <RefreshCw className="h-5 w-5 text-emerald-500" />
                  Reset slot active
                </>
              )}
              {activationDialog?.mode === "disable_activation" && (
                <>
                  <Ban className="h-5 w-5 text-red-500" />
                  Vô hiệu hoá key active
                </>
              )}
              {activationDialog?.mode === "enable_activation" && (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  Bỏ vô hiệu hoá
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Đơn hàng:</span>
                <span className="font-mono font-medium">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Khách hàng:</span>
                <span className="font-medium truncate">{order.customerEmail}</span>
              </div>
              {activationCode && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Mã hiện tại:</span>
                  <code className="font-mono">{activationCode}</code>
                </div>
              )}
            </div>

            {activationDialog?.mode === "regenerate_code" && (
              <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3 text-amber-800 dark:text-amber-300">
                <p className="font-medium">⚠️ Mã cũ sẽ mất hiệu lực ngay lập tức.</p>
                <p className="text-xs mt-1">
                  Mọi job đang chạy / đã thành công sẽ bị đánh dấu <code className="font-mono">expired</code>, toàn bộ slot được giải phóng và mã mới sẽ được sinh ra.
                </p>
              </div>
            )}
            {activationDialog?.mode === "free_slot" && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 p-3 text-emerald-800 dark:text-emerald-300">
                <p className="font-medium">Khách sẽ có thể active lại với cùng mã hiện tại.</p>
                {(activationSlots?.total ?? 0) >= 2 && occupiedJobs.length > 0 ? (
                  <>
                    <p className="text-xs mt-1">
                      Chọn slot cần reset. Slot được chọn sẽ bị đánh{" "}
                      <code className="font-mono">expired</code> để giải phóng (đã chọn{" "}
                      {selectedResetJobIds.length}/{occupiedJobs.length}).
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedResetJobIds(occupiedJobs.map((j) => j.id))
                        }
                        className="text-[11px] font-medium underline-offset-2 hover:underline"
                      >
                        Chọn tất cả
                      </button>
                      <span className="text-emerald-300 dark:text-emerald-700">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedResetJobIds([])}
                        className="text-[11px] font-medium underline-offset-2 hover:underline"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                    <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto">
                      {occupiedJobs.map((job, idx) => {
                        const checked = selectedResetJobIds.includes(job.id);
                        const statusLabel =
                          job.status === "success"
                            ? "Đã active"
                            : job.status === "processing"
                              ? "Đang xử lý"
                              : "Chờ xử lý";
                        return (
                          <label
                            key={job.id}
                            className="flex items-start gap-2 rounded border border-emerald-100 dark:border-emerald-900 bg-white dark:bg-gray-800/60 p-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={checked}
                              onChange={(e) =>
                                setSelectedResetJobIds((prev) =>
                                  e.target.checked
                                    ? [...prev, job.id]
                                    : prev.filter((id) => id !== job.id),
                                )
                              }
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="font-mono text-[11px] text-gray-500">
                                  #{idx + 1}
                                </span>
                                <span className="text-[10px] font-medium">
                                  {statusLabel}
                                </span>
                              </span>
                              {job.assignedAccountEmail && (
                                <span className="block break-all text-[11px] text-gray-600 dark:text-gray-300">
                                  {job.assignedAccountEmail}
                                </span>
                              )}
                              {(job.completedAt || job.createdAt) && (
                                <span className="block text-[10px] text-gray-500">
                                  {job.completedAt ? "Active lúc: " : "Bắt đầu: "}
                                  {format(
                                    new Date(
                                      (job.completedAt ?? job.createdAt) as
                                        | string
                                        | Date,
                                    ),
                                    "dd/MM/yyyy HH:mm",
                                  )}
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-xs mt-1">
                    Toàn bộ slot (bao gồm cả session đã login thành công) sẽ được đánh <code className="font-mono">expired</code> để giải phóng.
                  </p>
                )}
              </div>
            )}
            {activationDialog?.mode === "disable_activation" && (
              <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3 text-red-800 dark:text-red-300">
                <p className="font-medium">⚠️ Đơn sẽ bị chặn active ngay lập tức.</p>
                <p className="text-xs mt-1">
                  Khách submit mã đúng cũng nhận <code className="font-mono">ACTIVATION_DISABLED</code>. Các job pending/processing sẽ bị cancel. Dùng khi duyệt nhầm đơn hoặc muốn thu hồi key.
                </p>
                <p className="text-[11px] mt-1 opacity-80">
                  Lưu ý: cookie đã cấp trong Chrome của khách vẫn hoạt động đến khi Cursor invalidate session.
                </p>
              </div>
            )}
            {activationDialog?.mode === "enable_activation" && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 p-3 text-emerald-800 dark:text-emerald-300">
                <p className="font-medium">Khách sẽ active lại được bình thường.</p>
                <p className="text-xs mt-1">
                  Cờ vô hiệu hoá được gỡ. Các job đã bị cancel trước đó vẫn giữ nguyên trạng thái <code className="font-mono">expired</code> (slot trống trở lại).
                </p>
              </div>
            )}

            {/* Reason input - chỉ hiện cho disable */}
            {activationDialog?.mode === "disable_activation" && (
              <div className="space-y-1">
                <label
                  htmlFor="disable-reason"
                  className="text-xs font-medium text-gray-600 dark:text-gray-400"
                >
                  Lý do (tuỳ chọn)
                </label>
                <textarea
                  id="disable-reason"
                  rows={2}
                  value={dialogDisableReason}
                  onChange={(e) => setDialogDisableReason(e.target.value)}
                  placeholder="VD: Duyệt nhầm đơn, khách chưa thanh toán đủ..."
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            )}

            {/* Checkboxes - enable_activation không có */}
            {activationDialog?.mode !== "enable_activation" && (
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={dialogCleanupManager}
                    onChange={(e) => setDialogCleanupManager(e.target.checked)}
                  />
                  <span>
                    <span className="font-medium">Xoá customer record trên Manager</span>
                    <span className="text-xs text-gray-500 block">
                      Gọi Manager (localhost:3005) xoá khách khỏi mảng <code className="font-mono">Cookie.customers[]</code> của tài khoản đã dùng cho session này.
                    </span>
                  </span>
                </label>

                {activationDialog?.mode !== "disable_activation" && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={dialogResendEmail}
                      onChange={(e) => setDialogResendEmail(e.target.checked)}
                    />
                    <span>
                      <span className="font-medium">Gửi lại email cho khách</span>
                      <span className="text-xs text-gray-500 block">
                        {activationDialog?.mode === "regenerate_code"
                          ? "Gửi email chứa mã active MỚI kèm hướng dẫn login."
                          : "Gửi lại email hướng dẫn login với mã hiện tại."}
                      </span>
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setActivationDialog(null)}
              disabled={anyActivationActionRunning}
            >
              Hủy
            </Button>
            <Button
              onClick={confirmActivationAction}
              disabled={anyActivationActionRunning}
              className={
                activationDialog?.mode === "regenerate_code"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : activationDialog?.mode === "disable_activation"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              {anyActivationActionRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : activationDialog?.mode === "regenerate_code" ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Tạo mã mới
                </>
              ) : activationDialog?.mode === "disable_activation" ? (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Vô hiệu hoá
                </>
              ) : activationDialog?.mode === "enable_activation" ? (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Bỏ vô hiệu hoá
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Xác nhận reset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
} 