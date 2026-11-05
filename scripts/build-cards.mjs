// Builds the cards in assets/, all but banner.svg, which this only reads for its embedded Inter (OFL).
// GitHub shows README SVGs as <img>: no scripts, no web fonts, no hover. Motion is CSS and SMIL only.
// The themes card draws from a checkout of ClaudeCodeThemes, so it shows what the themes really draw.
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
// A spark climbs the nine rank tiers, lighting each emblem, and Legend bursts. All on one 10s clock.
const overpowered = () => {
  const W = 880, H = 340, STAGE = 216, T = 10
  const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ELITE', 'CHAMPION', 'LEGEND']
  const at = i => 5 + i * 6.5
  const HIT = at(8)
  const P = TIERS.map((_, i) => ({ x: 62 + i * 88, y: 152 - 88 * Math.pow(i / 8, 1.35), s: 15 + i * 2.6 }))
  const ramp = i => mix('#4B4B52', C.red, Math.pow(i / 8, 1.1))

  const shield = s => `M0 ${n(-s)}L${n(.86 * s)} ${n(-.62 * s)}V${n(.1 * s)}C${n(.86 * s)} ${n(.62 * s)} ${n(.4 * s)} ${n(.9 * s)} 0 ${n(1.04 * s)}C${n(-.4 * s)} ${n(.9 * s)} ${n(-.86 * s)} ${n(.62 * s)} ${n(-.86 * s)} ${n(.1 * s)}V${n(-.62 * s)}Z`
  const stroke = s => `fill="none" stroke="#fff" stroke-width="${n(Math.max(1.6, s * .09))}" stroke-linecap="round" stroke-linejoin="round"`
  const chevron = (s, y) => `<path d="M${n(-.42 * s)} ${n(y)}L0 ${n(y + .26 * s)}L${n(.42 * s)} ${n(y)}" ${stroke(s)}/>`
  const star = (s, r, y = 0) => `<path transform="translate(0 ${n(y)})" fill="#fff" d="M0 ${n(-r * s)}L${n(.12 * s)} ${n(-.12 * s)}L${n(r * s)} 0L${n(.12 * s)} ${n(.12 * s)}L0 ${n(r * s)}L${n(-.12 * s)} ${n(.12 * s)}L${n(-r * s)} 0L${n(-.12 * s)} ${n(-.12 * s)}Z"/>`
  const gem = (s, y) => `<path transform="translate(0 ${n(y)})" fill="#fff" d="M0 ${n(-.34 * s)}L${n(.34 * s)} 0L0 ${n(.34 * s)}L${n(-.34 * s)} 0Z"/>`
  const crown = s => `<path fill="#fff" d="M${n(-.46 * s)} ${n(.3 * s)}L${n(-.52 * s)} ${n(-.26 * s)}L${n(-.22 * s)} ${n(-.02 * s)}L0 ${n(-.42 * s)}L${n(.22 * s)} ${n(-.02 * s)}L${n(.52 * s)} ${n(-.26 * s)}L${n(.46 * s)} ${n(.3 * s)}Z"/>`
  // Nine marks: chevrons, then stars, then gems, then the crown.
  const mark = (i, s) => [
    chevron(s, -.1 * s),
    chevron(s, -.26 * s) + chevron(s, .06 * s),
    chevron(s, -.38 * s) + chevron(s, -.08 * s) + chevron(s, .22 * s),
    star(s, .46),
    star(s, .4, -.14 * s) + chevron(s, .28 * s),
    gem(s, 0),
    gem(s, -.14 * s) + chevron(s, .28 * s),
    star(s, .5, -.06 * s) + chevron(s, .4 * s),
    crown(s),
  ][i]
  const wing = (s, dir) => `<path fill="url(#wing)" transform="scale(${dir} 1)" d="M${n(.8 * s)} ${n(-.3 * s)}C${n(1.2 * s)} ${n(-.72 * s)} ${n(1.6 * s)} ${n(-.8 * s)} ${n(2 * s)} ${n(-1.02 * s)}C${n(1.92 * s)} ${n(-.62 * s)} ${n(1.78 * s)} ${n(-.42 * s)} ${n(1.62 * s)} ${n(-.26 * s)}C${n(1.66 * s)} ${n(-.2 * s)} ${n(1.68 * s)} ${n(-.16 * s)} ${n(1.68 * s)} ${n(-.1 * s)}C${n(1.42 * s)} ${n(.02 * s)} ${n(1.1 * s)} ${n(.16 * s)} ${n(.82 * s)} ${n(.3 * s)}Z"/>`

  const emblems = P.map((p, i) => {
    const color = ramp(i)
    return `<g transform="translate(${n(p.x)} ${n(p.y)})"><path d="${shield(p.s)}" fill="#131315" stroke="#2A2A2E" stroke-width="1.5"/>
<text y="${n(p.s * 1.04 + 17)}" text-anchor="middle" font-size="9.5" font-weight="600" letter-spacing="1.3" fill="#3F3F46">${TIERS[i]}</text>
<g class="lit e${i}">${i === 8 ? wing(p.s, 1) + wing(p.s, -1) : ''}<path d="${shield(p.s)}" fill="${color}" filter="url(#blur)" opacity=".55"/><path d="${shield(p.s)}" fill="url(#g${i})" stroke="${mix(color, '#ffffff', .4)}" stroke-width="1.5"/>${mark(i, p.s)}
<text y="${n(p.s * 1.04 + 17)}" text-anchor="middle" font-size="9.5" font-weight="600" letter-spacing="1.3" fill="${mix(color, '#ffffff', .5)}">${TIERS[i]}</text></g></g>`
  }).join('\n')

  // The line and rail both advance by rung, so they stay locked to the spark.
  const lengths = P.slice(1).map((p, i) => Math.hypot(p.x - P[i].x, p.y - P[i].y))
  const total = lengths.reduce((a, b) => a + b)
  const along = i => lengths.slice(0, i).reduce((a, b) => a + b, 0) / total
  const line = P.map(p => `${n(p.x)},${n(p.y)}`).join(' ')
  const legend = P[8]

  const css = [
    kf('spark', [[0, `opacity:0;transform:translate(${n(P[0].x)}px,${n(P[0].y)}px)`], [at(0) - 1, `opacity:0;transform:translate(${n(P[0].x)}px,${n(P[0].y)}px)`],
      ...P.map((p, i) => [at(i), `opacity:1;transform:translate(${n(p.x)}px,${n(p.y)}px)`]),
      [HIT + 1, `opacity:0;transform:translate(${n(legend.x)}px,${n(legend.y)}px)`], [100, `opacity:0;transform:translate(${n(legend.x)}px,${n(legend.y)}px)`]]),
    kf('draw', [[0, 'stroke-dashoffset:1;opacity:1'], [at(0), 'stroke-dashoffset:1;opacity:1'], ...P.map((_, i) => [at(i), `stroke-dashoffset:${n(1 - along(i))};opacity:1`]), [92, 'stroke-dashoffset:0;opacity:1'], [98, 'stroke-dashoffset:0;opacity:0'], [100, 'stroke-dashoffset:1;opacity:0']]),
    kf('rail', [[0, 'transform:scaleX(0);opacity:1'], [at(0), 'transform:scaleX(0);opacity:1'], ...P.map((_, i) => [at(i), `transform:scaleX(${n(along(i))});opacity:1`]), [92, 'transform:scaleX(1);opacity:1'], [98, 'transform:scaleX(1);opacity:0'], [100, 'transform:scaleX(0);opacity:0']]),
    ...P.map((_, i) => kf(`e${i}`, [[0, 'opacity:0;transform:scale(.82)'], [at(i) - .2, 'opacity:0;transform:scale(.82)'], [at(i) + 1, 'opacity:1;transform:scale(1.18)'], [at(i) + 4, 'opacity:1;transform:scale(1)'], [92, 'opacity:1;transform:scale(1)'], [98, 'opacity:0;transform:scale(1)'], [100, 'opacity:0;transform:scale(.82)']])),
    kf('burst', [[0, 'opacity:0;transform:translate(0,0)'], [HIT, 'opacity:0;transform:translate(0,0)'], [HIT + .4, 'opacity:1;transform:translate(0,0);animation-timing-function:cubic-bezier(.1,.7,.3,1)'], [HIT + 14, 'opacity:0;transform:translate(var(--x),var(--y))'], [100, 'opacity:0;transform:translate(var(--x),var(--y))']]),
    kf('halo', [[0, 'opacity:.12'], [HIT, 'opacity:.12'], [HIT + 1.5, 'opacity:1'], [92, 'opacity:.6'], [100, 'opacity:.12']]),
    kf('float', [[0, 'opacity:0;transform:translateY(8px)'], [HIT, 'opacity:0;transform:translateY(8px)'], [HIT + 2, 'opacity:1;transform:none'], [HIT + 22, 'opacity:1;transform:translateY(-6px)'], [HIT + 30, 'opacity:0;transform:translateY(-10px)'], [100, 'opacity:0;transform:translateY(-10px)']]),
    '@keyframes up{0%{opacity:0;transform:translateY(0)}15%{opacity:.85}100%{opacity:0;transform:translateY(-200px)}}',
    '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}',
    `.spark{opacity:0;animation:spark ${T}s linear infinite}`,
    `.draw{animation:draw ${T}s linear infinite}`,
    `.rail{transform-box:fill-box;transform-origin:left;animation:rail ${T}s linear infinite}`,
    ...P.map((_, i) => `.e${i}{animation:e${i} ${T}s ease-out infinite}`),
    `.bp{opacity:0;animation:burst ${T}s linear infinite}`,
    `.halo{animation:halo ${T}s ease-out infinite}`,
    `.float{opacity:0;animation:float ${T}s ease-out infinite}`,
    '.emb{opacity:0;animation:up linear infinite}',
    '.dot{animation:pulse 2.4s ease-in-out infinite}',
  ].join('\n')

  const sparks = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + rnd(-.15, .15), reach = rnd(36, 92)
    return `<circle class="bp" style="--x:${n(Math.cos(angle) * reach)}px;--y:${n(Math.sin(angle) * reach)}px" r="${n(rnd(1, 2.4))}" fill="${i % 3 ? C.ember : C.gold}"/>`
  }).join('')
  const embers = Array.from({ length: 20 }, () => {
    const dur = rnd(5, 11)
    return `<circle class="emb" style="animation-duration:${n(dur)}s;animation-delay:-${n(rnd(0, dur))}s" cx="${n(rnd(200, 870))}" cy="${STAGE - 4}" r="${n(rnd(.7, 1.7))}" fill="${[C.red, C.ember, C.gold][Math.floor(rnd(0, 3))]}"/>`
  }).join('')

  return `${open(W, H, 'Now building Overpowered: an iPhone workout tracker that plays like an RPG. Log fast, level up, rank honestly. In development.', css)}
<defs>
<clipPath id="c"><rect width="${W}" height="${H}" rx="16"/></clipPath>
<pattern id="d" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#242427"/></pattern>
<linearGradient id="fade" x1="0" x2="1"><stop offset=".2" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient>
<mask id="dm"><rect width="${W}" height="${STAGE}" fill="url(#fade)"/></mask>
<radialGradient id="glow"><stop offset="0" stop-color="${C.red}" stop-opacity=".42"/><stop offset="1" stop-color="${C.red}" stop-opacity="0"/></radialGradient>
<linearGradient id="heat" gradientUnits="userSpaceOnUse" x1="${P[0].x}" x2="${legend.x}" y1="0" y2="0"><stop offset="0" stop-color="#7F1D1D"/><stop offset=".6" stop-color="${C.red}"/><stop offset="1" stop-color="${C.ember}"/></linearGradient>
<linearGradient id="railfill"><stop offset="0" stop-color="#7F1D1D"/><stop offset=".55" stop-color="${C.red}"/><stop offset=".85" stop-color="${C.ember}"/><stop offset="1" stop-color="${C.gold}"/></linearGradient>
<linearGradient id="wing" x1="0" x2="1"><stop offset="0" stop-color="${C.red}"/><stop offset="1" stop-color="#7F1D1D" stop-opacity=".55"/></linearGradient>
<filter id="blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="sb" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="5"/></filter>
${P.map((_, i) => `<linearGradient id="g${i}" x2="0" y2="1"><stop offset="0" stop-color="${mix(ramp(i), '#ffffff', .2)}"/><stop offset="1" stop-color="${mix(ramp(i), '#000000', .4)}"/></linearGradient>`).join('')}
</defs>
<g clip-path="url(#c)">
<rect width="${W}" height="${H}" fill="${C.card}"/>
<rect width="${W}" height="${STAGE}" fill="${C.stage}"/>
<rect width="${W}" height="${STAGE}" fill="url(#d)" mask="url(#dm)"/>
<circle class="halo" cx="${n(legend.x)}" cy="${n(legend.y)}" r="210" fill="url(#glow)"/>
${embers}
<polyline points="${line}" fill="none" stroke="#232327" stroke-width="2" stroke-linejoin="round"/>
<polyline class="draw" points="${line}" pathLength="1" stroke-dasharray="1 1" fill="none" stroke="url(#heat)" stroke-width="2.5" stroke-linejoin="round"/>
${emblems}
<g class="spark"><circle r="9" fill="${C.ember}" filter="url(#sb)"/><circle r="3.4" fill="#FFF3B0"/></g>
<g transform="translate(${n(legend.x)} ${n(legend.y)})">${sparks}</g>
<g class="float" font-weight="800"><text x="${n(legend.x)}" y="${n(legend.y + 92)}" text-anchor="middle" font-size="22" letter-spacing="-.4" fill="${C.gold}">+210 XP</text><text x="${n(legend.x)}" y="${n(legend.y + 110)}" text-anchor="middle" font-size="10" letter-spacing="2" fill="${C.soft}">RANK UP</text></g>
<rect y="${STAGE}" width="${W}" height="3" fill="#18181B"/>
<rect class="rail" y="${STAGE}" width="${W}" height="3" fill="url(#railfill)"/>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${C.line}"/>
<text x="40" y="256" class="lbl" fill="${C.red}">NOW BUILDING</text>
<rect x="172.5" y="240.5" width="139" height="23" rx="11.5" fill="none" stroke="#5B1D1D"/><circle class="dot" cx="188" cy="252" r="3.5" fill="${C.red}"/><text x="199" y="256" class="tag" fill="${C.soft}">IN DEVELOPMENT</text>
<text x="37" y="312" font-size="54" font-weight="800" letter-spacing="-2.2" fill="${C.text}">Overpowered</text>
<text x="470" y="258" font-size="23" font-weight="700" letter-spacing="-.5" fill="${C.text}">Log fast. Level up. Rank honestly.</text>
<text x="470" y="284" font-size="15.5" fill="${C.muted}">An iPhone workout tracker that plays like an RPG.</text>
<text x="470" y="314" class="tag" fill="${C.soft}">27 RANKS · BOSSES · SEASON PASS · LOOT</text>
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
