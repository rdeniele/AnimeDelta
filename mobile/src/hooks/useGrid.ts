import { useWindowDimensions } from "react-native";

const PAD = 16;
const GAP = 12;

/** Responsive card sizing for phones, tablets and landscape. */
export function useGridMetrics() {
  const { width } = useWindowDimensions();
  const target = width >= 900 ? 150 : width >= 600 ? 140 : 112;
  const columns = Math.max(3, Math.floor((width - PAD * 2 + GAP) / (target + GAP)));
  const cardWidth = Math.floor((width - PAD * 2 - GAP * (columns - 1)) / columns);
  return {
    width,
    columns,
    cardWidth,
    gap: GAP,
    pad: PAD,
    railPoster: width >= 900 ? 160 : width >= 600 ? 140 : 120,
    railWide: width >= 900 ? 300 : width >= 600 ? 260 : Math.min(240, Math.round(width * 0.62)),
    isTablet: width >= 600,
  };
}
