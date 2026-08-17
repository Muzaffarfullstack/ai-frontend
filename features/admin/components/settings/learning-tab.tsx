"use client";

import { useEffect, useState } from "react";
import { localizedApiError, type Translate } from "@/lib/api-client";
import { patchLearningSettings } from "@/features/admin/api/settings.api";
import type { LearningSettingsDTO } from "@/features/admin/types";
import {
  SettingsInlineError,
  SettingsNumberField,
  SettingsSection,
  SettingsSelect,
  SettingsSwitch,
  SettingsTextField,
  dirtyFieldCount,
} from "./shared";

const LANGUAGE_OPTIONS: Array<[string, string]> = [
  ["uz", "O‘zbek"],
  ["ru", "Rus"],
  ["en", "English"],
];
const STATUS_OPTIONS: Array<[string, string]> = [
  ["draft", "Qoralama"],
  ["published", "Nashr etilgan"],
];
const CATALOG_OPTIONS: Array<[string, string]> = [
  ["newest", "Eng yangi avval"],
  ["oldest", "Eng eski avval"],
  ["popular", "Mashhurlik bo‘yicha"],
  ["position", "Qo‘lda tartiblash"],
];

export function LearningTab({
  initial,
  t,
  registerSave,
  onDirtyChange,
  onSaved,
}: {
  initial: LearningSettingsDTO;
  t: Translate;
  registerSave: (save: () => Promise<boolean>) => () => void;
  onDirtyChange: (count: number) => void;
  onSaved: (updated: LearningSettingsDTO) => void;
}) {
  const [form, setForm] = useState({
    default_language: initial.default_language,
    default_status: initial.default_status,
    default_level: initial.default_level,
    default_catalog_order: initial.default_catalog_order,
    min_lessons_per_section: String(initial.min_lessons_per_section),
    drag_and_drop_enabled: initial.drag_and_drop_enabled,
    progress_threshold_percent: String(initial.progress_threshold_percent),
    lesson_points: String(initial.lesson_points),
    assignment_points: String(initial.assignment_points),
  });
  const [error, setError] = useState("");

  useEffect(() => {
    onDirtyChange(dirtyFieldCount(initial, form));
  }, [form, initial, onDirtyChange]);

  useEffect(
    () =>
      registerSave(async () => {
        setError("");
        try {
          const updated = await patchLearningSettings({
            default_language: form.default_language,
            default_status: form.default_status,
            default_level: form.default_level.trim() || initial.default_level,
            default_catalog_order: form.default_catalog_order,
            min_lessons_per_section: Number(form.min_lessons_per_section),
            drag_and_drop_enabled: form.drag_and_drop_enabled,
            progress_threshold_percent: Number(form.progress_threshold_percent),
            lesson_points: Number(form.lesson_points),
            assignment_points: Number(form.assignment_points),
          });
          onSaved(updated);
          return true;
        } catch (reason) {
          setError(localizedApiError(reason, t));
          return false;
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, initial, onSaved, registerSave],
  );

  function patch(partial: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  return (
    <>
      <SettingsInlineError message={error} />
      <SettingsSection
        title="Kurs standartlari"
        subtitle="Yangi kurslar uchun boshlang‘ich qiymatlar."
      >
        <div className="settings-form-grid">
          <SettingsSelect
            label="Til"
            value={form.default_language}
            options={LANGUAGE_OPTIONS}
            onChange={(default_language) => patch({ default_language })}
          />
          <SettingsSelect
            label="Holat"
            value={form.default_status}
            options={STATUS_OPTIONS}
            onChange={(default_status) => patch({ default_status })}
          />
          <SettingsTextField
            label="Daraja"
            value={form.default_level}
            onChange={(default_level) => patch({ default_level })}
            placeholder="boshlang‘ich"
          />
          <SettingsSelect
            label="Katalog tartibi (saralash)"
            value={form.default_catalog_order}
            options={CATALOG_OPTIONS}
            onChange={(default_catalog_order) =>
              patch({ default_catalog_order })
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Curriculum qoidalari"
        subtitle="Kurs tarkibiga qo‘llanadigan majburiy qoidalar."
      >
        <div className="settings-form-grid">
          <SettingsNumberField
            label="Har bir bo‘limda kamida darslar soni"
            value={form.min_lessons_per_section}
            min={1}
            max={50}
            onChange={(min_lessons_per_section) =>
              patch({ min_lessons_per_section })
            }
          />
        </div>
        <div className="settings-switch-list">
          <SettingsSwitch
            label="Drag-and-drop tartiblash"
            description="Bo‘lim va darslarni sudrab tartiblash imkoniyati"
            checked={form.drag_and_drop_enabled}
            onChange={(drag_and_drop_enabled) =>
              patch({ drag_and_drop_enabled })
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Progress yakunlash"
        subtitle="Darsni yakunlangan deb hisoblash qoidasi."
      >
        <div className="settings-form-grid">
          <SettingsNumberField
            label="Yakunlash chegarasi (%)"
            value={form.progress_threshold_percent}
            min={1}
            max={100}
            suffix="%"
            onChange={(progress_threshold_percent) =>
              patch({ progress_threshold_percent })
            }
          />
        </div>
        <p className="settings-hint">
          Talaba videoning shu foizini ko‘rmaguncha dars yakunlanmaydi.
        </p>
      </SettingsSection>

      <SettingsSection
        title="Ball va reyting"
        subtitle="Reyting jadvalida beriladigan ballar."
      >
        <div className="settings-form-grid">
          <SettingsNumberField
            label="Dars uchun ball"
            value={form.lesson_points}
            min={0}
            max={1000}
            suffix="ball"
            onChange={(lesson_points) => patch({ lesson_points })}
          />
          <SettingsNumberField
            label="Topshiriq uchun ball"
            value={form.assignment_points}
            min={0}
            max={1000}
            suffix="ball"
            onChange={(assignment_points) => patch({ assignment_points })}
          />
        </div>
      </SettingsSection>
    </>
  );
}
