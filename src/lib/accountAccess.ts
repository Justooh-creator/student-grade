/** Account access never depends on payment or license status. */
export const accountHome = "/setup" as const;

export function canOpenApp(user: { id: string } | null, error: unknown): boolean {
  return Boolean(user?.id) && !error;
}

export function signupNextStep(session: unknown): "open-app" | "confirm-email" {
  return session ? "open-app" : "confirm-email";
}