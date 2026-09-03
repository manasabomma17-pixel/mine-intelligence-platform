export async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, options);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
