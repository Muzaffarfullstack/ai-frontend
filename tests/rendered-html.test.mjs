import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses standard Next.js and Mux", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.scripts.dev, "next dev");
  assert.equal(pkg.scripts.build, "next build");
  assert.equal(pkg.dependencies["@mux/mux-player-react"], "3.13.2");
  assert.equal(pkg.devDependencies.wrangler, undefined);
  assert.equal(pkg.devDependencies.vinext, undefined);
});

test("keeps authenticated API requests configurable", async () => {
  const api = await readFile(new URL("../lib/api-client.ts", import.meta.url), "utf8");
  assert.match(api, /NEXT_PUBLIC_API_URL/);
  assert.match(api, /credentials:\s*"include"/);
});

test("restricts optimized images to the configured public media host", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  const media = await readFile(new URL("../components/media-image.tsx", import.meta.url), "utf8");
  assert.match(config, /NEXT_PUBLIC_MEDIA_BASE_URL/);
  assert.match(config, /remotePatterns/);
  assert.doesNotMatch(config, /hostname:\s*["']\*\*["']/);
  assert.match(media, /from ["']next\/image["']/);
});

test("uploads course and gallery images through authenticated backend routes", async () => {
  const courseCreate = await readFile(new URL("../features/course-authoring/components/new-course-page.tsx", import.meta.url), "utf8");
  const courseMedia = await readFile(new URL("../features/course-authoring/components/course-media-page.tsx", import.meta.url), "utf8");
  const gallery = await readFile(new URL("../features/admin/components/showcase-page.tsx", import.meta.url), "utf8");
  assert.match(courseCreate, /\/admin\/courses\/\$\{course\.id\}\/thumbnail/);
  assert.match(courseMedia, /\/admin\/courses\/\$\{id\}\/thumbnail/);
  assert.match(gallery, /\/admin\/gallery\/upload/);
  assert.doesNotMatch(courseCreate, /B2_(?:PUBLIC|PRIVATE)_(?:KEY|APPLICATION)/);
  assert.doesNotMatch(courseMedia, /B2_(?:PUBLIC|PRIVATE)_(?:KEY|APPLICATION)/);
  assert.doesNotMatch(gallery, /B2_(?:PUBLIC|PRIVATE)_(?:KEY|APPLICATION)/);
});

test("keeps course authoring sequential and exposes complete CRUD and status actions", async () => {
  const courses = await readFile(new URL("../features/admin/components/courses-page.tsx", import.meta.url), "utf8");
  const editor = await readFile(new URL("../features/course-authoring/components/course-editor-page.tsx", import.meta.url), "utf8");
  const authoringApi = await readFile(new URL("../features/course-authoring/api/course-authoring.api.ts", import.meta.url), "utf8");
  const settings = await readFile(new URL("../features/course-authoring/components/course-settings-page.tsx", import.meta.url), "utf8");
  const orders = await readFile(new URL("../features/admin/components/orders-page.tsx", import.meta.url), "utf8");

  assert.match(editor, /CourseWorkspaceNav/);
  assert.match(editor, /active="curriculum"/);
  assert.match(editor, /\/admin\/sections\/\$\{section\.id\}/);
  assert.match(editor, /\/admin\/lessons\/\$\{lesson\.id\}/);
  assert.match(editor, /\/admin\/lessons\/\$\{lesson\.id\}\/draft/);
  assert.match(editor, /course-authoring-drawer/);
  assert.match(editor, /dropSection/);
  assert.match(authoringApi, /\/admin\/courses\/\$\{courseId\}\/workspace/);
  assert.match(authoringApi, /\/sections\/order/);
  assert.match(authoringApi, /\/lessons\/order/);
  assert.match(courses, /\/admin\/courses\/\$\{course\.id\}\/\$\{action\}/);
  assert.match(courses, /method: "DELETE"/);
  assert.match(settings, /Draftga qaytarish/);
  assert.match(settings, /Arxivlash/);
  assert.match(orders, /\/admin\/users\/\?limit=100/);
  assert.match(orders, /userContact/);
});

test("builds prompts through the dedicated student API without exposing provider routing", async () => {
  const api = await readFile(new URL("../lib/api-client.ts", import.meta.url), "utf8");
  const builder = await readFile(new URL("../features/ai-tools/components/ai-tools-page.tsx", import.meta.url), "utf8");

  assert.match(api, /\/prompt-builder\/targets/);
  assert.match(api, /\/prompt-builder\/build/);
  assert.match(builder, /getPromptTargets/);
  assert.match(builder, /buildPrompt/);
  assert.doesNotMatch(builder, /server-side routing/i);
  assert.doesNotMatch(builder, /Anthropic|DeepSeek/);
  assert.doesNotMatch(builder, /\/ai\/prompts/);
});

test("renders dashboard from real student workspace data", async () => {
  const dashboard = await readFile(new URL("../features/dashboard/components/dashboard-page.tsx", import.meta.url), "utf8");
  const workspace = await readFile(new URL("../features/student/api/student-workspace.api.ts", import.meta.url), "utf8");
  assert.match(dashboard, /useStudentWorkspace/);
  assert.match(workspace, /\/progress\/courses/);
  assert.match(workspace, /payment-status/);
  assert.doesNotMatch(dashboard, /38%|460 ball|12 \/ 32/);
});

test("renders the full public landing without fabricated social proof", async () => {
  const landing = await readFile(new URL("../features/public-site/components/landing-page.tsx", import.meta.url), "utf8");
  const landingApi = await readFile(new URL("../features/public-site/api/public-site.api.ts", import.meta.url), "utf8");

  for (const section of ["features", "how", "courses", "results", "faq"]) {
    assert.match(landing, new RegExp(`id=["']${section}["']`));
  }
  assert.match(landingApi, /\/courses\/\?limit=3/);
  assert.match(landingApi, /\/gallery\/featured\?limit=3/);
  assert.doesNotMatch(landing, /12\+|180\+|2\.4K|Madina A\.|Sardor K\.|Aziza R\./);
  assert.doesNotMatch(landing, /Generate image|Generate video|AI PROMPT LAB|LIVE/);
});

test("uses separate auth routes and a three-step password reset", async () => {
  const provider = await readFile(new URL("../features/auth/api/auth.api.ts", import.meta.url), "utf8");
  const login = await readFile(new URL("../features/auth/components/login-page.tsx", import.meta.url), "utf8");
  const register = await readFile(new URL("../features/auth/components/register-page.tsx", import.meta.url), "utf8");
  const resetContact = await readFile(new URL("../features/auth/components/forgot-password-page.tsx", import.meta.url), "utf8");
  const resetVerify = await readFile(new URL("../features/auth/components/forgot-password-verify-page.tsx", import.meta.url), "utf8");
  const resetComplete = await readFile(new URL("../features/auth/components/new-password-page.tsx", import.meta.url), "utf8");

  assert.match(login, /\/forgot-password/);
  assert.match(register, /\/verify-contact/);
  assert.match(resetContact, /password-reset|forgotPassword/);
  assert.match(resetVerify, /verifyPasswordResetCode/);
  assert.match(resetComplete, /completePasswordReset/);
  assert.match(provider, /\/auth\/password-reset\/verify/);
  assert.match(provider, /\/auth\/password-reset\/complete/);
  assert.doesNotMatch(resetVerify, /new_password|Yangi parol/);
});

test("does not render notification UI in the student shell", async () => {
  const shell = await readFile(new URL("../components/ui/app-shell.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(shell, /notification-button|name=["']bell["']|shell\.notifications/);
});

test("keeps app routes thin and removes sidebar numbering", async () => {
  const studentShell = await readFile(new URL("../components/ui/app-shell.tsx", import.meta.url), "utf8");
  const adminShell = await readFile(new URL("../components/ui/admin-shell.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(studentShell, /nav-number|"01"|"02"/);
  assert.doesNotMatch(adminShell, /padStart|"01"|"02"/);
  assert.match(studentShell, /href="\/admin"/);
});
