import { forwardRef, useImperativeHandle } from "react";

export interface EmbedHandle {
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
}

interface Props {
  videoId: string;
  width: number;
  height: number;
  startSeconds: number;
  onEnded: () => void;
  onError: (code: string) => void;
}

/** Web fallback: plain official embed (no progress tracking). */
export const YouTubeEmbed = forwardRef<EmbedHandle, Props>(function YouTubeEmbed({ videoId, width, height, startSeconds }, ref) {
  useImperativeHandle(ref, () => ({ getCurrentTime: async () => 0, getDuration: async () => 0 }));
  return (
    <iframe
      title="YouTube player"
      width={width}
      height={height}
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&start=${Math.floor(startSeconds)}`}
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen
      style={{ border: 0 }}
    />
  );
});
