import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createCourse } from "../api/courses";
import { getErrorMessage } from "../components/ErrorMessage";
import { isBugEnabled } from "../config/bug-flags";

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export default function CreateCoursePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("BEGINNER");
  const [validationError, setValidationError] = useState("");

  const mutation = useMutation({
    mutationFn: () => createCourse({ title, description, level }),
    onSuccess: () => navigate("/courses"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError("");

    // BUG: VITE_BUG_FORM_VALIDATION — skip title validation, allows empty title submission
    if (!isBugEnabled("VITE_BUG_FORM_VALIDATION")) {
      if (title.trim().length < 3) {
        setValidationError("Title must be at least 3 characters");
        return;
      }
      if (description.trim().length < 1) {
        setValidationError("Description is required");
        return;
      }
    }

    mutation.mutate();
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Create Course</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {(validationError || mutation.error) && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {validationError || getErrorMessage(mutation.error)}
          </div>
        )}

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="level"
            className="block text-sm font-medium text-gray-700"
          >
            Level
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) =>
              setLevel(e.target.value as (typeof LEVELS)[number])
            }
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? "Creating..." : "Create Course"}
        </button>
      </form>
    </div>
  );
}
