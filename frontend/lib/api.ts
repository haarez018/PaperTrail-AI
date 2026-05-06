const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}
