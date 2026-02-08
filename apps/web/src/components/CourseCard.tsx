import { Link } from "react-router-dom";
import type { Course } from "../api/courses";
import LevelBadge from "./LevelBadge";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
        <LevelBadge level={course.level} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
        {course.description}
      </p>
      <p className="mt-3 text-xs text-gray-400">
        {course.author.name} &middot; {course.sessions.length} sessions
      </p>
    </Link>
  );
}
