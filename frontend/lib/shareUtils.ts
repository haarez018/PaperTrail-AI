/**
 * Web Share API wrapper for NyayaMitra case plan sharing.
 * Falls back to clipboard copy on platforms that don't support navigator.share.
 */

export function canShare(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator;
}

export async function shareText(
  title: string,
  text: string,
  url?: string
): Promise<"shared" | "copied" | "error"> {
  if (canShare()) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (err) {
      // User cancelled — not a real error
      if ((err as Error).name === "AbortError") return "error";
    }
  }

  // Fallback: copy to clipboard
  const content = url ? `${text}\n\n${url}` : text;
  try {
    await navigator.clipboard.writeText(content);
    return "copied";
  } catch {
    // Older browsers
    const el = document.createElement("textarea");
    el.value = content;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    return "copied";
  }
}
