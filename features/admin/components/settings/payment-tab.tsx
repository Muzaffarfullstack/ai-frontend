"use client";

import { useEffect, useState } from "react";
import { localizedApiError, type Translate } from "@/lib/api-client";
import { patchPaymentSettings } from "@/features/admin/api/settings.api";
import type { PaymentSettingsDTO } from "@/features/admin/types";
import {
  SettingsInlineError,
  SettingsSection,
  SettingsSelect,
  SettingsSwitch,
  SettingsTextField,
  dirtyFieldCount,
} from "./shared";

const CURRENCY_OPTIONS: Array<[string, string]> = [
  ["UZS", "UZS — O‘zbek so‘mi"],
  ["USD", "USD — AQSh dollari"],
];

export function PaymentTab({
  initial,
  t,
  registerSave,
  onDirtyChange,
  onSaved,
}: {
  initial: PaymentSettingsDTO;
  t: Translate;
  registerSave: (save: () => Promise<boolean>) => () => void;
  onDirtyChange: (count: number) => void;
  onSaved: (updated: PaymentSettingsDTO) => void;
}) {
  const [form, setForm] = useState({
    currency: initial.currency,
    payment_method: initial.payment_method,
    enable_installments: initial.enable_installments,
    installment_1: String(initial.installment_percentages[0] ?? 33),
    installment_2: String(initial.installment_percentages[1] ?? 33),
    installment_3: String(initial.installment_percentages[2] ?? 33),
    part2_requires_part1: Boolean(
      initial.installment_part_conditions.part2_requires_part1,
    ),
    part3_requires_part2: Boolean(
      initial.installment_part_conditions.part3_requires_part2,
    ),
    payment_account_number: initial.payment_account_number ?? "",
    payment_company_name: initial.payment_company_name ?? "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const comparison = {
      currency: initial.currency,
      payment_method: initial.payment_method,
      enable_installments: initial.enable_installments,
      installment_1: initial.installment_percentages[0] ?? 33,
      installment_2: initial.installment_percentages[1] ?? 33,
      installment_3: initial.installment_percentages[2] ?? 33,
      part2_requires_part1: initial.installment_part_conditions.part2_requires_part1,
      part3_requires_part2: initial.installment_part_conditions.part3_requires_part2,
      payment_account_number: initial.payment_account_number ?? "",
      payment_company_name: initial.payment_company_name ?? "",
    };
    onDirtyChange(dirtyFieldCount(comparison, form));
  }, [form, initial, onDirtyChange]);

  useEffect(
    () =>
      registerSave(async () => {
        setError("");
        try {
          const percentages = [
            Number(form.installment_1),
            Number(form.installment_2),
            Number(form.installment_3),
          ];
          const updated = await patchPaymentSettings({
            currency: form.currency,
            payment_method: form.payment_method,
            enable_installments: form.enable_installments,
            installment_count: 3,
            installment_percentages: percentages,
            installment_part_conditions: {
              part2_requires_part1: form.part2_requires_part1,
              part3_requires_part2: form.part3_requires_part2,
            },
            payment_account_number: form.payment_account_number.trim() || null,
            payment_company_name: form.payment_company_name.trim() || null,
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

  const percentageSum =
    Number(form.installment_1 || 0) +
    Number(form.installment_2 || 0) +
    Number(form.installment_3 || 0);

  return (
    <>
      <SettingsInlineError message={error} />
      <SettingsSection
        title="Asosiy to‘lov qoidalari"
        subtitle="Valyuta va to‘lovni qabul qilish rejimi."
      >
        <div className="settings-form-grid">
          <SettingsSelect
            label="Valyuta"
            value={form.currency}
            options={CURRENCY_OPTIONS}
            onChange={(currency) => patch({ currency })}
          />
          <SettingsSelect
            label="To‘lov qabul qilish rejimi"
            value={form.payment_method}
            options={[["manual_bank", "Manual bank o‘tkazmasi"]]}
            onChange={(payment_method) => patch({ payment_method })}
          />
        </div>
        <p className="settings-hint">
          Karta orqali avtomatik to‘lov hozircha yoqilmagan — to‘lovlar admin
          tomonidan qo‘lda tasdiqlanadi.
        </p>
      </SettingsSection>

      <SettingsSection
        title="3 qismli to‘lov"
        subtitle="Kurs narxini uch bo‘lib to‘lash imkoniyati."
      >
        <div className="settings-switch-list">
          <SettingsSwitch
            label="3 qismli to‘lov"
            description="Talabalar kursni 3 bo‘lib to‘lashi mumkin"
            checked={form.enable_installments}
            onChange={(enable_installments) => patch({ enable_installments })}
          />
        </div>
        <div className="settings-form-grid settings-form-grid-thirds">
          <label className="settings-field">
            <span>1-qism (%)</span>
            <span className="settings-input-with-suffix">
              <input
                type="number"
                min={1}
                max={100}
                value={form.installment_1}
                onChange={(event) =>
                  patch({ installment_1: event.currentTarget.value })
                }
              />
              <i>%</i>
            </span>
          </label>
          <label className="settings-field">
            <span>2-qism (%)</span>
            <span className="settings-input-with-suffix">
              <input
                type="number"
                min={1}
                max={100}
                value={form.installment_2}
                onChange={(event) =>
                  patch({ installment_2: event.currentTarget.value })
                }
              />
              <i>%</i>
            </span>
          </label>
          <label className="settings-field">
            <span>3-qism (%)</span>
            <span className="settings-input-with-suffix">
              <input
                type="number"
                min={1}
                max={100}
                value={form.installment_3}
                onChange={(event) =>
                  patch({ installment_3: event.currentTarget.value })
                }
              />
              <i>%</i>
            </span>
          </label>
        </div>
        {percentageSum > 100 && (
          <p className="settings-field-error">
            Qismlar yig‘indisi 100% dan oshmasligi kerak (hozir {percentageSum}%).
          </p>
        )}
        <div className="settings-switch-list">
          <SettingsSwitch
            label="2-qism sharti"
            description="1-to‘lov tasdiqlanmaguncha 2-qism ochilmaydi"
            checked={form.part2_requires_part1}
            onChange={(part2_requires_part1) => patch({ part2_requires_part1 })}
          />
          <SettingsSwitch
            label="3-qism sharti"
            description="2-to‘lov tasdiqlanmaguncha 3-qism ochilmaydi"
            checked={form.part3_requires_part2}
            onChange={(part3_requires_part2) => patch({ part3_requires_part2 })}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="To‘lov rekvizitlari"
        subtitle="Chek suratini tasdiqlashda talabaga ko‘rsatiladigan ma’lumotlar."
      >
        <div className="settings-form-grid">
          <SettingsTextField
            label="Hisob raqami"
            value={form.payment_account_number}
            onChange={(payment_account_number) =>
              patch({ payment_account_number })
            }
            placeholder="2020 8000 0000 0000 0000"
          />
          <SettingsTextField
            label="MCHJ nomi"
            value={form.payment_company_name}
            onChange={(payment_company_name) => patch({ payment_company_name })}
            placeholder="PromptUsta MCHJ"
          />
        </div>
      </SettingsSection>
    </>
  );
}
