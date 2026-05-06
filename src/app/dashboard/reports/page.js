'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Upload, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Eyebrow } from '@/components/synex/Eyebrow';
import { Hairline } from '@/components/synex/Hairline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const initialForm = { reportName: '', extractedText: '' };

const getReportId = (r) => r?.id || r?.reportId || r?.uploadId;
const getReportTitle = (r) => r?.reportName || r?.name || r?.title || r?.fileName || 'Untitled report';
const getReportText = (r) => r?.extractedText || r?.extracted_text || r?.text || r?.content || '';
const getReportSummary = (r) => r?.summary || r?.analysisSummary || r?.analysis?.summary || '';
const getCreatedAt = (i) => {
  const v = i?.createdAt || i?.created_at || i?.uploadedAt || i?.uploaded_at;
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (typeof v?._seconds === 'number') return new Date(v._seconds * 1000).toISOString();
  if (typeof v?.seconds === 'number') return new Date(v.seconds * 1000).toISOString();
  return null;
};
const formatDate = (v) => {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};
const normalizeFindings = (r) => {
  const f = r?.findings || r?.keyFindings || r?.analysis?.findings || [];
  if (!Array.isArray(f)) return [];
  return f.map((x, i) => typeof x === 'string'
    ? { id: i, label: x, desc: '' }
    : { id: x?.id || i, label: x?.label || x?.title || x?.name || 'Finding', desc: x?.desc || x?.description || x?.detail || '', tone: x?.tone || x?.status || '' });
};

export default function ReportsPage() {
  const { user, loading: authLoading, authFetch, getIdToken, profile } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');

  const sortedReports = useMemo(() => [...reports]
    .sort((a, b) => (getCreatedAt(b) || '').localeCompare(getCreatedAt(a) || '')), [reports]);
  const selectedReport = useMemo(() =>
    sortedReports.find((r) => getReportId(r) === selectedId) || sortedReports[0] || null,
    [selectedId, sortedReports]);
  const findings = useMemo(() => normalizeFindings(selectedReport), [selectedReport]);
  const companionName = profile?.aiCompanionName || 'AI Companion';

  const loadReports = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    const data = await authFetch('/api/reports');
    if (!data) {
      setError('Could not load your reports.');
      setReports([]); setLoading(false); return;
    }
    const next = Array.isArray(data.reports) ? data.reports : [];
    setReports(next);
    setSelectedId((c) => (c && next.some((r) => getReportId(r) === c)) ? c : (getReportId(next[0]) || ''));
    setLoading(false);
  }, [authFetch, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    loadReports();
  }, [authLoading, loadReports, user]);

  const handleFormChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const t = e.dataTransfer.getData('text');
    if (t) { setForm((p) => ({ ...p, extractedText: t })); return; }
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setForm((p) => ({ ...p, reportName: p.reportName || f.name.replace(/\.[^.]+$/, '') }));
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setForm((p) => ({ ...p, reportName: p.reportName || f.name.replace(/\.[^.]+$/, '') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!form.extractedText.trim() && !file) || saving) {
      setError('Paste report text or upload a file.');
      return;
    }
    setSaving(true);
    setError('');
    let data = null;
    try {
      const token = await getIdToken();
      const body = new FormData();
      body.append('reportName', form.reportName.trim() || file?.name?.replace(/\.[^.]+$/, '') || 'Medical report');
      body.append('extractedText', form.extractedText);
      if (file) body.append('file', file);
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Could not save that report.');
    } catch (err) {
      setError(err.message || 'Could not save that report.');
    }
    if (data) {
      const created = data.report || data;
      setForm(initialForm);
      setFile(null);
      await loadReports();
      if (getReportId(created)) setSelectedId(getReportId(created));
    }
    setSaving(false);
  };

  const handleDelete = async (r) => {
    const id = getReportId(r);
    if (!id || deletingId) return;
    if (!window.confirm(`Do you really want to delete this report?\n\n${getReportTitle(r)}`)) return;
    setDeletingId(id);
    setError('');
    const data = await authFetch(`/api/reports?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!data) setError('Could not delete that report.');
    else await loadReports();
    setDeletingId('');
  };

  return (
    <div className="flex flex-col gap-12">
      <header>
        <Eyebrow className="mb-3">REPORTS</Eyebrow>
        <h1 className="font-serif text-4xl md:text-5xl text-ink leading-tight tracking-[-0.02em]">In plain English.</h1>
        <p className="text-ink-3 mt-2 text-sm">Drop a discharge summary, lab result, or imaging report.</p>
      </header>

      {error && (
        <div className="border border-danger px-4 py-3 text-sm text-danger font-mono uppercase tracking-wide text-[11px]" role="alert">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Form */}
        <form
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onSubmit={handleSubmit}
          className={cn(
            'border border-dashed border-rule-strong p-8 transition-colors',
            isDragging && 'border-ink bg-paper-2',
          )}
        >
          <div className="flex items-center gap-3 mb-6">
            <Upload size={20} strokeWidth={1.5} className="text-ink-3" />
            <h3 className="font-serif text-xl text-ink">Upload or paste</h3>
          </div>

          <div className="space-y-6">
            <label className="block">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 cursor-pointer hover:text-ink transition-colors">
                {file ? file.name : '+ Choose PDF, image, or text file'}
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/png,image/jpeg,image/webp,text/plain"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            <div className="space-y-2">
              <Label>Report name</Label>
              <Input name="reportName" value={form.reportName} onChange={handleFormChange} placeholder="Name this report" />
            </div>

            <div className="space-y-2">
              <Label>Report text</Label>
              <textarea
                name="extractedText"
                value={form.extractedText}
                onChange={handleFormChange}
                placeholder="Paste extracted text here…"
                rows={8}
                className="w-full bg-transparent border-0 border-b border-rule rounded-none px-0 py-2 text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink resize-none"
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Analyzing…' : 'Analyze report'}
            </Button>
          </div>
        </form>

        {/* Summary panel */}
        <div className="flex flex-col gap-6">
          {saving && (
            <div className="flex justify-end"><Skeleton width="120px" /></div>
          )}

          {loading ? (
            <p className="text-ink-3 text-sm">Loading…</p>
          ) : selectedReport ? (
            <>
              <div>
                <Eyebrow className="mb-2">SAVED REPORT</Eyebrow>
                <h2 className="font-serif text-3xl text-ink leading-tight">{getReportTitle(selectedReport)}</h2>
                <p className="font-mono text-xs text-ink-3 mt-2">{formatDate(getCreatedAt(selectedReport))}</p>
              </div>

              {findings.length > 0 && (
                <div>
                  <Eyebrow className="mb-4">KEY FINDINGS</Eyebrow>
                  <ul className="space-y-3">
                    {findings.map((f) => {
                      const warn = f.tone === 'warn' || f.tone === 'warning';
                      return (
                        <li key={f.id} className="flex gap-3 border-b border-rule pb-3">
                          <span className={cn('w-2 h-2 rounded-full mt-2 shrink-0', warn ? 'bg-warn' : 'bg-accent')} />
                          <div>
                            <span className="font-serif text-base text-ink">{f.label}</span>
                            {f.desc && <p className="text-ink-3 text-sm mt-1">{f.desc}</p>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {getReportSummary(selectedReport) && (
                <div>
                  <Eyebrow className="mb-4">ANALYSIS</Eyebrow>
                  <div className="prose-synex">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{getReportSummary(selectedReport)}</ReactMarkdown>
                  </div>
                </div>
              )}

              <div>
                <Eyebrow className="mb-4">REPORT TEXT</Eyebrow>
                <p className="text-ink-2 text-sm whitespace-pre-wrap leading-relaxed">
                  {getReportText(selectedReport) || 'No extracted text saved.'}
                </p>
              </div>
            </>
          ) : (
            <p className="text-ink-3 text-sm">Save a report to see it here.</p>
          )}

          {selectedReport && (
            <div className="border-t border-rule pt-4">
              <Link href="/dashboard/companion" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink hover:text-accent transition-colors">
                Ask {companionName} <ArrowRight size={12} strokeWidth={1.5} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Reports list */}
      {sortedReports.length > 0 && (
        <>
          <Hairline />
          <section>
            <Eyebrow className="mb-6">RECENT · {sortedReports.length}</Eyebrow>
            <ul>
              {sortedReports.map((r) => {
                const id = getReportId(r);
                const active = selectedReport && id === getReportId(selectedReport);
                return (
                  <li
                    key={id || getReportTitle(r)}
                    className={cn(
                      'border-t border-rule first:border-t-0 grid grid-cols-[1fr_120px_80px] gap-4 items-center py-3 transition-colors',
                      active && 'border-l-2 border-l-accent pl-3',
                    )}
                  >
                    <button onClick={() => setSelectedId(id || '')} className="text-left font-serif text-base text-ink hover:text-accent transition-colors">
                      {getReportTitle(r)}
                    </button>
                    <span className="font-mono text-xs text-ink-3 tabular-nums">{formatDate(getCreatedAt(r))}</span>
                    {id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
                        className="font-mono text-[11px] uppercase tracking-[0.18em] text-danger hover:text-ink transition-colors text-right"
                      >
                        {deletingId === id ? 'Deleting…' : 'Delete'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
