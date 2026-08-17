import { AdminShell } from "@/components/ui";

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
