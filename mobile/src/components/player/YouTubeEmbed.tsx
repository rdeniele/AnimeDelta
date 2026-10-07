import { forwardRef, useImperativeHandle, useRef } from "react";
import YoutubeIframe, { type YoutubeIframeRef } from "react-native-youtube-iframe";

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

/** Official YouTube IFrame player inside a WebView (native). */
export const YouTubeEmbed = forwardRef<EmbedHandle, Props>(function YouTubeEmbed({ videoId, width, height, startSeconds, onEnded, onError }, ref) {
  const inner = useRef<YoutubeIframeRef>(null);
  useImperativeHandle(ref, () => ({
    getCurrentTime: async () => (await inner.current?.getCurrentTime()) ?? 0,
    getDuration: async () => (await inner.current?.getDuration()) ?? 0,
  }));
  return (
    <YoutubeIframe
      ref={inner}
      videoId={videoId}
      width={width}
      height={height}
      play
      initialPlayerParams={{ start: Math.floor(startSeconds), controls: true, rel: false }}
      webViewProps={{ allowsInlineMediaPlayback: true, androidLayerType: "hardware" }}
      onChangeState={(s: string) => s === "ended" && onEnded()}
      onError={onError}
    />
  );
});
