"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import type { Application } from "../../lib/queries";

const COLUMNS: { id: string; label: string }[] = [
  { id: "interested",   label: "Intéressé" },
  { id: "applied",      label: "Candidaté" },
  { id: "interviewing", label: "Entretiens" },
  { id: "offer",        label: "Offre" },
  { id: "rejected",     label: "Refusé" },
];

const STATUS_COLORS: Record<string, string> = {
  interested:   "border-l-[#6b6860]",
  applied:      "border-l-[#3b82f6]",
  interviewing: "border-l-[#7c3aed]",
  offer:        "border-l-[#22c55e]",
  rejected:     "border-l-[#ef4444]",
};

function getScoreClass(score: number) {
  if (score < 40) return "text-rc-green border-rc-green/30 bg-rc-green/5";
  if (score < 70) return "text-rc-amber border-rc-amber/40 bg-rc-amber/5";
  return "text-rc-red border-rc-red/30 bg-rc-red/5";
}

function KanbanCard({
  app,
  onClick,
}: {
  app: Application;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(app.id),
  });

  const score = (app as any).analysis?.result?.score ?? null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      className={`bg-white border border-[rgba(0,0,0,0.08)] border-l-4 ${STATUS_COLORS[app.status] ?? "border-l-transparent"} rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${isDragging ? "opacity-50" : ""}`}
    >
      <p className="font-semibold text-[12px] text-rc-text truncate">{app.jobTitle}</p>
      <p className="font-mono text-[10px] text-rc-hint truncate">{app.company}</p>
      {score !== null && (
        <div className="mt-2">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border font-black text-[11px] ${getScoreClass(score)}`}>
            {score}
          </span>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  apps,
  onCardClick,
}: {
  column: { id: string; label: string };
  apps: Application[];
  onCardClick: (app: Application) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col gap-2 min-w-[200px] flex-1">
      <div className="flex items-center justify-between mb-1">
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-hint font-bold">
          {column.label}
        </p>
        <span className="w-5 h-5 rounded-full bg-[#f0ede9] flex items-center justify-center font-mono text-[10px] text-rc-hint">
          {apps.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[120px] rounded-xl p-2 transition-colors ${isOver ? "bg-rc-red/5 border border-dashed border-rc-red/30" : "bg-[#faf9f7]"}`}
      >
        {apps.map((app) => (
          <KanbanCard key={app.id} app={app} onClick={() => onCardClick(app)} />
        ))}
      </div>
    </div>
  );
}

export function KanbanView({
  applications,
  onStatusChange,
  onCardClick,
}: {
  applications: Application[];
  onStatusChange: (appId: number, newStatus: string) => void;
  onCardClick: (app: Application) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeApp = activeId
    ? applications.find((a) => String(a.id) === activeId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const appId = Number(active.id);
    const newStatus = String(over.id);
    const app = applications.find((a) => a.id === appId);
    if (app && app.status !== newStatus && COLUMNS.some((c) => c.id === newStatus)) {
      onStatusChange(appId, newStatus);
    }
  }

  const byStatus = (status: string) =>
    applications.filter((a) => a.status === status);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            apps={byStatus(col.id)}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeApp && (
          <div className={`bg-white border border-[rgba(0,0,0,0.08)] border-l-4 ${STATUS_COLORS[activeApp.status] ?? ""} rounded-lg p-3 shadow-xl opacity-90 w-[200px]`}>
            <p className="font-semibold text-[12px] text-rc-text truncate">{activeApp.jobTitle}</p>
            <p className="font-mono text-[10px] text-rc-hint truncate">{activeApp.company}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
