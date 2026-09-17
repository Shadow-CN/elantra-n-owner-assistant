/**
 * theme.js
 *
 * Manual theme override for WeChat mini-program.
 * Uses page-meta page-style to inject CSS variables onto the page element,
 * which overrides both the app.wxss defaults and @media dark query.
 *
 * Modes: 'auto' | 'light' | 'dark'
 *   auto  - follow system (let @media handle it, no forced vars)
 *   light - force light regardless of system
 *   dark  - force dark regardless of system
 *
 * Brand colors:
 *   N蓝  Performance Blue  #aacae6  (dark-theme text, chips, selected states)
 *   N红  Active Red        #e63312  (light-theme text, chips, selected states)
 */

var N_BLUE = '#aacae6'
var N_RED = '#e63312'
var DARK_BG = '#16181C' // Options: A #121212, B #16181C, C #181818, D #202124, E #1C1C1E.

var LIGHT_VARS = [
  '--bg-page:#F4F8FB',
  '--bg-card:#ffffff',
  '--bg-chip:#ffffff',
  '--bg-chip-active:' + N_RED,
  '--bg-item-sel:' + N_RED,
  '--bg-tag:#F4F8FB',
  '--bg-toolbar:#ffffff',
  '--bg-bar:#ffffff',
  '--bg-badge:#ffffff',
  '--bg-btn-sec:#ffffff',
  '--bg-success:' + N_BLUE,
  '--bg-error:#ffffff',
  '--bg-accent:' + N_RED,
  '--text-primary:#000000',
  '--text-secondary:' + N_RED,
  '--text-hint:' + N_RED,
  '--text-tag:' + N_RED,
  '--text-chip:#000000',
  '--text-chip-act:#ffffff',
  '--text-btn-sec:#000000',
  '--text-badge:#000000',
  '--text-success:#000000',
  '--text-error:' + N_RED,
  '--text-warn:' + N_RED,
  '--text-accent:#ffffff',
  '--text-selection:#ffffff',
  '--text-toolbar:#000000',
  '--border-default:' + N_RED,
  '--border-bottom-bar:' + N_RED,
  '--border-section:' + N_RED,
  '--border-chip:#000000',
  '--border-check:' + N_RED,
  '--border-item:' + N_RED,
  '--border-success:' + N_BLUE,
  '--border-error:' + N_RED,
].join(';')

var DARK_VARS = [
  '--bg-page:' + DARK_BG,
  '--bg-card:' + DARK_BG,
  '--bg-chip:' + DARK_BG,
  '--bg-chip-active:' + N_BLUE,
  '--bg-item-sel:' + N_BLUE,
  '--bg-tag:' + DARK_BG,
  '--bg-toolbar:' + DARK_BG,
  '--bg-bar:' + DARK_BG,
  '--bg-badge:#2C2C2E',
  '--bg-btn-sec:#2C2C2E',
  '--bg-success:' + DARK_BG,
  '--bg-error:' + DARK_BG,
  '--bg-accent:' + N_BLUE,
  '--text-primary:#ffffff',
  '--text-secondary:' + N_BLUE,
  '--text-hint:' + N_BLUE,
  '--text-tag:' + N_BLUE,
  '--text-chip:#FFFFFF',
  '--text-chip-act:#000000',
  '--text-btn-sec:#ffffff',
  '--text-badge:' + N_BLUE,
  '--text-success:' + N_BLUE,
  '--text-error:' + N_RED,
  '--text-warn:' + N_RED,
  '--text-accent:#000000',
  '--text-selection:#000000',
  '--text-toolbar:#ffffff',
  '--border-default:' + N_BLUE,
  '--border-bottom-bar:' + N_BLUE,
  '--border-section:' + N_BLUE,
  '--border-chip:#ffffff',
  '--border-check:' + N_BLUE,
  '--border-item:' + N_BLUE,
  '--border-success:' + N_BLUE,
  '--border-error:' + N_RED,
].join(';')

/**
 * Return the CSS variable string to inject via page-meta page-style.
 * Auto mode detects the system theme and applies the matching vars.
 * We always inject explicit vars because @media is removed from app.wxss
 * to avoid conflicts with page-meta in Skyline renderer.
 */
function getPageStyle(mode) {
  if (mode === 'dark') return DARK_VARS
  if (mode === 'light') return LIGHT_VARS
  // auto: detect system and apply matching vars
  return detectSystemTheme() === 'dark' ? DARK_VARS : LIGHT_VARS
}

/**
 * Detect system theme. Returns 'dark' or 'light'.
 * Reads from app.globalData.systemTheme (set at launch) to avoid
 * repeatedly calling the deprecated wx.getSystemInfoSync API.
 */
function detectSystemTheme() {
  try {
    var app = getApp()
    if (app && app.globalData && app.globalData.systemTheme) {
      return app.globalData.systemTheme
    }
    // Fallback for the brief window before app.onLaunch completes
    var info = wx.getAppBaseInfo()
    return info.theme === 'dark' ? 'dark' : 'light'
  } catch (e) {
    return 'light'
  }
}

/** Returns true if the effective display is dark given mode + system. */
function isDarkEffective(mode) {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return detectSystemTheme() === 'dark'
}

/** Cycle through modes: auto → dark → light → auto */
function nextMode(current) {
  if (current === 'auto') return 'dark'
  if (current === 'dark') return 'light'
  return 'auto'
}

/** Navigation bar colors for effective theme. */
function navColors(isDark) {
  return {
    navBg: isDark ? DARK_BG : '#ffffff',
    navColor: isDark ? 'white' : 'black',
  }
}

function loadMode() {
  try {
    return wx.getStorageSync('themeMode') || 'auto'
  } catch (e) {
    return 'auto'
  }
}

function saveMode(mode) {
  try {
    wx.setStorageSync('themeMode', mode)
  } catch (e) {}
}

module.exports = {
  getPageStyle,
  detectSystemTheme,
  isDarkEffective,
  nextMode,
  navColors,
  loadMode,
  saveMode,
}
