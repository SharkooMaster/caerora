"use client";
import { apiBase } from "./api";
import { clearStaffTokens, setStaffTokens } from "./adminApi";

export interface StaffUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export const staffAuth = {
  async login(username: string, password: string): Promise<StaffUser> {
    const res = await fetch(`${apiBase()}/admin/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        (data as { detail?: string }).detail ||
          "Invalid credentials or no staff access.",
      );
    }
    setStaffTokens(data.access, data.refresh);
    return data.user as StaffUser;
  },
  logout() {
    clearStaffTokens();
  },
};
