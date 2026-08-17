"use client";

import MuxPlayer from "@mux/mux-player-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiRequest, type LessonProgress, type VideoPlayback } from "@/lib/api-client";

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [playback, setPlayback] = useState<VideoPlayback | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const furthest = useRef(0);
  const lastSaved = useRef(0);

  useEffect(() => {
    apiRequest<LessonProgress | null>(`/progress/lessons/${id}`).then((value) => { setProgress(value); furthest.current = value?.furthest_position_seconds ?? 0; }).catch(() => undefined);
    apiRequest<VideoPlayback>(`/lessons/${id}/playback`).then(setPlayback).catch(async (reason) => {
      if (reason instanceof ApiError && (reason.status === 403 || reason.status === 404)) {
        try { setPlayback(await apiRequest<VideoPlayback>(`/courses/lessons/${id}/preview/playback`)); setPreview(true); }
        catch (fallback) { setError(fallback instanceof Error ? fallback.message : "Videoni ochib bo‘lmadi"); }
      } else setError(reason instanceof Error ? reason.message : "Videoni ochib bo‘lmadi");
    });
  }, [id]);

  const saveProgress = useCallback(async (position: number, force = false) => {
    if (preview || position < 0 || (!force && position - lastSaved.current < 10)) return;
    furthest.current = Math.max(furthest.current, Math.floor(position));
    lastSaved.current = Math.floor(position);
    await apiRequest(`/progress/lessons/${id}`, { method: "PUT", body: JSON.stringify({ last_position_seconds: Math.floor(position), furthest_position_seconds: furthest.current }) }).catch(() => undefined);
  }, [id, preview]);

  return <>
    <Link href="/app/courses" className="back-link-inline">← Kurslarga qaytish</Link>
    <header className="page-heading"><span className="eyebrow">{preview ? "FREE PREVIEW" : "SECURE MUX PLAYBACK"}</span><h1>Video dars</h1><p>Darsni tomosha qiling — progress avtomatik saqlanadi.</p></header>
    {error && <div className="form-error page-alert">{error}</div>}
    <section className="video-shell">{playback ? <MuxPlayer playbackId={playback.playback_id} tokens={playback.playback_token ? { playback: playback.playback_token } : undefined} currentTime={progress?.last_position_seconds ?? 0} metadata={{ video_id: id, video_title: "PromptUsta lesson" }} accentColor="#b8ff3d" onTimeUpdate={(event) => void saveProgress((event.target as HTMLMediaElement).currentTime)} onPause={(event) => void saveProgress((event.target as HTMLMediaElement).currentTime, true)} onEnded={(event) => void saveProgress((event.target as HTMLMediaElement).duration, true)} /> : !error && <div className="center-panel"><span className="loader" /></div>}</section>
  </>;
}
