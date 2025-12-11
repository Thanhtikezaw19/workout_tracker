'use server'
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache"; // <--- IMPORT THIS

const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;

// READ DATA
export async function getData() {
  const session = await getServerSession();
  if (!session) return [];

  // Add cache: 'no-store' to ensure we always get the latest data
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY },
    cache: 'no-store' 
  });
  
  if (!res.ok) return [];

  const json = await res.json();
  const allData = json.record || {};
  
  // Return only this user's data
  return allData[session.user.email] || [];
}

// WRITE DATA (APPEND)
export async function addExercise(formData) {
  const session = await getServerSession();
  if (!session) return;

  // 1. Get current data (Force fresh fetch)
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY },
    cache: 'no-store'
  });
  
  const json = await res.json();
  let allData = json.record || {};

  // 2. Prepare new entry (INCLUDE WEEK AND DAY HERE)
  const newEntry = {
    id: Date.now(),
    week: Number(formData.get('week')) || 1, // <--- Capture Week
    day: formData.get('day') || "Day 1",     // <--- Capture Day
    name: formData.get('name'),
    sets: Number(formData.get('sets')),
    reps: Number(formData.get('reps')),
    weight: Number(formData.get('weight')),
    unit: formData.get('unit'),
    date: new Date().toLocaleDateString()
  };

  // 3. Update local object
  const userEmail = session.user.email;
  if (!allData[userEmail]) allData[userEmail] = [];
  allData[userEmail].push(newEntry);

  // 4. Overwrite the JSON file on the server
  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY 
    },
    body: JSON.stringify(allData)
  });

  // 5. Refresh the UI
  revalidatePath('/');
}

// DELETE DATA
export async function deleteExercise(id) {
  const session = await getServerSession();
  if (!session) return;

  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY },
    cache: 'no-store'
  });
  const json = await res.json();
  let allData = json.record || {};

  // Filter out the item
  if (allData[session.user.email]) {
      allData[session.user.email] = allData[session.user.email].filter(item => item.id !== id);
  }

  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY 
    },
    body: JSON.stringify(allData)
  });

  revalidatePath('/');
}