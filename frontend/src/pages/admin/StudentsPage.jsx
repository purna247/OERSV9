import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { adminApi } from '../../services/api/adminApi';
import { useDebounce } from '../../hooks/useDebounce';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { Users } from 'lucide-react';

const statusVariant = (status) => {
  if (!status) return 'neutral';
  const s = status.toUpperCase();
  if (s === 'ACTIVE')   return 'success';
  if (s === 'DETAINED') return 'error';
  if (s === 'INACTIVE') return 'neutral';
  return 'default';
};

export const StudentsPage = () => {
  const [filters, setFilters] = useState({ program_code: '', semester: '', admission_year: '' });
  const debouncedFilters = useDebounce(filters, 500);
  const { data: students, loading, error, execute: reload } = useFetch(() => adminApi.getStudents(debouncedFilters));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const columns = [
    {
      key: 'name',
      label: 'Student',
      render: (v, row) => (
        <div>
          <p className="text-sm font-medium text-text-primary">{v}</p>
          <p className="text-xs text-text-tertiary mt-0.5">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'reg_no',
      label: 'Reg No',
      render: v => <span className="font-mono text-sm text-text-secondary">{v}</span>,
    },
    {
      key: 'program_code',
      label: 'Program',
      render: (v, row) => (
        <div>
          <p className="text-sm text-text-primary">{v}</p>
          <p className="text-xs text-text-tertiary mt-0.5">Sem {row.semester}</p>
        </div>
      ),
    },
    {
      key: 'cgpa',
      label: 'CGPA',
      render: v => <span className="text-sm font-medium text-text-primary">{v ?? '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: v => <Badge variant={statusVariant(v)}>{v || 'ACTIVE'}</Badge>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">Student Directory</h2>
        <p className="text-sm text-text-secondary">Manage and view all registered students</p>
      </section>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            name="program_code"
            placeholder="Program code (e.g. BTECH_CSE)"
            value={filters.program_code}
            onChange={handleChange}
          />
          <Select
            name="semester"
            value={filters.semester}
            onChange={handleChange}
          >
            <option value="">All semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </Select>
          <Input
            name="admission_year"
            placeholder="Admission year (e.g. 2023)"
            value={filters.admission_year}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Table */}
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !students?.length ? (
        <Card>
          <div className="text-center py-12 space-y-2">
            <Users className="w-8 h-8 text-text-tertiary mx-auto" />
            <p className="text-sm font-medium text-text-primary">No students found</p>
            <p className="text-xs text-text-tertiary">Try adjusting your filters.</p>
          </div>
        </Card>
      ) : (
        <Card padding="sm">
          <Table
            columns={columns}
            data={students}
            sortable
            hoverable
            pagination={{ pageSize: 20 }}
          />
        </Card>
      )}
    </div>
  );
};

export default StudentsPage;
