'use server'

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;

export interface Exercise {
  id: number;
  week: number;
  day: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  unit: string;
  date: string;
}

interface DataRecord {
  [email: string]: Exercise[];
}

// Helper to fetch fresh data
async function fetchJsonBin() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY as string },
    cache: 'no-store' 
  });
  if (!res.ok) throw new Error("Failed to fetch JSONBin");
  return res.json();
}

export async function getData(): Promise<Exercise[]> {
  const session = await getServerSession();
  if (!session?.user?.email) return [];
  try {
    const json = await fetchJsonBin();
    const record = json.record as DataRecord;
    return record[session.user.email] || [];
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}

export async function addExercise(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) return;

  const userEmail = session.user.email;

  // --- DEBUGGING VALUES ---
  const rawWeek = formData.get('week');
  const rawDay = formData.get('day');
  console.log("SERVER RECEIVED -> Week:", rawWeek, "Day:", rawDay);

  // Parse values safely. If "week" is missing, we set it to 1.
  const weekInt = rawWeek ? parseInt(rawWeek.toString()) : 1;
  const dayStr = rawDay ? rawDay.toString() : "Day 1";

  // 1. Get current data
  const json = await fetchJsonBin();
  const record = json.record as DataRecord;

  // 2. Create the new object
  const newExercise: Exercise = {
    id: Date.now(),
    week: weekInt,  // <--- This is what gets saved
    day: dayStr,
    name: formData.get('name') as string,
    sets: Number(formData.get('sets')),
    reps: Number(formData.get('reps')),
    weight: Number(formData.get('weight')),
    unit: formData.get('unit') as string,
    date: new Date().toLocaleDateString(),
  };

  // 3. Add to list
  if (!record[userEmail]) record[userEmail] = [];
  record[userEmail].push(newExercise);

  // 4. Save to JSONBin (Overwrite)
  const saveRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY as string
    },
    body: JSON.stringify(record)
  });

  if (!saveRes.ok) {
    console.error("SAVE FAILED:", await saveRes.text());
  } else {
    console.log("SAVE SUCCESS");
  }

  revalidatePath('/');
}

export async function deleteExercise(id: number) {
  const session = await getServerSession();
  if (!session?.user?.email) return;
  const userEmail = session.user.email;

  const json = await fetchJsonBin();
  const record = json.record as DataRecord;

  if (record[userEmail]) {
    record[userEmail] = record[userEmail].filter((ex) => ex.id !== id);
  }

  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY as string
    },
    body: JSON.stringify(record)
  });

  revalidatePath('/');
}