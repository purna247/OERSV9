import React from 'react';
import { cn } from '../../utils/cn';
import { EmptyState } from '../common/EmptyState';
import { Skeleton } from '../common/Skeleton';

export const DataTable = ({ 
  columns, 
  data, 
  isLoading = false, 
  emptyTitle = "No data found", 
  emptyDesc = "There are no records to display at this time." 
}) => {
  
  if (isLoading) {
    return (
      <div className="clay-card overflow-hidden w-full">
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDesc} />;
  }

  return (
    <div className="clay-card overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-soft-purple/5">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={cn(
                    "px-5 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-soft-purple/5">
            {data.map((row, rowIdx) => (
              <tr key={row.id || rowIdx} className="hover:bg-soft-purple/5 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={cn("px-5 py-5", col.cellClassName)}>
                    {col.accessor ? row[col.accessor] : col.render ? col.render(row) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
