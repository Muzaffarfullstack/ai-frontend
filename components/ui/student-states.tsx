import type { ReactNode } from "react";
import { AppIcon, type AppIconName } from "./app-icon";

export function StudentLoading({ cards = 3 }: { cards?: number }) {
  return <div className="student-skeleton-grid" aria-label="Ma’lumotlar yuklanmoqda">{Array.from({ length: cards }, (_, index) => <i key={index}/>)}</div>;
}

export function StudentError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="student-error" role="alert"><AppIcon name="shield"/><div><b>Ma’lumotlarni yuklab bo‘lmadi</b><p>{message}</p></div><button type="button" onClick={onRetry}>Qayta urinish</button></div>;
}

export function StudentEmpty({ icon = "book", title, body, action }: { icon?: AppIconName; title: string; body: string; action?: ReactNode }) {
  return <div className="student-empty"><span><AppIcon name={icon} size={40}/></span><h2>{title}</h2><p>{body}</p>{action}</div>;
}
