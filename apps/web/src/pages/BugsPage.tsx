import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import client from "../api/client";

interface Bug {
  id: string;
  category: "backend" | "frontend" | "performance" | "security";
  title: string;
  description: string;
  flag: string;
  severity: "low" | "medium" | "high" | "critical";
  hints: string[];
  testIdea: string;
  active: boolean;
}

const CATEGORY_ORDER = ["backend", "frontend", "performance", "security"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  backend: "Backend",
  frontend: "Frontend",
  performance: "Performance",
  security: "Security",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function BugsPage() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (import.meta.env.VITE_BUGS !== "on") {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    client
      .get<{ bugs: Bug[] }>("/internal/bugs")
      .then((res) => setBugs(res.data.bugs))
      .catch((err) => {
        if (err.response?.status === 403) {
          setError("Brak dostepu. Zaloguj sie jako trainer.");
        } else {
          setError("Nie udalo sie pobrac katalogu bugow.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const grouped = CATEGORY_ORDER
    .map((cat) => ({
      category: cat,
      items: bugs.filter((b) => b.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Bug Catalog</h1>
      <p className="mt-1 text-sm text-gray-500">
        {bugs.length} bugs &middot; {bugs.filter((b) => b.active).length} active
      </p>

      {grouped.map((group) => (
        <section key={group.category} className="mt-8">
          <h2 className="text-lg font-semibold text-gray-800">
            {CATEGORY_LABELS[group.category]}
          </h2>

          <div className="mt-3 space-y-3">
            {group.items.map((bug) => (
              <div
                key={bug.id}
                className="rounded-lg border border-gray-200 bg-white px-5 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{bug.title}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {bug.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_COLORS[bug.severity]}`}
                    >
                      {bug.severity}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        bug.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {bug.active ? "active" : "inactive"}
                    </span>
                  </div>
                </div>

                <p className="mt-2 font-mono text-xs text-gray-400">
                  {bug.flag}
                </p>

                {bug.hints.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500">Hints</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-gray-600">
                      {bug.hints.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 rounded bg-gray-50 px-3 py-2">
                  <p className="text-xs font-medium text-gray-500">
                    Test idea
                  </p>
                  <p className="mt-0.5 text-sm text-gray-700">{bug.testIdea}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
