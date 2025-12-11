'use server'
import { getServerSession } from "next-auth";

const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;

// READ DATA
export async function getData() {
  const session = await getServerSession();
  if (!session) return [];

  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY }
  });
  
  const json = await res.json();
  const allData = json.record || {};
  
  // Return only this user's data
  return allData[session.user.email] || [];
}

// WRITE DATA (APPEND)
export async function addExercise(formData) {
  const session = await getServerSession();
  if (!session) return;

  // 1. Get current data
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY }
  });
  const json = await res.json();
  let allData = json.record || {};

  // 2. Prepare new entry
  const newEntry = {
    id: Date.now(),
    name: formData.get('name'),
    sets: formData.get('sets'),
    reps: formData.get('reps'),
    weight: formData.get('weight'),
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
}

// DELETE DATA
export async function deleteExercise(id) {
  const session = await getServerSession();
  if (!session) return;

  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Master-Key': API_KEY }
  });
  const json = await res.json();
  let allData = json.record;

  // Filter out the item
  allData[session.user.email] = allData[session.user.email].filter(item => item.id !== id);

  await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY 
    },
    body: JSON.stringify(allData)
  });
}