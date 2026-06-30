export const SAFE_NAME = /^[a-zA-Z0-9_-]+$/;

export function assertSafeName(name) {
  if (!SAFE_NAME.test(name)) {
    throw new Error("name must contain only letters, digits, - and _");
  }
}
