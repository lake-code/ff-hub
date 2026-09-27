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
  --dimmer:    #5f7a6d;
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

.ff-shell { max-width: 880px; margin: 0 auto; padding: 20px 16px 64px; }

.ff-top {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 12px; margin-bottom: 4px; flex-wrap: wrap;
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
  margin-bottom: 12px;
  overflow: hidden;
}

.ff-league {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; color: var(--dim);
  padding: 11px 16px; border-bottom: 1px solid var(--turf-edge);
}
.ff-tag {
  font-size: 11px; letter-spacing: 0.04em; border: 1px solid var(--turf-edge);
  border-radius: 4px; padding: 2px 6px;
}

/* --- matchup header: two teams facing each other ------------------- */

.ff-head { display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; }

.ff-side { padding: 14px 16px; min-width: 0; }
.ff-side[data-align='right'] { text-align: right; }

.ff-ident { display: flex; align-items: center; gap: 10px; min-width: 0; }
.ff-side[data-align='right'] .ff-ident { flex-direction: row-reverse; }

.ff-tname {
  font-size: 17px; font-weight: 600; line-height: 1.2;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ff-towner { color: var(--dim); font-size: 13px; margin-top: 1px; }

.ff-tscore {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 40px; font-weight: 700; line-height: 1; margin-top: 8px;
}
.ff-tscore[data-lead='true'] { color: var(--up); }

.ff-tmeta { color: var(--dimmer); font-size: 12px; margin-top: 5px; line-height: 1.5; }
.ff-tmeta b { color: var(--dim); font-weight: 500; }

.ff-versus {
  align-self: center; color: var(--dimmer); font-size: 12px;
  padding: 0 4px; text-align: center;
}
.ff-margin {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 22px; font-weight: 700; line-height: 1; display: block;
}
.ff-margin[data-side='up'] { color: var(--up); }
.ff-margin[data-side='down'] { color: var(--down); }

/* --- avatars ------------------------------------------------------- */

.ff-av {
  width: 34px; height: 34px; border-radius: 50%; flex: 0 0 auto;
  background: var(--turf); border: 1px solid var(--turf-edge);
  object-fit: cover; overflow: hidden;
  display: grid; place-items: center;
  font-size: 11px; color: var(--dimmer); font-weight: 600;
}
.ff-av[data-size='sm'] { width: 26px; height: 26px; font-size: 9px; }

/* --- roster: paired rows with a centre slot rail ------------------- */

.ff-lineup { border-top: 1px solid var(--turf-edge); }

.ff-row {
  display: grid; grid-template-columns: 1fr 56px 1fr;
  align-items: stretch; border-bottom: 1px solid var(--turf-edge);
}
.ff-row:last-child { border-bottom: none; }

.ff-slotrail {
  display: grid; place-items: center;
  font-size: 11px; color: var(--dim);
  background: rgba(0, 0, 0, 0.16);
  border-left: 1px solid var(--turf-edge);
  border-right: 1px solid var(--turf-edge);
}

.ff-cell {
  display: grid; grid-template-columns: 26px minmax(0, 1fr) auto;
  gap: 9px; align-items: center; padding: 9px 14px; min-width: 0;
}
/* Every child is pinned to row 1: once columns are assigned out of DOM order,
   grid auto-placement will not move backwards and would stack them instead. */
.ff-cell > * { grid-row: 1; }
.ff-cell .ff-av   { grid-column: 1; }
.ff-cell .ff-who  { grid-column: 2; }
.ff-cell .ff-ppts { grid-column: 3; }

/* Mirrored for the away side: points inboard, avatar outboard. Columns are
   assigned explicitly so DOM order stays the same on both sides. */
.ff-cell[data-align='right'] {
  grid-template-columns: auto minmax(0, 1fr) 26px;
  text-align: right;
}
.ff-cell[data-align='right'] .ff-av   { grid-column: 3; }
.ff-cell[data-align='right'] .ff-who  { grid-column: 2; }
.ff-cell[data-align='right'] .ff-ppts { grid-column: 1; }

.ff-who { display: block; min-width: 0; }
.ff-pname {
  display: block;
  font-size: 14px; line-height: 1.25;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ff-pname i { font-style: normal; color: var(--dimmer); font-size: 11px; margin-left: 5px; }
.ff-pname i + i { margin-left: 4px; }
.ff-pname u { text-decoration: none; color: var(--down); font-size: 10px; margin-left: 4px; }
.ff-pgame {
  display: block;
  font-size: 11px; color: var(--dimmer); margin-top: 2px; line-height: 1.3;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ff-pgame[data-state='in'] { color: var(--live); }

.ff-ppts {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 19px; font-weight: 600; line-height: 1; white-space: nowrap;
}
.ff-pproj { display: block; font-family: 'Barlow', sans-serif; font-size: 10px; font-weight: 400; color: var(--dimmer); margin-top: 2px; }
.ff-empty { color: var(--dimmer); }

.ff-total {
  display: grid; grid-template-columns: 1fr 56px 1fr;
  border-top: 1px solid var(--turf-edge); border-bottom: 1px solid var(--turf-edge);
  background: rgba(0, 0, 0, 0.12);
}
/* Totals sit against the centre rail so the two numbers read as a pair. */
.ff-total > div { padding: 10px 14px; font-family: 'Barlow Condensed', sans-serif; font-size: 22px; font-weight: 700; text-align: right; }
.ff-total > div[data-align='right'] { text-align: left; }
.ff-total .ff-slotrail { font-family: 'Barlow', sans-serif; font-size: 11px; font-weight: 400; padding: 0; }

.ff-benchhead {
  padding: 9px 14px; font-size: 12px; color: var(--dimmer);
  border-bottom: 1px solid var(--turf-edge);
}
.ff-lineup[data-bench='true'] .ff-pname,
.ff-lineup[data-bench='true'] .ff-ppts { color: var(--dim); }

.ff-expand {
  width: 100%; background: none; border: none;
  border-top: 1px solid var(--turf-edge); color: var(--dim);
  padding: 11px 16px; font-family: inherit; font-size: 13px; cursor: pointer; text-align: left;
}
.ff-expand:hover { color: var(--chalk); background: rgba(0, 0, 0, 0.1); }

@media (max-width: 640px) {
  .ff-row, .ff-total { grid-template-columns: 1fr 42px 1fr; }
  .ff-cell { grid-template-columns: minmax(0, 1fr) auto; gap: 7px; padding: 8px 10px; }
  .ff-cell .ff-who  { grid-column: 1; }
  .ff-cell .ff-ppts { grid-column: 2; }
  .ff-cell[data-align='right'] { grid-template-columns: auto minmax(0, 1fr); }
  .ff-cell[data-align='right'] .ff-who  { grid-column: 2; }
  .ff-cell[data-align='right'] .ff-ppts { grid-column: 1; }
  .ff-cell .ff-av { display: none; }
  /* The game line below already names the opponent, so the player's own team
     abbreviation is the first thing to give up for name width. */
  .ff-pro { display: none; }
  .ff-pname { font-size: 13px; }
  .ff-ppts { font-size: 17px; }
  .ff-tname { font-size: 15px; }
  .ff-tscore { font-size: 32px; }
  .ff-side { padding: 12px 10px; }
}

/* --- settings ------------------------------------------------------ */

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

/* --- headshots ----------------------------------------------------- */

function headshot(player, platform) {
  const isDef = player.position === 'D/ST' || player.position === 'DEF';

  if (platform === 'ESPN') {
    if (isDef) {
      return player.proTeam
        ? `https://a.espncdn.com/i/teamlogos/nfl/500/${player.proTeam.toLowerCase()}.png`
        : null;
    }
    return player.playerId
      ? `https://a.espncdn.com/i/headshots/nfl/players/full/${player.playerId}.png`
      : null;
  }

  if (isDef) {
    return player.proTeam
      ? `https://sleepercdn.com/images/team_logos/nfl/${player.proTeam.toLowerCase()}.png`
      : null;
  }
  return player.playerId
    ? `https://sleepercdn.com/content/nfl/players/${player.playerId}.jpg`
    : null;
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

// Sleeper stores reception scoring as a number: 1 is full PPR, 0.5 is half,
// 0 is standard. Pick the matching projection column per league.
function scoringKey(league) {
  const rec = Number(league?.scoring_settings?.rec);
  if (rec >= 0.75) return 'p';
  if (rec >= 0.25) return 'h';
  return 's';
}

function projectionFor(projections, playerId, key) {
  const row = projections?.[playerId];
  if (!row) return null;
  const value = row[key];
  return Number.isFinite(value) ? round(value) : null;
}

function sleeperRoster(matchup, positions, players, projections, key) {
  const starters = matchup.starters || [];
  const points = matchup.players_points || {};
  const starterSet = new Set(starters);

  const rows = starters.map((id, i) => {
    const p = players[id] || {};
    const empty = !id || id === '0';
    return {
      slot: positions[i] || 'FLEX',
      starter: true,
      playerId: empty ? null : id,
      name: empty ? 'Empty slot' : p.n || id,
      position: p.p || '',
      proTeam: p.t || '',
      injury: p.i || null,
      points: round((matchup.starters_points || [])[i] ?? points[id] ?? 0),
      projected: empty ? null : projectionFor(projections, id, key),
    };
  });

  const bench = (matchup.players || [])
    .filter((id) => !starterSet.has(id))
    .map((id) => {
      const p = players[id] || {};
      return {
        slot: 'Bench',
        starter: false,
        playerId: id,
        name: p.n || id,
        position: p.p || '',
        proTeam: p.t || '',
        injury: p.i || null,
        points: round(points[id] ?? 0),
        projected: projectionFor(projections, id, key),
      };
    })
    .sort((a, b) => b.points - a.points);

  return [...rows, ...bench];
}

function sumProjected(roster) {
  const starters = roster.filter((p) => p.starter && p.projected != null);
  if (!starters.length) return null;
  return round(starters.reduce((sum, p) => sum + p.projected, 0));
}

async function fetchSleeperCards(username, season, week, players, projections) {
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
      const key = scoringKey(league);

      const memberFor = (rosterId) => {
        const roster = rosters.find((r) => r.roster_id === rosterId);
        return members.find((u) => u.user_id === roster?.owner_id) || null;
      };

      const sideFor = (rosterId, matchup) => {
        const member = memberFor(rosterId);
        const settings = rosters.find((r) => r.roster_id === rosterId)?.settings;
        const lineup = sleeperRoster(matchup, positions, players, projections, key);
        return {
          name: member?.metadata?.team_name || member?.display_name || `Roster ${rosterId}`,
          owner: member?.display_name || null,
          logo: member?.avatar
            ? `https://sleepercdn.com/avatars/thumbs/${member.avatar}`
            : null,
          record: settings
            ? `${settings.wins || 0}-${settings.losses || 0}-${settings.ties || 0}`
            : null,
          score: round(matchup.points),
          projected: sumProjected(lineup),
          roster: lineup,
        };
      };

      return {
        key: `sleeper-${league.league_id}`,
        platform: 'Sleeper',
        leagueName: league.name,
        me: sideFor(myRoster.roster_id, mine),
        opp: theirs
          ? sideFor(theirs.roster_id, theirs)
          : {
              name: 'Bye week', owner: null, logo: null, record: null,
              score: 0, projected: null, roster: [],
            },
      };
    })
  );

  return cards.filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

function Avatar({ src, fallback, size }) {
  const [broken, setBroken] = useState(false);

  useEffect(() => { setBroken(false); }, [src]);

  if (!src || broken) {
    return <span className="ff-av" data-size={size}>{fallback || ''}</span>;
  }
  return (
    <img
      className="ff-av"
      data-size={size}
      src={src}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

function PlayerCell({ player, platform, games, align }) {
  if (!player) return <div className="ff-cell" data-align={align} />;

  const game = player.proTeam ? games[player.proTeam.toUpperCase()] : null;
  const empty = player.name === 'Empty slot';

  return (
    <div className="ff-cell" data-align={align}>
      <Avatar
        src={empty ? null : headshot(player, platform)}
        fallback={player.position}
        size="sm"
      />
      <span className="ff-who">
        <span className={`ff-pname${empty ? ' ff-empty' : ''}`}>
          {player.name}
          {player.position ? <i>{player.position}</i> : null}
          {player.proTeam ? <i className="ff-pro">· {player.proTeam}</i> : null}
          {player.injury ? <u>{player.injury.slice(0, 1)}</u> : null}
        </span>
        {game ? (
          <span className="ff-pgame" data-state={game.state}>
            {game.line}{game.clock ? `, ${game.clock}` : ''}
          </span>
        ) : null}
      </span>
      <span className="ff-ppts">
        {empty ? '--' : player.points.toFixed(1)}
        {player.projected != null ? (
          <em className="ff-pproj">of {player.projected.toFixed(1)}</em>
        ) : null}
      </span>
    </div>
  );
}

// Walk both lineups together so every row lines up on a shared slot label,
// the way a head-to-head box score reads.
function pairRows(left, right) {
  const rows = [];
  const max = Math.max(left.length, right.length);
  for (let i = 0; i < max; i += 1) {
    rows.push({ left: left[i] || null, right: right[i] || null });
  }
  return rows;
}

function Lineup({ card, games, bench }) {
  const pick = (side) => side.roster.filter((p) => (bench ? !p.starter : p.starter));
  const rows = pairRows(pick(card.me), pick(card.opp));
  if (!rows.length) return null;

  return (
    <div className="ff-lineup" data-bench={bench ? 'true' : 'false'}>
      {bench && <div className="ff-benchhead">Bench</div>}
      {rows.map((row, i) => (
        <div className="ff-row" key={i}>
          <PlayerCell player={row.left} platform={card.platform} games={games} align="left" />
          <div className="ff-slotrail">
            {bench ? 'BN' : (row.left?.slot || row.right?.slot || '')}
          </div>
          <PlayerCell player={row.right} platform={card.platform} games={games} align="right" />
        </div>
      ))}
    </div>
  );
}

// How many starters are mid-game versus not yet kicked off.
function playClock(side, games) {
  let inPlay = 0;
  let toPlay = 0;
  for (const p of side.roster) {
    if (!p.starter || !p.proTeam) continue;
    const game = games[p.proTeam.toUpperCase()];
    if (!game) continue;
    if (game.state === 'in') inPlay += 1;
    else if (game.state === 'pre') toPlay += 1;
  }
  return { inPlay, toPlay };
}

function TeamHead({ side, platform, games, align, leading }) {
  const clock = playClock(side, games);
  const hasClock = clock.inPlay > 0 || clock.toPlay > 0;

  return (
    <div className="ff-side" data-align={align}>
      <div className="ff-ident">
        <Avatar src={side.logo} fallback={side.name.slice(0, 1)} />
        <span style={{ minWidth: 0 }}>
          <div className="ff-tname">{side.name}</div>
          <div className="ff-towner">
            {side.owner ? `${side.owner} ` : ''}
            {side.record ? `(${side.record})` : ''}
          </div>
        </span>
      </div>

      <div className="ff-tscore" data-lead={leading ? 'true' : 'false'}>
        {side.score.toFixed(1)}
      </div>

      <div className="ff-tmeta">
        {hasClock ? (
          <>In play <b>{clock.inPlay}</b> · To play <b>{clock.toPlay}</b><br /></>
        ) : null}
        {side.projected != null ? <>Proj total <b>{side.projected.toFixed(1)}</b></> : null}
      </div>
    </div>
  );
}

function Card({ card, games }) {
  const [open, setOpen] = useState(false);
  const margin = round(card.me.score - card.opp.score);
  const winning = margin >= 0;

  return (
    <div className="ff-card">
      <div className="ff-league">
        <span>{card.leagueName}</span>
        <span className="ff-tag">{card.platform}</span>
      </div>

      <div className="ff-head">
        <TeamHead
          side={card.me}
          platform={card.platform}
          games={games}
          align="left"
          leading={winning}
        />
        <div className="ff-versus">
          <span className="ff-margin" data-side={winning ? 'up' : 'down'}>
            {winning ? '+' : ''}{margin.toFixed(1)}
          </span>
          {winning ? 'ahead' : 'behind'}
        </div>
        <TeamHead
          side={card.opp}
          platform={card.platform}
          games={games}
          align="right"
          leading={!winning}
        />
      </div>

      {open && (
        <>
          <Lineup card={card} games={games} bench={false} />
          <div className="ff-total">
            <div>{card.me.score.toFixed(1)}</div>
            <div className="ff-slotrail">Total</div>
            <div data-align="right">{card.opp.score.toFixed(1)}</div>
          </div>
          <Lineup card={card} games={games} bench />
        </>
      )}

      <button className="ff-expand" onClick={() => setOpen(!open)}>
        {open ? 'Hide lineups' : 'Show lineups'}
      </button>
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
  const [games, setGames] = useState({});
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

    // Game state is a nicety. If it fails, rows simply render without it.
    try {
      setGames(await getJSON(`/api/nfl-games?week=${week}&season=${season}`));
    } catch (e) {
      setGames({});
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

        let projections = {};
        try {
          projections = await getJSON(`/api/sleeper-projections?season=${season}&week=${week}`);
        } catch (e) {
          projections = {};
        }

        const sleeper = await fetchSleeperCards(
          config.sleeperUser.trim(),
          season,
          week,
          playersRef.current,
          projections
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
              <Card card={card} games={games} key={card.key} />
            ))}
          </>
        )}
      </div>
    </>
  );
}
