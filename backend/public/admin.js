// AnimeDelta admin UI — talks to this same origin's /api routes.
// Nothing here is secret: the admin token lives only in this browser's localStorage
// and is sent as X-Admin-Token on admin-only calls.

const TOKEN_KEY = "animedelta_admin_token";
const tokenInput = document.getElementById("token");
tokenInput.value = localStorage.getItem(TOKEN_KEY) ?? "";
tokenInput.addEventListener("input", () => localStorage.setItem(TOKEN_KEY, tokenInput.value));

async function api(path, { method = "GET", body, admin = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (admin) headers["X-Admin-Token"] = tokenInput.value;
  const res = await fetch(`/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.error ?? `${res.status} ${res.statusText}`);
  return data;
}

function setStatus(el, message, ok) {
  el.textContent = message;
  el.className = "status" + (ok === undefined ? "" : ok ? " ok" : " err");
}

// ---------- Stats ----------

const statGrid = document.getElementById("stat-grid");
const statsStatus = document.getElementById("stats-status");

function renderStats(s) {
  const cells = [
    ["Anime", s.anime],
    ["Episodes", s.episodes],
    ["Airing", s.airing],
    ["Last sync", s.lastSync ? new Date(s.lastSync.startedAt).toLocaleString() : "never"],
    ["Metadata", s.providers.metadata],
    ["Video", s.providers.video],
  ];
  statGrid.innerHTML = cells
    .map(([label, value]) => `<div class="stat"><b>${String(value)}</b><small>${label}</small></div>`)
    .join("");
}

async function refreshStats() {
  try {
    const s = await api("/admin/stats", { admin: true });
    renderStats(s);
    setStatus(statsStatus, "", undefined);
  } catch (e) {
    setStatus(statsStatus, e.message, false);
  }
}

document.getElementById("refresh-stats").addEventListener("click", refreshStats);
document.getElementById("run-sync").addEventListener("click", async () => {
  try {
    await api("/admin/sync", { method: "POST", admin: true, body: {} });
    setStatus(statsStatus, "Sync started.", true);
  } catch (e) {
    setStatus(statsStatus, e.message, false);
  }
});
refreshStats();

// ---------- Add series ----------

const episodeList = document.getElementById("episode-list");

function addEpisodeRow(url = "", title = "") {
  const row = document.createElement("div");
  row.className = "episode-row";
  row.innerHTML = `
    <input class="ep-url" placeholder="Episode video URL *" value="${url}" />
    <input class="ep-title" placeholder="Title (optional)" value="${title}" style="max-width:220px;" />
    <button type="button" class="secondary small ep-remove">Remove</button>
  `;
  row.querySelector(".ep-remove").addEventListener("click", () => {
    if (episodeList.children.length > 1) row.remove();
  });
  episodeList.appendChild(row);
}
addEpisodeRow();
document.getElementById("add-episode").addEventListener("click", () => addEpisodeRow());

// ---------- Fetch episodes from a link (YouTube playlist, or your own URL) ----------

/** Shared by both importers below: drops a {title, cover, studio, episodes} preview into the
 * "Add a series" form without overwriting anything the admin already typed. */
function applySeriesPreview(result, status) {
  const titleEl = document.getElementById("s-title");
  if (!titleEl.value.trim() && result.title) titleEl.value = result.title;
  const coverEl = document.getElementById("s-cover");
  if (!coverEl.value.trim() && result.cover) coverEl.value = result.cover;
  const bannerEl = document.getElementById("s-banner");
  if (!bannerEl.value.trim() && result.cover) bannerEl.value = result.cover;
  const studioEl = document.getElementById("s-studio");
  if (!studioEl.value.trim() && result.studio) studioEl.value = result.studio;

  episodeList.innerHTML = "";
  for (const ep of result.episodes) addEpisodeRow(ep.url, ep.title);
  if (!episodeList.children.length) addEpisodeRow();

  const label = result.title ? `"${result.title}"` : "that link";
  if (result.episodes.length === 0) {
    setStatus(status, `No usable episodes found at ${label}.`, false);
  } else {
    setStatus(
      status,
      `Loaded ${result.episodes.length} episode${result.episodes.length === 1 ? "" : "s"} from ${label}. Review below (title/episodes if blank), then Save series.`,
      true,
    );
  }
}

document.getElementById("fetch-playlist").addEventListener("click", async () => {
  const status = document.getElementById("playlist-status");
  const url = document.getElementById("yt-playlist-url").value.trim();
  if (!url) return setStatus(status, "Paste a playlist link first.", false);

  setStatus(status, "Fetching playlist from YouTube...", undefined);
  try {
    const result = await api("/admin/youtube-playlist", { method: "POST", admin: true, body: { url } });
    applySeriesPreview(result, status);
  } catch (e) {
    setStatus(status, e.message, false);
  }
});

document.getElementById("fetch-import-url").addEventListener("click", async () => {
  const status = document.getElementById("import-url-status");
  const url = document.getElementById("generic-import-url").value.trim();
  if (!url) return setStatus(status, "Paste a URL first.", false);

  setStatus(status, "Fetching episodes...", undefined);
  try {
    const result = await api("/admin/import-url", { method: "POST", admin: true, body: { url } });
    applySeriesPreview(result, status);
  } catch (e) {
    setStatus(status, e.message, false);
  }
});

document.getElementById("submit-series").addEventListener("click", async () => {
  const seriesStatus = document.getElementById("series-status");
  const title = document.getElementById("s-title").value.trim();
  if (!title) return setStatus(seriesStatus, "Title is required.", false);

  const episodes = [...episodeList.querySelectorAll(".episode-row")]
    .map((row) => ({
      url: row.querySelector(".ep-url").value.trim(),
      title: row.querySelector(".ep-title").value.trim() || undefined,
    }))
    .filter((e) => e.url);
  if (episodes.length === 0) return setStatus(seriesStatus, "At least one episode URL is required.", false);

  const year = document.getElementById("s-year").value;
  const genres = document
    .getElementById("s-genres")
    .value.split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  const body = {
    title,
    nativeTitle: document.getElementById("s-native").value.trim() || undefined,
    description: document.getElementById("s-desc").value.trim() || undefined,
    cover: document.getElementById("s-cover").value.trim() || undefined,
    banner: document.getElementById("s-banner").value.trim() || undefined,
    year: year ? Number(year) : undefined,
    season: document.getElementById("s-season").value || undefined,
    status: document.getElementById("s-status").value,
    type: document.getElementById("s-type").value,
    studio: document.getElementById("s-studio").value.trim() || undefined,
    genres,
    episodes,
  };

  try {
    const result = await api("/admin/library-series", { method: "POST", admin: true, body });
    setStatus(seriesStatus, `Saved. Series: ${result.series}, episodes: ${result.episodes} (${result.created} new).`, true);
    refreshStats();
  } catch (e) {
    setStatus(seriesStatus, e.message, false);
  }
});

// ---------- Attach source to existing episode ----------

const searchInput = document.getElementById("search-q");
const searchResults = document.getElementById("search-results");
const episodePicker = document.getElementById("episode-picker");
const episodeResults = document.getElementById("episode-results");
const sourceForms = document.getElementById("source-forms");
const selectedEpisodeLabel = document.getElementById("selected-episode-label");

let searchTimer = null;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const q = searchInput.value.trim();
  if (!q) {
    searchResults.innerHTML = "";
    return;
  }
  searchTimer = setTimeout(async () => {
    try {
      const { items } = await api(`/anime?q=${encodeURIComponent(q)}&limit=10`);
      searchResults.innerHTML = "";
      for (const a of items) {
        const div = document.createElement("div");
        div.className = "result-item";
        div.innerHTML = `<span>${a.title}${a.year ? ` (${a.year})` : ""}</span><span class="muted">${a.type}</span>`;
        div.addEventListener("click", () => selectAnime(a));
        searchResults.appendChild(div);
      }
    } catch (e) {
      searchResults.innerHTML = `<div class="status err">${e.message}</div>`;
    }
  }, 300);
});

async function selectAnime(anime) {
  episodePicker.style.display = "block";
  sourceForms.style.display = "none";
  episodeResults.innerHTML = "Loading...";
  try {
    const { seasons } = await api(`/anime/${anime.id}/episodes`);
    episodeResults.innerHTML = "";
    for (const season of seasons) {
      for (const ep of season.episodes) {
        const div = document.createElement("div");
        div.className = "ep-item result-item";
        div.innerHTML = `<span>${season.title}: Ep ${ep.episodeNumber} — ${ep.title}</span>`;
        div.addEventListener("click", () => selectEpisode(anime, ep));
        episodeResults.appendChild(div);
      }
    }
    if (!episodeResults.children.length) episodeResults.innerHTML = '<p class="muted">No episodes yet.</p>';
  } catch (e) {
    episodeResults.innerHTML = `<div class="status err">${e.message}</div>`;
  }
}

let selectedEpisodeId = null;
function selectEpisode(anime, ep) {
  selectedEpisodeId = ep.id;
  selectedEpisodeLabel.textContent = `${anime.title} — Episode ${ep.episodeNumber}: ${ep.title}`;
  sourceForms.style.display = "block";
  setStatus(document.getElementById("source-status"), "", undefined);
  setStatus(document.getElementById("subtitle-status"), "", undefined);
}

document.getElementById("submit-source").addEventListener("click", async () => {
  const status = document.getElementById("source-status");
  const url = document.getElementById("ms-url").value.trim();
  if (!selectedEpisodeId) return setStatus(status, "Pick an episode first.", false);
  if (!url) return setStatus(status, "Video URL is required.", false);
  try {
    await api("/admin/media-sources", {
      method: "POST",
      admin: true,
      body: {
        episodeId: selectedEpisodeId,
        url,
        quality: document.getElementById("ms-quality").value.trim() || "auto",
        mimeType: document.getElementById("ms-mime").value.trim() || undefined,
        note: document.getElementById("ms-note").value.trim() || undefined,
      },
    });
    setStatus(status, "Video source added.", true);
  } catch (e) {
    setStatus(status, e.message, false);
  }
});

document.getElementById("submit-subtitle").addEventListener("click", async () => {
  const status = document.getElementById("subtitle-status");
  const language = document.getElementById("sub-lang").value.trim();
  const label = document.getElementById("sub-label").value.trim();
  const url = document.getElementById("sub-url").value.trim();
  if (!selectedEpisodeId) return setStatus(status, "Pick an episode first.", false);
  if (!language || !label || !url) return setStatus(status, "Language, label and URL are all required.", false);
  try {
    await api("/admin/subtitles", { method: "POST", admin: true, body: { episodeId: selectedEpisodeId, language, label, url } });
    setStatus(status, "Subtitle added.", true);
  } catch (e) {
    setStatus(status, e.message, false);
  }
});
