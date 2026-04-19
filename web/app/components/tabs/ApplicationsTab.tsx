"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, X, ChevronRight, Pencil, MoreVertical, Trash2, ExternalLink } from "lucide-react";
import type { Application } from "../../../lib/queries";
import { useApplications } from "../../../lib/queries";
import { useCreateApplication, useUpdateApplication, useDeleteApplication } from "../../../lib/mutations";

const STATUS_OPTIONS = [
  { value: "interested", label: "Interested" },
  { value: "applied",    label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer",      label: "Offer" },
  { value: "rejected",   label: "Rejected" },
];

const STATUS_COLORS: Record<string, string> = {
  interested:   "text-purple-600 border-purple-400/40 bg-purple-50",
  applied:      "text-amber-600 border-amber-400/40 bg-amber-50",
  interviewing: "text-blue-600 border-blue-400/40 bg-blue-50",
  offer:        "text-green-600 border-green-400/40 bg-green-50",
  rejected:     "text-[#D94040] border-[#D94040]/30 bg-[#D94040]/5",
};

function getScoreColor(score: number) {
  if (score < 40) return "border-green-300/40 text-green-700 bg-green-50";
  if (score < 70) return "border-amber-400/40 text-amber-600 bg-amber-50";
  return "border-[#D94040]/30 text-[#D94040] bg-[#D94040]/5";
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

type ModalState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; app: Application };

interface AppDrawerProps {
  app: Application;
  lang: string;
  onClose: () => void;
  onUpdate: (data: { id: number } & Record<string, any>) => void;
  onDelete: (id: number) => void;
}

function AppDrawer({ app, lang, onClose, onUpdate, onDelete }: AppDrawerProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [notes, setNotes] = useState(app.notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const dateLocale = lang === "fr" ? "fr-FR" : "en-US";
  const score = app.analysis?.result?.score as number | undefined;

  const close = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [close]);

  useEffect(() => {
    setNotes(app.notes ?? "");
  }, [app.id]);

  function saveField(field: string, value: any) {
    onUpdate({ id: app.id, [field]: value });
    setEditingField(null);
  }

  function FieldRow({
    label,
    field,
    value,
    display,
    children,
  }: {
    label: string;
    field: string;
    value: any;
    display?: React.ReactNode;
    children: React.ReactNode;
  }) {
    const isEditing = editingField === field;
    return (
      <div className="space-y-1">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">{label}</p>
        {isEditing ? (
          <div>{children}</div>
        ) : (
          <div
            className="group flex items-center gap-1.5 cursor-pointer"
            onClick={() => setEditingField(field)}
          >
            <span className="text-[13px] text-gray-800">{display ?? value ?? <span className="text-gray-400 italic">—</span>}</span>
            <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 backdrop-blur-[2px] bg-black/10 transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
        onClick={close}
      />
      <div
        ref={drawerRef}
        style={{ transition: "transform 300ms cubic-bezier(0.32,0.72,0,1)" }}
        className={`fixed right-0 top-0 h-full w-full max-w-[480px] bg-white border-l border-[rgba(0,0,0,0.08)] shadow-2xl z-50 flex flex-col overflow-hidden ${isClosing ? "translate-x-full" : "translate-x-0"}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[rgba(0,0,0,0.06)]">
          <div>
            <h2 className="font-bold text-[16px] text-gray-900 leading-tight">{app.jobTitle}</h2>
            <p className="font-mono text-[11px] text-gray-500 mt-0.5">{app.company}</p>
          </div>
          <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Status */}
          <FieldRow label="Status" field="status" value={app.status}
            display={
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[app.status] ?? ""}`}>
                {STATUS_OPTIONS.find(s => s.value === app.status)?.label ?? app.status}
              </span>
            }>
            <select
              autoFocus
              defaultValue={app.status}
              onChange={e => saveField("status", e.target.value)}
              onBlur={() => setEditingField(null)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#D94040]/50"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </FieldRow>

          {/* Applied date */}
          <FieldRow label="Applied" field="appliedAt" value={app.appliedAt}
            display={<span>{formatDate(app.appliedAt, dateLocale)}</span>}
          >
            <input
              type="date"
              autoFocus
              defaultValue={app.appliedAt.slice(0, 10)}
              onBlur={e => saveField("appliedAt", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-[#D94040]/50"
            />
          </FieldRow>

          {/* Score */}
          {score !== undefined && (
            <div className="space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Rejection Risk</p>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[11px] px-2 py-0.5 rounded-full border ${getScoreColor(score)}`}>
                  {score}%
                </span>
                {app.analysisId && (
                  <a
                    href={`/${lang}/analyze?id=${app.analysisId}`}
                    className="font-mono text-[10px] text-gray-400 hover:text-[#D94040] transition-colors flex items-center gap-1 no-underline"
                  >
                    View analysis <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => onUpdate({ id: app.id, notes })}
              placeholder="Add notes about this application…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#D94040]/50 resize-none min-h-[100px] placeholder:text-gray-300"
            />
          </div>

          {/* Job description */}
          {app.analysis?.result?.jobDescription || (app as any).jobDescription ? (
            <div className="space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Job Description</p>
              <p className="text-[12px] text-gray-600 whitespace-pre-line leading-relaxed max-h-[200px] overflow-y-auto">
                {(app as any).jobDescription ?? "See analysis for full details."}
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[rgba(0,0,0,0.06)]">
          {confirmDelete ? (
            <div className="flex items-center gap-3">
              <p className="text-[12px] text-gray-600 flex-1">Delete this application?</p>
              <button
                onClick={() => { onDelete(app.id); close(); }}
                className="px-3 py-1.5 rounded-lg bg-[#D94040] text-white font-mono text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 font-mono text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[#D94040]/30 text-[#D94040] font-mono text-[10px] uppercase tracking-widest hover:bg-[#D94040]/5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete application
            </button>
          )}
        </div>
      </div>
    </>
  );
}

interface AddEditModalProps {
  initial?: Application;
  onClose: () => void;
  onSave: (data: any) => void;
}

function AddEditModal({ initial, onClose, onSave }: AddEditModalProps) {
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [status, setStatus] = useState(initial?.status ?? "interested");
  const [appliedAt, setAppliedAt] = useState(
    initial?.appliedAt ? initial.appliedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobTitle.trim() || !company.trim()) return;
    onSave({ jobTitle: jobTitle.trim(), company: company.trim(), status, appliedAt, notes });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[440px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[14px]">{initial ? "Edit Application" : "Add Application"}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Position *</label>
            <input
              required
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="Frontend Engineer"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#D94040]/50"
            />
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Company *</label>
            <input
              required
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Acme Corp"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#D94040]/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#D94040]/50"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Applied date</label>
              <input
                type="date"
                value={appliedAt}
                onChange={e => setAppliedAt(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#D94040]/50"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes…"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-[#D94040]/50 resize-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#D94040] text-white font-mono text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            {initial ? "Save changes" : "Add application"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function ApplicationsTab({ lang }: { lang: string }) {
  const { data: apps = [], isLoading } = useApplications();
  const createApp = useCreateApplication();
  const updateApp = useUpdateApplication();
  const deleteApp = useDeleteApplication();

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [drawerApp, setDrawerApp] = useState<Application | null>(null);

  const dateLocale = lang === "fr" ? "fr-FR" : "en-US";

  const filtered = apps.filter(app => {
    const q = search.toLowerCase();
    return (
      app.jobTitle.toLowerCase().includes(q) ||
      app.company.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: apps.length,
    interviewing: apps.filter(a => a.status === "interviewing").length,
    offers: apps.filter(a => a.status === "offer").length,
    rejected: apps.filter(a => a.status === "rejected").length,
  };

  function handleSave(data: any) {
    if (modal.type === "edit") {
      updateApp.mutate({ id: modal.app.id, ...data });
    } else {
      createApp.mutate(data);
    }
  }

  function handleUpdate(data: { id: number } & Record<string, any>) {
    const { id, ...rest } = data;
    updateApp.mutate({ id, ...rest });
    // optimistically update drawer
    if (drawerApp?.id === id) {
      setDrawerApp(prev => prev ? { ...prev, ...rest } : prev);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-[#D94040] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400">
            Applications ({apps.length})
          </p>
          {apps.length > 0 && (
            <p className="font-mono text-[10px] text-gray-400 mt-1">
              Total: {stats.total} · Interviewing: {stats.interviewing} · Offers: {stats.offers} · Rejected: {stats.rejected}
            </p>
          )}
        </div>
        <button
          onClick={() => setModal({ type: "add" })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white font-mono text-[10px] uppercase tracking-widest text-gray-600 hover:border-[#D94040]/40 hover:text-[#D94040] transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Search */}
      {apps.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter by position or company…"
            className="w-full pl-9 pr-4 py-2 border border-[rgba(0,0,0,0.08)] rounded-xl bg-white text-[13px] outline-none focus:border-[#D94040]/40 placeholder:text-gray-300"
          />
        </div>
      )}

      {/* Empty state */}
      {apps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <p className="text-[14px] font-semibold text-gray-700">No applications tracked yet.</p>
          <p className="text-[13px] text-gray-400">Start logging your job search to stay organized.</p>
          <button
            onClick={() => setModal({ type: "add" })}
            className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D94040] text-white font-mono text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" /> Add Application
          </button>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl overflow-hidden">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-[rgba(0,0,0,0.06)]">
                <th className="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Position</th>
                <th className="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Company</th>
                <th className="px-4 py-3 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Status</th>
                <th className="px-4 py-3 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Score</th>
                <th className="px-4 py-3 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Applied</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app, i) => {
                const score = app.analysis?.result?.score as number | undefined;
                return (
                  <tr
                    key={app.id}
                    onClick={() => setDrawerApp(app)}
                    className={`cursor-pointer transition-colors hover:bg-gray-50/70 ${i < filtered.length - 1 ? "border-b border-[rgba(0,0,0,0.05)]" : ""}`}
                  >
                    <td className="px-4 py-3 min-w-[130px] max-w-[200px]">
                      <div className="truncate text-[12px] font-semibold text-gray-800">{app.jobTitle}</div>
                    </td>
                    <td className="px-4 py-3 min-w-[100px] max-w-[160px]">
                      <div className="truncate text-[12px] text-gray-600">{app.company}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex font-mono text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_COLORS[app.status] ?? ""}`}>
                        {STATUS_OPTIONS.find(s => s.value === app.status)?.label ?? app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {score !== undefined ? (
                        <span className={`inline-flex font-mono text-[10px] px-2 py-0.5 rounded-full border ${getScoreColor(score)}`}>
                          {score}%
                        </span>
                      ) : (
                        <span className="text-gray-300 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      {formatDate(app.appliedAt, dateLocale)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {search && filtered.length === 0 && apps.length > 0 && (
        <p className="text-center text-[13px] text-gray-400 py-8">No results for "{search}"</p>
      )}

      {/* Side drawer */}
      {drawerApp && (
        <AppDrawer
          app={drawerApp}
          lang={lang}
          onClose={() => setDrawerApp(null)}
          onUpdate={handleUpdate}
          onDelete={id => { deleteApp.mutate(id); setDrawerApp(null); }}
        />
      )}

      {/* Add/Edit modal */}
      {modal.type !== "none" && (
        <AddEditModal
          initial={modal.type === "edit" ? modal.app : undefined}
          onClose={() => setModal({ type: "none" })}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
