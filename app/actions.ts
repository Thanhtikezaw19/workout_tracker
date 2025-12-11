'use server'

import { getServerSession } from "next-auth";

// Define the shape of our data
export interface Exercise {
  id: number;
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

export async function getData(): Promise<Exercise[]> {
  const session = await getServerSession();
  if (!session?.user?.email) return [];

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY as string },
      cache: 'no-store' // Ensure we always get fresh data
    });

    if (!res.ok) return [];

    const json = await res.json();
    const record = json.record as DataRecord;
    
    // Return only the logged-in user's data
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

  // 1. Fetch current data
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY as string },
    cache: 'no-store'
  });
  const json = await res.json();
  const record = json.record as DataRecord;

  // 2. Create new exercise object
  const newExercise: Exercise = {
    id: Date.now(),
    name: formData.get('name') as string,
    sets: Number(formData.get('sets')),
    reps: Number(formData.get('reps')),
    weight: Number(formData.get('weight')),
    unit: formData.get('unit') as string,
    date: new Date().toLocaleDateString(),
  };

  // 3. Append to user's list
  if (!record[userEmail]) {
    record[userEmail] = [];
  }
  record[userEmail].push(newExercise);

  // 4. Overwrite JSONBin
  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY as string
    },
    body: JSON.stringify(record)
  });
}

export async function deleteExercise(id: number) {
  const session = await getServerSession();
  if (!session?.user?.email) return;

  const userEmail = session.user.email;

  // 1. Fetch
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY as string },
    cache: 'no-store'
  });
  const json = await res.json();
  const record = json.record as DataRecord;

  // 2. Filter out the item
  if (record[userEmail]) {
    record[userEmail] = record[userEmail].filter((ex: Exercise) => ex.id !== id);
  }

  // 3. Save
  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY as string
    },
    body: JSON.stringify(record)
  });
}