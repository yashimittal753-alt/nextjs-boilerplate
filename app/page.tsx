"use client";

import { useEffect, useMemo, useState } from "react";

type Entry = {
  id: string;
  name: string;
  calories: number;
  category: string | null;
  date: string;
  createdAt: string;
};

type ApiResponse = {
  entries: Entry[];
  totalCalories: number;
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [totalCalories, setTotalCalories] = useState<number>(0);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = useMemo(() => {
    if (!selectedDate) return "";
    return new Date(selectedDate).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [selectedDate]);

  async function fetchEntries(date: string) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/entries?date=${encodeURIComponent(date)}`);
      if (!res.ok) {
        throw new Error("Failed to load entries");
      }
      const data: ApiResponse = await res.json();
      setEntries(data.entries);
      setTotalCalories(data.totalCalories);
    } catch (err) {
      console.error(err);
      setError("Could not load entries. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    fetchEntries(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !calories.trim()) return;

    const caloriesNumber = Number(calories);
    if (Number.isNaN(caloriesNumber) || caloriesNumber <= 0) {
      setError("Calories must be a positive number.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          calories: caloriesNumber,
          category: category.trim() || null,
          date: selectedDate,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add entry");
      }

      setName("");
      setCalories("");
      setCategory("");
      await fetchEntries(selectedDate);
    } catch (err) {
      console.error(err);
      setError("Could not add entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteEntry(id: string) {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/entries?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete entry");
      }
      await fetchEntries(selectedDate);
    } catch (err) {
      console.error(err);
      setError("Could not delete entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800 sm:p-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Minimal Calorie Tracker
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Log what you eat and track your daily calories.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Day
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formattedDate}
            </span>
          </div>
        </header>

        <section className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Total for the day
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-3xl font-semibold">
              {isLoading ? "—" : totalCalories}
            </p>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              kcal
            </span>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Entries
              </h2>
              {isLoading && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Loading…
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              {entries.length === 0 && !isLoading && (
                <p className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  No entries for this day yet. Add your first meal below.
                </p>
              )}

              <ul className="space-y-2">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{entry.name}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {entry.category || "Uncategorized"} ·{" "}
                        {new Date(entry.createdAt).toLocaleTimeString(
                          undefined,
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                    <div className="ml-3 flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {entry.calories} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="rounded-full border border-zinc-300 px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:border-red-500 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-500 dark:hover:text-red-400"
                        disabled={isSubmitting}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Add entry
            </h2>

            <form
              onSubmit={handleAddEntry}
              className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Food or meal
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Banana, Chicken salad"
                  className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    Calories
                  </label>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="e.g. 250"
                    className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                    Category (optional)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    <option value="">Select</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 inline-flex h-9 w-full items-center justify-center rounded-full bg-zinc-900 px-4 text-xs font-medium text-zinc-50 shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isSubmitting ? "Saving…" : "Add entry"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
