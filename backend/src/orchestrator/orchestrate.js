export async function orchestrate({ users, concurrency, worker, onProgress, rampUpMs = 0 }) {
  const results = new Array(users.length);
  let index = 0;
  let completed = 0;
  const startTime = Date.now();

  async function runNext() {
    while (index < users.length) {
      const i = index++;

      // Ramp-up: user i повинен стартувати не раніше ніж (i / total) * rampUpMs
      if (rampUpMs > 0) {
        const targetMs = Math.round((i / users.length) * rampUpMs);
        const wait = targetMs - (Date.now() - startTime);
        if (wait > 0) await new Promise(res => setTimeout(res, wait));
      }

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
