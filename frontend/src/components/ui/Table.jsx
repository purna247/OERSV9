import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Table Component - Minimal Design
 * 
 * A clean, minimal table component with sortable columns, pagination, and responsive design.
 * Features subtle row separators, hover effects, and generous cell padding.
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 * 
 * @param {Object} props
 * @param {Array} props.columns - Column definitions [{ key, label, sortable }]
 * @param {Array} props.data - Table data array
 * @param {boolean} [props.sortable=false] - Enable column sorting
 * @param {boolean} [props.hoverable=true] - Enable row hover effects
 * @param {Object} [props.pagination] - Pagination config { page, pageSize, total, onPageChange }
 * @param {string} [props.className] - Additional CSS classes
 */
export const Table = ({
  columns = [],
  data = [],
  sortable = false,
  hoverable = true,
  pagination,
  className,
  ...props
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);

  // Determine if pagination is internal (only pageSize given) or external (page+total+onPageChange given)
  const isInternalPagination = pagination && !pagination.onPageChange;
  const pageSize = pagination?.pageSize ?? 20;

  // Handle column sorting
  const handleSort = (columnKey) => {
    if (!sortable) return;
    let direction = 'asc';
    if (sortConfig.key === columnKey && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key: columnKey, direction });
    setCurrentPage(1); // reset to page 1 on sort
  };

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue === bValue) return 0;
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  // Paginate data (internal mode)
  const totalRows = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const displayData = isInternalPagination
    ? sortedData.slice((safePage - 1) * pageSize, safePage * pageSize)
    : sortedData;

  // External pagination uses passed page/total
  const extPage  = pagination?.page  ?? 1;
  const extTotal = pagination?.total ?? 0;

  const renderSortIcon = (columnKey) => {
    if (!sortable) return null;
    const isActive = sortConfig.key === columnKey;
    const IconComponent = isActive
      ? sortConfig.direction === 'asc' ? ChevronUp : ChevronDown
      : ChevronsUpDown;
    return (
      <IconComponent className={cn('w-4 h-4 ml-1 inline-block transition-opacity duration-normal', isActive ? 'opacity-100' : 'opacity-40')} />
    );
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Table Container - Requirement 17.5: Responsive horizontal scroll */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" {...props}>
          {/* Table Header */}
          <thead>
            <tr className="border-b border-border-default">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    // Requirement 17.6: Generous cell padding (16px-20px)
                    'px-5 py-4',
                    // Requirement 17.6: Clean typography (header: weight 600, 14px)
                    'text-sm font-semibold text-text-primary text-left',
                    // Requirement 17.3: Sortable column headers with minimal icon indicators
                    sortable && column.sortable !== false && [
                      'cursor-pointer select-none',
                      'hover:bg-bg-hover transition-colors duration-normal'
                    ]
                  )}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {column.sortable !== false && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {displayData.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={cn(
                  'border-b border-border-default last:border-b-0',
                  hoverable && ['transition-colors duration-normal', 'hover:bg-bg-hover']
                )}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4 text-sm font-normal text-text-secondary">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {displayData.length === 0 && (
          <div className="text-center py-12 text-text-tertiary text-sm">No data available</div>
        )}
      </div>

      {/* Internal pagination */}
      {isInternalPagination && totalRows > pageSize && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-text-tertiary">
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, totalRows)} of {totalRows}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className={cn('px-3 py-1.5 text-sm font-medium rounded-sm border border-border-default transition-all duration-normal', safePage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg-hover')}
            >Previous</button>
            <span className="text-sm text-text-secondary px-2">Page {safePage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className={cn('px-3 py-1.5 text-sm font-medium rounded-sm border border-border-default transition-all duration-normal', safePage >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg-hover')}
            >Next</button>
          </div>
        </div>
      )}

      {/* External pagination */}
      {pagination && pagination.onPageChange && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-text-tertiary">
            Showing {Math.min((extPage - 1) * pageSize + 1, extTotal)}–{Math.min(extPage * pageSize, extTotal)} of {extTotal}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(extPage - 1)}
              disabled={extPage === 1}
              className={cn('px-3 py-1.5 text-sm font-medium rounded-sm border border-border-default transition-all duration-normal', extPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg-hover')}
            >Previous</button>
            <span className="text-sm text-text-secondary px-2">Page {extPage} of {Math.ceil(extTotal / pageSize)}</span>
            <button
              onClick={() => pagination.onPageChange(extPage + 1)}
              disabled={extPage >= Math.ceil(extTotal / pageSize)}
              className={cn('px-3 py-1.5 text-sm font-medium rounded-sm border border-border-default transition-all duration-normal', extPage >= Math.ceil(extTotal / pageSize) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg-hover')}
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
