// api/sleeper-players.js
//
// Sleeper's matchup and roster endpoints return player IDs, not names, so you
// need their player dictionary to render anything readable. That file is about
// 5 MB, which is too big to fetch on every page load and too big for
// localStorage. This trims it to name / position / team and lets Vercel's CDN
// serve the result for a day.
//
// Request:  /api/sleeper-players
// Response: { "4034": { n: "Christian McCaffrey", p: "RB", t: "SF" }, ... }

let memoryCache = null;
let cachedAt = 0;
const ONE_DAY = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  if (memoryCache && Date.now() - cachedAt < ONE_DAY) {
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
    return res.status(200).json(memoryCache);
  }

  try {
    const upstream = await fetch('https://api.sleeper.app/v1/players/nfl');
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `Sleeper returned ${upstream.status} for the player list.`,
      });
    }

    const all = await upstream.json();
    const trimmed = {};

    for (const [id, p] of Object.entries(all)) {
      if (!p) continue;
      const name = p.full_name || (p.position === 'DEF' ? `${p.team || id} D/ST` : p.last_name);
      if (!name) continue;
      trimmed[id] = {
        n: name,
        p: p.position || '',
        t: p.team || 'FA',
        ...(p.injury_status ? { i: p.injury_status } : {}),
      };
    }

    memoryCache = trimmed;
    cachedAt = Date.now();

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');
    return res.status(200).json(trimmed);
  } catch (err) {
    return res.status(500).json({ error: `Could not reach Sleeper: ${err.message}` });
  }
}
