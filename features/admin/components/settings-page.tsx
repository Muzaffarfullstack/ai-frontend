"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@/app/admin/settings.css";
import { useLocale } from "@/components/providers";
import type { AdminSettingsDTO, SettingsSectionKey } from "@/features/admin/types";
import { getAdminSettings } from "@/features/admin/api/settings.api";
import { AdminError, AdminPageHeader } from "./admin-kit";
import { SettingsInlineSuccess } from "./settings/shared";
import { GeneralTab } from "./settings/general-tab";
import { AuthTab } from "./settings/auth-tab";
import { LearningTab } from "./settings/learning-tab";
import { PaymentTab } from "./settings/payment-tab";
import { MediaTab } from "./settings/media-tab";
import { NotificationsTab } from "./settings/notifications-tab";
import { SecurityTab } from "./settings/security-tab";
import { IntegrationsTab } from "./settings/integrations-tab";

const TABS: Array<{ id: SettingsSectionKey | "integrations"; label: string }> = [
  { id: "general", label: "Umumiy" },
  { id: "auth", label: "Ro‘yxatdan o‘tish" },
  { id: "learning", label: "Ta’lim" },
  { id: "payment", label: "To‘lov" },
  { id: "media", label: "Media" },
  { id: "notifications", label: "Xabarnomalar" },
  { id: "security", label: "Xavfsizlik" },
  { id: "integrations", label: "Integratsiyalar" },
];

export default function SettingsPage() {
  const { t } = useLocale();
  const [data, setData] = useState<AdminSettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<string>("general");
  const [dirtyCounts, setDirtyCounts] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const saveHandlers = useRef<Record<string, () => Promise<boolean>>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setData(await getAdminSettings());
    } catch (reason) {
      setLoadError(String(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void reload());
  }, [reload]);

  const totalDirty = useMemo(
    () => Object.values(dirtyCounts).reduce((sum, count) => sum + count, 0),
    [dirtyCounts],
  );

  const registerSave = useCallback((tab: string) => {
    return (save: () => Promise<boolean>) => {
      saveHandlers.current[tab] = save;
      return () => {
        delete saveHandlers.current[tab];
      };
    };
  }, []);

  const handleDirtyChange = useCallback((tab: string, count: number) => {
    setDirtyCounts((prev) => ({ ...prev, [tab]: count }));
  }, []);

  const handleSaved = useCallback((sectionKey: keyof AdminSettingsDTO) => {
    return (updated: unknown) => {
      setData((prev) =>
        prev ? { ...prev, [sectionKey]: updated } : prev,
      );
    };
  }, []);

  // Warn before leaving the page while changes are unsaved.
  useEffect(() => {
    if (totalDirty === 0) return;
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [totalDirty]);

  function requestTabSwitch(tab: string) {
    if (tab === activeTab) return;
    if (dirtyCounts[activeTab] && dirtyCounts[activeTab] > 0) {
      setPendingTab(tab);
      return;
    }
    setActiveTab(tab);
  }

  function confirmTabSwitch() {
    // discard unsaved changes of the current tab by simply switching
    setDirtyCounts((prev) => ({ ...prev, [activeTab]: 0 }));
    setActiveTab(pendingTab ?? activeTab);
    setPendingTab(null);
  }

  async function saveCurrentTab() {
    const save = saveHandlers.current[activeTab];
    if (!save) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const ok = await save();
      if (ok) {
        setSaveMessage("Saqlash muvaffaqiyatli");
        setDirtyCounts((prev) => ({ ...prev, [activeTab]: 0 }));
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-skeleton-head">
          <div className="settings-skeleton settings-skeleton-eyebrow" />
          <div className="settings-skeleton settings-skeleton-title" />
          <div className="settings-skeleton settings-skeleton-subtitle" />
        </div>
        <div className="settings-skeleton-tabs">
          {TABS.map((tab) => (
            <div className="settings-skeleton settings-skeleton-tab" key={tab.id} />
          ))}
        </div>
        <div className="settings-skeleton-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="settings-skeleton settings-skeleton-card" key={index}>
              <div className="settings-skeleton settings-skeleton-line" />
              <div className="settings-skeleton settings-skeleton-line short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="settings-page">
        <AdminPageHeader
          eyebrow="SOZLAMALAR"
          title="Platforma sozlamalari"
          subtitle="Yuklashda xatolik yuz berdi."
        />
        <AdminError message={loadError} retry={() => void reload()} />
      </div>
    );
  }

  const isIntegrations = activeTab === "integrations";

  return (
    <div className="settings-page">
      <AdminPageHeader
        eyebrow="SOZLAMALAR"
        title="Platforma sozlamalari"
        subtitle="Platforma konfiguratsiyasi, integratsiyalar va xavfsizlikni boshqaring."
        action={
          !isIntegrations && (
            <div className="settings-save-group">
              {totalDirty > 0 && (
                <span className="settings-dirty-badge">
                  {totalDirty} ta saqlanmagan o‘zgarish
                </span>
              )}
              <button
                className="button button-primary"
                disabled={saving || totalDirty === 0}
                onClick={() => void saveCurrentTab()}
              >
                {saving ? "Saqlanmoqda…" : "O‘zgarishlarni saqlash"}
              </button>
            </div>
          )
        }
      />
      <SettingsInlineSuccess message={saveMessage} />

      <nav className="settings-tabs" aria-label="Sozlamalar bo‘limlari">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`settings-tab${activeTab === tab.id ? " active" : ""}`}
            onClick={() => requestTabSwitch(tab.id)}
          >
            <span>{tab.label}</span>
            {dirtyCounts[tab.id] ? (
              <i className="settings-tab-dot" aria-label="saqlanmagan o‘zgarishlar" />
            ) : null}
          </button>
        ))}
      </nav>

      {activeTab === "general" && (
        <GeneralTab
          initial={data.platform}
          t={t}
          registerSave={registerSave("general")}
          onDirtyChange={(count) => handleDirtyChange("general", count)}
          onSaved={handleSaved("platform")}
        />
      )}
      {activeTab === "auth" && (
        <AuthTab
          initial={data.auth}
          smsConfigured={data.providers.sms_configured}
          t={t}
          registerSave={registerSave("auth")}
          onDirtyChange={(count) => handleDirtyChange("auth", count)}
          onSaved={handleSaved("auth")}
        />
      )}
      {activeTab === "learning" && (
        <LearningTab
          initial={data.learning}
          t={t}
          registerSave={registerSave("learning")}
          onDirtyChange={(count) => handleDirtyChange("learning", count)}
          onSaved={handleSaved("learning")}
        />
      )}
      {activeTab === "payment" && (
        <PaymentTab
          initial={data.payment}
          t={t}
          registerSave={registerSave("payment")}
          onDirtyChange={(count) => handleDirtyChange("payment", count)}
          onSaved={handleSaved("payment")}
        />
      )}
      {activeTab === "media" && (
        <MediaTab
          initial={data.media}
          providers={data.providers}
          readinessPercent={data.media_readiness_percent}
          t={t}
          registerSave={registerSave("media")}
          onDirtyChange={(count) => handleDirtyChange("media", count)}
          onSaved={handleSaved("media")}
        />
      )}
      {activeTab === "notifications" && (
        <NotificationsTab
          initial={data.notifications}
          providers={data.providers}
          t={t}
          registerSave={registerSave("notifications")}
          onDirtyChange={(count) => handleDirtyChange("notifications", count)}
          onSaved={handleSaved("notifications")}
        />
      )}
      {activeTab === "security" && (
        <SecurityTab
          initial={data.security}
          t={t}
          registerSave={registerSave("security")}
          onDirtyChange={(count) => handleDirtyChange("security", count)}
          onSaved={handleSaved("security")}
        />
      )}
      {activeTab === "integrations" && (
        <IntegrationsTab
          flags={data.feature_flags}
          environment={data.environment}
          t={t}
          onFlagsChanged={(flags) =>
            setData((prev) => (prev ? { ...prev, feature_flags: flags } : prev))
          }
        />
      )}

      {pendingTab !== null && (
        <div className="settings-confirm-backdrop" role="presentation">
          <div className="settings-confirm" role="dialog" aria-modal="true">
            <h3>Saqlanmagan o‘zgarishlar mavjud</h3>
            <p>
              Boshqa bo‘limga o‘tsangiz, joriy o‘zgarishlar yo‘qoladi. Davom
              etasizmi?
            </p>
            <div className="settings-confirm-actions">
              <button className="button button-ghost" onClick={() => setPendingTab(null)}>
                Bekor qilish
              </button>
              <button className="button button-primary" onClick={confirmTabSwitch}>
                O‘tish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
