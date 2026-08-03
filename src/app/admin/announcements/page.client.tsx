"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Bell,
  Megaphone,
  Tag,
  RefreshCw,
  ExternalLink,
  Globe,
  Languages,
  Sparkles,
} from "lucide-react";

import type { Announcement } from "~/db/schema";
import { ANNOUNCEMENT_TYPES, SUPPORTED_LOCALES } from "~/db/schema";
import type { LocaleMap } from "~/db/schema";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Switch } from "~/ui/primitives/switch";
import { Badge } from "~/ui/primitives/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/ui/primitives/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";

const typeLabels: Record<string, string> = {
  [ANNOUNCEMENT_TYPES.GENERAL]: "Chung",
  [ANNOUNCEMENT_TYPES.PRODUCT]: "Sản phẩm",
  [ANNOUNCEMENT_TYPES.PROMOTION]: "Khuyến mãi",
  [ANNOUNCEMENT_TYPES.UPDATE]: "Cập nhật",
};

const typeBadgeColors: Record<string, string> = {
  [ANNOUNCEMENT_TYPES.GENERAL]: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  [ANNOUNCEMENT_TYPES.PRODUCT]: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  [ANNOUNCEMENT_TYPES.PROMOTION]: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  [ANNOUNCEMENT_TYPES.UPDATE]: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

function getLocaleText(map: LocaleMap | null | undefined, fallback = ""): string {
  if (!map) return fallback;
  return map["vi"] || map["en"] || Object.values(map)[0] || fallback;
}

function filledLocaleCount(map: LocaleMap): number {
  return Object.values(map).filter(v => v.trim().length > 0).length;
}

interface FormData {
  title: LocaleMap;
  content: LocaleMap;
  type: string;
  imageUrl: string;
  linkUrl: string;
  linkText: LocaleMap;
  isActive: boolean;
  priority: number;
  startDate: string;
  endDate: string;
}

function emptyLocaleMap(): LocaleMap {
  const map: LocaleMap = {};
  for (const l of SUPPORTED_LOCALES) map[l.code] = "";
  return map;
}

const emptyForm: FormData = {
  title: emptyLocaleMap(),
  content: emptyLocaleMap(),
  type: "general",
  imageUrl: "",
  linkUrl: "",
  linkText: emptyLocaleMap(),
  isActive: true,
  priority: 0,
  startDate: "",
  endDate: "",
};

function localeMapFromDb(map: LocaleMap | null | undefined): LocaleMap {
  const result = emptyLocaleMap();
  if (map) {
    for (const [k, v] of Object.entries(map)) {
      result[k] = v;
    }
  }
  return result;
}

function cleanLocaleMap(map: LocaleMap): LocaleMap {
  const result: LocaleMap = {};
  for (const [k, v] of Object.entries(map)) {
    if (v.trim()) result[k] = v.trim();
  }
  return result;
}

function formatDateForInput(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().slice(0, 16);
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AnnouncementsClientPageProps {
  announcements: Announcement[];
}

export default function AnnouncementsClientPage({ announcements: initialData }: AnnouncementsClientPageProps) {
  const [items, setItems] = useState<Announcement[]>(initialData);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Announcement | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [activeLocaleTab, setActiveLocaleTab] = useState("vi");
  const [translating, setTranslating] = useState(false);

  const handleCreate = () => {
    setEditingItem(null);
    setIsCreating(true);
    setFormData(emptyForm);
    setActiveLocaleTab("vi");
    setShowDialog(true);
  };

  const handleEdit = (item: Announcement) => {
    setEditingItem(item);
    setIsCreating(false);
    setFormData({
      title: localeMapFromDb(item.title),
      content: localeMapFromDb(item.content),
      type: item.type,
      imageUrl: item.imageUrl || "",
      linkUrl: item.linkUrl || "",
      linkText: localeMapFromDb(item.linkText),
      isActive: item.isActive,
      priority: item.priority,
      startDate: formatDateForInput(item.startDate),
      endDate: formatDateForInput(item.endDate),
    });
    setActiveLocaleTab("vi");
    setShowDialog(true);
  };

  const handleToggleActive = async (item: Announcement) => {
    try {
      const response = await fetch(`/api/admin/announcements/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });

      if (!response.ok) throw new Error("Failed to update");

      const data = await response.json() as { announcement: Announcement };
      setItems(prev => prev.map(i => i.id === item.id ? data.announcement : i));
      toast.success(data.announcement.isActive ? "Đã bật thông báo" : "Đã tắt thông báo");
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleDelete = async (item: Announcement) => {
    try {
      const response = await fetch(`/api/admin/announcements/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      setItems(prev => prev.filter(i => i.id !== item.id));
      toast.success("Đã xóa thông báo");
    } catch {
      toast.error("Không thể xóa thông báo");
    } finally {
      setShowDeleteAlert(false);
      setItemToDelete(null);
    }
  };

  const updateLocaleField = (field: "title" | "content" | "linkText", locale: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [locale]: value },
    }));
  };

  const handleTranslate = async () => {
    if (!formData.title.vi?.trim() || !formData.content.vi?.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung tiếng Việt trước khi dịch");
      setActiveLocaleTab("vi");
      return;
    }

    setTranslating(true);
    try {
      const response = await fetch("/api/admin/announcements/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.vi.trim(),
          content: formData.content.vi.trim(),
          linkText: formData.linkText.vi?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json() as { error?: string };
        throw new Error(err.error || "Dịch thất bại");
      }

      const data = await response.json() as {
        translations: Record<string, { title: string; content: string; linkText?: string }>;
      };

      setFormData(prev => {
        const newTitle = { ...prev.title };
        const newContent = { ...prev.content };
        const newLinkText = { ...prev.linkText };

        for (const [locale, t] of Object.entries(data.translations)) {
          if (t.title) newTitle[locale] = t.title;
          if (t.content) newContent[locale] = t.content;
          if (t.linkText) newLinkText[locale] = t.linkText;
        }

        return { ...prev, title: newTitle, content: newContent, linkText: newLinkText };
      });

      toast.success("Đã dịch sang 10 ngôn ngữ. Vui lòng kiểm tra trước khi lưu.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi khi dịch");
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.vi || !formData.content.vi) {
      toast.error("Vui lòng điền tiêu đề và nội dung tiếng Việt (bắt buộc)");
      setActiveLocaleTab("vi");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: cleanLocaleMap(formData.title),
        content: cleanLocaleMap(formData.content),
        type: formData.type,
        imageUrl: formData.imageUrl || null,
        linkUrl: formData.linkUrl || null,
        linkText: Object.values(cleanLocaleMap(formData.linkText)).length > 0
          ? cleanLocaleMap(formData.linkText)
          : null,
        isActive: formData.isActive,
        priority: formData.priority,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      const url = isCreating
        ? "/api/admin/announcements"
        : `/api/admin/announcements/${editingItem!.id}`;

      const response = await fetch(url, {
        method: isCreating ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json() as { error?: string };
        throw new Error(err.error || "Failed to save");
      }

      const data = await response.json() as { announcement: Announcement };

      if (isCreating) {
        setItems(prev => [data.announcement, ...prev]);
        toast.success("Tạo thông báo thành công");
      } else {
        setItems(prev => prev.map(i => i.id === data.announcement.id ? data.announcement : i));
        toast.success("Cập nhật thông báo thành công");
      }

      setShowDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const activeCount = items.filter(i => i.isActive).length;
  const inactiveCount = items.filter(i => !i.isActive).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="h-8 w-8 text-amber-600" />
            Quản lý thông báo
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Tạo và quản lý thông báo popup hiển thị cho người dùng khi truy cập trang web
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Tạo thông báo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Tổng thông báo</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{items.length}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Đang hiển thị</div>
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-sm text-gray-600 dark:text-gray-400">Đã tắt</div>
          <div className="text-2xl font-bold text-gray-500">{inactiveCount}</div>
        </div>
      </div>

      {/* List */}
      {items.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Thông báo</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Loại</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Ngôn ngữ</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Ưu tiên</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Thời gian</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Trạng thái</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {items.map(item => {
                const titleCount = filledLocaleCount(item.title);
                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[300px]">
                            {getLocaleText(item.title, "(Chưa có tiêu đề)")}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[300px]">
                            {getLocaleText(item.content)}
                          </div>
                          {item.linkUrl && (
                            <a
                              href={item.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {getLocaleText(item.linkText, "Xem thêm")}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={typeBadgeColors[item.type] || typeBadgeColors.general}>
                        {typeLabels[item.type] || item.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className="gap-1">
                        <Globe className="h-3 w-3" />
                        {titleCount}/{SUPPORTED_LOCALES.length}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300">
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                        {item.startDate && <div>Từ: {formatDate(item.startDate)}</div>}
                        {item.endDate && <div>Đến: {formatDate(item.endDate)}</div>}
                        {!item.startDate && !item.endDate && <div>Không giới hạn</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className="inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {item.isActive ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 transition-colors">
                            <Eye className="h-3 w-3 mr-1" />
                            Bật
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 transition-colors">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Tắt
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="hover:bg-blue-50 hover:border-blue-400 dark:hover:bg-blue-900/30"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setItemToDelete(item);
                            setShowDeleteAlert(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 px-4">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 flex items-center justify-center">
              <Megaphone className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Chưa có thông báo nào
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tạo thông báo đầu tiên để hiển thị popup cho người dùng khi truy cập trang web.
              </p>
            </div>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tạo thông báo đầu tiên
            </Button>
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isCreating ? "Tạo thông báo mới" : "Chỉnh sửa thông báo"}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? "Nhập nội dung tiếng Việt (bắt buộc), các ngôn ngữ khác là tuỳ chọn."
                : "Cập nhật nội dung thông báo cho từng ngôn ngữ."
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* Locale tabs for translatable fields */}
            <Tabs value={activeLocaleTab} onValueChange={setActiveLocaleTab}>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Ngôn ngữ</span>
              </div>
              <TabsList className="flex-wrap h-auto gap-1 p-1">
                {SUPPORTED_LOCALES.map(l => {
                  const hasTitleContent = formData.title[l.code]?.trim() && formData.content[l.code]?.trim();
                  return (
                    <TabsTrigger
                      key={l.code}
                      value={l.code}
                      className="relative text-xs px-2.5 py-1.5"
                    >
                      {l.code.toUpperCase()}
                      {l.code === "vi" && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                      {hasTitleContent && l.code !== "vi" && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Auto-translate button */}
              {formData.title.vi?.trim() && formData.content.vi?.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTranslate}
                  disabled={translating}
                  className="mt-2 gap-2 border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950 dark:hover:text-amber-300"
                >
                  {translating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Đang dịch tự động...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <Languages className="h-4 w-4" />
                      Tự động dịch từ tiếng Việt (AI)
                    </>
                  )}
                </Button>
              )}

              {SUPPORTED_LOCALES.map(l => (
                <TabsContent key={l.code} value={l.code} className="space-y-4 mt-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {l.label}
                    </span>
                    {l.code === "vi" && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-300">Bắt buộc</Badge>
                    )}
                    {l.code !== "vi" && (
                      <Badge variant="outline" className="text-xs">Tuỳ chọn</Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Tiêu đề {l.code === "vi" && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      value={formData.title[l.code] || ""}
                      onChange={e => updateLocaleField("title", l.code, e.target.value)}
                      placeholder={l.code === "vi" ? "VD: Sản phẩm mới ra mắt!" : `Title in ${l.label}`}
                      required={l.code === "vi"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Nội dung {l.code === "vi" && <span className="text-red-500">*</span>}
                    </Label>
                    <textarea
                      value={formData.content[l.code] || ""}
                      onChange={e => updateLocaleField("content", l.code, e.target.value)}
                      placeholder={l.code === "vi" ? "Nội dung thông báo chi tiết..." : `Content in ${l.label}`}
                      rows={3}
                      required={l.code === "vi"}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Text nút liên kết</Label>
                    <Input
                      value={formData.linkText[l.code] || ""}
                      onChange={e => updateLocaleField("linkText", l.code, e.target.value)}
                      placeholder={l.code === "vi" ? "VD: Xem ngay" : `Button text in ${l.label}`}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Non-translatable fields */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cài đặt chung</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Loại thông báo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={value => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">
                        <span className="flex items-center gap-2">
                          <Bell className="h-4 w-4" /> Chung
                        </span>
                      </SelectItem>
                      <SelectItem value="product">
                        <span className="flex items-center gap-2">
                          <Tag className="h-4 w-4" /> Sản phẩm
                        </span>
                      </SelectItem>
                      <SelectItem value="promotion">
                        <span className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4" /> Khuyến mãi
                        </span>
                      </SelectItem>
                      <SelectItem value="update">
                        <span className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" /> Cập nhật
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Độ ưu tiên</Label>
                  <Input
                    id="priority"
                    type="number"
                    min={0}
                    value={formData.priority}
                    onChange={e => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL hình ảnh (tuỳ chọn)</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={e => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkUrl">URL liên kết (tuỳ chọn)</Label>
                <Input
                  id="linkUrl"
                  value={formData.linkUrl}
                  onChange={e => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                  placeholder="https://example.com/product"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Bắt đầu hiển thị (tuỳ chọn)</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Kết thúc hiển thị (tuỳ chọn)</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Hiển thị thông báo ngay
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : isCreating ? (
                  "Tạo thông báo"
                ) : (
                  "Cập nhật"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thông báo &ldquo;{getLocaleText(itemToDelete?.title)}&rdquo;? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && handleDelete(itemToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
