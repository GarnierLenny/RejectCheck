"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Trash2,
  Plus,
  LogOut,
  AlertTriangle,
  CreditCard,
  Eye,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Heading, FieldLabel, Caption, Text } from "../typography";
import { Button } from "../Button";
import { PdfPreviewModal } from "../PdfPreviewModal";
import { createClient } from "../../../lib/supabase";
import { useLanguage } from "../../../context/language";
import { useSavedCvs } from "../../../lib/queries";
import {
  useCreatePortalSession,
  useDeleteAccount,
  useAddSavedCv,
  useDeleteSavedCv,
} from "../../../lib/mutations";
import type { Subscription, SavedCv } from "../../../lib/queries";

export function AccountSettings({
  subscription,
  session,
  onSignOut,
  lang,
}: {
  subscription: Subscription | null;
  session: Session | null;
  onSignOut: () => void;
  lang: string;
}) {
  const { t } = useLanguage();
  const supabase = createClient();
  const portalSession = useCreatePortalSession();
  const deleteAccount = useDeleteAccount();
  const addSavedCv = useAddSavedCv();
  const deleteSavedCv = useDeleteSavedCv();
  const { data: savedCvs = [] } = useSavedCvs();

  const userId = session?.user?.id;
  const email = session?.user?.email ?? "";

  const [cvUploading, setCvUploading] = useState(false);
  const cvRef = useRef<HTMLInputElement>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<{ url: string; name: string } | null>(null);

  async function handleCvUpload(file: File) {
    if (!userId) return;
    setCvUploading(true);
    try {
      const path = `${userId}/cvs/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("user-profiles")
        .upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from("user-profiles")
        .getPublicUrl(path);
      await addSavedCv.mutateAsync({ name: file.name, url: publicUrl });
    } finally {
      setCvUploading(false);
      if (cvRef.current) cvRef.current.value = "";
    }
  }

  async function handleDeleteAccount() {
    await deleteAccount.mutateAsync();
    await supabase.auth.signOut();
    window.location.href = `/${lang}`;
  }

  const isActive = subscription?.status === "active";
  const planLabel = subscription?.plan?.toUpperCase() ?? "FREE";
  const dateLocale = lang === "fr" ? "fr-FR" : "en-GB";

  return (
    <>
      {previewPdf && (
        <PdfPreviewModal
          url={previewPdf.url}
          name={previewPdf.name}
          onClose={() => setPreviewPdf(null)}
        />
      )}

      <div className="flex flex-col gap-8 max-w-[640px]">
        <header className="border-b border-rc-border pb-4">
          <Heading as="h2" size="lg">{t.settingsTab.account.title}</Heading>
          <Caption as="p" className="block mt-1">
            {t.settingsTab.account.description}
          </Caption>
        </header>

        {/* Email */}
        <div>
          <FieldLabel className="block mb-1.5">{t.settingsTab.account.email}</FieldLabel>
          <code className="block bg-rc-bg border border-rc-border rounded-md px-3 py-2 text-[14px] font-mono text-rc-muted">
            {email}
          </code>
        </div>

        {/* Subscription */}
        <div className="border border-rc-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={14} className="text-rc-muted" />
            <Heading as="h3">{t.settingsTab.account.subscription}</Heading>
          </div>
          <div className="flex items-center justify-between mb-3">
            <Text weight="medium">{planLabel}</Text>
            <span
              className={`text-[12px] leading-4 font-medium px-2 py-0.5 rounded-md border ${
                isActive
                  ? "border-rc-green/30 text-rc-green bg-rc-green/5"
                  : "border-rc-border text-rc-muted"
              }`}
            >
              {isActive ? t.settingsTab.account.active : t.settingsTab.account.inactive}
            </span>
          </div>
          {subscription?.currentPeriodEnd && (
            <Caption as="p" className="block mb-3">
              {t.settingsTab.account.renews}{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString(dateLocale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Caption>
          )}
          {isActive ? (
            <Button
              variant="default"
              block
              onClick={() => portalSession.mutate()}
              loading={portalSession.isPending}
            >
              {portalSession.isPending ? t.settingsTab.account.redirecting : t.settingsTab.account.manageBilling}
            </Button>
          ) : (
            <Button
              as={Link}
              href={`/${lang}/pricing`}
              variant="default"
              block
              className="!text-rc-red !border-rc-red/40 hover:!bg-rc-red/5 hover:!border-rc-red/60 no-underline"
            >
              {t.settingsTab.account.upgradePlan}
            </Button>
          )}
        </div>

        {/* Saved CVs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Heading as="h3">{t.settingsTab.account.savedCvs}</Heading>
            <Button
              variant="default"
              size="sm"
              leadingIcon={<Plus size={14} />}
              onClick={() => cvRef.current?.click()}
              loading={cvUploading}
            >
              {t.settingsTab.account.addCv}
            </Button>
            <input
              ref={cvRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCvUpload(f);
              }}
            />
          </div>
          {savedCvs.length === 0 ? (
            <Caption as="p" tone="subtle" className="block py-2">{t.settingsTab.account.noCvsYet}</Caption>
          ) : (
            <div className="flex flex-col gap-1.5">
              {savedCvs.map((cv: SavedCv) => (
                <div
                  key={cv.id}
                  className="flex items-center gap-2 px-3 py-2 bg-rc-bg border border-rc-border rounded-md"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,58,57,0.6)" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <Text className="flex-1 truncate">{cv.name}</Text>
                  <button
                    onClick={() => setPreviewPdf({ url: cv.url, name: cv.name })}
                    className="text-rc-hint hover:text-rc-text transition-colors"
                    aria-label={t.settingsTab.account.preview}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => deleteSavedCv.mutate(cv.id)}
                    className="text-rc-hint hover:text-rc-red transition-colors"
                    aria-label={t.settingsTab.account.delete}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="border-t border-rc-border pt-6">
          <Heading as="h3" className="mb-4">{t.settingsTab.account.accountActions}</Heading>
          <Button
            variant="default"
            block
            leadingIcon={<LogOut size={14} />}
            onClick={onSignOut}
            className="mb-2"
          >
            {t.settingsTab.account.signOut}
          </Button>
          {!confirmDelete ? (
            <Button
              variant="danger"
              block
              leadingIcon={<Trash2 size={14} />}
              onClick={() => setConfirmDelete(true)}
            >
              {t.settingsTab.account.deleteAccount}
            </Button>
          ) : (
            <div className="border border-rc-red/30 rounded-md p-3 bg-rc-red/[0.03]">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={14} className="text-rc-red" />
                <Caption tone="red" className="font-medium">{t.settingsTab.account.deleteWarning}</Caption>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  filled
                  size="sm"
                  className="flex-1"
                  onClick={handleDeleteAccount}
                  loading={deleteAccount.isPending}
                >
                  {deleteAccount.isPending ? t.settingsTab.account.deleting : t.settingsTab.account.confirm}
                </Button>
                <Button variant="default" size="sm" onClick={() => setConfirmDelete(false)}>
                  {t.settingsTab.account.cancel}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
