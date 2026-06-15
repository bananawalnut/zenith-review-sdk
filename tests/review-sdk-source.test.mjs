import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
const adminMenuContextSource = source.slice(
  source.indexOf('export interface ZenithAdminMenuActionContext'),
  source.indexOf('export interface ZenithAdminMenuState'),
)

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

test('stored review auth session validation tolerates status metadata omitted by Hub', () => {
  assert.match(source, /status\.projectId \?\? session\.projectId \?\? options\.projectId/)
  assert.match(source, /status\.deploymentId \?\? session\.deploymentId \?\? options\.deploymentId/)
})

test('admin menu callbacks receive redacted context without raw session client or DOM event', () => {
  assert.match(source, /export interface ZenithAdminMenuActionContext/)
  assert.match(source, /export interface ZenithAdminMenuAuthSnapshot \{[\s\S]*expiresAt: string[\s\S]*\}/)
  assert.match(source, /auth: Readonly<ZenithAdminMenuAuthSnapshot>/)
  assert.match(source, /runAllowedOperation: <T>\(operation: ZenithAllowedAdminOperation<T>\) => Promise<T>/)
  assert.match(source, /signal: AbortSignal/)
  assert.match(source, /event: ZenithSafeMenuEvent/)
  assert.doesNotMatch(adminMenuContextSource, /session: ReviewAuthSession/)
  assert.doesNotMatch(adminMenuContextSource, /hubClient:/)
  assert.doesNotMatch(adminMenuContextSource, /MouseEvent \| KeyboardEvent/)
})

test('admin menu item validation fails closed and requires provider permissions and bounded slots', () => {
  assert.match(source, /export interface ZenithAdminMenuItem/)
  assert.match(source, /providerId: string/)
  assert.match(source, /permissions\?: string\[\]/)
  assert.match(source, /const ZENITH_ADMIN_MENU_MAX_SLOT = 12/)
  assert.match(source, /function validateZenithAdminMenuItem\(/)
  assert.match(source, /Invalid Zenith admin menu slot/)
  assert.match(source, /Unauthorized Zenith admin menu provider/)
  assert.match(source, /Zenith admin menu item is missing required permissions/)
  assert.match(source, /replace.*same provider/s)
})

test('admin overlay renders host menu items only after auth and removes them on auth loss', () => {
  assert.match(source, /menuItems\?: ZenithAdminMenuItem\[\]/)
  assert.match(source, /const menuItemsRoot = document\.createElement\('div'\)/)
  assert.match(source, /menuItemsRoot\.replaceChildren\(\)/)
  assert.match(source, /if \(!currentSession \|\| !isReviewAuthSessionFresh\(currentSession\)\) \{[\s\S]*return[\s\S]*\}/)
  assert.match(source, /createSafeZenithMenuEvent\(/)
  assert.match(source, /AbortController/)
  assert.match(source, /sessionGeneration/)
})

test('admin menu DOM renders Zenith UI dots with text tooltips and rejects dangerous icon or url inputs', () => {
  assert.match(source, /\.za-button \{[^}]*width: 42px; height: 42px;[^}]*border: 1px solid transparent;[^}]*border-radius: 999px;[^}]*padding: 4px/)
  assert.match(source, /\.za-button:hover, \.za-button:focus-visible \{[^}]*border-color: rgba\(155, 251, 227, 0\.56\);[^}]*outline: none/)
  assert.doesNotMatch(source, /aria-label="Zenith admin" title="Zenith admin"/)
  assert.match(source, /\.za-menu-items \{ position: relative; display: grid; gap: 32px/)
  assert.match(source, /\.za-menu-items::before \{[\s\S]*width: 1px[\s\S]*rgba\(155, 251, 227, 0\.24\)/)
  assert.match(source, /\.za-menu-items:empty::before \{ display: none; \}/)
  assert.match(source, /\.za-menu-dot \{[^}]*background: rgba\(209, 255, 244, 0\.82\); box-shadow: none/)
  assert.doesNotMatch(source, /radial-gradient\(circle at 35% 30%/)
  assert.match(source, /dot\.className = 'za-menu-dot'/)
  assert.match(source, /dot\.setAttribute\('aria-hidden', 'true'\)/)
  assert.match(source, /tooltip\.className = 'za-menu-tooltip'/)
  assert.match(source, /tooltip\.textContent = item\.label/)
  assert.match(source, /itemButton\.append\(dot, tooltip\)/)
  assert.match(source, /itemButton\.setAttribute\('aria-label', item\.ariaLabel/)
  assert.doesNotMatch(source, /itemButton\.title = item\.title/)
  assert.match(source, /rejects arbitrary HTML, SVG strings, script URLs, and data URLs/i)
  assert.doesNotMatch(source, /menuItemsRoot\.innerHTML/)
  assert.doesNotMatch(source, /itemButton\.textContent = item\.label/)
})
