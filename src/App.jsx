import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap');

:root {
  --turf:      #10201a;
  --turf-hi:   #172c24;
  --turf-edge: #2a4638;
  --chalk:     #f2efe3;
  --dim:       #8ba79a;
  --up:        #5cc08c;
  --down:      #e2705f;
  --live:      #ffb020;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--turf);
  color: var(--chalk);
  font-family: 'Barlow', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.ff-shell { max-width: 640px; margin: 0 auto; padding: 20px 16px 64px; }

.ff-top {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 12px; margin-bottom: 4px;
}
.ff-week {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700; font-size: 40px; line-height: 1; letter-spacing: -0.01em;
}
.ff-season { color: var(--dim); font-size: 14px; }

.ff-tally {
  color: var(--dim); font-size: 15px; margin: 0 0 20px;
  border-bottom: 1px solid var(--turf-edge); padding-bottom: 16px;
}
.ff-tally b { color: var(--chalk); font-weight: 600; }

.ff-controls { display: flex; gap: 8px; align-items: center; }

.ff-btn {
  background: none; border: 1px solid var(--turf-edge); color: var(--chalk);
  border-radius: 6px; padding: 7px 12px; font-family: inherit; font-size: 14px;
  cursor: pointer;
}
.ff-btn:hover { background: var(--turf-hi); }
.ff-btn:focus-visible { outline: 2px solid var(--live); outline-offset: 2px; }
.ff-btn[data-on='true'] { border-color: var(--live); color: var(--live); }

.ff-card {
  background: var(--turf-hi);
  border: 1px solid var(--turf-edge);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.ff-league {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; color: var(--dim); margin-bottom: 12px;
}
.ff-tag {
  font-size: 11px; letter-spacing: 0.04em; border: 1px solid var(--turf-edge);
  border-radius: 4px; padding: 2px 6px;
}

.ff-margin {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 700; font-size: 58px; line-height: 0.9;
  letter-spacing: -0.02em; display: flex; align-items: baseline; gap: 10px;
  margin-bottom: 14px;
}
.ff-margin[data-side='up'] { color: var(--up); }
.ff-margin[data-side='down'] { color: var(--down); }
.ff-margin span { font-family: 'Barlow', sans-serif; font-size: 14px; font-weight: 500; color: var(--dim); }

.ff-line {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: 12px; padding: 7px 0;
}
.ff-line + .ff-line { border-top: 1px solid var(--turf-edge); }
.ff-team { font-size: 16px; font-weight: 500; }
.ff-team small { color: var(--dim); font-weight: 400; margin-left: 7px; font-size: 13px; }
.ff-pts {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 26px; font-weight: 600; line-height: 1; white-space: nowrap;
}
.ff-proj { color: var(--dim); font-size: 12px; display: block; text-align: right; margin-top: 2px; }

.ff-expand {
  width: 100%; margin-top: 12px; background: none; border: none;
  border-top: 1px solid var(--turf-edge); color: var(--dim);
  padding: 11px 0 0; font-family: inherit; font-size: 13px; cursor: pointer; text-align: left;
}
.ff-expand:hover { color: var(--chalk); }

.ff-rosters { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 14px; }
@media (max-width: 520px) { .ff-rosters { grid-template-columns: 1fr; } }

.ff-rname { font-size: 13px; color: var(--dim); margin-bottom: 8px; }
.ff-player {
  display: grid; grid-template-columns: 42px 1fr auto;
  gap: 8px; align-items: baseline; padding: 4px 0; font-size: 14px;
}
.ff-slot { color: var(--dim); font-size: 12px; }
.ff-pname { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ff-pname i { font-style: normal; color: var(--dim); font-size: 12px; margin-left: 5px; }
.ff-pname u { text-decoration: none; color: var(--down); font-size: 11px; margin-left: 5px; }
.ff-ppts { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 600; }
.ff-bench { border-top: 1px dashed var(--turf-edge); margin-top: 8px; padding-top: 8px; }
.ff-bench .ff-pname, .ff-bench .ff-ppts { color: var(--dim); }

.ff-field { display: block; margin-bottom: 14px; }
.ff-field label { display: block; font-size: 14px; margin-bottom: 6px; }
.ff-field input {
  width: 100%; background: var(--turf); border: 1px solid var(--turf-edge);
  color: var(--chalk); border-radius: 6px; padding: 10px 12px;
  font-family: inherit; font-size: 15px;
}
.ff-field input:focus-visible { outline: 2px solid var(--live); outline-offset: 1px; }
.ff-hint { color: var(--dim); font-size: 13px; line-height: 1.5; margin: 6px 0 0; }

.ff-chip {
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid var(--turf-edge); border-radius: 6px;
  padding: 6px 8px 6px 12px; margin: 0 8px 8px 0; font-size: 14px;
}
.ff-chip button { background: none; border: none; color: var(--dim); cursor: pointer; font-size: 16px; padding: 0 4px; }
.ff-chip button:hover { color: var(--down); }

.ff-note { color: var(--dim); font-size: 14px; line-height: 1.6; }
.ff-error {
  border: 1px solid var(--down); border-radius: 8px; padding: 12px 14px;
  color: var(--down); font-size: 14px; margin-bottom: 12px;
}
h2 { font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 24px; margin: 26px 0 12px; }
`;

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

const STORE_KEY = 'ff-hub-config';

function loadConfig() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* fall through to defaults */
  }
  return { espnLeagues: [], sleeperUser: '' };
}

function saveConfig(config) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(config));
  } catch (e) {
    /* storage disabled; config just will not persist */
  }
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const round = (n) => Math.round((Number(n) || 0) * 10) / 10;

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = await res.json();
      if (body.error) detail = body.error;
    } catch (e) {
      /* keep the status code */
    }
    throw new Error(detail);
  }
  return res.json();
}

async function fetchNflState() {
  const state = await getJSON('https://api.sleeper.app/v1/state/nfl');
  return {
    week: state.week || 1,
    season: Number(state.season) || new Date().getFullYear(),
    type: state.season_type,
  };
}

/* --- ESPN ---------------------------------------------------------- */

async function fetchEspnCard(league, season, week) {
  const data = await getJSON(
    `/api/espn?leagueId=${encodeURIComponent(league.id)}&season=${season}&week=${week}`
  );

  const matchup = (data.matchups || []).find((m) => m.home.isMine || m.away.isMine);
  if (!matchup) {
    throw new Error(
      `Found ${data.leagueName} but not your team in it. Check that ESPN_SWID matches this account.`
    );
  }

  const me = matchup.home.isMine ? matchup.home : matchup.away;
  const opp = matchup.home.isMine ? matchup.away : matchup.home;

  return {
    key: `espn-${league.id}`,
    platform: 'ESPN',
    leagueName: league.label || data.leagueName,
    me,
    opp,
  };
}

/* --- Sleeper ------------------------------------------------------- */

const SLEEPER = 'https://api.sleeper.app/v1';

function sleeperRoster(matchup, positions, players) {
  const starters = matchup.starters || [];
  const points = matchup.players_points || {};
  const starterSet = new Set(starters);

  const rows = starters.map((id, i) => {
    const p = players[id] || {};
    return {
      slot: positions[i] || 'FLEX',
      starter: true,
      name: id === '0' ? 'Empty' : p.n || id,
      position: p.p || '',
      proTeam: p.t || '',
      injury: p.i || null,
      points: round((matchup.starters_points || [])[i] ?? points[id] ?? 0),
      projected: null,
    };
  });

  const bench = (matchup.players || [])
    .filter((id) => !starterSet.has(id))
    .map((id) => {
      const p = players[id] || {};
      return {
        slot: 'Bench',
        starter: false,
        name: p.n || id,
        position: p.p || '',
        proTeam: p.t || '',
        injury: p.i || null,
        points: round(points[id] ?? 0),
        projected: null,
      };
    })
    .sort((a, b) => b.points - a.points);

  return [...rows, ...bench];
}

async function fetchSleeperCards(username, season, week, players) {
  const user = await getJSON(`${SLEEPER}/user/${encodeURIComponent(username)}`);
  if (!user || !user.user_id) throw new Error(`Sleeper has no user called "${username}".`);

  const leagues = await getJSON(`${SLEEPER}/user/${user.user_id}/leagues/nfl/${season}`);
  if (!leagues.length) return [];

  const cards = await Promise.all(
    leagues.map(async (league) => {
      const [rosters, members, matchups] = await Promise.all([
        getJSON(`${SLEEPER}/league/${league.league_id}/rosters`),
        getJSON(`${SLEEPER}/league/${league.league_id}/users`),
        getJSON(`${SLEEPER}/league/${league.league_id}/matchups/${week}`),
      ]);

      const myRoster = rosters.find((r) => r.owner_id === user.user_id);
      if (!myRoster) return null;

      const mine = matchups.find((m) => m.roster_id === myRoster.roster_id);
      if (!mine) return null;

      const theirs = matchups.find(
        (m) => m.matchup_id === mine.matchup_id && m.roster_id !== myRoster.roster_id
      );

      const positions = (league.roster_positions || []).filter(
        (p) => p !== 'BN' && p !== 'IR' && p !== 'TAXI'
      );

      const nameFor = (rosterId) => {
        const roster = rosters.find((r) => r.roster_id === rosterId);
        const member = members.find((u) => u.user_id === roster?.owner_id);
        return member?.metadata?.team_name || member?.display_name || `Roster ${rosterId}`;
      };

      const recordFor = (rosterId) => {
        const s = rosters.find((r) => r.roster_id === rosterId)?.settings;
        return s ? `${s.wins || 0}-${s.losses || 0}${s.ties ? `-${s.ties}` : ''}` : null;
      };

      return {
        key: `sleeper-${league.league_id}`,
        platform: 'Sleeper',
        leagueName: league.name,
        me: {
          name: nameFor(myRoster.roster_id),
          record: recordFor(myRoster.roster_id),
          score: round(mine.points),
          projected: null,
          roster: sleeperRoster(mine, positions, players),
        },
        opp: theirs
          ? {
              name: nameFor(theirs.roster_id),
              record: recordFor(theirs.roster_id),
              score: round(theirs.points),
              projected: null,
              roster: sleeperRoster(theirs, positions, players),
            }
          : { name: 'Bye week', record: null, score: 0, projected: null, roster: [] },
      };
    })
  );

  return cards.filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

function Roster({ side }) {
  const starters = side.roster.filter((p) => p.starter);
  const bench = side.roster.filter((p) => !p.starter);

  const row = (p, i) => (
    <div className="ff-player" key={`${p.name}-${i}`}>
      <span className="ff-slot">{p.slot}</span>
      <span className="ff-pname">
        {p.name}
        {p.position ? <i>{p.position}{p.proTeam ? ` · ${p.proTeam}` : ''}</i> : null}
        {p.injury ? <u>{p.injury.slice(0, 1)}</u> : null}
      </span>
      <span className="ff-ppts">{p.points.toFixed(1)}</span>
    </div>
  );

  return (
    <div>
      <div className="ff-rname">{side.name}</div>
      {starters.map(row)}
      {bench.length > 0 && <div className="ff-bench">{bench.map(row)}</div>}
    </div>
  );
}

function Card({ card }) {
  const [open, setOpen] = useState(false);
  const margin = round(card.me.score - card.opp.score);
  const winning = margin >= 0;

  return (
    <div className="ff-card">
      <div className="ff-league">
        <span>{card.leagueName}</span>
        <span className="ff-tag">{card.platform}</span>
      </div>

      <div className="ff-margin" data-side={winning ? 'up' : 'down'}>
        {winning ? '+' : ''}{margin.toFixed(1)}
        <span>{winning ? 'ahead' : 'behind'}</span>
      </div>

      <div className="ff-line">
        <span className="ff-team">
          {card.me.name}
          {card.me.record ? <small>{card.me.record}</small> : null}
        </span>
        <span>
          <span className="ff-pts">{card.me.score.toFixed(1)}</span>
          {card.me.projected ? <span className="ff-proj">proj {card.me.projected.toFixed(1)}</span> : null}
        </span>
      </div>

      <div className="ff-line">
        <span className="ff-team">
          {card.opp.name}
          {card.opp.record ? <small>{card.opp.record}</small> : null}
        </span>
        <span>
          <span className="ff-pts">{card.opp.score.toFixed(1)}</span>
          {card.opp.projected ? <span className="ff-proj">proj {card.opp.projected.toFixed(1)}</span> : null}
        </span>
      </div>

      <button className="ff-expand" onClick={() => setOpen(!open)}>
        {open ? 'Hide rosters' : 'Show rosters'}
      </button>

      {open && (
        <div className="ff-rosters">
          <Roster side={card.me} />
          <Roster side={card.opp} />
        </div>
      )}
    </div>
  );
}

function Settings({ config, onChange }) {
  const [leagueId, setLeagueId] = useState('');
  const [label, setLabel] = useState('');

  const addLeague = () => {
    const id = leagueId.trim();
    if (!id) return;
    onChange({
      ...config,
      espnLeagues: [...config.espnLeagues, { id, label: label.trim() || '' }],
    });
    setLeagueId('');
    setLabel('');
  };

  const removeLeague = (id) =>
    onChange({ ...config, espnLeagues: config.espnLeagues.filter((l) => l.id !== id) });

  return (
    <div>
      <h2>Sleeper</h2>
      <div className="ff-field">
        <label htmlFor="ff-sleeper">Your Sleeper username</label>
        <input
          id="ff-sleeper"
          value={config.sleeperUser}
          placeholder="username"
          onChange={(e) => onChange({ ...config, sleeperUser: e.target.value })}
        />
        <p className="ff-hint">Every Sleeper league on this account loads automatically.</p>
      </div>

      <h2>ESPN</h2>
      {config.espnLeagues.map((l) => (
        <span className="ff-chip" key={l.id}>
          {l.label || l.id}
          <button onClick={() => removeLeague(l.id)} aria-label={`Remove ${l.label || l.id}`}>
            ×
          </button>
        </span>
      ))}

      <div className="ff-field">
        <label htmlFor="ff-league">League ID</label>
        <input
          id="ff-league"
          value={leagueId}
          placeholder="123456"
          onChange={(e) => setLeagueId(e.target.value)}
        />
        <p className="ff-hint">
          It is the leagueId in your ESPN league URL. ESPN leagues need one entry each.
        </p>
      </div>

      <div className="ff-field">
        <label htmlFor="ff-label">Name it (optional)</label>
        <input
          id="ff-label"
          value={label}
          placeholder="The big one"
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <button className="ff-btn" onClick={addLeague}>Add league</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const [config, setConfig] = useState(loadConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [state, setState] = useState({ week: null, season: null });
  const [cards, setCards] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const playersRef = useRef(null);

  const updateConfig = (next) => {
    setConfig(next);
    saveConfig(next);
  };

  const configured = config.espnLeagues.length > 0 || config.sleeperUser.trim() !== '';

  const load = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    const found = [];
    const problems = [];

    let week = state.week;
    let season = state.season;
    try {
      const nfl = await fetchNflState();
      week = nfl.week;
      season = nfl.season;
      setState({ week, season });
    } catch (e) {
      problems.push(`Could not read the current NFL week: ${e.message}`);
      week = week || 1;
      season = season || new Date().getFullYear();
    }

    for (const league of config.espnLeagues) {
      try {
        found.push(await fetchEspnCard(league, season, week));
      } catch (e) {
        problems.push(`ESPN league ${league.label || league.id}: ${e.message}`);
      }
    }

    if (config.sleeperUser.trim()) {
      try {
        if (!playersRef.current) {
          playersRef.current = await getJSON('/api/sleeper-players');
        }
        const sleeper = await fetchSleeperCards(
          config.sleeperUser.trim(),
          season,
          week,
          playersRef.current
        );
        found.push(...sleeper);
      } catch (e) {
        problems.push(`Sleeper: ${e.message}`);
      }
    }

    setCards(found);
    setErrors(problems);
    setLoading(false);
  }, [config, configured, state.week, state.season]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  const tally = useMemo(() => {
    const winning = cards.filter((c) => c.me.score >= c.opp.score).length;
    const points = cards.reduce((sum, c) => sum + c.me.score, 0);
    return { winning, total: cards.length, points: round(points) };
  }, [cards]);

  return (
    <>
      <style>{CSS}</style>
      <div className="ff-shell">
        <div className="ff-top">
          <div>
            <div className="ff-week">Week {state.week ?? '–'}</div>
            <div className="ff-season">{state.season ?? ''} season</div>
          </div>
          <div className="ff-controls">
            <button
              className="ff-btn"
              data-on={autoRefresh}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Live
            </button>
            <button className="ff-btn" onClick={load} disabled={loading}>
              {loading ? 'Loading' : 'Refresh'}
            </button>
            <button className="ff-btn" onClick={() => setShowSettings(!showSettings)}>
              {showSettings ? 'Done' : 'Leagues'}
            </button>
          </div>
        </div>

        {!showSettings && cards.length > 0 && (
          <p className="ff-tally">
            Winning <b>{tally.winning}</b> of <b>{tally.total}</b>, scoring{' '}
            <b>{tally.points.toFixed(1)}</b> across every team.
          </p>
        )}

        {showSettings ? (
          <Settings config={config} onChange={updateConfig} />
        ) : (
          <>
            {errors.map((e) => (
              <div className="ff-error" key={e}>{e}</div>
            ))}

            {!configured && (
              <p className="ff-note">
                Add your Sleeper username and ESPN league IDs to start. Tap Leagues above.
              </p>
            )}

            {configured && !loading && cards.length === 0 && errors.length === 0 && (
              <p className="ff-note">No matchups for this week yet.</p>
            )}

            {cards.map((card) => (
              <Card card={card} key={card.key} />
            ))}
          </>
        )}
      </div>
    </>
  );
}
