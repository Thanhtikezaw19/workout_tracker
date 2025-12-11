'use client';
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { getData, addExercise, deleteExercise } from "./actions";

export default function Home() {
  const { data: session } = useSession();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data when logged in
  useEffect(() => {
    if (session) {
      refreshData();
    }
  }, [session]);

  const refreshData = async () => {
    const data = await getData();
    setExercises(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    await addExercise(formData);
    e.target.reset();
    await refreshData();
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if(!confirm("Delete this log?")) return;
    await deleteExercise(id);
    await refreshData();
  };

  if (!session) {
    return (
      <div style={styles.container}>
        <h1>Gym Tracker</h1>
        <button onClick={() => signIn('google')} style={styles.btn}>Login with Gmail</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>Hi, {session.user.name}</span>
        <button onClick={() => signOut()} style={styles.smallBtn}>Logout</button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input name="name" placeholder="Exercise Name" required style={styles.input} />
        <div style={styles.row}>
          <input name="sets" type="number" placeholder="Sets" required style={styles.input} />
          <input name="reps" type="number" placeholder="Reps" required style={styles.input} />
        </div>
        <div style={styles.row}>
          <input name="weight" type="number" placeholder="Weight" required style={styles.input} />
          <select name="unit" style={styles.input}>
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
          </select>
        </div>
        <button type="submit" disabled={loading} style={styles.btn}>
          {loading ? "Saving..." : "Add Log"}
        </button>
      </form>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Exercise</th>
            <th>S / R</th>
            <th>Weight</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((ex) => (
            <tr key={ex.id}>
              <td>
                <b>{ex.name}</b><br/>
                <small>{ex.date}</small>
              </td>
              <td>{ex.sets} x {ex.reps}</td>
              <td>{ex.weight} {ex.unit}</td>
              <td>
                <button onClick={() => handleDelete(ex.id)} style={{color:'red'}}>X</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Simple internal CSS for mobile-first look
const styles = {
  container: { padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px', background: '#f9f9f9', padding: '15px', borderRadius: '10px' },
  row: { display: 'flex', gap: '10px' },
  input: { padding: '10px', width: '100%', borderRadius: '5px', border: '1px solid #ddd' },
  btn: { padding: '12px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' },
  smallBtn: { padding: '5px 10px', background: '#ccc', border: 'none', borderRadius: '5px' },
  table: { width: '100%', borderCollapse: 'collapse' }
};