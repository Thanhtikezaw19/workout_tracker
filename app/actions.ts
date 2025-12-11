'use server'

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

// 1. Define the interface
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

const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;

// Helper to fetch without caching
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

  console.log("--- SERVER ACTION (NEW VERSION) STARTED ---");

  // 1. Force extraction as Strings first
  const weekStr = formData.get('week') as string;
  const dayStr = formData.get('day') as string;
  
  // 2. Convert cleanly
  const weekInt = parseInt(weekStr) || 1;
  const dayFinal = dayStr || "Day 1";

  console.log(`PREPARING TO SAVE -> Week: ${weekInt}, Day: ${dayFinal}`);

  // 3. Fetch current data
  const json = await fetchJsonBin();
  const record = json.record as DataRecord; // Current Data

  // 4. Create new object
  const newExercise: Exercise = {
    id: Date.now(),
    week: weekInt,  // <--- Explicitly set here
    day: dayFinal,  // <--- Explicitly set here
    name: formData.get('name') as string,
    sets: Number(formData.get('sets')),
    reps: Number(formData.get('reps')),
    weight: Number(formData.get('weight')),
    unit: formData.get('unit') as string,
    date: new Date().toLocaleDateString(),
  };

  // 5. Append to record
  if (!record[userEmail]) record[userEmail] = [];
  record[userEmail].push(newExercise);

  console.log("OBJECT BEING SAVED:", JSON.stringify(newExercise));

  // 6. Save to JSONBin (Overwrite)
  const saveRes = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY as string
    },
    body: JSON.stringify(record) // We send the updated record back
  });

  if (!saveRes.ok) {
    console.error("JSONBIN SAVE FAILED", await saveRes.text());
  } else {
    console.log("JSONBIN SAVE SUCCESS");
  }

  // 7. Force UI Refresh
  revalidatePath('/'); 
}

export async function deleteExercise(id: number) {
  const session = await getServerSession();
  if (!session?.user?.email) return;
  const userEmail = session.user.email;

  const json = await fetchJsonBin();
  const record = json.record as DataRecord;

  if (record[userEmail]) {
    record[userEmail] = record[userEmail].filter((ex: Exercise) => ex.id !== id);
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