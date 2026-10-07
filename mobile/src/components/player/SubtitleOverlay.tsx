import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { activeCue, parseVtt, type Cue } from "@/lib/vtt";

/** Fetches a WebVTT track and renders the cue active at `time`. */
export function SubtitleOverlay({ url, time, raised }: { url: string | null; time: number; raised: boolean }) {
  const [cues, setCues] = useState<Cue[]>([]);

  useEffect(() => {
    setCues([]);
    if (!url) return;
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.text() : ""))
      .then((t) => setCues(parseVtt(t)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [url]);

  const cue = useMemo(() => activeCue(cues, time), [cues, time]);
  if (!cue) return null;
  return (
    <View pointerEvents="none" className="absolute right-0 left-0 items-center px-10" style={{ bottom: raised ? 92 : 28 }}>
      <Text
        className="rounded-md bg-black/60 px-3 py-1 text-center text-lg font-semibold text-white"
        style={{ textShadowColor: "#000", textShadowRadius: 4 }}
      >
        {cue.text}
      </Text>
    </View>
  );
}
