"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import type { AdminSeason, Paginated } from "@/lib/adminTypes";

/** Season dropdown for the product editor. Seasons are managed in /studio/seasons. */
export function SeasonSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [seasons, setSeasons] = useState<AdminSeason[]>([]);

  useEffect(() => {
    adminApi
      .get<Paginated<AdminSeason> | AdminSeason[]>("/seasons/?page_size=100")
      .then((d) => setSeasons(Array.isArray(d) ? d : d.results))
      .catch(() => {});
  }, []);

  return (
    <select
      className="input"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">No season</option>
      {seasons.map((s) => (
        <option key={s.id} value={s.id}>
          {s.numeral}. {s.name}
          {!s.is_active ? " (hidden)" : ""}
        </option>
      ))}
    </select>
  );
}
