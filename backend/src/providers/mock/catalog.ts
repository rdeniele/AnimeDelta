import type { AnimeDTO, AnimeSeasonDTO, AnimeStatusDTO, AnimeTypeDTO, EpisodeDTO } from "../types.js";

/** Fictional titles only; artwork comes from a placeholder image service. */
type Row = [
  slug: string,
  english: string,
  native: string,
  genres: string[],
  studio: string,
  type: AnimeTypeDTO,
  status: AnimeStatusDTO,
  rating: number,
  /** weeks relative to now when episode 1 aired (negative = past) */
  startWeeks: number,
  episodes: number,
];

const ROWS: Row[] = [
  ["starlit-blade", "Starlit Blade Chronicles", "星刃年代記", ["Action", "Fantasy", "Adventure"], "Studio Kōmei", "TV", "AIRING", 8.7, -5, 12],
  ["neon-ronin", "Neon Ronin", "ネオン浪人", ["Action", "Sci-Fi", "Thriller"], "Orbit Works", "TV", "AIRING", 8.4, -3, 13],
  ["moonlit-cafe", "The Moonlit Café", "月夜の喫茶店", ["Slice of Life", "Romance", "Comedy"], "Pale Fox", "TV", "AIRING", 8.1, -6, 12],
  ["aether-academy", "Aether Academy", "エーテル学園", ["Fantasy", "Adventure", "Comedy"], "Studio Kōmei", "TV", "AIRING", 7.9, -2, 24],
  ["crimson-tide", "Crimson Tide Requiem", "紅潮レクイエム", ["Horror", "Mystery", "Supernatural"], "Nightbloom", "TV", "AIRING", 8.8, -4, 12],
  ["mecha-vanguard", "Vanguard Zero", "ヴァンガード・ゼロ", ["Action", "Sci-Fi", "Drama"], "Orbit Works", "TV", "AIRING", 8.0, -1, 12],
  ["pitch-perfect", "Last Inning Dreams", "九回裏の夢", ["Sports", "Drama"], "Redline", "TV", "AIRING", 8.3, -7, 25],
  ["cloud-courier", "Cloud Courier Mei", "雲の配達人メイ", ["Adventure", "Slice of Life", "Fantasy"], "Pale Fox", "TV", "AIRING", 8.5, -4, 12],
  ["shadow-archive", "Shadow Archive", "影の文書館", ["Mystery", "Thriller", "Supernatural"], "Nightbloom", "TV", "AIRING", 8.2, -2, 12],
  ["ocean-hymn", "Hymn of the Deep", "深海の讃歌", ["Fantasy", "Drama", "Romance"], "Studio Kōmei", "TV", "AIRING", 8.6, -8, 13],
  ["iron-saints", "Iron Saints", "鋼の聖者たち", ["Action", "Drama", "Supernatural"], "Redline", "TV", "FINISHED", 8.9, -40, 24],
  ["paper-lanterns", "Paper Lantern Summer", "提灯の夏", ["Romance", "Slice of Life", "Drama"], "Pale Fox", "TV", "FINISHED", 8.6, -45, 12],
  ["void-walker", "Void Walker", "虚空の旅人", ["Sci-Fi", "Adventure", "Mystery"], "Orbit Works", "TV", "FINISHED", 8.3, -60, 26],
  ["kitsune-court", "Kitsune Court", "狐の宮廷", ["Fantasy", "Romance", "Supernatural"], "Studio Kōmei", "TV", "FINISHED", 8.1, -52, 24],
  ["gridiron-blaze", "Gridiron Blaze", "グリッドアイアン", ["Sports", "Comedy"], "Redline", "TV", "FINISHED", 7.7, -70, 25],
  ["haunted-lens", "The Haunted Lens", "憑かれたレンズ", ["Horror", "Thriller"], "Nightbloom", "OVA", "FINISHED", 7.5, -30, 4],
  ["dragon-postal", "Dragon Postal Service", "竜の郵便局", ["Comedy", "Fantasy", "Adventure"], "Pale Fox", "TV", "FINISHED", 8.0, -80, 12],
  ["glass-horizon", "Glass Horizon", "硝子の地平", ["Sci-Fi", "Romance", "Drama"], "Orbit Works", "MOVIE", "FINISHED", 9.0, -100, 1],
  ["midnight-ramen", "Midnight Ramen Stories", "深夜ラーメン物語", ["Slice of Life", "Comedy"], "Pale Fox", "ONA", "FINISHED", 7.8, -35, 10],
  ["spirit-detective", "Spirit Detective Ayame", "霊探偵アヤメ", ["Mystery", "Supernatural", "Comedy"], "Nightbloom", "TV", "FINISHED", 8.2, -90, 24],
  ["tempest-knights", "Tempest Knights", "嵐の騎士団", ["Action", "Fantasy", "Adventure"], "Redline", "TV", "FINISHED", 8.4, -120, 26],
  ["echo-colony", "Echo Colony", "エコー・コロニー", ["Sci-Fi", "Thriller", "Drama"], "Orbit Works", "TV", "FINISHED", 8.5, -110, 13],
  ["sakura-circuit", "Sakura Circuit", "桜サーキット", ["Sports", "Romance"], "Redline", "TV", "FINISHED", 7.6, -65, 12],
  ["bone-orchard", "Bone Orchard", "骨の果樹園", ["Horror", "Fantasy", "Mystery"], "Nightbloom", "TV", "FINISHED", 8.0, -75, 12],
  ["lantern-sea", "Lantern Sea Special", "ランタンの海", ["Fantasy", "Slice of Life"], "Pale Fox", "SPECIAL", "FINISHED", 7.4, -25, 1],
  ["cosmic-bakery", "Cosmic Bakery", "宇宙パン工房", ["Comedy", "Sci-Fi", "Slice of Life"], "Pale Fox", "TV", "FINISHED", 7.9, -55, 12],
  ["silver-wolf", "Silver Wolf Oath", "銀狼の誓い", ["Action", "Fantasy", "Drama"], "Studio Kōmei", "MOVIE", "FINISHED", 8.7, -48, 1],
  ["azure-protocol", "Azure Protocol", "アズール・プロトコル", ["Sci-Fi", "Action", "Mystery"], "Orbit Works", "TV", "FINISHED", 8.1, -85, 12],
  ["thunder-strings", "Thunder Strings", "雷の弦", ["Drama", "Slice of Life", "Romance"], "Redline", "TV", "FINISHED", 8.3, -95, 13],
  ["abyss-rangers", "Abyss Rangers", "深淵レンジャーズ", ["Action", "Horror", "Sci-Fi"], "Nightbloom", "TV", "CANCELLED", 6.9, -38, 6],
  ["bamboo-chronicle", "Bamboo Chronicle", "竹取演義", ["Fantasy", "Drama", "Adventure"], "Studio Kōmei", "TV", "FINISHED", 8.2, -130, 26],
  ["crown-of-embers", "Crown of Embers", "燼の王冠", ["Action", "Fantasy", "Thriller"], "Redline", "TV", "UPCOMING", 0, 3, 12],
  ["velvet-orbit", "Velvet Orbit", "ベルベット・オービット", ["Sci-Fi", "Romance"], "Orbit Works", "TV", "UPCOMING", 0, 5, 12],
  ["ghost-train", "Midnight Ghost Train", "真夜中の幽霊列車", ["Horror", "Mystery", "Supernatural"], "Nightbloom", "TV", "UPCOMING", 0, 2, 12],
  ["tea-and-thunder", "Tea & Thunder", "お茶と雷", ["Comedy", "Slice of Life", "Fantasy"], "Pale Fox", "TV", "UPCOMING", 0, 8, 12],
  ["rival-stars", "Rival Stars Academy", "ライバルスターズ", ["Sports", "Drama", "Comedy"], "Redline", "TV", "UPCOMING", 0, 10, 24],
  ["wraith-signal", "Wraith Signal", "亡霊の信号", ["Thriller", "Sci-Fi", "Horror"], "Orbit Works", "ONA", "AIRING", 7.8, -1, 8],
  ["petal-storm", "Petal Storm Girls", "花嵐少女", ["Action", "Romance", "Comedy"], "Pale Fox", "TV", "FINISHED", 7.5, -42, 12],
  ["clockwork-sky", "Clockwork Sky", "歯車の空", ["Adventure", "Sci-Fi", "Fantasy"], "Studio Kōmei", "TV", "FINISHED", 8.4, -140, 24],
];

const WEEK = 7 * 24 * 3600 * 1000;
const DESCRIPTIONS = [
  "When an ancient rift tears open above a quiet town, an unlikely group must decide what they are willing to give up to seal it.",
  "Every night the city changes. Only a handful of people remember the version of the world that came before.",
  "A reluctant hero, a talkative companion and a map that rewrites itself. The journey is stranger than the destination.",
  "Small moments, big feelings: a season in the lives of people who never quite say what they mean.",
  "Rivals become allies when the final tournament reveals a secret the whole league has been hiding.",
];

function seasonOf(date: Date): AnimeSeasonDTO {
  const m = date.getUTCMonth();
  return m < 3 ? "WINTER" : m < 6 ? "SPRING" : m < 9 ? "SUMMER" : "FALL";
}

export function buildCatalog(now = new Date()): AnimeDTO[] {
  return ROWS.map((r, i) => {
    const [slug, english, native, genres, studio, type, status, rating, startWeeks, episodes] = r;
    const start = new Date(now.getTime() + startWeeks * WEEK);
    start.setUTCHours(15, 0, 0, 0);
    return {
      externalId: slug,
      title: english,
      englishTitle: english,
      nativeTitle: native,
      synonyms: [slug.replace(/-/g, " "), english.split(" ").slice(0, 2).join(" ")],
      description: DESCRIPTIONS[i % DESCRIPTIONS.length],
      coverImage: `https://picsum.photos/seed/${slug}-p/400/600`,
      bannerImage: `https://picsum.photos/seed/${slug}-b/1280/720`,
      year: start.getUTCFullYear(),
      month: start.getUTCMonth() + 1,
      season: seasonOf(start),
      status,
      type,
      rating: rating > 0 ? rating : null,
      popularity: Math.round(((ROWS.length - i) / ROWS.length) * 100000) + ((i * 7919) % 500),
      duration: type === "MOVIE" ? 110 : type === "TV" ? 24 : 12,
      episodeCount: episodes,
      studio,
      startDate: start,
      genres,
    };
  });
}

export function buildEpisodes(anime: AnimeDTO): EpisodeDTO[] {
  const total = anime.episodeCount ?? 12;
  const start = anime.startDate ?? new Date();
  // Long runs are split into two cours so the season picker has something to show.
  const split = total > 13 ? Math.ceil(total / 2) : total;
  return Array.from({ length: total }, (_, n) => {
    const number = n + 1;
    const seasonNumber = number > split ? 2 : 1;
    const local = seasonNumber === 2 ? number - split : number;
    return {
      seasonNumber,
      episodeNumber: local,
      title: anime.type === "MOVIE" ? anime.title : `Episode ${local}: ${EP_TITLES[n % EP_TITLES.length]}`,
      description: `${anime.title}, episode ${local}. ${DESCRIPTIONS[(n + 1) % DESCRIPTIONS.length]}`,
      thumbnail: `https://picsum.photos/seed/${anime.externalId}-e${number}/480/270`,
      releaseDate: new Date(start.getTime() + n * WEEK),
      duration: anime.duration ?? 24,
    };
  });
}

const EP_TITLES = [
  "The Door at Dusk", "A Name Left Behind", "Static", "What the River Knew", "Borrowed Light",
  "The Long Way Round", "Ash and Honey", "Paper Wings", "No Return Address", "Hollow Bells",
  "The Quiet Before", "Starfall", "Second Chances", "Crossed Wires", "The Weight of Rain",
];
