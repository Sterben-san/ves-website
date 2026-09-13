import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render(row: T): ReactNode;
  className?: string;
};

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  actions,
  emptyState = "No records yet."
}: {
  rows: T[];
  columns: Array<DataTableColumn<T>>;
  getRowKey(row: T): string;
  actions?: (row: T) => ReactNode;
  emptyState?: string;
}) {
  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              {columns.map((column) => (
                <th className={`px-4 py-3 font-black ${column.className ?? ""}`} key={column.key}>
                  {column.header}
                </th>
              ))}
              {actions ? <th className="px-4 py-3 font-black">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-slate-100" key={getRowKey(row)}>
                {columns.map((column) => (
                  <td className={`px-4 py-3 align-top ${column.className ?? ""}`} key={column.key}>
                    {column.render(row)}
                  </td>
                ))}
                {actions ? <td className="px-4 py-3 align-top">{actions(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {rows.map((row) => (
          <article className="min-w-0 rounded border border-slate-200 bg-white p-4" key={getRowKey(row)}>
            {columns.map((column) => (
              <div className="border-b border-slate-100 py-2 last:border-b-0" key={column.key}>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{column.header}</p>
                <div className="mt-1 min-w-0 break-words text-sm text-slate-800">{column.render(row)}</div>
              </div>
            ))}
            {actions ? <div className="mt-3 flex flex-wrap gap-2 [&>button]:min-h-10 [&>button]:flex-1">{actions(row)}</div> : null}
          </article>
        ))}
      </div>
      {rows.length === 0 ? <p className="px-5 py-10 text-center text-sm font-semibold text-slate-500">{emptyState}</p> : null}
    </div>
  );
}
