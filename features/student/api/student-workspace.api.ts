import {
  ApiError,
  apiRequest,
  type Course,
  type CourseProgress,
  type CourseSection,
  type Enrollment,
  type LeaderboardEntry,
  type LeaderboardResponse,
  type Lesson,
  type Order,
  type OrderPaymentStatus,
  type Payment,
} from "@/lib/api-client";

export interface StudentCourse {
  course: Course;
  enrollment: Enrollment;
  sections: CourseSection[];
  progress: CourseProgress;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  nextLesson: Lesson | null;
  order: Order | null;
}

export interface StudentWorkspace {
  catalog: Course[];
  enrollments: Enrollment[];
  courses: StudentCourse[];
  orders: Order[];
  payments: Payment[];
  paymentStatuses: OrderPaymentStatus[];
  leaderboard: LeaderboardEntry[];
}

const emptyProgress = (courseId: string): CourseProgress => ({
  course_id: courseId,
  completion_ratio: 0,
  lessons: [],
});

async function optional<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    return await request;
  } catch (reason) {
    if (reason instanceof ApiError && [403, 404].includes(reason.status)) return fallback;
    throw reason;
  }
}

export async function loadStudentWorkspace(): Promise<StudentWorkspace> {
  const [catalog, enrollments, orders, payments, ranking] = await Promise.all([
    apiRequest<Course[]>("/courses/?limit=100"),
    apiRequest<Enrollment[]>("/enrollments/?limit=100"),
    apiRequest<Order[]>("/orders/?limit=100"),
    apiRequest<Payment[]>("/payments/?limit=100"),
    apiRequest<LeaderboardResponse>("/leaderboard?limit=100"),
  ]);

  const activeOrders = new Map<string, Order>();
  orders
    .filter((order) => !["cancelled", "expired", "refunded"].includes(order.status))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .forEach((order) => {
      if (!activeOrders.has(order.course_id)) activeOrders.set(order.course_id, order);
    });

  const statuses = await Promise.all(
    orders
      .filter((order) => !["cancelled", "expired", "refunded"].includes(order.status))
      .map((order) => optional<OrderPaymentStatus | null>(apiRequest<OrderPaymentStatus>(`/orders/${order.id}/payment-status`), null)),
  );

  const courses = await Promise.all(
    enrollments.map(async (enrollment): Promise<StudentCourse | null> => {
      const course = catalog.find((item) => item.id === enrollment.course_id)
        ?? await optional<Course | null>(apiRequest<Course>(`/courses/${enrollment.course_id}`), null);
      if (!course) return null;
      const [sections, progress] = await Promise.all([
        optional(apiRequest<CourseSection[]>(`/courses/${course.id}/sections`), []),
        optional(apiRequest<CourseProgress>(`/progress/courses/${course.id}`), emptyProgress(course.id)),
      ]);
      const lessons = sections.flatMap((section) => section.lessons ?? []);
      const completedIds = new Set(progress.lessons.filter((item) => item.is_completed).map((item) => item.lesson_id));
      const accessStage = enrollment.access_stage ?? 0;
      const nextLesson = lessons.find((lesson) => {
        const section = sections.find((item) => item.id === lesson.section_id);
        return !completedIds.has(lesson.id) && lesson.status === "published" && (lesson.is_preview || (section?.unlock_stage ?? 4) <= accessStage);
      }) ?? null;
      return {
        course,
        enrollment,
        sections,
        progress,
        completedLessons: completedIds.size,
        totalLessons: lessons.length,
        progressPercent: Math.round(Math.max(0, Math.min(1, progress.completion_ratio)) * 100),
        nextLesson,
        order: activeOrders.get(course.id) ?? null,
      };
    }),
  );

  return {
    catalog,
    enrollments,
    courses: courses.filter((item): item is StudentCourse => item !== null),
    orders,
    payments,
    paymentStatuses: statuses.filter((item): item is OrderPaymentStatus => item !== null),
    leaderboard: ranking.entries,
  };
}

export function localizedCourse(course: Course, locale: string) {
  const translation = course.translations?.[locale];
  return {
    title: translation?.title ?? course.title,
    shortDescription: translation?.short_description ?? course.short_description,
    description: translation?.description ?? course.description ?? course.short_description,
  };
}
