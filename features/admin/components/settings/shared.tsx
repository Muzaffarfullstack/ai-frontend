"use client";

import type { ReactNode } from "react";

export function SettingsSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-section">
      <header className="settings-section-head">
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}

export function SettingsSwitch({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className={`settings-switch-row${disabled ? " is-disabled" : ""}`}>
      <span className="settings-switch-copy">
        <b>{label}</b>
        {description ? <small>{description}</small> : null}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    </label>
  );
}

export function SettingsTextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url";
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
}

export function SettingsNumberField({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <span className="settings-input-with-suffix">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        {suffix ? <i>{suffix}</i> : null}
      </span>
    </label>
  );
}

export function SettingsSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option value={optionValue} key={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SettingsRadio({
  label,
  name,
  value,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="settings-radio">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />
      <span>{label}</span>
    </label>
  );
}

export function SettingsBadge({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "neutral";
  children: ReactNode;
}) {
  return <span className={`settings-badge is-${tone}`}>{children}</span>;
}

export function SettingsInlineError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="admin-error">
      <p>{message}</p>
    </div>
  );
}

export function SettingsInlineSuccess({ message }: { message: string }) {
  if (!message) return null;
  return <div className="success-message page-alert">{message}</div>;
}

/** Compare a flat string-keyed form against its initial values and report
 * the number of changed fields (for the "N ta saqlanmagan o'zgarish" badge). */
export function dirtyFieldCount(
  initial: Record<string, unknown>,
  form: Record<string, string | boolean>,
): number {
  let count = 0;
  for (const key of Object.keys(form)) {
    const before = initial[key];
    const after = form[key];
    const normalizedBefore =
      typeof before === "boolean" ? before : String(before ?? "");
    if (normalizedBefore !== after) count += 1;
  }
  return count;
}
