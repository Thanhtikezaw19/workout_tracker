'use server'

import { getServerSession } from "next-auth";

// 1. Define the complete structure of your data
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

// READ DATA
export async function getData(): Promise<Exercise[]> {
  const session = await getServerSession();
  if (!session?.user?.email) return [];

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY as string },
      cache: 'no-store'
    });

    if (!res.ok) return [];

    const json = await res.json();
    const record = json.record as DataRecord;
    return record[session.user.email] || [];
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}

// SAVE DATA
export async function addExercise(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) return;

  const userEmail = session.user.email;

  // 1. Fetch current data
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY as string },
    cache: 'no-store'
  });
  const json = await res.json();
  const record = json.record as DataRecord;

  // 2. Parse inputs with fallbacks
  const rawWeek = formData.get('week');
  const week = rawWeek ? Number(rawWeek) : 1;
  
  const rawDay = formData.get('day');
  const day = rawDay ? (rawDay as string) : "Day 1";

  // 3. Create new object
  console.log("Everygoing to add exercise for week:", week, "day:", day);
  const newExercise: Exercise = {
    id: Date.now(),
    week: week,    // Saving the week
    day: day,      // Saving the day
    name: formData.get('name') as string,
    sets: Number(formData.get('sets')),
    reps: Number(formData.get('reps')),
    weight: Number(formData.get('weight')),
    unit: formData.get('unit') as string,
    date: new Date().toLocaleDateString(),
  };

  // 4. Update and Save
  if (!record[userEmail]) {
    record[userEmail] = [];
  }
  record[userEmail].push(newExercise);

  console.log("Record after addition:", record[userEmail]);

  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY as string
    },
    body: JSON.stringify(record)
  });
}

// DELETE DATA
export async function deleteExercise(id: number) {
  const session = await getServerSession();
  if (!session?.user?.email) return;

  const userEmail = session.user.email;

  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY as string },
    cache: 'no-store'
  });
  const json = await res.json();
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
}