export async function safeJson(response: Response): Promise<{ detail?: string } | null> {
  try {
    return (await response.json()) as { detail?: string };
  } catch {
    return null;
  }
}
