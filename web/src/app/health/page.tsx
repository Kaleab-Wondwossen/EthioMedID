export default async function HealthPage() {
  const res = await fetch('http://localhost:4000/health', { cache: 'no-store' });
  const data = await res.json();
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
