import client from "./client";

export interface Course {
  id: string;
  title: string;
  description: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  author: { name: string; email: string };
  sessions: Session[];
}

export interface Session {
  id: string;
  courseId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

interface CoursesResponse {
  data: Course[];
  meta: { page: number; limit: number; total: number };
}

export interface CoursesParams {
  page?: number;
  limit?: number;
  level?: string;
}

export async function getCourses(
  params: CoursesParams = {},
): Promise<CoursesResponse> {
  const { data } = await client.get<CoursesResponse>("/courses", { params });
  return data;
}

export async function getCourse(id: string): Promise<Course> {
  const { data } = await client.get<Course>(`/courses/${id}`);
  return data;
}

export interface CreateCourseData {
  title: string;
  description: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
}

export async function createCourse(body: CreateCourseData): Promise<Course> {
  const { data } = await client.post<Course>("/courses", body);
  return data;
}
