"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Shield, ShieldCheck, Handshake } from "lucide-react";

import type { UserWithPassword } from "~/lib/queries/users";

import { Button } from "~/ui/primitives/button";
import { Label } from "~/ui/primitives/label";

interface RoleChangeDialogProps {
  user: UserWithPassword;
  onSuccess: (updatedUser: UserWithPassword) => void;
  onCancel: () => void;
}

export function RoleChangeDialog({ user, onSuccess, onCancel }: RoleChangeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);

  const handleRoleChange = async () => {
    if (selectedRole === user.role) {
      onCancel();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          newRole: selectedRole,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to change user role");
      }

      const updatedUser = await response.json() as UserWithPassword;
      onSuccess(updatedUser);
    } catch (error) {
      console.error("Error changing user role:", error);
      toast.error("Không thể thay đổi vai trò");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      value: "USER",
      label: "User",
      description: "Quyền truy cập cơ bản",
      icon: Shield,
    },
    {
      value: "AFFILIATE",
      label: "Cộng Tác Viên",
      description: "CTV bán hàng — đủ điều kiện được cấp voucher",
      icon: Handshake,
    },
    {
      value: "ADMIN", 
      label: "Admin",
      description: "Quyền quản trị hệ thống",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Thay đổi vai trò</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Chọn vai trò mới cho <strong className="text-gray-900 dark:text-gray-100">{user.name}</strong>
        </p>
      </div>

      <div className="space-y-3">
        {roles.map((role) => {
          const IconComponent = role.icon;
          const isSelected = selectedRole === role.value;
          const isCurrent = user.role === role.value;
          
          return (
            <div
              key={role.value}
              className={`
                relative rounded-lg border p-3 cursor-pointer transition-colors
                ${isSelected 
                  ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30" 
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800"
                }
              `}
              onClick={() => setSelectedRole(role.value)}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={isSelected}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="sr-only"
                />
                <IconComponent className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium cursor-pointer text-gray-900 dark:text-gray-100">
                      {role.label}
                    </Label>
                    {isCurrent && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                        Hiện tại
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedRole !== user.role && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/30 p-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Lưu ý:</strong> Thay đổi vai trò sẽ ảnh hưởng đến quyền truy cập của người dùng.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Hủy
        </Button>
        <Button
          onClick={handleRoleChange}
          disabled={loading || selectedRole === user.role}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          {loading ? "Đang thay đổi..." : "Thay đổi vai trò"}
        </Button>
      </div>
    </div>
  );
} 