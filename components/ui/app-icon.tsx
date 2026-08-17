"use client";

import type { ReactNode } from "react";

export type AppIconName =
  | "home"
  | "book"
  | "sparkles"
  | "trophy"
  | "bag"
  | "user"
  | "logout"
  | "calendar"
  | "star"
  | "check"
  | "arrow"
  | "bot"
  | "receipt"
  | "clock"
  | "shield"
  | "mail"
  | "phone"
  | "copy"
  | "settings"
  | "image"
  | "video"
  | "camera"
  | "sun"
  | "cloud"
  | "motion"
  | "palette"
  | "file"
  | "search";

export function AppIcon({
  name,
  size = 22,
}: {
  name: AppIconName;
  size?: number;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<AppIconName, ReactNode> = {
    home: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.5V21h13V10.5M9.5 21v-6h5v6" />
      </>
    ),
    book: (
      <>
        <path d="M3.5 5.5A4.5 4.5 0 0 1 8 4h3v16H8a4.5 4.5 0 0 0-4.5 1.5z" />
        <path d="M20.5 5.5A4.5 4.5 0 0 0 16 4h-3v16h3a4.5 4.5 0 0 1 4.5 1.5z" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 2 1.4 4.1L17.5 7.5l-4.1 1.4L12 13l-1.4-4.1-4.1-1.4 4.1-1.4z" />
        <path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8zM5 14l.7 1.8 1.8.7-1.8.7L5 19l-.7-1.8-1.8-.7 1.8-.7z" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v4c0 3-1.8 5-4 5s-4-2-4-5zM12 13v4M8.5 21h7M10 17h4" />
        <path d="M8 6H4v1c0 2.2 1.3 4 4 4M16 6h4v1c0 2.2-1.3 4-4 4" />
      </>
    ),
    bag: (
      <>
        <path d="M5 8h14l1 13H4z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H4v16h6M14 8l4 4-4 4M9 12h9" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18M8 14h3v3H8z" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" />
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </>
    ),
    bot: (
      <>
        <rect x="4" y="7" width="16" height="12" rx="4" />
        <path d="M12 3v4M8 12h.01M16 12h.01M8 16h8" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v19l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    phone: (
      <path d="M6.5 3h3l1.5 5-2 1.5a15 15 0 0 0 5.5 5.5l1.5-2 5 1.5v3c0 2-1.5 3.5-3.5 3.5C9.5 21 3 14.5 3 6.5 3 4.5 4.5 3 6.5 3z" />
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V4H4v12h4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19 13.5v-3l-2-.7-.8-1.8.9-2-2.1-2.1-2 .9-1.8-.8-.7-2h-3l-.7 2-1.8.8-2-.9L.9 6l.9 2L1 9.8l-2 .7v3l2 .7.8 1.8-.9 2L3 20.1l2-.9 1.8.8.7 2h3l.7-2 1.8-.8 2 .9 2.1-2.1-.9-2 .8-1.8z"
          transform="translate(2) scale(.85)"
        />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m4 17 5-5 4 4 2-2 5 5" />
      </>
    ),
    video: (
      <>
        <rect x="3" y="5" width="14" height="14" rx="2" />
        <path d="m17 10 4-3v10l-4-3" />
      </>
    ),
    camera: (
      <>
        <path d="M4 7h4l1.5-2h5L16 7h4v12H4z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
      </>
    ),
    cloud: (
      <path d="M6 19h12a4 4 0 0 0 .5-8 7 7 0 0 0-13-1A4.5 4.5 0 0 0 6 19z" />
    ),
    motion: (
      <>
        <path d="M3 8h12M6 12h15M3 16h12" />
        <path d="m17 6 4 6-4 6" />
      </>
    ),
    palette: (
      <>
        <path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h5a4 4 0 0 0 4-4c0-3.3-4-6-9-6z" />
        <circle cx="7" cy="9" r="1" />
        <circle cx="10" cy="6.5" r="1" />
        <circle cx="15" cy="7" r="1" />
      </>
    ),
    file: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      {...common}
    >
      {paths[name]}
    </svg>
  );
}

