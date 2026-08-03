"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { UserWithPassword } from "~/lib/queries/users";

import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

interface UserEditFormProps {
  user: UserWithPassword;
  onSuccess: (updatedUser: UserWithPassword) => void;
  onCancel: () => void;
}

export function UserEditForm({ user, onSuccess, onCancel }: UserEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    age: user.age?.toString() || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
          age: formData.age ? Number(formData.age) : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      const updatedUser = await response.json() as UserWithPassword;
      onSuccess(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Không thể cập nhật người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-gray-900 dark:text-gray-100">Tên</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            placeholder="Nhập tên"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-gray-900 dark:text-gray-100">Họ</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            placeholder="Nhập họ"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">Tên hiển thị</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Nhập tên hiển thị"
          required
          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-900 dark:text-gray-100">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="Nhập email"
          required
          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="age" className="text-gray-900 dark:text-gray-100">Tuổi</Label>
        <Input
          id="age"
          type="number"
          value={formData.age}
          onChange={(e) => handleChange("age", e.target.value)}
          placeholder="Nhập tuổi"
          min="1"
          max="120"
          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Hủy
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
} 