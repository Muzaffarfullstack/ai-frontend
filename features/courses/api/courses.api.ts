import { ApiError, apiRequest, type Course, type CourseSection, type Enrollment, type Order, type PaymentMode } from "@/lib/api-client";

export async function getCourseDetail(slug: string) {
  const course = await apiRequest<Course>(`/courses/slug/${encodeURIComponent(slug)}`);
  const sections = await apiRequest<CourseSection[]>(`/courses/${course.id}/sections`);
  let enrollment: Enrollment | null = null;
  try { enrollment = await apiRequest<Enrollment>(`/enrollments/courses/${course.id}`); }
  catch (reason) { if (!(reason instanceof ApiError) || reason.status !== 404) throw reason; }
  return { course, sections, enrollment };
}

export const createCourseOrder = (
  courseId: string,
  paymentMode: PaymentMode = "full",
  contactAdmin = false,
) => apiRequest<Order>("/orders/", {
  method: "POST",
  body: JSON.stringify({
    course_id: courseId,
    payment_mode: paymentMode,
    contact_admin: contactAdmin,
  }),
});
