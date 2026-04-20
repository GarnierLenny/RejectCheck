"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  Plus, Pencil, Link as LinkIcon, Trash2, MoreVertical,
  Briefcase, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, Search, X, ExternalLink,
} from "lucide-react";
import { type Application, type HistoryItem, useAnalysis } from "../../../lib/queries";
import { KanbanView } from "../KanbanView";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  applications: Application[];
  applicationsLoading: boolean;
  history: HistoryItem[];
  onCreateApplication: (data: ApplicationInput) => Promise<unknown>;
  onUpdateApplication: (data: { id: number } & Partial<ApplicationInput>) => Promise<unknown>;
  onDeleteApplication: (id: number) => Promise<unknown>;
};

type ApplicationInput = {
  jobTitle: string; company: string; status?: string; appliedAt?: string;
  notes?: string | null; analysisId?: number | null; seniority?: string | null;
  pay?: string | null; officeLocation?: string | null; workSetting?: string | null;
  contractType?: string | null; languagesRequired?: string | null;
  yearsOfExperience?: string | null; companyStage?: string | null;
};

type AppFormState = {
  jobTitle: string; company: string; status: string; appliedAt: string;
  notes: string; analysisId: string; seniority: string; pay: string;
  officeLocation: string; workSetting: string; contractType: string;
  languagesRequired: string; yearsOfExperience: string; companyStage: string;
};

type FloatingMenu =
  | { type: 'app'; id: number; app: Application; x: number; y: number }
  | { type: 'status'; id: number; app: Application; x: number; y: number }
  | null;

const EMPTY_FORM: AppFormState = {
  jobTitle: '', company: '', status: 'applied',
  appliedAt: new Date().toISOString().slice(0, 10),
  notes: '', analysisId: '', seniority: '', pay: '',
  officeLocation: '', workSetting: '', contractType: '',
  languagesRequired: '', yearsOfExperience: '', companyStage: '',
};

const PAGE_SIZE = 10;
const ROW_HEIGHT = 53; // px — matches py-3 + content

const STATUS_COLORS: Record<string, string> = {
  interested:   'text-purple-600 border-purple-400/40 bg-purple-50',
  applied:      'text-rc-amber border-rc-amber/40 bg-rc-amber/5',
  interviewing: 'text-blue-600 border-blue-400/40 bg-blue-50',
  offer:        'text-rc-green border-rc-green/30 bg-rc-green/5',
  rejected:     'text-[#D94040] border-[#D94040]/30 bg-[#D94040]/5',
};
const STATUS_LABEL: Record<string, string> = {
  interested: 'Interested', applied: 'Applied', interviewing: 'Interviewing', offer: 'Offer', rejected: 'Rejected',
};

function scoreColor(score: number) {
  if (score < 40) return 'border-rc-green/30 text-rc-green bg-rc-green/5';
  if (score < 70) return 'border-rc-amber/40 text-rc-amber bg-rc-amber/5';
  return 'border-rc-red/30 text-rc-red bg-rc-red/5';
}

function Chip({ label, cls }: { label: string; cls?: string }) {
  return (
    <span className={`inline-flex font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded whitespace-nowrap ${cls ?? 'bg-rc-surface-raised border-rc-border text-rc-muted'}`}>
      {label}
    </span>
  );
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc')  return <ChevronUp size={10} className="shrink-0" />;
  if (sorted === 'desc') return <ChevronDown size={10} className="shrink-0" />;
  return <ChevronsUpDown size={10} className="shrink-0 opacity-30" />;
}

const SELECT_CLS = 'border border-rc-border rounded px-2 py-0.5 font-mono text-[11px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40 w-full';
const INPUT_CLS  = 'border border-rc-border rounded px-2 py-0.5 font-mono text-[12px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40 w-full';

function FieldRow({ label, display, isEditing, onActivate, children }: {
  label: string;
  display: React.ReactNode;
  isEditing: boolean;
  onActivate: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-2.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-rc-muted w-28 shrink-0">{label}</span>
      {isEditing ? (
        <div className="flex-1">{children}</div>
      ) : (
        <button
          onClick={onActivate}
          className="group flex items-center gap-2 flex-1 text-left rounded px-2 py-1 -mx-2 hover:bg-rc-surface-raised transition-colors"
        >
          {display ?? <span className="font-mono text-[12px] text-rc-muted/50">—</span>}
          <Pencil size={9} className="text-rc-muted opacity-0 group-hover:opacity-50 transition-opacity shrink-0 ml-auto" />
        </button>
      )}
    </div>
  );
}

// ─── App Drawer ──────────────────────────────────────────────────────────────

function AppDrawer({
  app, isClosing, onClose, onUpdateApplication,
}: {
  app: Application;
  isClosing: boolean;
  onClose: () => void;
  onUpdateApplication: (data: { id: number } & Partial<ApplicationInput>) => Promise<unknown>;
}) {
  const params = useParams();
  const lang = (params?.lang as string) ?? 'en';
  const { data: analysis, isLoading: analysisLoading } = useAnalysis(app.analysisId ?? null);
  const [notes, setNotes] = useState(app.notes ?? '');
  const [pay, setPay] = useState(app.pay ?? '');
  const [officeLocation, setOfficeLocation] = useState(app.officeLocation ?? '');
  const [yearsOfExperience, setYearsOfExperience] = useState(app.yearsOfExperience ?? '');
  const [appliedAt, setAppliedAt] = useState(app.appliedAt.slice(0, 10));
  const [editingField, setEditingField] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    setNotes(app.notes ?? '');
    setPay(app.pay ?? '');
    setOfficeLocation(app.officeLocation ?? '');
    setYearsOfExperience(app.yearsOfExperience ?? '');
    setAppliedAt(app.appliedAt.slice(0, 10));
  }, [app.id, app.notes, app.pay, app.officeLocation, app.yearsOfExperience, app.appliedAt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const score = app.analysis?.result?.score;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-[2px] bg-black/5 transition-opacity duration-300"
        style={{ opacity: visible && !isClosing ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 w-[480px] z-50 bg-white border-l border-[rgba(0,0,0,0.1)] shadow-2xl flex flex-col transition-transform duration-300 ease-out"
        style={{ transform: visible && !isClosing ? 'translateX(0)' : 'translateX(100%)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[rgba(0,0,0,0.06)] shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="font-mono text-[15px] font-bold text-rc-text leading-tight">{app.jobTitle}</h2>
            <p className="font-mono text-[12px] text-rc-muted mt-0.5">{app.company}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-rc-surface-raised text-rc-muted transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Status + score row */}
        <div className="flex items-center gap-3 px-6 py-3.5 border-b border-[rgba(0,0,0,0.06)] shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted">Status</span>
          <select
            value={app.status}
            onChange={async e => { await onUpdateApplication({ id: app.id, status: e.target.value }); }}
            className={`border rounded px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider focus:outline-none cursor-pointer ${STATUS_COLORS[app.status] ?? STATUS_COLORS.applied}`}
          >
            {Object.entries(STATUS_LABEL).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <div className="flex items-center gap-3 ml-auto">
            {typeof score === 'number' && (
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-[11px] font-black font-mono ${scoreColor(score)}`}>
                {score}
              </span>
            )}
            {app.analysisId && (
              <a
                href={`/${lang}/analyze?id=${app.analysisId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-rc-muted hover:text-rc-red transition-colors"
              >
                View Analysis <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Fields — click-to-edit rows */}
          <div className="divide-y divide-[rgba(0,0,0,0.05)]">
            {/* Select row helper rendered inline per field */}

            {/* Seniority */}
            <FieldRow label="Seniority" onActivate={() => setEditingField('seniority')} isEditing={editingField === 'seniority'}
              display={app.seniority ? <Chip label={app.seniority} /> : null}>
              <select autoFocus value={app.seniority ?? ''} onBlur={() => setEditingField(null)}
                onChange={async e => { setEditingField(null); await onUpdateApplication({ id: app.id, seniority: e.target.value || null }); }}
                className={SELECT_CLS}>
                <option value="">—</option>
                <option value="junior">Junior</option><option value="junior-mid">Junior-Mid</option>
                <option value="mid">Mid</option><option value="mid-senior">Mid-Senior</option><option value="senior">Senior</option>
              </select>
            </FieldRow>

            {/* Work Setting */}
            <FieldRow label="Work Setting" onActivate={() => setEditingField('workSetting')} isEditing={editingField === 'workSetting'}
              display={app.workSetting ? <Chip label={app.workSetting} cls={app.workSetting === 'full-remote' ? 'bg-rc-green/5 border-rc-green/20 text-rc-green' : app.workSetting === 'hybrid' ? 'bg-blue-50 border-blue-200 text-blue-600' : undefined} /> : null}>
              <select autoFocus value={app.workSetting ?? ''} onBlur={() => setEditingField(null)}
                onChange={async e => { setEditingField(null); await onUpdateApplication({ id: app.id, workSetting: e.target.value || null }); }}
                className={SELECT_CLS}>
                <option value="">—</option>
                <option value="full-remote">Full Remote</option><option value="hybrid">Hybrid</option><option value="on-site">On Site</option>
              </select>
            </FieldRow>

            {/* Contract */}
            <FieldRow label="Contract" onActivate={() => setEditingField('contractType')} isEditing={editingField === 'contractType'}
              display={app.contractType ? <Chip label={app.contractType} /> : null}>
              <select autoFocus value={app.contractType ?? ''} onBlur={() => setEditingField(null)}
                onChange={async e => { setEditingField(null); await onUpdateApplication({ id: app.id, contractType: e.target.value || null }); }}
                className={SELECT_CLS}>
                <option value="">—</option>
                <option value="CDI">CDI</option><option value="CDD">CDD</option><option value="freelance">Freelance</option>
                <option value="internship">Internship</option><option value="apprenticeship">Apprenticeship</option>
              </select>
            </FieldRow>

            {/* Languages */}
            <FieldRow label="Languages" onActivate={() => setEditingField('languagesRequired')} isEditing={editingField === 'languagesRequired'}
              display={app.languagesRequired ? <Chip label={app.languagesRequired} /> : null}>
              <select autoFocus value={app.languagesRequired ?? ''} onBlur={() => setEditingField(null)}
                onChange={async e => { setEditingField(null); await onUpdateApplication({ id: app.id, languagesRequired: e.target.value || null }); }}
                className={SELECT_CLS}>
                <option value="">—</option>
                <option value="french-only">French only</option><option value="english-only">English only</option><option value="bilingual">Bilingual</option>
              </select>
            </FieldRow>

            {/* Company Stage */}
            <FieldRow label="Company Stage" onActivate={() => setEditingField('companyStage')} isEditing={editingField === 'companyStage'}
              display={app.companyStage ? <Chip label={app.companyStage} /> : null}>
              <select autoFocus value={app.companyStage ?? ''} onBlur={() => setEditingField(null)}
                onChange={async e => { setEditingField(null); await onUpdateApplication({ id: app.id, companyStage: e.target.value || null }); }}
                className={SELECT_CLS}>
                <option value="">—</option>
                <option value="startup">Startup</option><option value="scale-up">Scale-up</option>
                <option value="sme">SME / PME</option><option value="enterprise">Enterprise</option>
              </select>
            </FieldRow>

            {/* Exp. required */}
            <FieldRow label="Exp. Required" onActivate={() => setEditingField('yearsOfExperience')} isEditing={editingField === 'yearsOfExperience'}
              display={yearsOfExperience ? <span className="font-mono text-[12px] text-rc-text">{yearsOfExperience}</span> : null}>
              <input autoFocus type="text" value={yearsOfExperience} placeholder="ex: 3-5 ans"
                onChange={e => setYearsOfExperience(e.target.value)}
                onBlur={async () => { setEditingField(null); if (yearsOfExperience !== (app.yearsOfExperience ?? '')) await onUpdateApplication({ id: app.id, yearsOfExperience: yearsOfExperience || null }); }}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className={INPUT_CLS} />
            </FieldRow>

            {/* Pay */}
            <FieldRow label="Pay" onActivate={() => setEditingField('pay')} isEditing={editingField === 'pay'}
              display={pay ? <span className="font-mono text-[12px] text-rc-green">{pay}</span> : null}>
              <input autoFocus type="text" value={pay} placeholder="ex: 45-55k€"
                onChange={e => setPay(e.target.value)}
                onBlur={async () => { setEditingField(null); if (pay !== (app.pay ?? '')) await onUpdateApplication({ id: app.id, pay: pay || null }); }}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className={INPUT_CLS} />
            </FieldRow>

            {/* Office Location */}
            <FieldRow label="Location" onActivate={() => setEditingField('officeLocation')} isEditing={editingField === 'officeLocation'}
              display={officeLocation ? <span className="font-mono text-[12px] text-rc-text">{officeLocation}</span> : null}>
              <input autoFocus type="text" value={officeLocation} placeholder="ex: Paris 8e"
                onChange={e => setOfficeLocation(e.target.value)}
                onBlur={async () => { setEditingField(null); if (officeLocation !== (app.officeLocation ?? '')) await onUpdateApplication({ id: app.id, officeLocation: officeLocation || null }); }}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className={INPUT_CLS} />
            </FieldRow>

            {/* Applied Date */}
            <FieldRow label="Applied" onActivate={() => setEditingField('appliedAt')} isEditing={editingField === 'appliedAt'}
              display={<span className="font-mono text-[12px] text-rc-text">{new Date(appliedAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>}>
              <input autoFocus type="date" value={appliedAt}
                onChange={e => setAppliedAt(e.target.value)}
                onBlur={async () => { setEditingField(null); if (appliedAt !== app.appliedAt.slice(0, 10)) await onUpdateApplication({ id: app.id, appliedAt }); }}
                className={INPUT_CLS} />
            </FieldRow>
          </div>

          {/* Notes */}
          <div className="px-6 py-5 border-t border-[rgba(0,0,0,0.05)]">
            <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={async () => {
                if (notes !== (app.notes ?? '')) await onUpdateApplication({ id: app.id, notes: notes || null });
              }}
              rows={3}
              placeholder="Add notes…"
              className="w-full border border-rc-border rounded-lg px-3 py-2 font-mono text-[12px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40 resize-none"
            />
          </div>

          {/* Job description */}
          <div className="px-6 pb-6 border-t border-[rgba(0,0,0,0.05)]">
            <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-2 pt-5">Job Description</label>
            {!app.analysisId ? (
              <p className="font-mono text-[12px] text-rc-muted italic">No analysis linked.</p>
            ) : analysisLoading ? (
              <p className="font-mono text-[12px] text-rc-muted">Loading…</p>
            ) : analysis?.jobDescription ? (
              <pre className="whitespace-pre-wrap font-mono text-[11px] text-rc-text leading-relaxed bg-rc-surface-raised rounded-lg p-4 border border-[rgba(0,0,0,0.06)]">
                {analysis.jobDescription}
              </pre>
            ) : (
              <p className="font-mono text-[12px] text-rc-muted italic">No job description available.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ApplicationsTab({
  applications, applicationsLoading, history,
  onCreateApplication, onUpdateApplication, onDeleteApplication,
}: Props) {
  const params = useParams();
  const lang = (params?.lang as string) ?? 'en';
  const dateLocale = lang === 'fr' ? 'fr-FR' : 'en-US';
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [sorting, setSorting] = useState<SortingState>([{ id: 'appliedAt', desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE });
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  function closeDrawer() {
    setIsClosing(true);
    setTimeout(() => { setSelectedApp(null); setIsClosing(false); }, 300);
  }

  // Keep drawer in sync when React Query refreshes the list
  useEffect(() => {
    if (!selectedApp) return;
    const fresh = applications.find(a => a.id === selectedApp.id);
    if (fresh) setSelectedApp(fresh);
  }, [applications]); // eslint-disable-line react-hooks/exhaustive-deps
  const [floatingMenu, setFloatingMenu] = useState<FloatingMenu>(null);
  const [appModal, setAppModal] = useState<{ mode: 'create' | 'edit' | 'link'; app?: Application } | null>(null);
  const [appForm, setAppForm] = useState<AppFormState>(EMPTY_FORM);

  // Close floating menu on outside click or scroll
  useEffect(() => {
    const close = () => setFloatingMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true); };
  }, []);

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(a =>
      a.jobTitle.toLowerCase().includes(q) || a.company.toLowerCase().includes(q)
    );
  }, [applications, search]);

  useEffect(() => {
    setPagination(p => ({ ...p, pageIndex: 0 }));
  }, [search]);

  const stats = useMemo(() => {
    const total        = applications.length;
    const interviewing = applications.filter(a => a.status === 'interviewing').length;
    const offers       = applications.filter(a => a.status === 'offer').length;
    const rejected     = applications.filter(a => a.status === 'rejected').length;
    const responseCount = applications.filter(a => a.status !== 'interested').length;
    const responseRate  = total > 0 ? Math.round((responseCount / total) * 100) : 0;
    return { total, interviewing, offers, rejected, responseCount, responseRate };
  }, [applications]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  function openCreate() {
    setAppForm({ ...EMPTY_FORM, appliedAt: new Date().toISOString().slice(0, 10) });
    setAppModal({ mode: 'create' });
  }

  function openEdit(app: Application) {
    setAppForm({
      jobTitle: app.jobTitle, company: app.company, status: app.status,
      appliedAt: app.appliedAt.slice(0, 10), notes: app.notes ?? '',
      analysisId: app.analysisId ? String(app.analysisId) : '',
      seniority: app.seniority ?? '', pay: app.pay ?? '',
      officeLocation: app.officeLocation ?? '', workSetting: app.workSetting ?? '',
      contractType: app.contractType ?? '', languagesRequired: app.languagesRequired ?? '',
      yearsOfExperience: app.yearsOfExperience ?? '', companyStage: app.companyStage ?? '',
    });
    setAppModal({ mode: 'edit', app });
  }

  function openLink(app: Application) {
    setAppForm({ ...EMPTY_FORM, jobTitle: app.jobTitle, company: app.company, status: app.status,
      appliedAt: app.appliedAt.slice(0, 10), analysisId: app.analysisId ? String(app.analysisId) : '' });
    setAppModal({ mode: 'link', app });
  }

  async function handleSubmit() {
    const orNull = (v: string) => v.trim() || null;
    const payload: ApplicationInput = {
      jobTitle: appForm.jobTitle, company: appForm.company, status: appForm.status,
      appliedAt: appForm.appliedAt, notes: appForm.notes || null,
      analysisId: appForm.analysisId ? parseInt(appForm.analysisId) : null,
      seniority: orNull(appForm.seniority), pay: orNull(appForm.pay),
      officeLocation: orNull(appForm.officeLocation), workSetting: orNull(appForm.workSetting),
      contractType: orNull(appForm.contractType), languagesRequired: orNull(appForm.languagesRequired),
      yearsOfExperience: orNull(appForm.yearsOfExperience), companyStage: orNull(appForm.companyStage),
    };
    if (appModal?.mode === 'create') {
      await onCreateApplication(payload);
    } else if (appModal?.mode === 'edit' && appModal.app) {
      await onUpdateApplication({ id: appModal.app.id, ...payload });
    } else if (appModal?.mode === 'link' && appModal.app) {
      await onUpdateApplication({ id: appModal.app.id, analysisId: payload.analysisId });
    }
    setAppModal(null);
  }

  // ── Column definitions ────────────────────────────────────────────────────

  const col = createColumnHelper<Application>();

  const columns = useMemo(() => [
    col.accessor('jobTitle', {
      header: 'Position',
      meta: { align: 'left', minW: '130px' },
      cell: info => <div className="font-mono text-[12px] font-bold text-rc-text truncate">{info.getValue()}</div>,
    }),
    col.accessor('company', {
      header: 'Company',
      meta: { align: 'left', minW: '100px' },
      cell: info => <div className="font-mono text-[12px] text-rc-muted truncate">{info.getValue()}</div>,
    }),
    col.accessor('status', {
      header: 'Status',
      cell: info => {
        const app = info.row.original;
        return (
          <button
            onClick={e => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setFloatingMenu(fm => fm?.type === 'status' && fm.id === app.id ? null : {
                type: 'status', id: app.id, app,
                x: rect.left, y: rect.bottom + 4,
              });
            }}
            className={`inline-flex items-center px-2 py-0.5 border rounded font-mono text-[11px] uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${STATUS_COLORS[app.status] ?? STATUS_COLORS.applied}`}
          >
            {STATUS_LABEL[app.status] ?? app.status}
          </button>
        );
      },
    }),
    col.accessor(row => row.analysis?.result?.score ?? null, {
      id: 'score', header: 'Score', sortUndefined: 'last',
      cell: info => {
        const score = info.getValue();
        if (typeof score !== 'number') return <span className="text-rc-muted font-mono text-[12px]">—</span>;
        return (
          <span className={`font-mono text-[12px] font-black ${score < 40 ? 'text-rc-green' : score < 70 ? 'text-rc-amber' : 'text-rc-red'}`}>
            {score}
          </span>
        );
      },
    }),
    col.accessor('seniority', {
      header: 'Seniority',
      cell: info => info.getValue() ? <Chip label={info.getValue()!} /> : <span className="text-rc-muted font-mono text-[12px]">—</span>,
    }),
    col.accessor('workSetting', {
      header: 'Remote',
      cell: info => {
        const v = info.getValue();
        if (!v) return <span className="text-rc-muted font-mono text-[12px]">—</span>;
        const cls = v === 'full-remote' ? 'bg-rc-green/5 border-rc-green/20 text-rc-green'
          : v === 'hybrid' ? 'bg-blue-50 border-blue-200 text-blue-600'
          : 'bg-rc-surface-raised border-rc-border text-rc-muted';
        return <Chip label={v} cls={cls} />;
      },
    }),
    col.accessor('contractType', {
      header: 'Contract',
      cell: info => info.getValue() ? <Chip label={info.getValue()!} /> : <span className="text-rc-muted font-mono text-[12px]">—</span>,
    }),
    col.accessor('pay', {
      header: 'Pay',
      cell: info => info.getValue()
        ? <span className="font-mono text-[12px] text-rc-green whitespace-nowrap">{info.getValue()}</span>
        : <span className="text-rc-muted font-mono text-[12px]">—</span>,
    }),
    col.accessor('officeLocation', {
      header: 'Location',
      cell: info => info.getValue()
        ? <span className="font-mono text-[12px] text-rc-text whitespace-nowrap">{info.getValue()}</span>
        : <span className="text-rc-muted font-mono text-[12px]">—</span>,
    }),
    col.accessor('appliedAt', {
      header: 'Applied',
      cell: info => (
        <span className="font-mono text-[12px] text-rc-muted whitespace-nowrap">
          {new Date(info.getValue()).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit', year: '2-digit' })}
        </span>
      ),
    }),
    col.display({
      id: 'actions', header: '',
      cell: ({ row }) => {
        const app = row.original;
        return (
          <button
            onClick={e => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setFloatingMenu(fm => fm?.type === 'app' && fm.id === app.id ? null : {
                type: 'app', id: app.id, app,
                x: rect.right, y: rect.bottom + 4,
              });
            }}
            className="p-1 rounded hover:bg-rc-surface-raised transition-colors text-rc-muted ml-auto block"
          >
            <MoreVertical size={14} />
          </button>
        );
      },
    }),
  ], [dateLocale]); // eslint-disable-line react-hooks/exhaustive-deps

  const table = useReactTable({
    data: filteredApplications,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const emptyRowCount = Math.max(0, PAGE_SIZE - rows.length);
  const colCount = columns.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-rc-muted">
          Applications ({stats.total})
        </span>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[rgba(0,0,0,0.1)] overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors ${
                viewMode === "table"
                  ? "bg-rc-red text-white"
                  : "bg-white text-rc-hint hover:text-rc-text"
              }`}
            >
              ☰ Table
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors border-l border-[rgba(0,0,0,0.1)] ${
                viewMode === "kanban"
                  ? "bg-rc-red text-white"
                  : "bg-white text-rc-hint hover:text-rc-text"
              }`}
            >
              ⬛ Kanban
            </button>
          </div>
          <button
            onClick={e => { e.stopPropagation(); openCreate(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rc-red text-white font-mono text-[10px] uppercase tracking-[0.12em] rounded-md hover:bg-rc-red/90 transition-colors"
          >
            <Plus size={12} /> Add Application
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-rc-muted pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by position or company…"
          className="w-full pl-8 pr-3 py-2 border border-rc-border rounded-lg font-mono text-[12px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40 placeholder:text-rc-muted/60"
        />
      </div>

      {/* Stats cards */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <div className="bg-[#faf9f7] border border-[rgba(0,0,0,0.06)] rounded-xl p-3 flex flex-col gap-1.5">
            <p className="font-mono text-[8px] tracking-widest uppercase text-rc-hint">Total</p>
            <p className="text-2xl font-black leading-none text-rc-text">{stats.total}</p>
            <p className="font-mono text-[8px] text-rc-hint">applications</p>
          </div>
          <div className="bg-[#faf9f7] border border-[rgba(0,0,0,0.06)] rounded-xl p-3 flex flex-col gap-1.5">
            <p className="font-mono text-[8px] tracking-widest uppercase text-rc-hint">Interviewing</p>
            <p className="text-2xl font-black leading-none text-rc-text">{stats.interviewing}</p>
            <p className="font-mono text-[8px] text-rc-hint">in progress</p>
          </div>
          <div className="bg-[#faf9f7] border border-[rgba(0,0,0,0.06)] rounded-xl p-3 flex flex-col gap-1.5">
            <p className="font-mono text-[8px] tracking-widest uppercase text-rc-hint">Offers</p>
            <p className="text-2xl font-black leading-none text-rc-text">{stats.offers}</p>
            <p className="font-mono text-[8px] text-rc-hint">received</p>
          </div>
          <div className="bg-[#faf9f7] border border-[rgba(0,0,0,0.06)] rounded-xl p-3 flex flex-col gap-1.5">
            <p className="font-mono text-[8px] tracking-widest uppercase text-rc-hint">Rejected</p>
            <p className="text-2xl font-black leading-none text-rc-text">{stats.rejected}</p>
            <p className="font-mono text-[8px] text-rc-hint">applications</p>
          </div>
          <div className="bg-[#faf9f7] border border-[rgba(0,0,0,0.06)] rounded-xl p-3 flex flex-col gap-1.5">
            <p className="font-mono text-[8px] tracking-widest uppercase text-rc-hint">Response rate</p>
            <p className="text-2xl font-black leading-none text-rc-text">{stats.responseRate}%</p>
            <p className="font-mono text-[8px] text-rc-hint">{stats.responseCount} / {stats.total}</p>
          </div>
        </div>
      )}

      {/* Table / Kanban toggle */}
      {viewMode === "kanban" ? (
        <KanbanView
          applications={applications}
          onStatusChange={(appId, newStatus) => {
            onUpdateApplication({ id: appId, status: newStatus });
          }}
          onCardClick={(app) => {
            setSelectedApp(app);
          }}
        />
      ) : (
      /* Table — no overflow wrapper so fixed-position menus aren't clipped */
      <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[8px]">
        <table className="w-full border-collapse table-auto">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-[rgba(0,0,0,0.06)]">
                {hg.headers.map(header => {
                  const meta = header.column.columnDef.meta as any;
                  const isLeft = meta?.align === 'left';
                  return (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={meta?.minW ? { minWidth: meta.minW } : undefined}
                      className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted select-none overflow-hidden text-ellipsis ${isLeft ? 'text-left' : 'text-center'} ${header.column.getCanSort() ? 'cursor-pointer hover:text-rc-text' : ''}`}
                    >
                      <span className={`inline-flex items-center gap-1 ${isLeft ? '' : 'justify-center'}`}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && <SortIcon sorted={header.column.getIsSorted()} />}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 && !applicationsLoading ? (
              /* Full empty-state spanning all columns */
              <tr>
                <td colSpan={colCount} style={{ height: ROW_HEIGHT * PAGE_SIZE }}>
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <div className="w-10 h-10 rounded-full bg-rc-red/5 border border-rc-red/10 flex items-center justify-center mb-3">
                      <Briefcase size={18} className="text-rc-red/50" />
                    </div>
                    <p className="font-mono text-[12px] text-rc-text mb-1">No applications tracked yet.</p>
                    <p className="font-mono text-[11px] text-rc-muted mb-5">Start logging your job search to stay organized.</p>
                    <button
                      onClick={e => { e.stopPropagation(); openCreate(); }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rc-red text-white font-mono text-[10px] uppercase tracking-[0.12em] rounded-md hover:bg-rc-red/90 transition-colors"
                    >
                      <Plus size={12} /> Add Application
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    style={{ height: ROW_HEIGHT }}
                    className={`border-b border-[rgba(0,0,0,0.04)] last:border-0 hover:bg-[rgba(0,0,0,0.035)] transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-[rgba(0,0,0,0.01)]' : ''}`}
                    onClick={() => setSelectedApp(row.original)}
                  >
                    {row.getVisibleCells().map(cell => {
                      const meta = cell.column.columnDef.meta as any;
                      const isLeft = meta?.align === 'left';
                      return (
                        <td
                          key={cell.id}
                          style={meta?.minW ? { minWidth: meta.minW } : undefined}
                          className={`px-4 align-middle overflow-hidden ${isLeft ? 'text-left' : 'text-center'}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Placeholder rows to maintain fixed height */}
                {Array.from({ length: emptyRowCount }).map((_, i) => (
                  <tr key={`empty-${i}`} style={{ height: ROW_HEIGHT }} className={`border-b border-[rgba(0,0,0,0.04)] last:border-0 ${(rows.length + i) % 2 === 1 ? 'bg-[rgba(0,0,0,0.01)]' : ''}`}>
                    <td colSpan={colCount} />
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(0,0,0,0.06)]">
          <span className="font-mono text-[10px] text-rc-muted">
            {filteredApplications.length === 0
              ? (search ? 'No results' : '0 applications')
              : `${pagination.pageIndex * PAGE_SIZE + 1}–${Math.min((pagination.pageIndex + 1) * PAGE_SIZE, filteredApplications.length)} of ${filteredApplications.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded font-mono text-[10px] text-rc-muted hover:bg-rc-surface-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-mono text-[10px] text-rc-muted px-2">
              {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded font-mono text-[10px] text-rc-muted hover:bg-rc-surface-raised disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
      )}{/* end table/kanban toggle */}
      </div>{/* end blur wrapper */}

      {/* ── Floating menus — fixed position, never clipped by table ── */}
      {floatingMenu?.type === 'status' && (
        <div
          className="fixed z-50 bg-white border border-rc-border rounded-lg shadow-lg py-1 min-w-[152px]"
          style={{ top: floatingMenu.y, left: floatingMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          {Object.entries(STATUS_LABEL).map(([val, label]) => (
            <button
              key={val}
              onClick={async () => { setFloatingMenu(null); await onUpdateApplication({ id: floatingMenu.id, status: val }); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] hover:bg-rc-surface-raised transition-colors ${floatingMenu.app.status === val ? 'font-bold' : ''}`}
            >
              <span className={`inline-flex px-1.5 py-0.5 border rounded text-[9px] uppercase tracking-wider ${STATUS_COLORS[val]}`}>{label}</span>
            </button>
          ))}
        </div>
      )}
      {floatingMenu?.type === 'app' && (
        <div
          className="fixed z-50 bg-white border border-rc-border rounded-lg shadow-lg py-1 min-w-[148px]"
          style={{ top: floatingMenu.y, right: `calc(100vw - ${floatingMenu.x}px)` }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => { openLink(floatingMenu.app); setFloatingMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-rc-text hover:bg-rc-surface-raised transition-colors">
            <LinkIcon size={11} /> Link Analysis
          </button>
          <button onClick={async () => { setFloatingMenu(null); await onDeleteApplication(floatingMenu.id); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] text-[#D94040] hover:bg-rc-surface-raised transition-colors">
            <Trash2 size={11} /> Delete
          </button>
        </div>
      )}

      {/* ── Add / Edit / Link Modal ── */}
      {appModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAppModal(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono text-[12px] uppercase tracking-[0.12em] text-rc-text font-bold mb-5">
              {appModal.mode === 'create' ? 'Add Application' : appModal.mode === 'link' ? 'Link Analysis' : 'Edit Application'}
            </h3>
            <div className="space-y-4">
              {appModal.mode !== 'link' && (
                <>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Job Title *</label>
                    <input type="text" value={appForm.jobTitle} onChange={e => setAppForm(f => ({ ...f, jobTitle: e.target.value }))} className="w-full border border-rc-border rounded-lg px-3 py-2 font-mono text-[12px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40" placeholder="Software Engineer" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Company *</label>
                    <input type="text" value={appForm.company} onChange={e => setAppForm(f => ({ ...f, company: e.target.value }))} className="w-full border border-rc-border rounded-lg px-3 py-2 font-mono text-[12px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40" placeholder="Acme Corp" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Status</label>
                    <select value={appForm.status} onChange={e => setAppForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-rc-border rounded-lg px-3 py-2 font-mono text-[12px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40">
                      <option value="interested">Interested</option>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Applied Date</label>
                    <input type="date" value={appForm.appliedAt} onChange={e => setAppForm(f => ({ ...f, appliedAt: e.target.value }))} className="w-full border border-rc-border rounded-lg px-3 py-2 font-mono text-[12px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Notes</label>
                    <textarea value={appForm.notes} onChange={e => setAppForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full border border-rc-border rounded-lg px-3 py-2 font-mono text-[12px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40 resize-none" placeholder="Optional notes..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Seniority</label>
                      <select value={appForm.seniority} onChange={e => setAppForm(f => ({ ...f, seniority: e.target.value }))} className="w-full border border-rc-border rounded-lg px-2 py-1.5 font-mono text-[11px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40">
                        <option value="">—</option>
                        <option value="junior">Junior</option>
                        <option value="junior-mid">Junior-Mid</option>
                        <option value="mid">Mid</option>
                        <option value="mid-senior">Mid-Senior</option>
                        <option value="senior">Senior</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Work Setting</label>
                      <select value={appForm.workSetting} onChange={e => setAppForm(f => ({ ...f, workSetting: e.target.value }))} className="w-full border border-rc-border rounded-lg px-2 py-1.5 font-mono text-[11px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40">
                        <option value="">—</option>
                        <option value="full-remote">Full Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="on-site">On Site</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Contract</label>
                      <select value={appForm.contractType} onChange={e => setAppForm(f => ({ ...f, contractType: e.target.value }))} className="w-full border border-rc-border rounded-lg px-2 py-1.5 font-mono text-[11px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40">
                        <option value="">—</option>
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="freelance">Freelance</option>
                        <option value="internship">Internship</option>
                        <option value="apprenticeship">Apprenticeship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Languages</label>
                      <select value={appForm.languagesRequired} onChange={e => setAppForm(f => ({ ...f, languagesRequired: e.target.value }))} className="w-full border border-rc-border rounded-lg px-2 py-1.5 font-mono text-[11px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40">
                        <option value="">—</option>
                        <option value="french-only">French only</option>
                        <option value="english-only">English only</option>
                        <option value="bilingual">Bilingual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Company Stage</label>
                      <select value={appForm.companyStage} onChange={e => setAppForm(f => ({ ...f, companyStage: e.target.value }))} className="w-full border border-rc-border rounded-lg px-2 py-1.5 font-mono text-[11px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40">
                        <option value="">—</option>
                        <option value="startup">Startup</option>
                        <option value="scale-up">Scale-up</option>
                        <option value="sme">SME / PME</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Exp. required</label>
                      <input type="text" value={appForm.yearsOfExperience} onChange={e => setAppForm(f => ({ ...f, yearsOfExperience: e.target.value }))} placeholder="ex: 3-5 ans" className="w-full border border-rc-border rounded-lg px-2 py-1.5 font-mono text-[11px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Pay</label>
                    <input type="text" value={appForm.pay} onChange={e => setAppForm(f => ({ ...f, pay: e.target.value }))} placeholder="ex: 45-55k€, TJM 600€" className="w-full border border-rc-border rounded-lg px-3 py-2 font-mono text-[12px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Office Location</label>
                    <input type="text" value={appForm.officeLocation} onChange={e => setAppForm(f => ({ ...f, officeLocation: e.target.value }))} placeholder="ex: Paris 8e" className="w-full border border-rc-border rounded-lg px-3 py-2 font-mono text-[12px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40" />
                  </div>
                </>
              )}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-rc-muted mb-1">Link Analysis</label>
                <select value={appForm.analysisId} onChange={e => setAppForm(f => ({ ...f, analysisId: e.target.value }))} className="w-full border border-rc-border rounded-lg px-3 py-2 font-mono text-[12px] text-rc-text bg-white focus:outline-none focus:border-rc-red/40">
                  <option value="">None</option>
                  {history.map(h => (
                    <option key={h.id} value={String(h.id)}>
                      {h.jobLabel || h.company || `Analysis #${h.id}`} — {new Date(h.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button onClick={() => setAppModal(null)} className="px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-rc-muted hover:text-rc-text transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={appModal.mode !== 'link' && (!appForm.jobTitle || !appForm.company)}
                className="px-4 py-2 bg-rc-red text-white font-mono text-[11px] uppercase tracking-[0.12em] rounded-lg hover:bg-rc-red/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {appModal.mode === 'create' ? 'Add' : appModal.mode === 'link' ? 'Link' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Side drawer ── */}
      {selectedApp && (
        <AppDrawer
          app={selectedApp}
          isClosing={isClosing}
          onClose={closeDrawer}
          onUpdateApplication={onUpdateApplication}
        />
      )}
    </>
  );
}
