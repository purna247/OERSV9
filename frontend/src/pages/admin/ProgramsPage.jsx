import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { adminApi } from '../../services/api/adminApi';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { BookOpen } from 'lucide-react';

export const ProgramsPage = () => {
  const { data, loading, error, execute: reload } = useFetch(adminApi.getPrograms);

  const columns = [
    {
      key: 'program_code',
      label: 'Program Code',
      render: v => <span className="font-mono text-sm font-medium text-text-primary">{v}</span>,
    },
    { key: 'degree_type',  label: 'Degree Type' },
    { key: 'branch_name',  label: 'Branch Name' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">Programs</h2>
        <p className="text-sm text-text-secondary">All academic programs offered</p>
      </section>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : !data?.length ? (
        <Card>
          <div className="text-center py-12 space-y-2">
            <BookOpen className="w-8 h-8 text-text-tertiary mx-auto" />
            <p className="text-sm font-medium text-text-primary">No programs found</p>
          </div>
        </Card>
      ) : (
        <Card padding="sm">
          <Table columns={columns} data={data} sortable hoverable />
        </Card>
      )}
    </div>
  );
};

export default ProgramsPage;
