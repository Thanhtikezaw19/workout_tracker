'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { getData, addExercise, deleteExercise, Exercise } from "./actions";

export default function Home() {
  const { data: session } = useSession();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data on login
  useEffect(() => {
    if (session) {
      refreshData();
    }
  }, [session]);

  const refreshData = async () => {
    const data = await getData();
    // Sort by newest first
    setExercises(data.reverse());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await addExercise(formData);
    (e.target as HTMLFormElement).reset();
    await refreshData();
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this log?")) return;
    // Optimistic update (remove from UI immediately)
    setExercises(prev => prev.filter(ex => ex.id !== id));
    await deleteExercise(id);
    await refreshData(); // Sync to be sure
  };

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg text-center">
          <h1 className="mb-6 text-3xl font-bold text-blue-600">Gym Tracker</h1>
          <p className="mb-8 text-gray-500">Login to save your progress</p>
          <button
            onClick={() => signIn("google")}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Sign in with Gmail
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4 pb-24">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Hi, {session.user?.name?.split(' ')[0]}</h2>
          <p className="text-xs text-gray-500">Let's crush it today!</p>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-lg bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700"
        >
          Logout
        </button>
      </header>

      {/* Input Form */}
      <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-800">Add New Set</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            name="name"
            type="text"
            placeholder="Exercise Name (e.g. Bench Press)"
            required
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-400">Sets</label>
              <input
                name="sets"
                type="number"
                placeholder="0"
                required
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-center outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-400">Reps</label>
              <input
                name="reps"
                type="number"
                placeholder="0"
                required
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-center outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-[2]">
              <label className="mb-1 block text-xs text-gray-400">Weight</label>
              <input
                name="weight"
                type="number"
                placeholder="0"
                required
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-400">Unit</label>
              <select
                name="unit"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 outline-none"
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Log Exercise"}
          </button>
        </form>
      </section>

      {/* History List */}
      <section>
        <h3 className="mb-4 font-semibold text-gray-800">History</h3>
        <div className="flex flex-col gap-3">
          {exercises.length === 0 && (
            <p className="text-center text-gray-400">No exercises logged yet.</p>
          )}
          
          {exercises.map((ex) => (
            <div key={ex.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <div>
                <h4 className="font-bold text-gray-800">{ex.name}</h4>
                <div className="mt-1 flex gap-2 text-sm text-gray-600">
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700 font-medium">
                    {ex.sets} x {ex.reps}
                  </span>
                  <span className="rounded-md bg-orange-50 px-2 py-0.5 text-orange-700 font-medium">
                    {ex.weight}{ex.unit}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{ex.date}</p>
              </div>
              
              <button
                onClick={() => handleDelete(ex.id)}
                className="ml-4 rounded-full bg-red-50 p-2 text-red-500 hover:bg-red-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}