/** Opens a video-call link in a centered app-window-style popup. */
export function openCallPopup(url: string) {
  const w = 1100;
  const h = 720;
  const left = Math.max(0, (window.screen.width - w) / 2);
  const top = Math.max(0, (window.screen.height - h) / 2);
  window.open(
    url,
    "aliice_video_call",
    `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes,noopener`
  );
}
