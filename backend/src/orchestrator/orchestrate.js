export async function orchestrate({ users, concurrency, worker, onProgress }) {
  const results = new Array(users.length);
  let index = 0;
  let completed = 0;

  async function runNext() {
    while (index < users.length) {
      const i = index++;
      try {
        results[i] = await worker(users[i]);
      } catch (err) {
        results[i] = { ok: false, error: err.message };
      }
      completed++;
      if (onProgress) onProgress(completed, users.length);
    }
  }

  const slots = Math.min(concurrency, users.length);
  await Promise.all(Array.from({ length: slots }, runNext));

  return results;
}
