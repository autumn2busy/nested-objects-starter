// TEMP: permissive gate so pages don't crash until Outseta/JWT is wired.
export async function requireFeature(_featureKey: string): Promise<boolean> {
  return true;
}
