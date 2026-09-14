// api/espn.js
//
// Vercel serverless function. The browser cannot call ESPN directly (CORS),
// and we do not want the private-league cookies in client code, so every
// ESPN request goes through here.
//
// Required Vercel environment variables:
//   ESPN_S2   the espn_s2 cookie value
//   ESPN_SWID the SWID cookie value, braces included: {ABC-123-...}
//
// Request:  /api/espn?leagueId=123456&season=2026&week=2
// Response: normalized league object (see bottom of file for the shape)

const LINEUP_SLOT = {
  0: 'QB', 1: 'QB', 2: 'RB', 3: 'RB/WR', 4: 'WR', 5: 'WR/TE', 6: 'TE',
  7: 'OP', 8: 'DT', 9: 'DE', 10: 'LB', 11: 'DL', 12: 'CB', 13: 'S',
  14: 'DB', 15: 'DP', 16: 'D/ST', 17: 'K', 18: 'P', 19: 'HC',
  20: 'Bench', 21: 'IR', 22: '', 23: 'FLEX', 24: 'ER',
};

const POSITION = { 1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE', 5: 'K', 16: 'D/ST' };

const PRO_TEAM = {
  0: 'FA', 1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL',
  7: 'DEN', 8: 'DET', 9: 'GB', 10: 'TEN', 11: 'IND', 12: 'KC', 13: 'LV',
  14: 'LAR', 15: 'MIA', 16: 'MIN', 17: 'NE', 18: 'NO', 19: 'NYG', 20: 'NYJ',
  21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC', 25: 'SF', 26: 'SEA', 27: 'TB',
  28: 'WSH', 29: 'CAR', 30: 'JAX', 33: 'BAL', 34: 'HOU',
};

const BENCH_SLOTS = new Set([20, 21, 24]);

function round(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function teamName(team) {
  if (!team) return 'Unknown';
  if (team.name) return team.name;
  const parts = [team.location, team.nickname].filter(Boolean);
  return parts.length ? parts.join(' ') : `Team ${team.id}`;
}

function statFor(player, week, sourceId) {
  const stats = player?.stats || [];
  const hit = stats.find(
    (s) => s.scoringPeriodId === week && s.statSourceId === sourceId && s.statSplitTypeId === 1
  );
  return hit ? round(hit.appliedTotal) : 0;
}

function mapEntry(entry, week) {
  const player = entry?.playerPoolEntry?.player || {};
  const slotId = entry?.lineupSlotId;
  return {
    slot: LINEUP_SLOT[slotId] ?? '',
    starter: !BENCH_SLOTS.has(slotId),
    name: player.fullName || 'Empty',
    position: POSITION[player.defaultPositionId] || '',
    proTeam: PRO_TEAM[player.proTeamId] || '',
    injury: player.injuryStatus && player.injuryStatus !== 'ACTIVE' ? player.injuryStatus : null,
    points: round(entry?.playerPoolEntry?.appliedStatTotal ?? statFor(player, week, 0)),
    projected: statFor(player, week, 1),
  };
}

function sideFrom(side, teams, week) {
  if (!side) return null;
  const team = teams[side.teamId];
  const entries = side.rosterForCurrentScoringPeriod?.entries || [];
  const roster = entries.map((e) => mapEntry(e, week)).sort((a, b) => {
    if (a.starter !== b.starter) return a.starter ? -1 : 1;
    return b.points - a.points;
  });

  const starters = roster.filter((p) => p.starter);
  const liveScore = starters.reduce((sum, p) => sum + p.points, 0);

  return {
    teamId: side.teamId,
    name: teamName(team),
    abbrev: team?.abbrev || '',
    logo: team?.logo || null,
    isMine: Boolean(team?.isMine),
    record: team?.record || null,
    // totalPoints is authoritative once a week is final; the live sum is
    // fresher while games are in progress.
    score: round(side.totalPoints || liveScore || 0),
    projected: round(starters.reduce((sum, p) => sum + (p.projected || 0), 0)),
    roster,
  };
}

export default async function handler(req, res) {
  const { leagueId, season, week } = req.query;

  if (!leagueId) {
    return res.status(400).json({ error: 'Add a leagueId to the request.' });
  }

  const year = Number(season) || new Date().getFullYear();
  const scoringPeriod = Number(week) || 1;
  const swid = process.env.ESPN_SWID || '';
  const s2 = process.env.ESPN_S2 || '';

  const url =
    `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${year}` +
    `/segments/0/leagues/${leagueId}` +
    `?view=mMatchupScore&view=mTeam&view=mRoster&view=mSettings` +
    `&scoringPeriodId=${scoringPeriod}`;

  try {
    const espn = await fetch(url, {
      headers: {
        cookie: `espn_s2=${s2}; SWID=${swid}`,
        accept: 'application/json',
        'user-agent': 'Mozilla/5.0',
      },
    });

    if (espn.status === 401) {
      return res.status(401).json({
        error: 'ESPN rejected the cookies. Refresh ESPN_S2 and ESPN_SWID in Vercel.',
      });
    }
    if (!espn.ok) {
      return res.status(espn.status).json({
        error: `ESPN returned ${espn.status} for league ${leagueId}.`,
      });
    }

    const data = await espn.json();

    // Which team is mine: ESPN lists owner SWIDs on each team.
    const mySwid = swid.replace(/[{}]/g, '').toLowerCase();
    const teams = {};
    for (const team of data.teams || []) {
      const owners = (team.owners || []).map((o) => String(o).replace(/[{}]/g, '').toLowerCase());
      teams[team.id] = {
        ...team,
        isMine: mySwid ? owners.includes(mySwid) : false,
        record: team.record?.overall
          ? `${team.record.overall.wins}-${team.record.overall.losses}` +
            (team.record.overall.ties ? `-${team.record.overall.ties}` : '')
          : null,
      };
    }

    const matchups = (data.schedule || [])
      .filter((m) => m.matchupPeriodId === scoringPeriod)
      .map((m) => ({
        home: sideFrom(m.home, teams, scoringPeriod),
        away: sideFrom(m.away, teams, scoringPeriod),
      }))
      .filter((m) => m.home && m.away);

    // Cache briefly so rapid refreshes during games do not hammer ESPN.
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

    return res.status(200).json({
      platform: 'espn',
      leagueId: String(leagueId),
      leagueName: data.settings?.name || `League ${leagueId}`,
      season: year,
      week: scoringPeriod,
      matchups,
    });
  } catch (err) {
    return res.status(500).json({ error: `Could not reach ESPN: ${err.message}` });
  }
}
