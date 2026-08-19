import React, { useState } from 'react';
import { adminApi } from '../../services/api/adminApi';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { FileUploadField } from '../../components/common/FileUploadField';
import { useToast } from '../../hooks/useToast';
import { AlertCircle, CheckCircle2, Users, BookOpen, UserCheck, ClipboardList } from 'lucide-react';
import { cn } from '../../utils/cn';

const TABS = [
  { id: 'students', label: 'Students', icon: Users,        columns: 'reg_no | name | email | program_code | semester | admission_year | cgpa' },
  { id: 'subjects', label: 'Subjects', icon: BookOpen,     columns: 'subject_code | short_code | subject_name | program_code | semester | type | credits' },
  { id: 'advisors', label: 'Advisors', icon: UserCheck,    columns: 'name | email' },
  { id: 'backlogs', label: 'Backlogs', icon: ClipboardList, columns: 'reg_no | subject_code | status' },
];

const UPLOAD_APIS = {
  students: fd => adminApi.uploadStudents(fd),
  subjects: fd => adminApi.uploadSubjects(fd),
  advisors: fd => adminApi.uploadAdvisors(fd),
  backlogs: fd => adminApi.uploadBacklogs(fd),
};

const btnPrimary = 'h-10 px-5 text-sm font-medium text-bg-primary bg-text-primary rounded-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-normal flex items-center gap-2';

export const UploadStudentsPage = () => {
  const [activeTab,   setActiveTab]   = useState('students');
  const [file,        setFile]        = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result,      setResult]      = useState(null);
  const { addToast } = useToast();

  const handleTabChange = (id) => { setActiveTab(id); setFile(null); setResult(null); };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true); setResult(null);
    try {
      const response = await UPLOAD_APIS[activeTab](formData);
      setResult(response);
      addToast('Upload processed successfully', 'success');
      setFile(null);
    } catch (err) {
      addToast(err.message || 'Failed to upload file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      {/* Header */}
      <section className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">Bulk Uploads</h2>
        <p className="text-sm text-text-secondary">Import data from Excel or CSV files</p>
      </section>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border-default">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={cn(
              'flex items-center gap-2 px-4 h-10 text-sm font-medium border-b-2 -mb-px transition-colors duration-normal',
              activeTab === id
                ? 'border-text-primary text-text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            )}
          >
            <Icon className="w-4 h-4" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {/* Upload form */}
      <Card>
        <div className="space-y-5">
          {/* Instructions */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-text-primary">Upload {currentTab.label}</p>
            <ul className="text-xs text-text-tertiary space-y-1 list-disc list-inside">
              <li>File must be <code className="font-mono">.xlsx</code> or <code className="font-mono">.csv</code></li>
              <li>Required columns: <code className="font-mono text-text-secondary">{currentTab.columns}</code></li>
              {activeTab === 'students' && <li>Passwords are auto-generated for new students</li>}
              <li>Max file size: 5 MB</li>
            </ul>
          </div>

          <FileUploadField
            key={activeTab}
            label="Select File"
            accept=".xlsx, .csv"
            onFileSelect={setFile}
            maxSizeMB={5}
          />

          <div className="flex justify-end pt-2 border-t border-border-default">
            <button onClick={handleUpload} disabled={!file || isUploading} className={btnPrimary}>
              {isUploading && <Spinner size="sm" />}
              Upload &amp; Process
            </button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <Card header={
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-green" />
            <p className="text-sm font-medium text-text-primary">Upload Summary</p>
          </div>
        }>
          {/* Counts */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Inserted', value: result.inserted || 0, variant: 'success' },
              { label: 'Updated',  value: result.updated  || 0, variant: 'info' },
              { label: 'Skipped',  value: result.skipped  || 0, variant: result.skipped > 0 ? 'warning' : 'neutral' },
            ].map(({ label, value, variant }) => (
              <div key={label} className="text-center p-4 rounded-sm border border-border-default bg-bg-secondary">
                <p className="text-2xl font-semibold text-text-primary">{value}</p>
                <Badge variant={variant} className="mt-1">{label}</Badge>
              </div>
            ))}
          </div>

          {/* Skipped details */}
          {result.skippedDetails?.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-accent-red" /> Skipped Details
              </p>
              <div className="rounded-sm border border-border-default bg-bg-secondary p-3 max-h-40 overflow-y-auto no-scrollbar">
                <ul className="text-xs text-accent-red space-y-1">
                  {result.skippedDetails.map((d, i) => (
                    <li key={i}>
                      Row {d.row} ({d.reg_no || d.subject_code || d.email}): {d.reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* New credentials */}
          {result.imported_credentials?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-secondary">New Credentials — save and distribute securely</p>
              <div className="rounded-sm border border-border-default bg-bg-secondary p-3 max-h-60 overflow-y-auto no-scrollbar">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="pb-2 text-left font-medium text-text-tertiary">Identifier</th>
                      <th className="pb-2 text-left font-medium text-text-tertiary">Temp Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.imported_credentials.map((c, i) => (
                      <tr key={i} className="border-b border-border-subtle last:border-0">
                        <td className="py-1.5 font-mono text-text-secondary">{c.identifier}</td>
                        <td className="py-1.5 font-mono font-medium text-text-primary">{c.temp_password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default UploadStudentsPage;
