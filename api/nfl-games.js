// api/nfl-games.js
//
// Live NFL game state, used to print "@BUF 10-0, 15:00 2nd" under each player
// and to count how many are in play versus still to play.
//
// This is ESPN's public site scoreboard, not the fantasy API. It needs no
// auth. It is stable and long-lived but not a contract, so every failure path
// returns an empty object and the dashboard simply renders without game lines.
//
// Request:  /api/nfl-games?week=4&season=2026
// Response: { "BUF": { line: "@BUF 10-0", clock: "15:00 2nd", state: "in" }, ... }
//           keyed by team abbreviation, one entry per team playing that week.

const ESPN_TO_FANTASY = { WSH: 'WSH', LAR: 'LAR', LAC: 'LAC', LV: 'LV', JAX: 'JAX' };

function normalizeAbbrev(abbrev) {
  if (!abbrev) return '';
  const upper = String(abbrev).toUpperCase();
  return ESPN_TO_FANTASY[upper] || upper;
}

export default async function handler(req, res) {
  const week = Number(req.query.week) || null;
  const season = Number(req.query.season) || null;

  const params = new URLSearchParams();
  if (week && season) {
    params.set('week', String(week));
    params.set('dates', String(season));
    params.set('seasontype', '2');
  }

  const url =
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' +
    (params.toString() ? `?${params}` : '');

  try {
    const upstream = await fetch(url, { headers: { accept: 'application/json' } });
    if (!upstream.ok) {
      res.setHeader('Cache-Control', 's-maxage=30');
      return res.status(200).json({});
    }

    const data = await upstream.json();
    const events = Array.isArray(data?.events) ? data.events : [];
    const out = {};

    for (const event of events) {
      const comp = event?.competitions?.[0];
      const competitors = comp?.competitors;
      if (!Array.isArray(competitors) || competitors.length < 2) continue;

      const status = comp?.status || event?.status || {};
      const state = status?.type?.state || 'pre'; // pre | in | post
      const period = status?.period;
      const displayClock = status?.displayClock;

      const home = competitors.find((c) => c?.homeAway === 'home') || competitors[0];
      const away = competitors.find((c) => c?.homeAway === 'away') || competitors[1];

      const homeAb = normalizeAbbrev(home?.team?.abbreviation);
      const awayAb = normalizeAbbrev(away?.team?.abbreviation);
      if (!homeAb || !awayAb) continue;

      const homeScore = Number(home?.score);
      const awayScore = Number(away?.score);
      const haveScores = Number.isFinite(homeScore) && Number.isFinite(awayScore);

      let clock = null;
      if (state === 'in') {
        const ordinal = period === 1 ? '1st' : period === 2 ? '2nd'
          : period === 3 ? '3rd' : period === 4 ? '4th'
          : period > 4 ? 'OT' : '';
        clock = [displayClock, ordinal].filter(Boolean).join(' ') || 'In progress';
      } else if (state === 'post') {
        clock = status?.type?.shortDetail?.includes('Final')
          ? status.type.shortDetail
          : 'Final';
      } else {
        // Pre-game: show the kickoff time the way ESPN does.
        clock = status?.type?.shortDetail || event?.shortName || 'Scheduled';
      }

      // Each side sees the matchup from its own point of view: the away team
      // reads "@HOME", the home team reads "AWAY".
      const build = (mine, theirs, isHome) => ({
        line: haveScores && state !== 'pre'
          ? `${isHome ? theirs : `@${theirs}`} ${isHome ? homeScore : awayScore}-${isHome ? awayScore : homeScore}`
          : `${isHome ? theirs : `@${theirs}`}`,
        clock,
        state,
      });

      out[homeAb] = build(homeAb, awayAb, true);
      out[awayAb] = build(awayAb, homeAb, false);
    }

    // Scores move constantly during games; 20s is enough to stay fresh without
    // hammering ESPN from every viewer.
    res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
    return res.status(200).json(out);
  } catch (err) {
    res.setHeader('Cache-Control', 's-maxage=30');
    return res.status(200).json({});
  }
}
