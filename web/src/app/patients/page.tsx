'use client';

import { useEffect, useState, ChangeEvent } from 'react';

type Patient = { id: string; name: string };

export default function PatientsPage() {
  const [list, setList] = useState<Patient[]>([]);
  const [id, setId] = useState<string>('');
  const [name, setName] = useState<string>('');

  useEffect(() => {
    (async () => {
      const res = await fetch('http://localhost:4000/patients', { cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const data: Patient[] = await res.json();
      setList(data);
    })().catch(console.error);
  }, []);

  async function add() {
    const res = await fetch('http://localhost:4000/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    });
    if (res.ok) {
      setList(prev => [...prev, { id, name }]);
      setId('');
      setName('');
    } else {
      alert(await res.text());
    }
  }

  function onChangeId(e: ChangeEvent<HTMLInputElement>) {
    setId(e.target.value);
  }
  function onChangeName(e: ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Patients</h1>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input placeholder="id" value={id} onChange={onChangeId} />
        <input placeholder="name" value={name} onChange={onChangeName} />
        <button onClick={add}>Add</button>
      </div>
      <ul>
        {list.map((p) => (
          <li key={p.id}>
            {p.id} — {p.name}
          </li>
        ))}
      </ul>
    </main>
  );
}
