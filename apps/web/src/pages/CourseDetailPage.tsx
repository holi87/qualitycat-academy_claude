import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCourse } from "../api/courses";
import LevelBadge from "../components/LevelBadge";
import SessionList from "../components/SessionList";
import { isBugEnabled } from "../config/bug-flags";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => getCourse(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <p className="p-8 text-sm text-gray-500">Loading...</p>;
  }

  if (!course) {
    return <p className="p-8 text-sm text-gray-500">Course not found.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        to="/courses"
        className="text-sm text-blue-600 hover:underline"
      >
        &larr; Back to courses
      </Link>

      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <LevelBadge level={course.level} />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          by {course.author.name} ({course.author.email})
        </p>

        {/* BUG: VITE_BUG_XSS_DESCRIPTION — renders HTML in description via dangerouslySetInnerHTML */}
        {/* DEMO ONLY - XSS vulnerability for training */}
        {isBugEnabled("VITE_BUG_XSS_DESCRIPTION") ? (
          <p
            className="mt-4 text-gray-700"
            dangerouslySetInnerHTML={{ __html: course.description }}
          />
        ) : (
          <p className="mt-4 text-gray-700">{course.description}</p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>
        <div className="mt-3">
          <SessionList courseId={course.id} />
        </div>
      </div>
    </div>
  );
}
