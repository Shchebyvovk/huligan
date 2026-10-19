// Платформа за дизайном симулює "до 10 000 users" (CLAUDE.md) — ця межа
// захищає сам оркестратор: без неї run.concurrency іде напряму в
// Array.from({length: concurrency}) (runJob.js), і довільно велике число
// валить процес по пам'яті ще до першого мережевого запиту.
export const MAX_CONCURRENCY = 10000;
