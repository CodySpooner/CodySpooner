// Builds the level card from real GitHub activity. The daily workflow runs it; every number on the card comes from the API.
// Run: GH_TOKEN=... node scripts/build-level.mjs [out file, default assets/level.svg]
// Commits are counted across the repos this account owns. A token that can read private repos adds theirs, as totals only: no repo is ever named.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const LOGIN = 'CodySpooner'
const n = v => +v.toFixed(2)
const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('')

// ---------------------------------------------------------------- The rules
const XP = { commit: 10, pr: 50, release: 250, day: 25 }
export const xpOf = s => s.commits * XP.commit + s.prs * XP.pr + s.releases * XP.release + s.days * XP.day
// Level L takes 50·L·(L-1) XP in all, so early levels come fast and later ones take real work.
const need = level => 50 * level * (level - 1)
export const levelOf = xp => {
  let level = 1
  while (xp >= need(level + 1)) level++
  return { level, from: need(level), to: need(level + 1) }
}
// Nine ranks, ten levels each, each with three versions. ROOT is the top, so it needs no version.
// Each rank has a color and a symbol, drawn on a 24-unit grid.
const RANKS = [
  ['HELLO WORLD', '#94A3B8', 'M4 7l5 5-5 5M12 18h8'],
  ['SCRIPTER', '#4ADE80', 'M9 4C7 4 6 5 6 7v2.500C6 10.700 5.200 11.700 4 12c1.200.3 2 1.300 2 2.500V17c0 2 1 3 3 3M15 4c2 0 3 1 3 3v2.500c0 1.200.8 2.200 2 2.500-1.200.3-2 1.300-2 2.500V17c0 2-1 3-3 3'],
  ['HACKER', '#22D3EE', 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16'],
  ['MAINTAINER', '#60A5FA', 'M6 8v8M6 8a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5zM6 21a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5zM18 10a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5zM18 10c0 4-5 4-12 6'],
  ['FULL STACK', '#A78BFA', 'M12 3l9 4.500-9 4.500-9-4.500zM3 12l9 4.500 9-4.500M3 16.500L12 21l9-4.500'],
  ['ARCHITECT', '#F472B6', 'M12 7.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5zM5 21.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5zM19 21.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5zM12 7.500V13M6.500 17l5.500-4 5.500 4'],
  ['WIZARD', '#FB923C', 'M6 4h1.500c1.800 0 2.800.9 3.500 2.800L16 19c.5 1.200 1.200 1.500 2.500 1.500M12.300 10L6 20.500'],
  ['10X', '#EF4444', 'M13 2L5 14h6l-1 8 8-12h-6z'],
  ['ROOT', '#FFD166', 'M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5zM5 22h14'],
]
export const rankOf = level => {
  const tier = Math.min(8, Math.floor(level / 10))
  const [title, color, symbol] = RANKS[tier]
  const version = Math.min(2, Math.floor((level % 10) / (10 / 3))) + 1
  return { tier, color, symbol, name: tier === 8 ? title : `${title} v${version}` }
}

// ---------------------------------------------------------------- The numbers
const api = (url, init = {}) => fetch(`https://api.github.com/${url}`, { ...init, headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, 'User-Agent': 'profile-level-card' } }).then(async res => {
  const body = await res.json()
  if (!res.ok || body.errors) throw new Error(`${url}: ${JSON.stringify(body.errors || body)}`)
  return body
})
const gql = async query => (await api('graphql', { method: 'POST', body: JSON.stringify({ query }) })).data.user

const fetchStats = async () => {
  const me = await gql(`{user(login:"${LOGIN}"){pullRequests(states:MERGED){totalCount} contributionsCollection{contributionYears}}}`)
  const { repositories } = await gql(`{user(login:"${LOGIN}"){repositories(ownerAffiliations:OWNER,isFork:false,first:100){nodes{releases{totalCount} defaultBranchRef{target{...on Commit{history{totalCount}}}}}}}}`)
  const years = await gql(`{user(login:"${LOGIN}"){${me.contributionsCollection.contributionYears.map(y => `y${y}:contributionsCollection(from:"${y}-01-01T00:00:00Z",to:"${y}-12-31T23:59:59Z"){contributionCalendar{weeks{contributionDays{contributionCount}}}}`).join(' ')}}}`)
  const coop = await api(`search/commits?per_page=1&q=${encodeURIComponent(`user:${LOGIN} "Co-Authored-By: Claude"`)}`)
  return {
    commits: repositories.nodes.reduce((sum, r) => sum + (r.defaultBranchRef?.target.history.totalCount || 0), 0),
    prs: me.pullRequests.totalCount,
    releases: repositories.nodes.reduce((sum, r) => sum + r.releases.totalCount, 0),
    days: Object.values(years).flatMap(y => y.contributionCalendar.weeks).flatMap(w => w.contributionDays).filter(d => d.contributionCount > 0).length,
    coop: coop.total_count,
  }
}

// ---------------------------------------------------------------- The badge
// A chip with its rank's symbol etched on the die. Higher ranks gain pins, then live traces, then orbiting rings.
const badge = ({ tier, color, symbol }) => {
  const DIE = 50, PIN = 13
  const pins = [3, 4, 5, 5, 5, 6, 6, 6, 7][tier]
  const offsets = Array.from({ length: pins }, (_, i) => n((i - (pins - 1) / 2) * (DIE * 1.56 / (pins - 1))))
  const side = rotate => `<g transform="rotate(${rotate})">${offsets.map(x => `<rect x="${n(x - 2.75)}" y="${-DIE - PIN}" width="5.500" height="${PIN + 2}" rx="1.500" fill="url(#metal)"/>`).join('')}</g>`
  // Traces leave the pin tips and end in a pad, with a pulse of data running out along each.
  const traces = tier < 3 ? '' : [0, 90, 180, 270].map((rotate, s) => {
    const from = offsets[s % 2 ? 1 : pins - 2], out = tier > 5 ? 26 : 20, step = s % 2 ? -14 : 14
    const d = `M${from} ${-DIE - PIN}v-8l${step} -${out - 8}`
    const end = [from + step, -DIE - PIN - out]
    return `<g transform="rotate(${rotate})"><path d="${d}" fill="none" stroke="${mix(color, '#000000', .35)}" stroke-width="1.800" stroke-linejoin="round"/><circle cx="${end[0]}" cy="${end[1]}" r="3" fill="#0B0B0E" stroke="${color}" stroke-width="1.600"/>
<path class="data" style="animation-delay:${n(s * .35)}s" d="${d}" pathLength="1" fill="none" stroke="${mix(color, '#ffffff', .55)}" stroke-width="2" stroke-linecap="round" stroke-dasharray=".16 1"/></g>`
  }).join('')
  const rings = (tier >= 5 ? `<circle class="spin" r="88" fill="none" stroke="${color}" stroke-opacity=".6" stroke-width="1.500" stroke-dasharray="3 9 24 9"/>` : '')
    + (tier >= 7 ? `<circle class="spin rev" r="96" fill="none" stroke="${color}" stroke-opacity=".4" stroke-width="1" stroke-dasharray="1 7"/>` : '')
  return `<g class="pop">${rings}${traces}${[0, 90, 180, 270].map(side).join('')}
<rect x="${-DIE}" y="${-DIE}" width="${DIE * 2}" height="${DIE * 2}" rx="14" fill="url(#die)" stroke="url(#metal)" stroke-width="3"/>
<rect x="${-DIE + 8}" y="${-DIE + 8}" width="${DIE * 2 - 16}" height="${DIE * 2 - 16}" rx="8" fill="none" stroke="${color}" stroke-opacity=".5"/>
<circle cx="${-DIE + 16}" cy="${-DIE + 16}" r="2.200" fill="${color}"/>
<g transform="scale(2.300) translate(-12 -12)" fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="etch" d="${symbol}" stroke="${color}" stroke-width="3.400" filter="url(#sg)"/><path d="${symbol}" stroke="${mix(color, '#ffffff', .45)}" stroke-width="2"/></g></g>`
}

// ---------------------------------------------------------------- The card
const C = { card: '#0F0F10', line: '#1F1F22', text: '#FAFAFA', soft: '#D4D4D8', muted: '#A1A1AA', dim: '#71717A', red: '#EF4444', ember: '#FF8C42', gold: '#FFD166' }
const big = v => v.toLocaleString('en-US')

export const card = stats => {
  const W = 880, H = 236, T = 10
  const xp = xpOf(stats), { level, from, to } = levelOf(xp), rank = rankOf(level)
  const share = Math.max(.02, (xp - from) / (to - from))
  const font = fs.readFileSync(path.join(root, 'assets/banner.svg'), 'utf8').match(/base64,([A-Za-z0-9+/=]+)/)[1]
  const BAR = { x: 214, y: 128, w: 334, h: 12 }
  const head = BAR.x + BAR.w * share
  const TILES = [['STR', 'COMMITS', stats.commits], ['INT', 'MERGED PRS', stats.prs], ['DEX', 'RELEASES', stats.releases], ['END', 'ACTIVE DAYS', stats.days]]
  const tile = ([stat, label, value], i) => {
    const x = 580 + (i % 2) * 142, y = 22 + Math.floor(i / 2) * 102
    return `<g class="tile" style="animation-delay:${n(.25 + i * .12)}s"><rect x="${x + .5}" y="${y + .5}" width="131" height="91" rx="12" fill="#141416" stroke="#26262A"/>
<text x="${x + 14}" y="${y + 26}" class="tag" fill="${C.red}">${stat}</text><text x="${x + 118}" y="${y + 26}" text-anchor="end" font-size="9" font-weight="600" letter-spacing=".7" fill="${C.dim}">${label}</text>
<text x="${x + 13}" y="${y + 70}" font-size="33" font-weight="800" letter-spacing="-1" fill="${C.text}">${big(value)}</text></g>`
  }
  const embers = Array.from({ length: 12 }, (_, i) => {
    const dur = 4 + (i * 37 % 50) / 10
    return `<circle class="emb" style="animation-duration:${n(dur)}s;animation-delay:-${n((i * 53 % 40) / 10)}s" cx="${40 + (i * 97 % 150)}" cy="${H - 8}" r="${n(.8 + (i % 3) * .5)}" fill="${[C.red, C.ember, C.gold][i % 3]}"/>`
  }).join('')
  const css = `@font-face{font-family:I;font-weight:100 900;src:url(data:font/woff2;base64,${font}) format("woff2")}
text{font-family:I,Inter,system-ui,sans-serif}.lbl{font-size:12px;font-weight:600;letter-spacing:.2em}.tag{font-size:11px;font-weight:700;letter-spacing:.14em}
@keyframes fill{0%,4%{transform:scaleX(0)}24%,92%{transform:scaleX(1)}98%,100%{transform:scaleX(0)}}
@keyframes head{0%,4%{opacity:0;transform:translateX(${n(BAR.x - head)}px)}6%{opacity:1}24%{opacity:1;transform:none}30%,100%{opacity:0;transform:none}}
@keyframes pop{0%,23%{transform:scale(1)}26%{transform:scale(1.08)}32%,100%{transform:scale(1)}}
@keyframes aura{0%,23%{opacity:.55}26%{opacity:1}55%,100%{opacity:.55}}
@keyframes etch{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes data{from{stroke-dashoffset:.16}to{stroke-dashoffset:-1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes tile{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes up{0%{opacity:0;transform:translateY(0)}15%{opacity:.9}100%{opacity:0;transform:translateY(-190px)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
.fill{transform-box:fill-box;transform-origin:left;animation:fill ${T}s cubic-bezier(.3,.7,.3,1) infinite}
.head{opacity:0;animation:head ${T}s cubic-bezier(.3,.7,.3,1) infinite}
.pop{animation:pop ${T}s ease-out infinite}.aura{animation:aura ${T}s ease-out infinite}
.etch{animation:etch 3s ease-in-out infinite}.data{stroke-dashoffset:.16;animation:data 1.400s linear infinite}
.spin{animation:spin 26s linear infinite}.rev{animation-direction:reverse;animation-duration:40s}
.tile{animation:tile .5s ease-out both}.emb{opacity:0;animation:up linear infinite}.dot{animation:blink 2.400s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.head,.data{display:none}}`
  const title = `Xody's character sheet: level ${level} vibe coder, rank ${rank.name}, ${big(xp)} XP from real GitHub activity. ${big(stats.commits)} commits, ${big(stats.prs)} merged pull requests, ${big(stats.releases)} releases, ${big(stats.days)} active days, ${big(stats.coop)} commits co-authored with Claude.`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}"><title>${title}</title>
<style>${css}</style>
<defs><clipPath id="c"><rect width="${W}" height="${H}" rx="16"/></clipPath>
<clipPath id="bar"><rect x="${BAR.x}" y="${BAR.y}" width="${BAR.w}" height="${BAR.h}" rx="6"/></clipPath>
<radialGradient id="aura"><stop offset="0" stop-color="${rank.color}" stop-opacity=".5"/><stop offset=".55" stop-color="${rank.color}" stop-opacity=".16"/><stop offset="1" stop-color="${rank.color}" stop-opacity="0"/></radialGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mix(rank.color, '#ffffff', .65)}"/><stop offset=".5" stop-color="${mix(rank.color, '#000000', .4)}"/><stop offset="1" stop-color="${mix(rank.color, '#ffffff', .35)}"/></linearGradient>
<linearGradient id="die" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1D1D22"/><stop offset="1" stop-color="#09090C"/></linearGradient>
<linearGradient id="fg"><stop offset="0" stop-color="#7F1D1D"/><stop offset=".5" stop-color="${C.red}"/><stop offset=".85" stop-color="${C.ember}"/><stop offset="1" stop-color="${C.gold}"/></linearGradient>
<linearGradient id="tf" gradientUnits="userSpaceOnUse" x1="0" y1="-46" x2="0" y2="2"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#FFE3DC"/><stop offset="1" stop-color="#F8695C"/></linearGradient>
<filter id="sb" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="sg" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.300"/></filter></defs>
<g clip-path="url(#c)"><rect width="${W}" height="${H}" fill="${C.card}"/>
<circle class="aura" cx="108" cy="118" r="190" fill="url(#aura)"/>
${embers}
<g transform="translate(108 118)">${badge(rank)}</g>
<text x="214" y="44" class="lbl" fill="${C.red}">XODY · VIBE CODER</text>
<text x="548" y="44" text-anchor="end" font-size="14" font-weight="800" letter-spacing="1.200" fill="${mix(rank.color, '#ffffff', .35)}">${rank.name}</text>
<text transform="translate(212 106) skewX(-10)" font-size="60" font-weight="900" letter-spacing="-1.500" fill="url(#tf)">LEVEL ${level}</text>
<rect x="${BAR.x}" y="${BAR.y}" width="${BAR.w}" height="${BAR.h}" rx="6" fill="#1E1E22"/>
<g clip-path="url(#bar)"><rect class="fill" x="${BAR.x}" y="${BAR.y}" width="${n(BAR.w * share)}" height="${BAR.h}" fill="url(#fg)"/></g>
<g class="head"><circle cx="${n(head)}" cy="${BAR.y + 6}" r="9" fill="${C.ember}" filter="url(#sb)"/><circle cx="${n(head)}" cy="${BAR.y + 6}" r="3.400" fill="#FFF3B0"/></g>
<text x="${BAR.x}" y="163" font-size="14" font-weight="600" fill="${C.soft}">${big(xp)} <tspan fill="${C.dim}">/ ${big(to)} XP</tspan></text>
<text x="${BAR.x + BAR.w}" y="163" text-anchor="end" font-size="13" fill="${C.muted}">${big(to - xp)} XP to Level ${level + 1}</text>
<path transform="translate(221 192)" fill="${C.ember}" d="M0-8C1-2.500 2.500-1 8 0 2.500 1 1 2.500 0 8-1 2.500-2.500 1-8 0-2.500-1-1-2.500 0-8Z"/>
<text x="236" y="197" class="tag" fill="${C.soft}">PARTY: CLAUDE</text>
<text x="${BAR.x + BAR.w}" y="197" text-anchor="end" class="tag" fill="${C.gold}">${big(stats.coop)} CO-OP COMMITS</text>
<circle class="dot" cx="218" cy="217" r="2.500" fill="${C.red}"/><text x="227" y="220.500" font-size="9.500" font-weight="600" letter-spacing="1.100" fill="${C.dim}">LIVE FROM GITHUB · UPDATED DAILY</text>
${TILES.map(tile).join('\n')}
</g><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="15.500" fill="none" stroke="${C.line}"/></svg>`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = path.resolve(process.argv[2] || path.join(root, 'assets/level.svg'))
  const stats = await fetchStats()
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, card(stats))
  console.log(JSON.stringify({ ...stats, xp: xpOf(stats), ...levelOf(xpOf(stats)) }))
}
