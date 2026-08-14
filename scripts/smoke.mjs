// Smoke test: verifies the app loads without JS errors and captures key views.
// Usage: node scripts/smoke.mjs [url] [outDir]
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5174/';
const out = process.argv[3] || '/tmp/cinebench-shots';
import('fs').then(fs => fs.mkdirSync(out, { recursive: true }));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on('console', m => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', e => errors.push(`[pageerror] ${e.message}`));

await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(6000);

// Dismiss the genre quiz (pick 3 genres) — click sequentially so each registers
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.quiz-genre-btn')];
  for (const b of btns.slice(0, 3)) b.click();
  const sub = document.getElementById('quizSubmit');
  if (!sub.disabled) sub.click();
});
await page.waitForTimeout(3500);
// Confirm quiz dismissed
const quizStillOpen = await page.evaluate(() => document.getElementById('quizModal').classList.contains('open'));
console.log('quiz still open after dismiss attempt:', quizStillOpen);
if (quizStillOpen) {
  await page.evaluate(() => {
    document.querySelectorAll('.quiz-genre-btn').forEach(b => {
      if (document.getElementById('quizSelected').querySelector('strong').textContent === '3') return;
      b.click();
    });
    const sub = document.getElementById('quizSubmit');
    if (!sub.disabled) sub.click();
  });
  await page.waitForTimeout(2500);
}

// Home view screenshot
await page.screenshot({ path: `${out}/01-home.png` });

// Typing in search to test dropdown
await page.fill('#navSearch', 'batman');
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/02-search-dropdown.png` });
await page.keyboard.press('Enter');
await page.waitForTimeout(4000);
await page.screenshot({ path: `${out}/03-search-results.png` });

// Check clear button visibility
const clearVisible = await page.evaluate(() => {
  const b = document.getElementById('searchClear');
  const cs = getComputedStyle(b);
  return { hasClass: b.classList.contains('visible'), opacity: cs.opacity, display: cs.display };
});
console.log('clear-btn state:', JSON.stringify(clearVisible));

// Open first movie modal via the poster-wrap click handler
await page.evaluate(() => {
  const card = document.querySelector('.movie-card:not(.skeleton-card)');
  if (card) card.querySelector('.card-poster-wrap').click();
});
await page.waitForTimeout(4000);
await page.screenshot({ path: `${out}/04-modal.png` });

// Check modal classes render styled (computed styles matter)
const modalInfo = await page.evaluate(() => {
  const sel = s => {
    const el = document.querySelector(s);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { exists: true, display: cs.display, color: cs.color, bg: cs.backgroundColor, opacity: cs.opacity };
  };
  return {
    modalTop: sel('.modal-top'),
    headerRow: sel('.modal-header-row'),
    modalRating: sel('.modal-rating'),
    modalStars: sel('.modal-user-rating'),
    starFilled: sel('.modal-star.filled'),
    sectionSubtitle: sel('.section-subtitle'),
    modalActionBtns: sel('.modal-action-btns'),
    btnPrimary: sel('.btn-primary'),
    btnHeart: sel('.btn-heart'),
    btnShare: sel('.btn-share'),
    modalTrailer: sel('.modal-trailer'),
    modalCast: sel('.modal-cast'),
    castCharacter: sel('.cast-character'),
  };
});
console.log('modal styled elements:', JSON.stringify(modalInfo, null, 1));

// Close modal, go to watchlist
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
await page.evaluate(() => showWatchlist());
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/05-watchlist-empty.png` });

// Add first card to watchlist via the bookmark button
await page.evaluate(() => showHome());
await page.waitForTimeout(300);
await page.evaluate(() => {
  const btn = document.querySelector('.card-action-btn[data-action="watchlist"]');
  if (btn) btn.click();
});
await page.waitForTimeout(800);
await page.evaluate(() => showWatchlist());
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/06-watchlist-filled.png` });

const cardTitle = await page.evaluate(() => {
  const sel = s => {
    const el = document.querySelector(s);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { text: el.textContent.trim().slice(0, 40), display: cs.display, color: cs.color, opacity: cs.opacity };
  };
  return {
    cardTitle: sel('.card-title'),
    cardRating: sel('.card-rating'),
    badgeGreen: sel('.badge-green'),
    cardStar: sel('.card-star'),
    cardActions: sel('.card-actions'),
  };
});
console.log('card styling:', JSON.stringify(cardTitle, null, 1));

await browser.close();

console.log('\nConsole errors/warnings captured:', errors.length);
errors.forEach(e => console.log(' ', e));
if (errors.some(e => /ReferenceError|is not defined|Uncaught/.test(e))) process.exit(1);
