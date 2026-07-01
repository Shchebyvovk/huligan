export async function orchestrate({ users, concurrency, worker, onProgress, rampUpMs = 0 }) {
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
  const delayPerSlot = rampUpMs > 0 ? rampUpMs / slots : 0;

  const promises = Array.from({ length: slots }, (_, i) =>
    new Promise(res => setTimeout(res, Math.round(delayPerSlot * i))).then(runNext)
  );

  await Promise.all(promises);
  return results;
}
