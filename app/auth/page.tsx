import { redirect } from "next/navigation";

export default async function LegacyAuthPage({ searchParams }: PageProps<"/auth">) {
  const params = await searchParams;
  redirect(params.mode === "register" ? "/register" : "/login");
}
