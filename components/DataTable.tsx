"use client";

import { format } from "date-fns";

interface DataTableProps {
  data: {
    timestamp: Date | string;
    poolCount: number;
  }[];
}

export function DataTable({ data }: DataTableProps) {
  // Sort descending for table view (newest first)
  const sortedData = [...data].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-medium text-slate-800">Detailní data</h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[300px]">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
            <tr>
              <th className="px-6 py-3">Čas</th>
              <th className="px-6 py-3">Vodní zóna</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-4 text-center text-slate-500"
                >
                  Žádná data pro tento den.
                </td>
              </tr>
            ) : (
              sortedData.map((record, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                    {format(new Date(record.timestamp), "HH:mm")}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {record.poolCount}
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
