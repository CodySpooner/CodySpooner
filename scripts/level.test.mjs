// node scripts/level.test.mjs
import assert from 'node:assert/strict'
import { xpOf, levelOf, rankOf, card } from './build-level.mjs'

assert.equal(xpOf({ commits: 1, prs: 1, releases: 1, days: 1 }), 335)
assert.deepEqual(levelOf(0), { level: 1, from: 0, to: 100 })
assert.deepEqual(levelOf(99), { level: 1, from: 0, to: 100 })
assert.deepEqual(levelOf(100), { level: 2, from: 100, to: 300 })
assert.deepEqual(levelOf(1390), { level: 5, from: 1000, to: 1500 })

assert.equal(rankOf(1).name, 'HELLO WORLD v1')
assert.equal(rankOf(5).name, 'HELLO WORLD v2')
assert.equal(rankOf(9).name, 'HELLO WORLD v3')
assert.equal(rankOf(10).name, 'SCRIPTER v1')
assert.equal(rankOf(23).name, 'HACKER v1')
assert.equal(rankOf(79).name, '10X v3')
assert.equal(rankOf(80).name, 'ROOT')
assert.equal(rankOf(500).name, 'ROOT')

// The card must stand alone: nothing from Overpowered, and no image files to go missing.
const svg = card({ commits: 17, prs: 8, releases: 2, days: 6, coop: 16 })
assert.ok(svg.includes('LEVEL 5') && svg.includes('HELLO WORLD v2'))
assert.ok(!svg.includes('<image'))
console.log('level rules ok')
