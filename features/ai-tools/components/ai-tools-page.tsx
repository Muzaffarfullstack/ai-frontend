"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppIcon, type AppIconName } from "@/components/ui";
import { useLocale } from "@/components/providers";
import {
  ApiError,
  buildPrompt,
  getPromptTargets,
  type PromptBuildResult,
  type PromptMediaType,
  type PromptTargetCapability,
} from "@/lib/api-client";

type ResultTab = "prompt" | "constraints" | "shots";

const anatomy: Array<[string, AppIconName]> = [
  ["subject", "file"], ["composition", "image"], ["camera", "camera"],
  ["lighting", "sun"], ["atmosphere", "cloud"], ["motion", "motion"],
  ["style", "palette"], ["constraints", "shield"],
];

const advancedCopy = {
  uz: {
    subject: "Mavzu tafsilotlari", environment: "Muhit", composition: "Kompozitsiya",
    movement: "Obyekt harakati", camera: "Kamera", lighting: "Yorug‘lik",
    atmosphere: "Atmosfera", continuity: "Kadrlar izchilligi", ending: "Yakuniy holat",
    avoid: "Cheklovlar va istisnolar", avoidPlaceholder: "vergul bilan ajrating",
    edit: "G‘oyani tahrirlash",
  },
  ru: {
    subject: "Детали объекта", environment: "Окружение", composition: "Композиция",
    movement: "Движение объекта", camera: "Камера", lighting: "Освещение",
    atmosphere: "Атмосфера", continuity: "Непрерывность кадров", ending: "Финальное состояние",
    avoid: "Ограничения и исключения", avoidPlaceholder: "разделите запятыми",
    edit: "Изменить идею",
  },
  en: {
    subject: "Subject details", environment: "Environment", composition: "Composition",
    movement: "Subject movement", camera: "Camera", lighting: "Lighting",
    atmosphere: "Atmosphere", continuity: "Shot continuity", ending: "Ending state",
    avoid: "Constraints and exclusions", avoidPlaceholder: "separate with commas",
    edit: "Edit idea",
  },
} as const;

function localizedApiError(reason: unknown, t: (key: string) => string) {
  if (reason instanceof ApiError && reason.code) {
    const key = `errors.${reason.code}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return reason instanceof Error ? reason.message : t("errors.request_failed");
}

export default function AiToolsPage() {
  const { t, locale } = useLocale();
  const advancedLabels = advancedCopy[locale];
  const [targets, setTargets] = useState<PromptTargetCapability[]>([]);
  const [mediaType, setMediaType] = useState<PromptMediaType>("image");
  const [targetKey, setTargetKey] = useState("");
  const [idea, setIdea] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [style, setStyle] = useState("cinematic");
  const [detailLevel, setDetailLevel] = useState<"standard" | "high">("high");
  const [duration, setDuration] = useState(5);
  const [shotMode, setShotMode] = useState<"single_shot" | "multi_shot">("single_shot");
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [referenceDescription, setReferenceDescription] = useState("");
  const [advanced, setAdvanced] = useState({
    subject_details: "", environment: "", composition: "", camera: "",
    lighting: "", atmosphere: "", subject_movement: "", camera_movement: "",
    continuity: "", ending_state: "", avoid: "",
  });
  const [result, setResult] = useState<PromptBuildResult | null>(null);
  const [resultTab, setResultTab] = useState<ResultTab>("prompt");
  const [busy, setBusy] = useState(false);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);

  useEffect(() => {
    getPromptTargets()
      .then((nextTargets) => {
        setTargets(nextTargets);
        const first = nextTargets.find((target) => target.mediaType === "image" && target.enabled);
        if (first) {
          setTargetKey(first.key);
          setAspectRatio(first.aspectRatios[0] ?? "1:1");
          setDuration(first.durationSeconds[0] ?? 5);
        }
      })
      .catch((reason) => setError(localizedApiError(reason, t)))
      .finally(() => setLoadingTargets(false));
  }, [t]);

  const visibleTargets = useMemo(
    () => targets.filter((target) => target.mediaType === mediaType && target.enabled),
    [mediaType, targets],
  );
  const selectedTarget = targets.find((target) => target.key === targetKey);

  function selectTarget(target: PromptTargetCapability | undefined) {
    setTargetKey(target?.key ?? "");
    setAspectRatio(target?.aspectRatios[0] ?? "1:1");
    setDuration(target?.durationSeconds[0] ?? 5);
  }

  function switchMedia(next: PromptMediaType) {
    setMediaType(next);
    selectTarget(targets.find((target) => target.mediaType === next && target.enabled));
    setResult(null);
    setResultTab("prompt");
    setError("");
    setFieldErrors({});
  }

  function updateAdvanced(key: keyof typeof advanced, value: string) {
    setAdvanced((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const normalizedIdea = idea.trim().replace(/\s+/g, " ");
    const nextErrors: Record<string, string> = {};
    if (normalizedIdea.length < 10) nextErrors.idea = t("promptBuilder.validation.idea");
    if (!targetKey) nextErrors.target_key = t("promptBuilder.validation.target");
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }
    setBusy(true); setError(""); setFieldErrors({}); setCopied(false);
    const advancedPayload: Record<string, unknown> = Object.fromEntries(
      Object.entries(advanced).filter(([, value]) => value.trim()),
    );
    if (advanced.avoid.trim()) advancedPayload.avoid = advanced.avoid.split(",").map((item) => item.trim()).filter(Boolean);
    if (mediaType === "video") {
      advancedPayload.duration_seconds = duration;
      advancedPayload.shot_mode = shotMode;
      advancedPayload.generation_mode = "text_to_video";
    }
    try {
      const next = await buildPrompt({
        mediaType,
        targetKey,
        idea: normalizedIdea,
        outputLanguage: locale,
        aspectRatio,
        style,
        detailLevel,
        referenceDescription: referenceDescription.trim() || undefined,
        advanced: advancedPayload,
        idempotencyKey: crypto.randomUUID(),
      });
      setResult(next);
      setResultTab("prompt");
    } catch (reason) {
      if (reason instanceof ApiError) setFieldErrors(reason.fields);
      setError(localizedApiError(reason, t));
    } finally {
      setBusy(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    const text = resultTab === "constraints"
      ? result.sections.constraints.join("\n")
      : resultTab === "shots"
        ? result.shotPlan.map((shot) => `${shot.index}. ${shot.framing} — ${shot.subjectAction} — ${shot.camera}`).join("\n")
        : result.finalPrompt;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function editIdea() {
    const field = document.getElementById("prompt-idea") as HTMLTextAreaElement | null;
    field?.scrollIntoView({ block: "center" });
    field?.focus({ preventScroll: true });
  }

  const canSubmit = idea.trim().length >= 10 && Boolean(targetKey) && !busy;

  return <div className="prompt-builder-page">
    <header className="student-page-heading prompt-heading">
      <span className="lime-label">AI YORDAMCHI</span>
      <h1>{t("promptBuilder.title")}</h1>
      <p>{t("promptBuilder.subtitle")}</p>
    </header>
    <div className="prompt-notice"><span>i</span>{t("promptBuilder.notice")}</div>
    {error && <div className="form-error page-alert" role="alert">{error}</div>}

    <section className="prompt-workspace">
      <div className="prompt-main-column">
        <form className="panel builder-card" onSubmit={submit} aria-busy={busy}>
          <h2>{t("promptBuilder.new")}</h2>
          <div className="builder-steps" aria-label="Prompt builder steps">
            {["type", "model", "idea"].map((step, index) => <div className={index === 0 ? "active" : ""} key={step}><i />{index + 1}. {t(`promptBuilder.step.${step}`)}</div>)}
          </div>

          <div className="prompt-type-toggle" role="group" aria-label={t("promptBuilder.step.type")}>
            <button type="button" aria-pressed={mediaType === "image"} className={mediaType === "image" ? "active" : ""} onClick={() => switchMedia("image")}><AppIcon name="image"/>{t("promptBuilder.media.image")}</button>
            <button type="button" aria-pressed={mediaType === "video"} className={mediaType === "video" ? "active" : ""} onClick={() => switchMedia("video")}><AppIcon name="video"/>{t("promptBuilder.media.video")}</button>
          </div>

          <fieldset className="target-selector model-strip">
            <legend>{t("promptBuilder.target.label")} <small>{visibleTargets.length} ta model</small></legend>
            {loadingTargets ? <div className="target-skeletons"><i/><i/></div> : <div className="target-grid">
              {visibleTargets.slice(0, 4).map((target) => <label className={target.key === targetKey ? "target-option selected" : "target-option"} key={target.key}>
                <input type="radio" name="target" value={target.key} checked={target.key === targetKey} onChange={() => selectTarget(target)} />
                <span className="target-logo">{target.label.slice(0, 1)}</span>
                <span><b>{target.label}</b><small>{target.description}</small></span>
                <i>{target.key === targetKey ? "✓" : ""}</i>
              </label>)}
              <button className="all-models-button" type="button" onClick={() => setModelPickerOpen(true)}><AppIcon name="settings"/>Barcha modellar</button>
            </div>}
            {fieldErrors.target_key && <small className="field-error">{fieldErrors.target_key}</small>}
          </fieldset>

          <label className="prompt-idea-field" htmlFor="prompt-idea">
            <span>{t("promptBuilder.idea.label")}</span>
            <textarea id="prompt-idea" value={idea} maxLength={2000} aria-describedby={fieldErrors.idea ? "idea-error" : undefined} onChange={(event) => setIdea(event.target.value)} placeholder={t("promptBuilder.idea.placeholder")} />
            <small>{idea.length} / 2000</small>
          </label>
          {fieldErrors.idea && <small className="field-error" id="idea-error">{fieldErrors.idea}</small>}

          <button className="reference-toggle" type="button" aria-expanded={referenceOpen} onClick={() => setReferenceOpen((open) => !open)}>＋ {t("promptBuilder.reference.add")}</button>
          {referenceOpen && <label className="reference-description"><span className="sr-only">{t("promptBuilder.reference.add")}</span><textarea value={referenceDescription} maxLength={2000} onChange={(event) => setReferenceDescription(event.target.value)} placeholder={t("promptBuilder.reference.placeholder")} /></label>}

          <div className="basic-settings">
            <label><span>{t("promptBuilder.settings.format")}</span><select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>{selectedTarget?.aspectRatios.map((ratio) => <option key={ratio}>{ratio}</option>)}</select></label>
            {mediaType === "image" ? <label><span>{t("promptBuilder.settings.style")}</span><select value={style} onChange={(event) => setStyle(event.target.value)}><option value="cinematic">Kinolik</option><option value="photorealistic">Fotorealistik</option><option value="editorial">Editorial</option><option value="minimal">Minimal</option></select></label> : <label><span>{t("promptBuilder.settings.duration")}</span><select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{selectedTarget?.durationSeconds.map((seconds) => <option value={seconds} key={seconds}>{seconds}s</option>)}</select></label>}
            <label><span>{t("promptBuilder.settings.language")}</span><select value={locale} disabled><option value={locale}>{locale.toUpperCase()}</option></select></label>
            {mediaType === "image" ? <label><span>{t("promptBuilder.settings.detail")}</span><select value={detailLevel} onChange={(event) => setDetailLevel(event.target.value as "standard" | "high")}><option value="high">Yuqori</option><option value="standard">Standart</option></select></label> : <label><span>{t("promptBuilder.settings.shotMode")}</span><select value={shotMode} onChange={(event) => setShotMode(event.target.value as "single_shot" | "multi_shot")}><option value="single_shot">Single-shot</option>{selectedTarget?.supportsMultiShot && <option value="multi_shot">Multi-shot</option>}</select></label>}
          </div>

          <details className="advanced-settings">
            <summary><AppIcon name="settings"/>{t("promptBuilder.settings.advanced")}<span>›</span></summary>
            <div className="advanced-grid">
              <label>{advancedLabels.subject}<textarea value={advanced.subject_details} onChange={(event) => updateAdvanced("subject_details", event.target.value)} /></label>
              <label>{advancedLabels.environment}<textarea value={advanced.environment} onChange={(event) => updateAdvanced("environment", event.target.value)} /></label>
              {mediaType === "image" ? <label>{advancedLabels.composition}<textarea value={advanced.composition} onChange={(event) => updateAdvanced("composition", event.target.value)} /></label> : <label>{advancedLabels.movement}<textarea value={advanced.subject_movement} onChange={(event) => updateAdvanced("subject_movement", event.target.value)} /></label>}
              <label>{advancedLabels.camera}<textarea value={mediaType === "video" ? advanced.camera_movement : advanced.camera} onChange={(event) => updateAdvanced(mediaType === "video" ? "camera_movement" : "camera", event.target.value)} /></label>
              <label>{advancedLabels.lighting}<textarea value={advanced.lighting} onChange={(event) => updateAdvanced("lighting", event.target.value)} /></label>
              <label>{advancedLabels.atmosphere}<textarea value={advanced.atmosphere} onChange={(event) => updateAdvanced("atmosphere", event.target.value)} /></label>
              {mediaType === "video" && <><label>{advancedLabels.continuity}<textarea value={advanced.continuity} onChange={(event) => updateAdvanced("continuity", event.target.value)} /></label><label>{advancedLabels.ending}<textarea value={advanced.ending_state} onChange={(event) => updateAdvanced("ending_state", event.target.value)} /></label></>}
              <label className="advanced-wide">{advancedLabels.avoid}<textarea value={advanced.avoid} onChange={(event) => updateAdvanced("avoid", event.target.value)} placeholder={advancedLabels.avoidPlaceholder} /></label>
            </div>
          </details>

          <div className="builder-actions"><button className="button button-primary" disabled={!canSubmit}>{busy ? t("promptBuilder.actions.building") : <>{t("promptBuilder.actions.build")} <AppIcon name="arrow"/></>}</button></div>
          <div className="sr-only" aria-live="polite">{busy ? t("promptBuilder.actions.building") : copied ? t("promptBuilder.actions.copied") : ""}</div>
        </form>

        <article className="panel prompt-result-card">
          <div className="result-header"><h2>{t("promptBuilder.result.title")}</h2><div>{result && <><button type="button" onClick={editIdea}>{advancedLabels.edit}</button><button type="button" onClick={() => void copyResult()}><AppIcon name="copy"/>{copied ? t("promptBuilder.actions.copied") : t("promptBuilder.actions.copy")}</button><button type="button" onClick={() => document.querySelector<HTMLFormElement>(".builder-card")?.requestSubmit()} disabled={busy}>{t("promptBuilder.actions.rebuild")}</button></>}</div></div>
          <div className="result-tabs" role="tablist"><button role="tab" aria-selected={resultTab === "prompt"} className={resultTab === "prompt" ? "active" : ""} onClick={() => setResultTab("prompt")}>{t("promptBuilder.result.mainPrompt")}</button><button role="tab" aria-selected={resultTab === "constraints"} className={resultTab === "constraints" ? "active" : ""} onClick={() => setResultTab("constraints")}>{t("promptBuilder.result.constraints")}</button>{result?.shotPlan.length ? <button role="tab" aria-selected={resultTab === "shots"} className={resultTab === "shots" ? "active" : ""} onClick={() => setResultTab("shots")}>{t("promptBuilder.result.shotPlan")}</button> : null}</div>
          {!result ? <div className="result-empty"><AppIcon name="file" size={46}/><div><h3>{t("promptBuilder.result.emptyTitle")}</h3><p>{t("promptBuilder.result.emptyDescription")}</p></div></div> : <div className="result-content" role="tabpanel">
            <div className="result-meta"><span>{result.targetLabel}</span><span>Profile {result.profileVersion}</span></div>
            {resultTab === "prompt" && <p>{result.finalPrompt}</p>}
            {resultTab === "constraints" && <ul>{result.sections.constraints.map((item) => <li key={item}>{item}</li>)}</ul>}
            {resultTab === "shots" && <div className="shot-list">{result.shotPlan.map((shot) => <div key={shot.index}><b>Shot {shot.index}</b><p>{shot.framing} — {shot.subjectAction}</p><small>{shot.camera}</small></div>)}</div>}
          </div>}
        </article>
      </div>

    </section>
    <div className="prompt-anatomy-bar"><b>Prompt tarkibi</b>{anatomy.map(([key]) => <span key={key}>✓ {t(`promptBuilder.anatomy.${key}`)}</span>)}</div>
    {modelPickerOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setModelPickerOpen(false); }}><section className="model-picker-modal" role="dialog" aria-modal="true" aria-labelledby="model-picker-title"><button className="modal-close" onClick={() => setModelPickerOpen(false)} aria-label="Yopish">×</button><header><h2 id="model-picker-title">AI modelini tanlang</h2><p>Prompt qaysi platformada ishlatilishini tanlang.</p></header><div className="model-picker-tabs"><button className="active">Barchasi <span>{targets.length}</span></button><button>Tasvir <span>{targets.filter((item) => item.mediaType === "image").length}</span></button><button>Video <span>{targets.filter((item) => item.mediaType === "video").length}</span></button></div><div className="model-picker-columns">{(["image", "video"] as const).map((type) => <div key={type}><h3>{type === "image" ? "TASVIR MODELLARI" : "VIDEO MODELLARI"}</h3>{targets.filter((target) => target.mediaType === type).map((target) => <button className={target.key === targetKey ? "selected" : ""} key={target.key} onClick={() => { switchMedia(type); selectTarget(target); setModelPickerOpen(false); }}><span className="target-logo">{target.label.slice(0, 1)}</span><div><b>{target.label}</b><small>{target.description}</small></div><em>{type === "image" ? "Tasvir" : "Video"}</em>{target.key === targetKey && <i>✓</i>}</button>)}</div>)}</div><footer><AppIcon name="shield"/><p>Yordamchi faqat modelga mos prompt yozadi. Media yaratmaydi.</p><button className="button button-ghost" onClick={() => setModelPickerOpen(false)}>Bekor qilish</button></footer></section></div>}
  </div>;
}
