// Builds the cards in assets/, all but banner.svg, which this only reads for its embedded Inter (OFL).
// GitHub shows README SVGs as <img>: no scripts, no web fonts, no hover. Motion is CSS and SMIL only.
// The themes card draws from a checkout of ClaudeCodeThemes, so it shows what the themes really draw.
// The Overpowered card embeds assets/art, exported from the app. The level card has its own script, build-level.mjs.
// Run: node scripts/build-cards.mjs [themes repo, default ../claude-code-themes] [out dir, default assets]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const themesRepo = path.resolve(process.argv[2] || path.join(root, '../claude-code-themes'))
const out = path.resolve(process.argv[3] || path.join(root, 'assets'))
const font = fs.readFileSync(path.join(root, 'assets/banner.svg'), 'utf8').match(/base64,([A-Za-z0-9+/=]+)/)[1]

const C = { stage: '#09090B', card: '#0F0F10', line: '#1F1F22', text: '#FAFAFA', soft: '#D4D4D8', muted: '#A1A1AA', dim: '#52525B', red: '#EF4444', ember: '#FF8C42', gold: '#FFD166' }
const MONO = "ui-monospace,SFMono-Regular,'Cascadia Mono',Menlo,Consolas,monospace"

// Seeded, so a rebuild only changes what the code changed.
let seed = 7
const rnd = (low = 0, high = 1) => low + ((seed = (seed * 16807) % 2147483647) / 2147483647) * (high - low)
const n = v => +v.toFixed(2)
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const kf = (name, stops) => `@keyframes ${name}{${stops.map(([at, css]) => `${n(at)}%{${css}}`).join('')}}`
const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('')

const open = (w, h, title, css = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>
<style>@font-face{font-family:I;font-weight:100 900;src:url(data:font/woff2;base64,${font}) format("woff2")}
text{font-family:I,Inter,system-ui,sans-serif}.m{font-family:${MONO}}
.lbl{font-size:12px;font-weight:600;letter-spacing:.2em}.tag{font-size:11px;font-weight:600;letter-spacing:.14em}
${css}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.live{display:none}}</style>`

// A half card sits flush beside its partner; each keeps 8 units clear on the inner side, making the gutter.
const halfX = side => (side === 'left' ? 0 : 8)

// ---------------------------------------------------------------- Overpowered
// The app's real art on a lit stage. A set is logged, XP sparks out of the phone and climbs the nine painted
// emblems, and Legend bursts. All on one 14s clock.
const art = name => `data:image/webp;base64,${fs.readFileSync(path.join(root, 'assets/art', `${name}.webp`)).toString('base64')}`

const overpowered = () => {
  const W = 880, H = 470, T = 14, HZ = 398
  // Key, label, glow and label colors come from the app's own palette.
  const TIERS = [['iron', '#7FB6FF', '#C7DCF2'], ['bronze', '#FF7330', '#FFB98A'], ['silver', '#D6E8FF', '#EEF5FF'], ['gold', '#FFC400', '#FFE27A'], ['platinum', '#2EF6FF', '#9FFAFF'], ['diamond', '#6F7DFF', '#B8C3FF'], ['elite', '#22FF9C', '#8DFFCF'], ['champion', '#FF2450', '#FF8FA6'], ['legend', '#FFD23F', '#FFE58F']]
  const SIZE = [70, 74, 82, 92, 104, 118, 132, 150, 178]
  const pct = t => t / T * 100
  const at = i => pct(2.4 + i * .8)
  const HIT = at(8), HOLD = pct(13), OUT = pct(13.7)

  // Each emblem stands on the rail; the rail rises to the right and the emblems grow with it.
  let px = 305
  const P = SIZE.map((s, i) => {
    if (i) px += (SIZE[i - 1] + s) * .27
    const y = 428 - 106 * Math.pow(i / 8, 1.25)
    return { x: px, y, s, cy: y - s * .4 }
  })
  const legend = P[8]
  const START = [230, 322]

  const lengths = P.slice(1).map((p, i) => Math.hypot(p.x - P[i].x, p.y - P[i].y))
  const total = lengths.reduce((a, b) => a + b)
  const along = i => lengths.slice(0, i).reduce((a, b) => a + b, 0) / total
  const line = P.map(p => `${n(p.x)},${n(p.y)}`).join(' ')

  const emblems = P.map((p, i) => {
    return `<g transform="translate(${n(p.x)} ${n(p.cy)})"><use href="#em${i}" opacity=".15"/>
<g class="lit e${i}"><circle r="${n(p.s * .72)}" fill="url(#h${i})"/><use href="#em${i}"/></g></g>`
  }).join('\n')
  const labels = P.map((p, i) => {
    const [key, glow, label] = TIERS[i]
    return `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="2.5" fill="#2B2B30"/>
<text x="${n(p.x)}" y="${n(p.y + 16)}" text-anchor="middle" font-size="9.5" font-weight="700" letter-spacing="1.3" fill="#3F3F46">${key.toUpperCase()}</text>
<g class="lit e${i}" style="transform-origin:${n(p.x)}px ${n(p.y)}px"><circle cx="${n(p.x)}" cy="${n(p.y)}" r="3" fill="${glow}"/><text x="${n(p.x)}" y="${n(p.y + 16)}" text-anchor="middle" font-size="9.5" font-weight="700" letter-spacing="1.3" fill="${label}">${key.toUpperCase()}</text></g>`
  }).join('\n')

  const css = [
    kf('spark', [[0, `opacity:0;transform:translate(${START[0]}px,${START[1]}px)`], [pct(1.9), `opacity:0;transform:translate(${START[0]}px,${START[1]}px)`], [pct(2), `opacity:1;transform:translate(${START[0]}px,${START[1]}px)`],
      ...P.map((p, i) => [at(i), `opacity:1;transform:translate(${n(p.x)}px,${n(p.y)}px)`]),
      [HIT + 1, `opacity:0;transform:translate(${n(legend.x)}px,${n(legend.y)}px)`], [100, `opacity:0;transform:translate(${n(legend.x)}px,${n(legend.y)}px)`]]),
    kf('draw', [[0, 'stroke-dashoffset:1;opacity:1'], [at(0), 'stroke-dashoffset:1;opacity:1'], ...P.map((_, i) => [at(i), `stroke-dashoffset:${n(1 - along(i))};opacity:1`]), [HOLD, 'stroke-dashoffset:0;opacity:1'], [OUT, 'stroke-dashoffset:0;opacity:0'], [100, 'stroke-dashoffset:1;opacity:0']]),
    ...P.map((_, i) => kf(`e${i}`, [[0, 'opacity:0;transform:scale(.8)'], [at(i) - .2, 'opacity:0;transform:scale(.8)'], [at(i) + 1, 'opacity:1;transform:scale(1.2)'], [at(i) + 3.5, 'opacity:1;transform:scale(1)'], [HOLD, 'opacity:1;transform:scale(1)'], [OUT, 'opacity:0;transform:scale(1)'], [100, 'opacity:0;transform:scale(.8)']])),
    kf('xp', [[0, 'opacity:0'], [pct(2.2), 'opacity:0'], [pct(2.6), 'opacity:1'], [pct(8.2), 'opacity:1'], [pct(8.7), 'opacity:0'], [100, 'opacity:0']]),
    kf('season', [[0, 'opacity:0'], [pct(8.2), 'opacity:0'], [pct(8.7), 'opacity:1'], [HOLD, 'opacity:1'], [OUT, 'opacity:0'], [100, 'opacity:0']]),
    kf('gain', [[0, 'opacity:0;transform:translateY(10px)'], [pct(1.2), 'opacity:0;transform:translateY(10px)'], [pct(1.6), 'opacity:1;transform:none'], [pct(2.6), 'opacity:1;transform:translateY(-10px)'], [pct(3.1), 'opacity:0;transform:translateY(-16px)'], [100, 'opacity:0;transform:translateY(-16px)']]),
    kf('burst', [[0, 'opacity:0;transform:translate(0,0)'], [HIT, 'opacity:0;transform:translate(0,0)'], [HIT + .4, 'opacity:1;transform:translate(0,0);animation-timing-function:cubic-bezier(.1,.7,.3,1)'], [HIT + 14, 'opacity:0;transform:translate(var(--x),var(--y))'], [100, 'opacity:0;transform:translate(var(--x),var(--y))']]),
    kf('halo', [[0, 'opacity:.1'], [HIT, 'opacity:.1'], [HIT + 1.5, 'opacity:1'], [HOLD, 'opacity:.6'], [OUT, 'opacity:.1'], [100, 'opacity:.1']]),
    kf('rays', [[0, 'opacity:0'], [HIT, 'opacity:0'], [HIT + 1.5, 'opacity:.9'], [HOLD, 'opacity:.45'], [OUT, 'opacity:0'], [100, 'opacity:0']]),
    kf('rank', [[0, 'opacity:0;transform:translateY(8px)'], [HIT, 'opacity:0;transform:translateY(8px)'], [HIT + 2, 'opacity:1;transform:none'], [HOLD, 'opacity:1;transform:none'], [OUT, 'opacity:0;transform:none'], [100, 'opacity:0']]),
    kf('sweep', [[0, 'transform:translateX(-300px)'], [HIT, 'transform:translateX(-300px)'], [HIT + 9, 'transform:translateX(1100px)'], [100, 'transform:translateX(1100px)']]),
    kf('tglow', [[0, 'opacity:.5'], [HIT, 'opacity:.5'], [HIT + 1.5, 'opacity:1'], [HIT + 14, 'opacity:.5'], [100, 'opacity:.5']]),
    '@keyframes up{0%{opacity:0;transform:translateY(0)}15%{opacity:.9}100%{opacity:0;transform:translateY(-260px)}}',
    '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}',
    '@keyframes flickA{0%,100%{opacity:1}35%{opacity:.62}70%{opacity:.88}}',
    '@keyframes flickB{0%,100%{opacity:.25}35%{opacity:.95}70%{opacity:.5}}',
    '@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}',
    '@keyframes spin{to{transform:rotate(360deg)}}',
    `.spark{opacity:0;animation:spark ${T}s linear infinite}`,
    `.draw{animation:draw ${T}s linear infinite}`,
    ...P.map((_, i) => `.e${i}{animation:e${i} ${T}s ease-out infinite}`),
    `.xp{opacity:0;animation:xp ${T}s linear infinite}.season{opacity:0;animation:season ${T}s linear infinite}`,
    `.gain{opacity:0;animation:gain ${T}s ease-out infinite}`,
    `.bp{opacity:0;animation:burst ${T}s linear infinite}`,
    `.halo{animation:halo ${T}s ease-out infinite}.rays{opacity:0;animation:rays ${T}s ease-out infinite}`,
    `.rank{animation:rank ${T}s ease-out infinite}`,
    `.sw{transform:translateX(-300px);animation:sweep ${T}s linear infinite}`,
    `.tglow{animation:tglow ${T}s ease-out infinite}`,
    '.emb{opacity:0;animation:up linear infinite}',
    '.dot{animation:pulse 2.4s ease-in-out infinite}',
    '.fa{animation:flickA 1.7s ease-in-out infinite}.fb{opacity:.3;animation:flickB 1.7s ease-in-out infinite}',
    '.bob{animation:bob 6s ease-in-out infinite}',
    '.spin{animation:spin 60s linear infinite}',
  ].join('\n')

  const sparks = Array.from({ length: 26 }, (_, i) => {
    const angle = (i / 26) * Math.PI * 2 + rnd(-.15, .15), reach = rnd(70, 150)
    return `<circle class="bp" style="--x:${n(Math.cos(angle) * reach)}px;--y:${n(Math.sin(angle) * reach)}px" r="${n(rnd(1.2, 3))}" fill="${i % 3 ? C.gold : '#fff'}"/>`
  }).join('')
  const embers = Array.from({ length: 28 }, () => {
    const dur = rnd(5, 11)
    return `<circle class="emb" style="animation-duration:${n(dur)}s;animation-delay:-${n(rnd(0, dur))}s" cx="${n(rnd(10, 870))}" cy="${H - 6}" r="${n(rnd(.7, 1.9))}" fill="${[C.red, C.ember, C.gold][Math.floor(rnd(0, 3))]}"/>`
  }).join('')
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = i * 22.5 + rnd(-6, 6), wide = rnd(2.5, 6)
    return `<path transform="rotate(${n(a)})" fill="url(#ray)" d="M0 0L${n(-wide * 3.4)} -300H${n(wide * 3.4)}Z"/>`
  }).join('')
  const floor = [
    ...Array.from({ length: 21 }, (_, i) => { const k = i - 10; return `M${440 + k * 34} ${HZ}L${440 + k * 170} ${H + 4}` }),
    ...[6, 15, 28, 46].map(d => `M0 ${HZ + d}H${W}`),
  ].join('')

  const TITLE = 'OVERPOWERED'
  const titleAt = 'translate(36 126) skewX(-10)'
  const title = extra => `<text transform="${titleAt}" font-size="106" font-weight="900" textLength="792" lengthAdjust="spacingAndGlyphs" ${extra}>${TITLE}</text>`

  return `${open(W, H, 'Now building Overpowered: an iPhone workout tracker that plays like an RPG. Log a set, earn XP, and climb nine rank tiers from Iron to Legend. In development.', css)}
<defs>
<clipPath id="c"><rect width="${W}" height="${H}" rx="16"/></clipPath>
<clipPath id="ph"><rect x="70" y="226" width="160" height="337" rx="34"/></clipPath>
<clipPath id="tc">${title('')}</clipPath>
<radialGradient id="glow"><stop offset="0" stop-color="${C.gold}" stop-opacity=".5"/><stop offset=".45" stop-color="${C.ember}" stop-opacity=".22"/><stop offset="1" stop-color="${C.red}" stop-opacity="0"/></radialGradient>
<radialGradient id="left"><stop offset="0" stop-color="${C.red}" stop-opacity=".5"/><stop offset="1" stop-color="${C.red}" stop-opacity="0"/></radialGradient>
<radialGradient id="top" cx=".5" cy="0" r=".8"><stop offset="0" stop-color="#3B0A0A" stop-opacity=".85"/><stop offset="1" stop-color="#3B0A0A" stop-opacity="0"/></radialGradient>
<radialGradient id="ray" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="300"><stop offset="0" stop-color="#FFE9A0" stop-opacity=".55"/><stop offset="1" stop-color="#FFD23F" stop-opacity="0"/></radialGradient>
<linearGradient id="fl" x2="0" y2="1"><stop offset="0" stop-color="${C.red}" stop-opacity=".2"/><stop offset="1" stop-color="${C.red}" stop-opacity="0"/></linearGradient>
<linearGradient id="hz"><stop offset="0" stop-color="${C.red}" stop-opacity="0"/><stop offset=".5" stop-color="${C.red}" stop-opacity=".85"/><stop offset="1" stop-color="${C.red}" stop-opacity="0"/></linearGradient>
<linearGradient id="tf" gradientUnits="userSpaceOnUse" x1="0" y1="-78" x2="0" y2="2"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#FFE3DC"/><stop offset="1" stop-color="#F8695C"/></linearGradient>
<linearGradient id="sw"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="rail" gradientUnits="userSpaceOnUse" x1="${n(P[0].x)}" x2="${n(legend.x)}" y1="0" y2="0">${P.map((p, i) => `<stop offset="${n((p.x - P[0].x) / (legend.x - P[0].x))}" stop-color="${TIERS[i][1]}"/>`).join('')}</linearGradient>
<filter id="tb" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="16"/></filter>
<filter id="sb" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="5"/></filter>
${P.map((p, i) => `<image id="em${i}" x="${n(-p.s / 2)}" y="${n(-p.s / 2)}" width="${p.s}" height="${p.s}" href="${art(`emblem-${TIERS[i][0]}`)}"/><radialGradient id="h${i}"><stop offset="0" stop-color="${TIERS[i][1]}" stop-opacity=".5"/><stop offset="1" stop-color="${TIERS[i][1]}" stop-opacity="0"/></radialGradient>`).join('\n')}
<image id="back" x="-185" y="-185" width="370" height="370" href="${art('inferno-back')}"/>
</defs>
<g clip-path="url(#c)">
<rect width="${W}" height="${H}" fill="#07080B"/>
<rect width="${W}" height="220" fill="url(#top)"/>
<circle cx="150" cy="345" r="290" fill="url(#left)"/>
<rect y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#fl)"/>
<path d="${floor}" fill="none" stroke="${C.red}" stroke-opacity=".14"/>
<rect y="${HZ - .75}" width="${W}" height="1.5" fill="url(#hz)"/>
<circle class="halo" cx="${n(legend.x)}" cy="${n(legend.cy)}" r="300" fill="url(#glow)"/>
<g class="rays" transform="translate(${n(legend.x)} ${n(legend.cy)})"><g class="spin">${rays}</g></g>
<g transform="translate(150 353)"><use class="fa" href="#back"/><use class="fb" href="#back" transform="scale(-1 1)"/></g>
<image x="-35" y="168" width="370" height="370" href="${art('inferno-front')}"/>
${embers}
<polyline points="${line}" fill="none" stroke="#232327" stroke-width="2" stroke-linejoin="round"/>
<polyline class="draw" points="${line}" pathLength="1" stroke-dasharray="1 1" fill="none" stroke="url(#rail)" stroke-width="2.5" stroke-linejoin="round"/>
${emblems}
${labels}
<g transform="translate(${n(legend.x)} ${n(legend.cy)})">${sparks}</g>
<g class="bob"><g clip-path="url(#ph)">
<rect x="70" y="226" width="160" height="337" fill="#0A0F1E"/>
<image x="70" y="226" width="160" height="337" href="${art('screen-log')}"/>
<image class="xp" x="70" y="226" width="160" height="305" href="${art('screen-xp')}"/>
<image class="season" x="70" y="226" width="160" height="337" href="${art('screen-season')}"/>
</g><rect x="70.5" y="226.5" width="159" height="336" rx="34" fill="none" stroke="#5A5F6B" stroke-opacity=".7"/></g>
<g class="gain" font-weight="800"><text x="238" y="300" font-size="27" letter-spacing="-.6" fill="${C.gold}" stroke="#1A0606" stroke-width="3.5" stroke-linejoin="round" style="paint-order:stroke fill">+192 XP</text></g>
<g class="spark"><circle r="10" fill="${C.ember}" filter="url(#sb)"/><circle r="3.6" fill="#FFF3B0"/></g>
<g class="rank"><text x="${n(legend.x)}" y="${n(legend.y + 38)}" text-anchor="middle" font-size="19" font-weight="800" letter-spacing="1.6" fill="${C.gold}">RANK UP</text></g>
${title('fill="#EF4444" filter="url(#tb)" class="tglow"')}
${title('fill="url(#tf)"')}
<g clip-path="url(#tc)"><rect class="sw" y="30" width="170" height="110" fill="url(#sw)"/></g>
<image x="36" y="17" width="29" height="16.5" href="${art('op-mark')}"/>
<text x="74" y="30" class="lbl" fill="${C.red}">NOW BUILDING</text>
<rect x="705.5" y="13.5" width="139" height="23" rx="11.5" fill="#07080B" fill-opacity=".6" stroke="#5B1D1D"/><circle class="dot" cx="721" cy="25" r="3.5" fill="${C.red}"/><text x="732" y="29" class="tag" fill="${C.soft}">IN DEVELOPMENT</text>
<text x="40" y="162" font-size="22" font-weight="700" letter-spacing="-.5" fill="${C.text}">Log fast. Level up. Rank honestly.</text>
<text x="848" y="436" text-anchor="end" font-size="14.5" fill="${C.muted}">An iPhone workout tracker that plays like an RPG.</text>
<text x="848" y="456" text-anchor="end" class="tag" fill="${C.soft}">27 RANKS · BOSSES · SEASON PASS · LOOT</text>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${C.line}"/>
</svg>`
}

// ---------------------------------------------------------------- Claude Code Themes
// A little terminal running /theme: every 3s it becomes the next theme, drawn from that theme's own data.
const themesCard = LOOKS => {
  const W = 440, H = 470, X = halfX('left'), STAGE = 300, EACH = 3
  const cardW = W - 8
  const dark = plugin => key => JSON.parse(fs.readFileSync(path.join(themesRepo, plugin, 'themes', `${key}.json`), 'utf8')).overrides
  const hackerColors = dark('hacker-terminal')('hacker')
  const themes = [...Object.values(LOOKS).map(l => ({ ...l, t: dark('theme-pack')(l.key), spin: `✻ ${l.verbs[0]}… ${l.glyph}` })), {
    key: 'hacker', glyph: '▓', badge: '▓ hacker', accent: hackerColors.success, t: hackerColors, spin: '✻ Thinking…',
    banner: ['▄▀█ █▀▀ █▀▀ █▀▀ █▀ █▀   █▀▀ █▀█ ▄▀█ █▄ █ ▀█▀ █▀▀ █▀▄', '█▀█ █▄▄ █▄▄ ██▄ ▄█ ▄█   █▄█ █▀▄ █▀█ █ ▀█  █  ██▄ █▄▀'],
    colors: { top: hackerColors.success, bottom: hackerColors.success, tagline: hackerColors.inactive },
    tagline: '[ OK ] uplink established · type to begin_',
  }]
  const pixels = (look, x, y) => {
    // Royal leads with a crown glyph; only the blocks are drawn, so start from the first one.
    const lead = Math.min(...look.banner.map(r => [...r].findIndex(ch => '█▀▄'.includes(ch))))
    const cols = Math.max(...look.banner.map(r => [...r].length)) - lead, p = Math.min(8, 384 / cols)
    const row = (text, r) => {
      let d = ''
      ;[...text].slice(lead).forEach((ch, i) => {
        if (ch === '█' || ch === '▀') d += `M${n(x + i * p)} ${n(y + r * 2 * p)}h${n(p)}v${n(p)}h${n(-p)}z`
        if (ch === '█' || ch === '▄') d += `M${n(x + i * p)} ${n(y + (r * 2 + 1) * p)}h${n(p)}v${n(p)}h${n(-p)}z`
      })
      return d
    }
    return `<path shape-rendering="crispEdges" fill="${look.colors.top}" d="${row(look.banner[0], 0)}"/><path shape-rendering="crispEdges" fill="${look.colors.bottom}" d="${row(look.banner[1], 1)}"/>`
  }
  // The themes' own files share ids (edge, glass, rail), so each gets a prefix before nesting.
  const bar = (key, x, y, w) => fs.readFileSync(path.join(themesRepo, `docs/images/${key}-bar.svg`), 'utf8')
    .replace(/id="([^"]+)"/g, `id="${key}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#${key}-$1)`)
    .replace('<svg ', `<svg x="${x}" y="${y}" `).replace('width="480" height="54"', `width="${w}" height="${n(w * 54 / 480)}"`)

  const TX = X + 16, TY = 16, TW = cardW - 32, TH = STAGE - 32
  const layer = (look, i) => {
    const { t } = look, bottom = TY + TH
    return `<g class="L${i ? '' : ' L0'}" style="animation-delay:${i * EACH}s">
<text x="${TX + TW - 12}" y="${TY + 18}" class="m" text-anchor="end" font-size="11" fill="${look.accent}">${esc(look.badge)}</text>
<g class="live">${bar(look.key, TX + 8, TY + 34, TW - 16)}</g>
${pixels(look, TX + 8, TY + 92)}
<text x="${TX + 8}" y="${TY + 146}" class="m" font-size="11.5" fill="${look.colors.tagline}">${esc(look.tagline)}</text>
<text x="${TX + 8}" y="${TY + 174}" class="m" font-size="12.5" fill="${t.claude}">${esc(look.spin)}</text>
<path d="M${TX + 8} ${bottom - 58}h${TW - 16}M${TX + 8} ${bottom - 22}h${TW - 16}" stroke="${t.promptBorder}"/>
<text x="${TX + 10}" y="${bottom - 35}" class="m" font-size="13" fill="${t.text}">&gt; /theme <tspan fill="${look.accent}">› ${look.key}</tspan><tspan class="cur" fill="${look.accent}"> ▌</tspan></text>
</g>`
  }
  const names = themes.map(l => l.key.toUpperCase())
  let px = X + 24
  const pager = names.map((name, i) => {
    const x = px
    px += name.length * 8.3 + 13
    return `<text x="${n(x)}" y="451" font-size="10.5" font-weight="600" textLength="${n(name.length * 8.3)}" fill="${C.dim}">${name}</text><text class="L${i ? '' : ' L0'}" style="animation-delay:${i * EACH}s" x="${n(x)}" y="451" font-size="10.5" font-weight="600" textLength="${n(name.length * 8.3)}" fill="${mix(themes[i].accent, '#ffffff', .25)}">${name}</text>`
  }).join('')

  const css = [
    `@keyframes show{0%{opacity:0}1.5%,15.2%{opacity:1}16.7%,100%{opacity:0}}`,
    `.L{opacity:0;animation:show ${EACH * themes.length}s linear infinite}.L0{opacity:1}`,
    '@keyframes blink{0%,49%{fill-opacity:1}50%,100%{fill-opacity:0}}.cur{animation:blink 1.1s step-end infinite}',
  ].join('\n')
  const defs = themes.map(l => `<radialGradient id="glow-${l.key}" cx=".5" cy=".42" r=".72"><stop offset="0" stop-color="${l.accent}" stop-opacity=".5"/><stop offset="1" stop-color="${l.accent}" stop-opacity="0"/></radialGradient>`).join('')

  return `${open(W, H, 'Claude Code Themes: six animated themes for Claude Code, plus a themed HUD for the desktop app. Sakura, Voltage, Royal, Crunch, Xody and Hacker.', css)}
<defs><clipPath id="c"><rect x="${X}" width="${cardW}" height="${H}" rx="16"/></clipPath>${defs}</defs>
<g clip-path="url(#c)">
<rect x="${X}" width="${cardW}" height="${H}" fill="${C.card}"/>
<rect x="${X}" width="${cardW}" height="${STAGE}" fill="${C.stage}"/>
${themes.map((l, i) => `<rect class="L${i ? '' : ' L0'}" style="animation-delay:${i * EACH}s" x="${X}" width="${cardW}" height="${STAGE}" fill="url(#glow-${l.key})"/>`).join('')}
<rect x="${TX + .5}" y="${TY + .5}" width="${TW - 1}" height="${TH - 1}" rx="10" fill="#0B0B0D" stroke="#2A2A30"/>
${[0, 1, 2].map(i => `<circle cx="${TX + 16 + i * 14}" cy="${TY + 14}" r="4" fill="#3A3A41"/>`).join('')}
<text x="${TX + 66}" y="${TY + 18}" class="m" font-size="11" fill="${C.dim}">claude · ~/my-app</text>
<path d="M${TX} ${TY + 28}h${TW}" stroke="#222226"/>
${themes.map(layer).join('\n')}
<path d="M${X} ${STAGE + .5}h${cardW}" stroke="${C.line}"/>
</g>
<rect x="${X + .5}" y=".5" width="${cardW - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${C.line}"/>
<text x="${X + 24}" y="332" class="lbl" fill="${C.red}">OPEN SOURCE</text>
<text x="${X + cardW - 24}" y="332" class="tag" fill="${C.muted}" text-anchor="end">VIEW REPO →</text>
<text x="${X + 22}" y="374" font-size="33" font-weight="800" letter-spacing="-1.2" fill="${C.text}">Claude Code Themes</text>
<text font-size="15" fill="${C.muted}"><tspan x="${X + 24}" y="401">Six animated themes for Claude Code, plus a</tspan><tspan x="${X + 24}" y="422">themed HUD for the desktop app.</tspan></text>
${pager}
</svg>`
}

// ---------------------------------------------------------------- Claude Color Coded
// A cursor right-clicks a group and picks green, the rest light up, and the list scrolls with colors locked on.
const colorCoded = () => {
  const W = 440, H = 470, X = halfX('right'), STAGE = 300, T = 12
  const cardW = W - 8
  const PX = X + 58, PY = 16, PW = cardW - 116, PH = STAGE - 32
  const ROW = 27
  const rowY = i => PY + 12 + i * ROW
  const ROWS = [
    { t: 'Portfolio Site', group: 'open', hl: '#22C55E', name: '#BBF7D0', at: 30 },
    { t: 'Landing page' }, { t: 'Contact form' }, { t: 'Image cleanup' },
    { t: 'Mobile App', group: 'shut', hl: '#3B82F6', name: '#DBEAFE', at: 34 },
    { t: 'Client Work', group: 'shut', hl: '#F97316', name: '#FDE047', at: 37 },
    { t: 'Game Jam', group: 'shut', hl: 'url(#gj)', edge: '#EC4899', name: '#FBCFE8', at: 40 },
    { t: 'Reading List', group: 'shut', name: '#F472B6', at: 43 },
    { t: 'Level editor' }, { t: 'Sound pass' }, { t: 'Boss fight notes' }, { t: 'Press kit' },
  ]
  const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#A855F7', '#EC4899']
  const rows = ROWS.map((r, i) => {
    const y = rowY(i), tx = PX + (r.group ? 26 : 30), base = r.group ? C.muted : C.soft, weight = r.group ? 600 : 400
    const arrow = r.group === 'open' ? `M${PX + 13} ${y + 11}l4 5 4-5z` : `M${PX + 14} ${y + 9}l5 4.5-5 4.5z`
    const lit = r.at ? `<g class="hl h${i}">${r.hl ? `<rect x="${PX + 6}" y="${y + 2}" width="${PW - 12}" height="${ROW - 3}" rx="6" fill="${r.hl}" fill-opacity="${r.edge ? 1 : .3}" stroke="${r.edge || r.hl}" stroke-opacity=".75"/>` : ''}<text x="${tx}" y="${y + 18}" font-size="12.5" font-weight="${weight}" fill="${r.name}">${r.t}</text></g>` : ''
    return `<text x="${tx}" y="${y + 18}" font-size="12.5" font-weight="${weight}" fill="${base}">${r.t}</text>${r.group ? `<path d="${arrow}" fill="${C.dim}"/>` : ''}${lit}`
  }).join('\n')

  const MX = PX + 92, MY = rowY(0) + 16, MW = 176
  const SX = i => MX + 28 + (i % 4) * 40, SY = i => MY + 88 + Math.floor(i / 4) * 34
  const pos = (x, y) => `transform:translate(${n(x)}px,${n(y)}px)`
  const start = [PX + PW + 8, PY + PH - 26], onRow = [PX + 82, rowY(0) + 13], onItem = [MX + 60, MY + 40], onGreen = [SX(3) + 1, SY(3) + 1]
  const css = [
    kf('cursor', [[0, `opacity:0;${pos(...start)}`], [2, `opacity:1;${pos(...start)}`], [9, `opacity:1;${pos(...onRow)}`], [15, `opacity:1;${pos(...onRow)}`], [19, `opacity:1;${pos(...onItem)}`], [22, `opacity:1;${pos(...onItem)}`], [27, `opacity:1;${pos(...onGreen)}`], [31, `opacity:1;${pos(...onGreen)}`], [35, `opacity:0;${pos(...start)}`], [100, `opacity:0;${pos(...start)}`]]),
    kf('menu', [[0, 'opacity:0'], [10.5, 'opacity:0'], [11.5, 'opacity:1'], [30, 'opacity:1'], [31, 'opacity:0'], [100, 'opacity:0']]),
    kf('palette', [[0, 'opacity:0'], [20.5, 'opacity:0'], [21.5, 'opacity:1'], [30, 'opacity:1'], [31, 'opacity:0'], [100, 'opacity:0']]),
    kf('pick', [[0, 'opacity:0'], [26.5, 'opacity:0'], [27.5, 'opacity:1'], [30, 'opacity:1'], [31, 'opacity:0'], [100, 'opacity:0']]),
    kf('hover', [[0, 'opacity:0'], [8.5, 'opacity:0'], [9.5, 'opacity:1'], [30, 'opacity:1'], [31, 'opacity:0'], [100, 'opacity:0']]),
    kf('scroll', [[0, 'transform:translateY(0)'], [52, 'transform:translateY(0)'], [59, 'transform:translateY(-81px)'], [70, 'transform:translateY(-81px)'], [77, 'transform:translateY(0)'], [100, 'transform:translateY(0)']]),
    ...ROWS.map((r, i) => (r.at ? kf(`h${i}`, [[0, 'opacity:0'], [r.at, 'opacity:0'], [r.at + 1.5, 'opacity:1'], [91, 'opacity:1'], [96, 'opacity:0'], [100, 'opacity:0']]) : '')),
    `@keyframes hue{${COLORS.map((c, i) => `${n(i * 100 / COLORS.length)}%{fill:${c}}`).join('')}100%{fill:${COLORS[0]}}}`,
    `.cursor{opacity:0;animation:cursor ${T}s cubic-bezier(.4,0,.2,1) infinite}`,
    `.menu{opacity:0;animation:menu ${T}s linear infinite}.palette{opacity:0;animation:palette ${T}s linear infinite}.pick{opacity:0;animation:pick ${T}s linear infinite}.hover{opacity:0;animation:hover ${T}s linear infinite}`,
    `.list{animation:scroll ${T}s cubic-bezier(.4,0,.2,1) infinite}`,
    ...ROWS.map((r, i) => (r.at ? `.h${i}{animation:h${i} ${T}s ease-out infinite}` : '')),
    '.hue{fill:#22C55E;animation:hue 16s linear infinite}',
  ].filter(Boolean).join('\n')

  return `${open(W, H, 'Claude Color Coded: color-code the sidebar of the Claude desktop app. Right-click a group, pick a color, and it stays on its row even mid-scroll. Windows, C#, MIT, unofficial.', css)}
<defs>
<clipPath id="c"><rect x="${X}" width="${cardW}" height="${H}" rx="16"/></clipPath>
<clipPath id="side"><rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="12"/></clipPath>
<radialGradient id="a1" cx="0" cy="1" r="1"><stop offset="0" stop-color="#A855F7" stop-opacity=".3"/><stop offset="1" stop-color="#A855F7" stop-opacity="0"/></radialGradient>
<radialGradient id="a2" cx="1" cy="0" r="1"><stop offset="0" stop-color="#14B8A6" stop-opacity=".26"/><stop offset="1" stop-color="#14B8A6" stop-opacity="0"/></radialGradient>
<radialGradient id="a3" cx="1" cy="1" r=".9"><stop offset="0" stop-color="#F97316" stop-opacity=".2"/><stop offset="1" stop-color="#F97316" stop-opacity="0"/></radialGradient>
<linearGradient id="gj"><stop offset="0" stop-color="#A855F7" stop-opacity=".5"/><stop offset="1" stop-color="#EC4899" stop-opacity=".45"/></linearGradient>
<linearGradient id="foot" x2="0" y2="1"><stop offset="0" stop-color="#141416" stop-opacity="0"/><stop offset="1" stop-color="#141416"/></linearGradient>
</defs>
<g clip-path="url(#c)">
<rect x="${X}" width="${cardW}" height="${H}" fill="${C.card}"/>
<rect x="${X}" width="${cardW}" height="${STAGE}" fill="${C.stage}"/>
<rect x="${X}" width="${cardW}" height="${STAGE}" fill="url(#a1)"/><rect x="${X}" width="${cardW}" height="${STAGE}" fill="url(#a2)"/><rect x="${X}" width="${cardW}" height="${STAGE}" fill="url(#a3)"/>
<rect x="${PX + .5}" y="${PY + .5}" width="${PW - 1}" height="${PH - 1}" rx="12" fill="#141416" stroke="#2A2A30"/>
<g clip-path="url(#side)"><g class="list">
<rect class="hover" x="${PX + 6}" y="${rowY(0) + 2}" width="${PW - 12}" height="${ROW - 3}" rx="6" fill="#fff" fill-opacity=".07"/>
${rows}
</g><rect x="${PX}" y="${PY + PH - 30}" width="${PW}" height="30" fill="url(#foot)"/></g>
<rect x="${PX + .5}" y="${PY + .5}" width="${PW - 1}" height="${PH - 1}" rx="12" fill="none" stroke="#2A2A30"/>
<g class="menu"><rect x="${MX}" y="${MY}" width="${MW}" height="66" rx="8" fill="#1E1E22" stroke="#34343A"/>
<text x="${MX + 12}" y="${MY + 26}" font-size="12" fill="${C.soft}">Select font color</text><text x="${MX + MW - 12}" y="${MY + 26}" font-size="12" text-anchor="end" fill="${C.dim}">›</text>
<rect x="${MX + 5}" y="${MY + 34}" width="${MW - 10}" height="26" rx="5" fill="#fff" fill-opacity=".08"/>
<text x="${MX + 12}" y="${MY + 52}" font-size="12" fill="${C.text}">Select color</text><text x="${MX + MW - 12}" y="${MY + 52}" font-size="12" text-anchor="end" fill="${C.dim}">›</text></g>
<g class="palette"><rect x="${MX}" y="${MY + 70}" width="${MW}" height="70" rx="8" fill="#1E1E22" stroke="#34343A"/>${COLORS.map((c, i) => `<circle cx="${SX(i)}" cy="${SY(i)}" r="10" fill="${c}"/>`).join('')}
<circle class="pick" cx="${SX(3)}" cy="${SY(3)}" r="13.5" fill="none" stroke="#fff" stroke-width="2"/></g>
<g class="cursor"><path d="M0 0v16.5l4.4-3.8 2.9 6.6 2.7-1.2-2.8-6.3h5.8z" fill="#fff" stroke="#000" stroke-width="1"/></g>
<path d="M${X} ${STAGE + .5}h${cardW}" stroke="${C.line}"/>
</g>
<rect x="${X + .5}" y=".5" width="${cardW - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${C.line}"/>
<text x="${X + 24}" y="332" class="lbl" fill="${C.red}">OPEN SOURCE</text>
<text x="${X + cardW - 24}" y="332" class="tag" fill="${C.muted}" text-anchor="end">VIEW REPO →</text>
<text x="${X + 22}" y="374" font-size="33" font-weight="800" letter-spacing="-1.2" fill="${C.text}">Claude <tspan class="hue">Color</tspan> Coded</text>
<text font-size="15" fill="${C.muted}"><tspan x="${X + 24}" y="401">Right-click a group in the Claude desktop sidebar</tspan><tspan x="${X + 24}" y="422">and pick a color. It stays on its row, even mid-scroll.</tspan></text>
<text x="${X + 24}" y="451" font-size="10.5" font-weight="600" letter-spacing="1.3" fill="${C.soft}">WINDOWS · C# · MIT · UNOFFICIAL</text>
</svg>`
}

// ---------------------------------------------------------------- Stack
// A slow ticker. textLength pins each word's width, so one set is an exact, seamless loop.
const stack = () => {
  const W = 880, H = 76, SIZE = 27
  const ITEMS = ['CLAUDE CODE', 'CODEX', 'TYPESCRIPT', 'NEXT.JS', 'SWIFT', 'C#', 'PYTHON']
  const width = word => Math.round(word.length * SIZE * .71)
  let x = 0
  const set = ITEMS.map((word, i) => {
    const w = width(word), at = x
    x += w + 56
    const paint = i % 2 ? `fill="${C.card}" stroke="${C.dim}" stroke-width="1.2" style="paint-order:stroke fill"` : `fill="${C.soft}"`
    return `<text x="${at}" y="47" font-size="${SIZE}" font-weight="800" textLength="${w}" lengthAdjust="spacing" ${paint}>${word}</text><path d="M${at + w + 28} 33l5 5-5 5-5-5z" fill="${C.red}"/>`
  }).join('')
  const span = x
  const css = `@keyframes tick{from{transform:translateX(0)}to{transform:translateX(-${span}px)}}.tick{animation:tick ${Math.round(span / 34)}s linear infinite}`
  return `${open(W, H, 'Stack: Claude Code, Codex, TypeScript, Next.js, Swift, C#, Python', css)}
<defs><clipPath id="c"><rect width="${W}" height="${H}" rx="16"/></clipPath>
<linearGradient id="l"><stop offset="0" stop-color="${C.card}"/><stop offset=".55" stop-color="${C.card}"/><stop offset="1" stop-color="${C.card}" stop-opacity="0"/></linearGradient>
<linearGradient id="r"><stop offset="0" stop-color="${C.card}" stop-opacity="0"/><stop offset="1" stop-color="${C.card}"/></linearGradient></defs>
<g clip-path="url(#c)"><rect width="${W}" height="${H}" fill="${C.card}"/>
<g transform="translate(130 0)"><g class="tick"><g>${set}</g><g transform="translate(${span} 0)">${set}</g></g></g>
<rect width="190" height="${H}" fill="url(#l)"/><rect x="${W - 90}" width="90" height="${H}" fill="url(#r)"/></g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${C.line}"/>
<text x="40" y="43" class="lbl" fill="${C.red}">STACK</text>
</svg>`
}

// ---------------------------------------------------------------- Contact
const X_LOGO = 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'
const DISCORD_LOGO = 'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.032.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z'
const contact = (side, label, handle, logo, isLink) => {
  const W = 440, H = 84, X = halfX(side), cardW = W - 8
  return `${open(W, H, `${label}: ${handle}`)}
<rect x="${X + .5}" y=".5" width="${cardW - 1}" height="${H - 1}" rx="15.5" fill="${C.card}" stroke="${C.line}"/>
<rect x="${X + 20.5}" y="18.5" width="47" height="47" rx="12" fill="#17171A" stroke="#2A2A30"/>
<path transform="translate(${X + 33} 31) scale(.917)" fill="${C.text}" d="${logo}"/>
<text x="${X + 84}" y="36" class="tag" fill="${C.red}">${label}</text>
<text x="${X + 83}" y="60" font-size="21" font-weight="700" letter-spacing="-.4" fill="${C.text}">${handle}</text>
${isLink ? `<text x="${X + cardW - 26}" y="50" font-size="22" font-weight="500" text-anchor="end" fill="${C.muted}">→</text>` : ''}
</svg>`
}

const { LOOKS } = await import(pathToFileURL(path.join(themesRepo, 'theme-pack/hooks/looks.ts')).href)
fs.mkdirSync(out, { recursive: true })
const cards = {
  'now-overpowered.svg': overpowered(),
  'claude-code-themes.svg': themesCard(LOOKS),
  'claude-color-coded.svg': colorCoded(),
  'stack.svg': stack(),
  'chip-x.svg': contact('left', 'X', '@imxody', X_LOGO, true),
  'chip-discord.svg': contact('right', 'DISCORD', '@xodyz', DISCORD_LOGO, false),
}
for (const [name, svg] of Object.entries(cards)) {
  fs.writeFileSync(path.join(out, name), svg)
  console.log(name, Math.round(svg.length / 1024) + ' KB')
}
