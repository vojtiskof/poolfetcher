"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";

export function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Default to today if no param, or use the param
  const dateParam = searchParams.get("date");
  const currentDate = dateParam ? new Date(dateParam) : new Date();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    router.push(`/?date=${newDate}`);
  };

  return (
    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
      <label
        htmlFor="date-filter"
        className="text-sm font-medium text-slate-500 pl-2"
      >
        Datum:
      </label>
      <input
        type="date"
        id="date-filter"
        value={format(currentDate, "yyyy-MM-dd")}
        onChange={handleDateChange}
        className="outline-none text-slate-700 bg-transparent text-sm"
      />
    </div>
  );
}
