import { apiRequest, type Course, type GalleryPost } from "@/lib/api-client";

export async function getLandingContent() {
  const [courses, gallery] = await Promise.allSettled([apiRequest<Course[]>("/courses/?limit=3"), apiRequest<GalleryPost[]>("/gallery/featured?limit=3")]);
  return { courses: courses.status === "fulfilled" ? courses.value : [], gallery: gallery.status === "fulfilled" ? gallery.value : [] };
}
