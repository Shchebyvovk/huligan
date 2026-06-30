export function mergeSettings(defaults, userSettings) {
  const result = { ...defaults };
  if (!userSettings) return result;

  for (const key of Object.keys(defaults)) {
    if (userSettings[key] !== undefined) {
      result[key] = userSettings[key];
    }
  }

  return result;
}
