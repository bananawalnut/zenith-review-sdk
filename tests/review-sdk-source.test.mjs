import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')

test('spoken review submission does not synthesize blank fallback audio', () => {
  assert.doesNotMatch(source, /result\.audio\?\.blob\s*\?\?\s*createBlankReviewAudioBlob\(\)/)
  assert.doesNotMatch(source, /audio_fallback_used:\s*!result\.audio/)
})

test('recorder fails closed when microphone capture is requested but unavailable', () => {
  assert.match(source, /Microphone capture failed|Microphone permission|audio capture/i)
  assert.match(source, /throw new Error\([^)]*(Microphone|audio)/s)
  assert.doesNotMatch(source, /catch \(error\) \{\s*this\.log\(\{\s*type: 'audio-error'/s)
})

test('review HUD exposes explicit Start review action and does not auto-start capture', () => {
  assert.match(source, /data-action="start"/)
  assert.match(source, /Start review/)
  assert.match(source, /data-action="close"/)
  assert.match(source, /hide\(\): void/)
  assert.match(source, /startButton\.addEventListener\('click', \(\) => void startReview\(\)\)/)
  assert.match(source, /closeButton\.addEventListener\('click', \(\) => unmount\(\)\)/)
  assert.doesNotMatch(source, /function reveal\(\) \{[\s\S]*startReview\(\)/)
})

test('SDK admin overlay can be hidden by global shortcut without destroying auth state', () => {
  assert.match(source, /toggleVisibility\(\): boolean/)
  assert.match(source, /isVisible\(\): boolean/)
  assert.match(source, /let visible = false/)
  assert.match(source, /host\.style\.display = visible \? '' : 'none'/)
  assert.match(source, /if \(!visible\) open = false/)
})

test('review SDK exports a global admin shortcut initializer', () => {
  assert.match(source, /export function initZenithAdminShortcut\(options: ZenithAdminShortcutOptions\)/)
  assert.match(source, /eventName\?: string/)
  assert.match(source, /const state = getZenithAdminShortcutState\(\)/)
})

test('shortcut handler ignores form controls and routes to fallback event when callback missing', () => {
  assert.match(source, /function isTextInputLikeElement\(/)
  assert.match(source, /if \(!state\.open\)[\s\S]*dispatchEvent\(new CustomEvent\(eventName\)/)
  assert.match(source, /window\.dispatchEvent\(new CustomEvent\(eventName\)\)/)
})
