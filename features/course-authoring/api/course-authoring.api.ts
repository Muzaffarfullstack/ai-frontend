import { apiRequest, type CourseWorkspace, type VideoUpload } from "@/lib/api-client";

export const authoringRequest = <T = void,>(path: string, init: RequestInit = {}) => apiRequest<T>(path, init);
export async function loadCourseEditor(courseId: string) {
  const workspace = await apiRequest<CourseWorkspace>(`/admin/courses/${courseId}/workspace`);
  const lessons = workspace.sections.flatMap((section) => section.lessons);
  const videos = lessons.flatMap((lesson) => lesson.video_asset ? [lesson.video_asset] : []);
  return { ...workspace, lessons, videos };
}

export function reorderSections(courseId: string, ids: string[]) {
  return apiRequest(`/admin/courses/${courseId}/sections/order`, {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
}

export function reorderLessons(sectionId: string, ids: string[]) {
  return apiRequest(`/admin/sections/${sectionId}/lessons/order`, {
    method: "PUT",
    body: JSON.stringify({ ids }),
  });
}
export async function uploadLessonVideo(lessonId: string, file: File) {
  const upload = await apiRequest<VideoUpload>(`/admin/lessons/${lessonId}/videos/upload`, { method: "POST" });
  const response = await fetch(upload.upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type || "video/mp4" } });
  if (!response.ok) throw new Error("request_failed");
}
