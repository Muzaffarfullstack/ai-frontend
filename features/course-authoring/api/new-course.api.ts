import { apiRequest, type Course } from "@/lib/api-client";

export function createCourse(payload: Record<string, unknown>) {
  return apiRequest<Course>("/admin/courses/", { method: "POST", body: JSON.stringify(payload) });
}
