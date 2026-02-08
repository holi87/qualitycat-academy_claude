import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCourses } from "../api/courses";
import CourseCard from "../components/CourseCard";

const LEVELS = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export default function CoursesPage() {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<string>("ALL");

  const params = {
    page,
    limit: 10,
    ...(level !== "ALL" && { level }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["courses", params],
    queryFn: () => getCourses(params),
  });

  const totalPages = data ? Math.ceil(data.meta.total / data.meta.limit) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Courses</h1>

      <div className="mt-4 flex gap-2">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => {
              setLevel(l);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              level === l
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-gray-500">Loading...</p>
      ) : !data?.data.length ? (
        <p className="mt-6 text-sm text-gray-500">No courses found.</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4">
            {data.data.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border px-3 py-1 text-sm disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border px-3 py-1 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
