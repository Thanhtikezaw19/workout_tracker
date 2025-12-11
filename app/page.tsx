'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import { getData, addExercise, deleteExercise, Exercise } from "./actions";

export default function Home() {
  const { data: session } = useSession();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterWeek, setFilterWeek] = useState<string>("all");

  // Load data
  useEffect(() => {
    if (session) refreshData();
  }, [session]);

  const refreshData = async () => {
    const data = await getData();
    setExercises(data.reverse());
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    await addExercise(formData);
    
    // Only clear specific fields so you can quickly add more exercises for the same day
    const form = e.target as HTMLFormElement;
    form.querySelector<HTMLInputElement>('input[name="name"]')!.value = "";
    form.querySelector<HTMLInputElement>('input[name="weight"]')!.value = "";
    form.querySelector<HTMLInputElement>('input[name="sets"]')!.value = "";
    form.querySelector<HTMLInputElement>('input[name="reps"]')!.value = "";
    form.querySelector<HTMLInputElement>('input[name="day"]')!.value = "Day 1";
    form.querySelector<HTMLInputElement>('input[name="week"]')!.value = "";
    
    await refreshData();
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this log?")) return;
    setExercises(prev => prev.filter(ex => ex.id !== id));
    await deleteExercise(id);
    await refreshData();
  };

  // Get unique weeks for filter
  const uniqueWeeks = useMemo(() => {
    // Only take weeks that are valid numbers
    const weeks = exercises.map(ex => ex.week).filter(w => w > 0);
    return Array.from(new Set(weeks)).sort((a, b) => a - b);
  }, [exercises]);

  const filteredExercises = exercises.filter(ex => {
    if (filterWeek === "all") return true;
    return ex.week === Number(filterWeek);
  });

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg text-center">
          <h1 className="mb-6 text-3xl font-bold text-blue-600">Gym Tracker</h1>
          <button onClick={() => signIn("google")} className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 shadow-md">
            Sign in with Gmail
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4 pb-24 min-h-screen bg-gray-50">
      <header className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Hi, {session.user?.name?.split(' ')[0]}</h2>
        <button onClick={() => signOut()} className="text-sm font-medium text-gray-500 hover:text-red-500">
          Logout
        </button>
      </header>

      <section className="mb-8 rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
        <h3 className="mb-4 font-semibold text-gray-800">Log Workout</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          
          {/* Week and Day Inputs */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-bold text-gray-600">Week #</label>
              {/* Note: name="week" matches formData.get('week') in actions.ts */}
              <input name="week" type="number" defaultValue="1" min="1" required className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 p-3 outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-bold text-gray-600">Day</label>
              {/* Note: name="day" matches formData.get('day') in actions.ts */}
              <select name="day" className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 p-3 outline-none focus:border-blue-500">
                <option value="Day 1">Day 1</option>
                <option value="Day 2">Day 2</option>
                <option value="Day 3">Day 3</option>
                <option value="Day 4">Day 4</option>
                <option value="Day 5">Day 5</option>
                <option value="Day 6">Day 6</option>
                <option value="Day 7">Day 7</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-gray-600">Exercise</label>
            <input name="name" type="text" placeholder="e.g. Hammer Curl" required className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 p-3 outline-none focus:border-blue-500" />
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-bold text-gray-600">Sets</label>
              <input name="sets" type="number" placeholder="3" required className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 p-3 text-center outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-bold text-gray-600">Reps</label>
              <input name="reps" type="number" placeholder="10" required className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 p-3 text-center outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-[2]">
              <label className="mb-1 block text-xs font-bold text-gray-600">Weight</label>
              <input name="weight" type="number" placeholder="20" required className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 p-3 outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-bold text-gray-600">Unit</label>
              <select name="unit" className="w-full rounded-lg border border-gray-300 bg-white text-gray-900 p-3 outline-none">
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Saving..." : "Add to Log"}
          </button>
        </form>
      </section>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-lg">History</h3>
        <select 
          value={filterWeek} 
          onChange={(e) => setFilterWeek(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white text-sm py-2 px-3 outline-none text-gray-700 font-medium"
        >
          <option value="all">All Weeks</option>
          {uniqueWeeks.map(w => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        {filteredExercises.map((ex) => (
          <div key={ex.id} className="relative flex flex-col rounded-xl bg-white p-4 shadow-sm border border-gray-200">
            <div className="flex gap-2 mb-2">
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-md">
                Week {ex.week || 1}
              </span>
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-md">
                {ex.day || "Day 1"}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-extrabold text-gray-900 text-lg leading-tight">{ex.name}</h4>
                <div className="mt-2 flex items-center gap-3">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Sets x Reps</span>
                      <span className="text-gray-800 font-bold text-md">{ex.sets} x {ex.reps}</span>
                   </div>
                   <div className="h-6 w-px bg-gray-200"></div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Weight</span>
                      <span className="text-gray-800 font-bold text-md">{ex.weight} {ex.unit}</span>
                  </div>
                  <div className="h-6 w-px bg-gray-200"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Training Volume</span>
                    <span className="text-gray-800 font-bold text-md">{ex.weight * ex.reps * ex.sets} {ex.unit}</span>
                  </div>
                </div>
              </div>

              <button onClick={() => handleDelete(ex.id)} className="text-gray-300 hover:text-red-500 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}