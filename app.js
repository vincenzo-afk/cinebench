// ============================================================
// CineMatch — app.js
// ============================================================

// === CONFIG ===
const API_KEY        = import.meta.env?.VITE_TMDB_API_KEY || '';

// Demo mode: self-contained mock so the app can be previewed without a TMDB key.
// Enable with ?demo (e.g. /?demo) — never used in production.
const DEMO_MODE = typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo');
const BASE_URL       = 'https://api.tmdb.org/3';
const IMG_BASE       = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE  = 'https://image.tmdb.org/t/p/original';
const PLACEHOLDER_POSTER   = 'https://placehold.co/500x750/1a1a1a/555?text=No+Poster';
const PLACEHOLDER_BACKDROP = 'https://placehold.co/1280x720/1a1a1a/555?text=No+Backdrop';
const PLACEHOLDER_AVATAR   = 'https://placehold.co/185x278/1a1a1a/555?text=No+Photo';

// === STATE ===
const state = {
  currentView       : 'home',
  searchQuery       : '',
  searchPage        : 1,
  searchTotalPages  : 1,
  isLoadingMore     : false,
  isFilterMode      : false,
  searchDebounce    : null,
  filterGenres      : [],
  filterYearFrom    : '',
  filterYearTo      : '',
  filterRating      : 0,
  filterSort        : 'popularity.desc',
  compareMovies     : [],
  genres            : [],
};

// localStorage key map
const LS = {
  WATCHLIST       : 'cm_watchlist',
  FAVOURITES      : 'cm_favourites',
  WATCHED         : 'cm_watched',
  RATINGS         : 'cm_ratings',
  SEARCH_HISTORY  : 'cm_search_history',
  GENRE_PREFS     : 'cm_genre_prefs',
  THEME           : 'cm_theme',
  RECENTLY_VIEWED : 'cm_recently_viewed',
  QUIZ_DONE       : 'cm_quiz_done',
  COMPARE         : 'cm_compare',
};

// ============================================================
// === API HELPERS ===
// ============================================================

// Demo-mode mock: returns plausible fake TMDB-shaped data when no key is configured.
// Used only with ?demo for previews; live API is always preferred when a key exists.
const DEMO_MOVIES = [
  { id: 278,  title: 'The Shawshank Redemption', vote_average: 8.7, vote_count: 26000, popularity: 120, release_date: '1994-09-23', runtime: 142, genre_ids: [18], overview: 'An enduring tale of hope and friendship inside a maximum-security prison.', media_type: 'movie' },
  { id: 238,  title: 'The Godfather',             vote_average: 8.7, vote_count: 19000, popularity: 105, release_date: '1972-03-14', runtime: 175, genre_ids: [18, 80], overview: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.', media_type: 'movie' },
  { id: 155,  title: 'The Dark Knight',           vote_average: 8.5, vote_count: 31000, popularity: 150, release_date: '2008-07-16', runtime: 152, genre_ids: [28, 80, 18], overview: 'Batman raises the stakes in his war on crime against the Joker.', media_type: 'movie' },
  { id: 550,  title: 'Fight Club',                vote_average: 8.4, vote_count: 27000, popularity: 95, release_date: '1999-10-15', runtime: 139, genre_ids: [18], overview: 'An insomniac office worker forms an underground fight club.', media_type: 'movie' },
  { id: 13,   title: 'Forrest Gump',              vote_average: 8.5, vote_count: 26000, popularity: 88, release_date: '1994-06-23', runtime: 142, genre_ids: [35, 18, 10749], overview: 'The presidencies of Kennedy and Johnson through the eyes of an Alabama man.', media_type: 'movie' },
  { id: 680,  title: 'Pulp Fiction',              vote_average: 8.5, vote_count: 26000, popularity: 102, release_date: '1994-09-10', runtime: 154, genre_ids: [80, 53], overview: 'The lives of two mob hitmen, a boxer, and a pair of diner bandits intertwine.', media_type: 'movie' },
  { id: 603,  title: 'The Matrix',                vote_average: 8.2, vote_count: 24000, popularity: 98, release_date: '1999-03-30', runtime: 136, genre_ids: [28, 878], overview: 'A hacker discovers the shocking truth about his reality.', media_type: 'movie' },
  { id: 372058, title: 'Your Name.',              vote_average: 8.5, vote_count: 10000, popularity: 75, release_date: '2016-08-26', runtime: 106, genre_ids: [16, 10749, 18], overview: 'Two teenagers share a mysterious connection across time and space.', media_type: 'movie' },
  { id: 76600,  title: 'Avatar: The Way of Water',vote_average: 7.6, vote_count: 8000,  popularity: 130, release_date: '2022-12-14', runtime: 192, genre_ids: [878, 12], overview: 'Jake Sully and Neytiri protect their family on Pandora.', media_type: 'movie' },
  { id: 299536, title: 'Avengers: Infinity War',  vote_average: 8.2, vote_count: 28000, popularity: 140, release_date: '2018-04-25', runtime: 149, genre_ids: [12, 28, 878], overview: 'The Avengers must stop Thanos from collecting all six Infinity Stones.', media_type: 'movie' },
];

const DEMO_GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' }, { id: 27, name: 'Horror' }, { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' }, { id: 53, name: 'Thriller' },
];

const DEMO_DETAIL = {
  id: 278,
  title: 'The Shawshank Redemption',
  name: undefined,
  vote_average: 8.7,
  vote_count: 26000,
  popularity: 120,
  release_date: '1994-09-23',
  first_air_date: undefined,
  runtime: 142,
  budget: 25000000,
  revenue: 58300000,
  original_language: 'en',
  tagline: 'Fear can hold you prisoner. Hope can set you free.',
  overview: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
  genres: DEMO_GENRES.filter(g => [18].includes(g.id)),
  poster_path: null,
  backdrop_path: null,
  media_type: 'movie',
  videos: { results: [{ key: '6hB3S9bIaco', site: 'YouTube', type: 'Trailer' }] },
  credits: {
    cast: [
      { name: 'Tim Robbins',   character: 'Andy Dufresne', profile_path: null },
      { name: 'Morgan Freeman',character: 'Ellis Boyd "Red" Redding', profile_path: null },
      { name: 'Bob Gunton',    character: 'Warden Norton', profile_path: null },
    ],
  },
  release_dates: { results: [{ iso_3166_1: 'US', release_dates: [{ certification: 'R' }] }] },
};

function demoFetch(endpoint, params = {}) {
  const q = (params.query || '').toLowerCase();
  let pool = [...DEMO_MOVIES];
  if (q) pool = DEMO_MOVIES.filter(m => m.title.toLowerCase().includes(q));
  const page = Number(params.page || 1);
  // Genre list endpoint
  if (endpoint === '/genre/movie/list') {
    return Promise.resolve({ genres: DEMO_GENRES });
  }
  // Detail endpoints (e.g. /movie/278, /tv/1396) with optional append_to_response
  const detailMatch = endpoint.match(/^\/(movie|tv)\/(\d+)$/);
  if (detailMatch) {
    const id = Number(detailMatch[2]);
    const found = DEMO_MOVIES.find(m => m.id === id) || DEMO_MOVIES[0];
    return Promise.resolve({ ...DEMO_DETAIL, ...found, id });
  }
  return Promise.resolve({
    page,
    total_pages: 1,
    total_results: pool.length,
    results: pool.map((m, i) => ({
      ...m,
      backdrop_path: null,
      poster_path: null,
      media_type: m.media_type,
      _seed: (page - 1) * 10 + i,
    })),
  });
}

async function apiFetch(endpoint, params = {}) {
  if (DEMO_MODE) return demoFetch(endpoint, params);
  const buildUrl = (baseUrl) => {
    const url = new URL(`${baseUrl}${endpoint}`);
    url.searchParams.set('api_key', API_KEY);
    for (const [k, v] of Object.entries(params)) {
      if (v !== '' && v !== null && v !== undefined) url.searchParams.set(k, v);
    }
    return url.toString();
  };

  const primaryUrl = buildUrl(BASE_URL);
  console.log('[CineBench] Fetching:', endpoint);

  try {
    // Try primary first
    const res = await fetch(primaryUrl);
    if (res.ok) return await res.json();
    throw new Error(`Primary failed with ${res.status}`);
  } catch (err) {
    console.warn('[CineBench] Primary API failed, trying proxy...', err.message);
    try {
      // Fallback to proxy
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(primaryUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Proxy failed with ${res.status}`);
      return await res.json();
    } catch (proxyErr) {
      console.error('[CineBench] Both API and Proxy failed:', proxyErr.message);
      return null;
    }
  }
}

/** Lock/Unlock body scroll */
function toggleBodyScroll(lock) {
  document.body.style.overflow = lock ? 'hidden' : '';
}

// ============================================================
// === RENDER FUNCTIONS ===
// ============================================================

function getRatingClass(r) {
  const n = parseFloat(r);
  if (n >= 7) return 'green';
  if (n >= 5) return 'yellow';
  return 'red';
}

function formatYear(dateStr) {
  if (!dateStr) return 'N/A';
  return dateStr.slice(0, 4);
}

function formatRuntime(mins) {
  if (!mins) return 'N/A';
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatMoney(n) {
  if (!n || n === 0) return 'N/A';
  return '$' + n.toLocaleString();
}

/** Build a single movie card element */
function createMovieCard(movie, { isTV = false, showCompare = true } = {}) {
  const id     = movie.id;
  const title  = movie.title || movie.name || 'Untitled';
  const poster = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : PLACEHOLDER_POSTER;
  const rating = movie.vote_average != null ? Number(movie.vote_average).toFixed(1) : '?';
  const year   = formatYear(movie.release_date || movie.first_air_date);

  const watchlist  = lsGet(LS.WATCHLIST)  || [];
  const favourites = lsGet(LS.FAVOURITES) || [];
  const watched    = lsGet(LS.WATCHED)    || [];
  const ratings    = lsGet(LS.RATINGS)    || {};

  const inWL    = watchlist.some(m  => m.id === id);
  const inFav   = favourites.some(m => m.id === id);
  const isWatched = watched.includes(id);
  const userStar  = ratings[id] || 0;
  const compareOn = state.compareMovies.some(m => m.id === id);
  const rc        = getRatingClass(rating);

  const card = document.createElement('div');
  card.className = `movie-card${isWatched ? ' watched' : ''}`;
  card.dataset.id = id;
  card.tabIndex   = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', title);

  card.innerHTML = `
    <div class="card-poster-wrap">
      <img class="card-poster" src="${poster}" alt="${escHtml(title)}"
           onerror="this.src='${PLACEHOLDER_POSTER}'" loading="lazy" />
      ${isWatched ? '<div class="watched-overlay"><span>✓</span></div>' : ''}
      <div class="card-overlay">
        <div class="card-actions">
          <button class="card-action-btn${inWL  ? ' active' : ''}" data-action="watchlist"  data-id="${id}" title="Watchlist">🔖</button>
          <button class="card-action-btn${inFav ? ' active' : ''}" data-action="favourite"  data-id="${id}" title="Favourite">❤️</button>
          <button class="card-action-btn${isWatched ? ' active' : ''}" data-action="watched" data-id="${id}" title="Mark Watched">✓</button>
          ${showCompare ? `<button class="card-action-btn${compareOn ? ' active' : ''}" data-action="compare" data-id="${id}" title="Compare">📊</button>` : ''}
        </div>
        <div class="card-stars">
          ${[1,2,3,4,5].map(s =>
            `<span class="card-star${userStar >= s ? ' filled' : ''}" data-star="${s}" data-id="${id}">★</span>`
          ).join('')}
        </div>
      </div>
      <div class="card-rating badge-${rc}">★ ${rating}</div>
    </div>
    <div class="card-info">
      <div class="card-title">${escHtml(title)}</div>
      <div class="card-year">${year}</div>
    </div>`;

  // Open modal on poster click (but not on action buttons / stars)
  card.querySelector('.card-poster-wrap').addEventListener('click', e => {
    if (e.target.closest('.card-action-btn, .card-star')) return;
    openModal(id, isTV ? 'tv' : 'movie');
  });

  card.addEventListener('keydown', e => {
    if (e.key === 'Enter') openModal(id, isTV ? 'tv' : 'movie');
  });

  // Action buttons
  card.querySelectorAll('.card-action-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const act = btn.dataset.action;
      if (act === 'watchlist') toggleWatchlist(movie, btn);
      else if (act === 'favourite') toggleFavourite(movie, btn);
      else if (act === 'watched') toggleWatched(id, card, btn);
      else if (act === 'compare') {
        movie.media_type = isTV ? 'tv' : 'movie';
        toggleCompare(movie, btn);
      }
    });
  });

  // Star rating
  card.querySelectorAll('.card-star').forEach(star => {
    star.addEventListener('click', e => {
      e.stopPropagation();
      setUserRating(id, parseInt(star.dataset.star), card);
    });
  });

  // 3-D tilt on hover
  card.addEventListener('mousemove', e => {
    const r   = card.getBoundingClientRect();
    const x   = (e.clientX - r.left) / r.width  - 0.5;
    const y   = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x*12}deg) rotateX(${-y*12}deg) scale(1.04)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });

  return card;
}

/** Skeleton placeholder cards */
function buildSkeletons(count = 10) {
  return Array.from({ length: count }, () => {
    const d = document.createElement('div');
    d.className = 'movie-card skeleton-card';
    d.innerHTML = `
      <div class="skel skel-poster"></div>
      <div class="skel skel-line" style="width:80%;margin-top:8px"></div>
      <div class="skel skel-line" style="width:50%;margin-top:6px"></div>`;
    return d;
  });
}

function renderSkeletons(container, count = 10) {
  container.innerHTML = '';
  buildSkeletons(count).forEach(s => container.appendChild(s));
}

// ============================================================
// === HOME SECTIONS ===
// ============================================================

async function loadHero() {
  const data = await apiFetch('/trending/movie/day');
  const heroContent  = document.getElementById('heroContent');
  const heroBackdrop = document.getElementById('heroBackdrop');

  if (!data?.results?.length) {
    heroContent.innerHTML = '<p class="hero-error">Could not load featured movie.</p>';
    return;
  }

  state.heroMovies = data.results.slice(0, 8);
  state.heroIndex  = 0;

  renderHero();
  startHeroTimer();
}

function renderHero() {
  const heroBackdrop = document.getElementById('heroBackdrop');
  const heroContent  = document.getElementById('heroContent');
  if (!heroBackdrop || !heroContent) return;

  const movie = state.heroMovies[state.heroIndex];
  if (!movie) return;

  const backdrop = movie.backdrop_path ? `${BACKDROP_BASE}${movie.backdrop_path}` : PLACEHOLDER_BACKDROP;
  
  heroContent.style.opacity = '0';
  heroContent.style.transform = 'translateY(20px)';

  setTimeout(async () => {
    heroBackdrop.style.backgroundImage = `url(${backdrop})`;
    
    const detail  = await apiFetch(`/movie/${movie.id}`);
    const tagline = detail?.tagline || '';
    const inWL    = (lsGet(LS.WATCHLIST) || []).some(m => m.id === movie.id);

    heroContent.innerHTML = `
      <div class="hero-meta">
        <span class="hero-badge badge-${getRatingClass(movie.vote_average)}">★ ${Number(movie.vote_average).toFixed(1)}</span>
        <span class="hero-year">${formatYear(movie.release_date)}</span>
      </div>
      <h1 class="hero-title">${escHtml(movie.title)}</h1>
      ${tagline ? `<p class="hero-tagline">${escHtml(tagline)}</p>` : ''}
      <p class="hero-overview">${movie.overview ? escHtml(movie.overview.substring(0, 180)) + '…' : ''}</p>
      <div class="hero-buttons">
        <button class="btn-primary" onclick="openModal(${movie.id},'movie')">▶ View Details</button>
        <button class="btn-secondary hero-watchlist-btn${inWL ? ' active' : ''}" id="heroWatchlistBtn"
                onclick="toggleHeroWatchlist(${movie.id})">
          ${inWL ? '✓ In Watchlist' : '🔖 Add to Watchlist'}
        </button>
      </div>
      <div class="hero-dots">
        ${state.heroMovies.map((_, i) => `<span class="hero-dot${i === state.heroIndex ? ' active' : ''}" onclick="jumpToHero(${i})"></span>`).join('')}
      </div>`;
    
    heroContent.style.opacity = '1';
    heroContent.style.transform = 'translateY(0)';
  }, 400);
}

function startHeroTimer() {
  if (state.heroTimer) clearInterval(state.heroTimer);
  state.heroTimer = setInterval(() => {
    state.heroIndex = (state.heroIndex + 1) % state.heroMovies.length;
    renderHero();
  }, 10000);
}

function jumpToHero(index) {
  state.heroIndex = index;
  renderHero();
  startHeroTimer();
}

window.jumpToHero = jumpToHero;

async function loadRow(rowId, endpoint, params = {}, isTV = false) {
  const row = document.getElementById(rowId);
  if (!row) return;
  renderSkeletons(row, 10);
  const data = await apiFetch(endpoint, params);
  row.innerHTML = '';
  if (!data?.results?.length) {
    row.innerHTML = `<p class="row-error">Could not load content. <button class="retry-btn" onclick="retryRow('${rowId}', '${endpoint}', ${JSON.stringify(params)}, ${isTV})">Retry</button></p>`;
    return;
  }
  data.results.forEach(m => row.appendChild(createMovieCard(m, { isTV })));
}
// Retry a failed row (stored on window so inline onclick works from the module)
function retryRow(rowId, endpoint, params, isTV) {
  loadRow(rowId, endpoint, params, isTV);
}
window.retryRow = retryRow;

function setupRowArrows() {
  document.querySelectorAll('.row-arrow').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = document.getElementById(btn.dataset.row + 'Row');
      if (!row) return;
      const dist = row.clientWidth * 0.8;
      row.scrollBy({ left: btn.classList.contains('row-arrow-left') ? -dist : dist, behavior: 'smooth' });
    });
  });
}

async function loadAllHomeSections() {
  await Promise.all([
    loadHero(),
    loadRow('trendingDayRow',  '/trending/movie/day'),
    loadRow('trendingWeekRow', '/trending/movie/week'),
    loadRow('nowPlayingRow',   '/movie/now_playing'),
    loadRow('topRatedRow',     '/movie/top_rated'),
    loadRow('upcomingRow',     '/movie/upcoming'),
    loadRow('tvPopularRow',    '/tv/popular', {}, true),
  ]);
  loadRecentlyViewed();
  loadBecauseYouWatched();
}

function loadRecentlyViewed() {
  const recent  = lsGet(LS.RECENTLY_VIEWED) || [];
  const section = document.getElementById('recentlyViewedSection');
  const row     = document.getElementById('recentlyViewedRow');
  if (!recent.length) { section.style.display = 'none'; return; }
  section.style.display = '';
  row.innerHTML = '';
  recent.forEach(m => row.appendChild(createMovieCard(m)));
}

async function loadBecauseYouWatched() {
  const recent  = lsGet(LS.RECENTLY_VIEWED) || [];
  if (!recent.length) return;

  const movie   = recent[0];
  const section = document.getElementById('becauseYouWatchedSection');
  const title   = document.getElementById('becauseYouWatchedTitle');
  const row     = document.getElementById('becauseYouWatchedRow');

  title.textContent = `🎯 Because You Watched "${movie.title || movie.name}"`;
  section.style.display = '';
  renderSkeletons(row, 10);

  const [sim, rec] = await Promise.all([
    apiFetch(`/movie/${movie.id}/similar`),
    apiFetch(`/movie/${movie.id}/recommendations`),
  ]);

  row.innerHTML = '';
  const seen    = new Set();
  const results = [...(sim?.results || []), ...(rec?.results || [])]
    .filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });

  if (!results.length) { section.style.display = 'none'; return; }
  results.slice(0, 20).forEach(m => row.appendChild(createMovieCard(m)));
}

// ============================================================
// === SEARCH ===
// ============================================================

function initSearch() {
  const input    = document.getElementById('navSearch');
  const clearBtn = document.getElementById('searchClear');
  const dropdown = document.getElementById('searchDropdown');

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearBtn.classList.toggle('visible', !!q);
    clearTimeout(state.searchDebounce);
    if (q.length < 2) { dropdown.innerHTML = ''; dropdown.style.display = 'none'; return; }
    state.searchDebounce = setTimeout(() => showSearchDropdown(q), 400);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (!q) return;
      dropdown.style.display = 'none';
      addSearchHistory(q);
      runSearch(q);
    }
    if (e.key === 'Escape') dropdown.style.display = 'none';
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.remove('visible');
    dropdown.style.display = 'none';
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-search-wrap')) dropdown.style.display = 'none';
  });
}

async function showSearchDropdown(q) {
  const dropdown = document.getElementById('searchDropdown');
  dropdown.innerHTML = '<div class="dropdown-loading">Searching…</div>';
  dropdown.style.display = 'block';

  const data = await apiFetch('/search/movie', { query: q });
  if (!data?.results?.length) {
    dropdown.innerHTML = '<div class="dropdown-empty">No results found</div>';
    return;
  }

  dropdown.innerHTML = data.results.slice(0, 5).map(m => {
    const img = m.poster_path ? `${IMG_BASE}${m.poster_path}` : PLACEHOLDER_POSTER;
    return `
      <div class="dropdown-item" data-id="${m.id}">
        <img src="${img}" alt="${escHtml(m.title)}" onerror="this.src='${PLACEHOLDER_POSTER}'" />
        <div class="dropdown-info">
          <div class="dropdown-title">${escHtml(m.title)}</div>
          <div class="dropdown-year">${formatYear(m.release_date)}</div>
        </div>
      </div>`;
  }).join('');

  dropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      dropdown.style.display = 'none';
      document.getElementById('navSearch').value = '';
      openModal(parseInt(item.dataset.id), 'movie');
    });
  });
}

async function runSearch(q, page = 1) {
  state.searchQuery  = q;
  state.searchPage   = page;
  state.isFilterMode = false;
  switchView('searchView');

  const grid   = document.getElementById('searchGrid');
  const loader = document.getElementById('searchLoader');
  const empty  = document.getElementById('searchEmpty');
  document.getElementById('searchViewTitle').textContent = `Results for "${q}"`;

  if (page === 1) {
    grid.innerHTML = '';
    empty.style.display = 'none';
    renderSkeletons(grid, 20);
  }

  const data = await apiFetch('/search/movie', { query: q, page });
  grid.querySelectorAll('.skeleton-card').forEach(s => s.remove());
  loader.style.display = 'none';

  if (!data?.results?.length) {
    if (page === 1) empty.style.display = 'flex';
    return;
  }

  state.searchTotalPages = data.total_pages || 1;
  data.results.forEach(m => grid.appendChild(createMovieCard(m)));
  setupInfiniteScroll();
  state.isLoadingMore = false;
}

async function runFilterSearch(page = 1) {
  state.isFilterMode = true;
  state.searchPage   = page;
  switchView('searchView');

  const grid   = document.getElementById('searchGrid');
  const loader = document.getElementById('searchLoader');
  const empty  = document.getElementById('searchEmpty');

  if (page === 1) {
    grid.innerHTML = '';
    empty.style.display = 'none';
    renderSkeletons(grid, 20);
  }

  const params = { sort_by: state.filterSort, page };
  if (state.filterGenres.length)  params.with_genres                    = state.filterGenres.join(',');
  if (state.filterYearFrom)       params['primary_release_date.gte']    = `${state.filterYearFrom}-01-01`;
  if (state.filterYearTo)         params['primary_release_date.lte']    = `${state.filterYearTo}-12-31`;
  if (state.filterRating > 0)     params['vote_average.gte']            = state.filterRating;

  const data = await apiFetch('/discover/movie', params);
  grid.querySelectorAll('.skeleton-card').forEach(s => s.remove());
  loader.style.display = 'none';

  if (!data?.results?.length) {
    if (page === 1) empty.style.display = 'flex';
    return;
  }

  state.searchTotalPages = data.total_pages || 1;
  data.results.forEach(m => grid.appendChild(createMovieCard(m)));
  setupInfiniteScroll();
  state.isLoadingMore = false;
}

function setupInfiniteScroll() {
  if (window._scrollHandler) window.removeEventListener('scroll', window._scrollHandler);

  window._scrollHandler = () => {
    if (document.getElementById('searchView').style.display === 'none') return;
    const nearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 300;
    if (!nearBottom || state.isLoadingMore || state.searchPage >= state.searchTotalPages) return;

    state.isLoadingMore = true;
    document.getElementById('searchLoader').style.display = 'block';
    state.searchPage++;

    const fn = state.isFilterMode ? runFilterSearch : runSearch;
    const arg = state.isFilterMode ? state.searchPage : state.searchQuery;
    fn(arg, state.searchPage);
  };

  window.addEventListener('scroll', window._scrollHandler);
}

function retrySearch() {
  if (state.isFilterMode) runFilterSearch();
  else if (state.searchQuery) runSearch(state.searchQuery);
}

// Search history helpers
function addSearchHistory(q) {
  let h = lsGet(LS.SEARCH_HISTORY) || [];
  h = [q, ...h.filter(x => x !== q)].slice(0, 10);
  lsSet(LS.SEARCH_HISTORY, h);
  renderSearchHistory();
}

function renderSearchHistory() {
  const bar   = document.getElementById('searchHistoryBar');
  const chips = document.getElementById('historyChips');
  const h     = lsGet(LS.SEARCH_HISTORY) || [];
  if (!h.length) { bar.style.display = 'none'; return; }

  bar.style.display = 'flex';
  chips.innerHTML = h.map(q =>
    `<button class="history-chip" data-query="${escAttr(q)}">${escHtml(q)}</button>`
  ).join('');

  chips.querySelectorAll('.history-chip').forEach(c => {
    c.addEventListener('click', () => {
      document.getElementById('navSearch').value = c.dataset.query;
      runSearch(c.dataset.query);
    });
  });
}

function initFilters() {
  const toggleBtn = document.getElementById('filterToggleBtn');
  const panel     = document.getElementById('filterPanel');
  const slider    = document.getElementById('filterRating');
  const sliderLbl = document.getElementById('ratingSliderVal');
  const applyBtn  = document.getElementById('applyFiltersBtn');

  toggleBtn.addEventListener('click', () => {
    const open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'block';
    toggleBtn.classList.toggle('active', !open);
  });

  slider.addEventListener('input', () => {
    sliderLbl.textContent     = slider.value;
    state.filterRating = parseFloat(slider.value);
  });

  applyBtn.addEventListener('click', () => {
    state.filterYearFrom = document.getElementById('filterYearFrom').value;
    state.filterYearTo   = document.getElementById('filterYearTo').value;
    state.filterSort     = document.getElementById('filterSort').value;
    runFilterSearch();
  });
}

async function loadGenres() {
  const data = await apiFetch('/genre/movie/list');
  if (!data?.genres) return;
  state.genres = data.genres;
  renderGenreMultiSelect();
  renderQuizGenres();
}

function renderGenreMultiSelect() {
  const container = document.getElementById('genreMulti');
  container.innerHTML = state.genres.map(g => `
    <label class="genre-check">
      <input type="checkbox" value="${g.id}" />
      <span>${escHtml(g.name)}</span>
    </label>`).join('');

  container.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      state.filterGenres = [...container.querySelectorAll('input:checked')].map(c => c.value);
    });
  });
}

// ============================================================
// === MODAL ===
// ============================================================

async function openModal(id, type = 'movie') {
  const modal   = document.getElementById('movieModal');
  const inner   = document.getElementById('modalInner');
  const backdrop = document.getElementById('modalBackdrop');

  // Show loading skeleton immediately
  inner.innerHTML = `
    <div class="modal-loading">
      <div class="skel skel-modal-poster"></div>
      <div class="modal-info-skel">
        <div class="skel skel-title"></div>
        <div class="skel skel-sub"></div>
        <div class="skel skel-sub" style="width:60%"></div>
      </div>
    </div>`;
  modal.classList.add('open');
  toggleBodyScroll(true);

  // Track the opened modal's media type so modal action handlers (which can't
  // accept params from inline onclick) use the right /movie or /tv endpoint.
  state.modalType = type;
  const data = await apiFetch(`/${type}/${id}`, { append_to_response: 'videos,credits,release_dates' });
  if (!data) {
    inner.innerHTML = '<p class="modal-error">Could not load details. Please try again.</p>';
    toggleBodyScroll(false); // Fix: Unlock scroll on failure
    return;
  }

  // Store in recently viewed
  addRecentlyViewed({
    id: data.id,
    title: data.title || data.name,
    poster_path: data.poster_path,
    vote_average: data.vote_average,
    release_date: data.release_date || data.first_air_date,
  });

  // Backdrop
  if (data.backdrop_path) backdrop.style.backgroundImage = `url(${BACKDROP_BASE}${data.backdrop_path})`;

  // YouTube trailer
  const videos  = data.videos?.results || [];
  const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube')
                || videos.find(v => v.site === 'YouTube')
                || null;

  // Cast (top 10)
  const cast    = data.credits?.cast?.slice(0, 10) || [];
  const genres  = data.genres || [];

  // Age cert (US)
  let cert = '';
  const usDates = data.release_dates?.results?.find(r => r.iso_3166_1 === 'US');
  if (usDates) {
    const c = usDates.release_dates.find(d => d.certification);
    if (c) cert = c.certification;
  }

  const watchlist  = lsGet(LS.WATCHLIST)  || [];
  const favourites = lsGet(LS.FAVOURITES) || [];
  const ratings    = lsGet(LS.RATINGS)    || {};
  const inWL    = watchlist.some(m  => m.id === data.id);
  const inFav   = favourites.some(m => m.id === data.id);
  const userStar = ratings[data.id] || 0;

  const poster = data.poster_path ? `${IMG_BASE}${data.poster_path}` : PLACEHOLDER_POSTER;
  const title  = data.title || data.name || 'Untitled';
  const rc     = getRatingClass(data.vote_average);

  inner.innerHTML = `
    <div class="modal-top">
      <img class="modal-poster" src="${poster}" alt="${escHtml(title)}"
           onerror="this.src='${PLACEHOLDER_POSTER}'" />
      <div class="modal-info">
        <div class="modal-header-row">
          ${cert ? `<span class="cert-badge">${escHtml(cert)}</span>` : ''}
          <span class="modal-rating badge-${rc}">★ ${data.vote_average != null ? Number(data.vote_average).toFixed(1) : 'N/A'}</span>
          <span class="modal-vote-count">(${data.vote_count?.toLocaleString() ?? '0'} votes)</span>
        </div>
        <h2 class="modal-title">${escHtml(title)}</h2>
        ${data.tagline ? `<p class="modal-tagline">"${escHtml(data.tagline)}"</p>` : ''}
        <div class="modal-meta-row">
          ${data.release_date ? `<span>📅 ${data.release_date}</span>` : ''}
          ${data.runtime      ? `<span>⏱ ${formatRuntime(data.runtime)}</span>` : ''}
          ${data.original_language ? `<span>🌐 ${data.original_language.toUpperCase()}</span>` : ''}
        </div>
        ${genres.length ? `
          <div class="modal-genres">
            ${genres.map(g => `<button class="genre-tag" onclick="filterByGenre(${g.id},'${escAttr(g.name)}')">${escHtml(g.name)}</button>`).join('')}
          </div>` : ''}
        <p class="modal-overview">${data.overview ? escHtml(data.overview) : 'No description available.'}</p>
        <div class="modal-financial">
          ${data.budget  ? `<span>💰 Budget: ${formatMoney(data.budget)}</span>`  : ''}
          ${data.revenue ? `<span>💵 Revenue: ${formatMoney(data.revenue)}</span>` : ''}
        </div>
        <div class="modal-user-rating">
          <span class="user-rating-label">Your Rating:</span>
          ${[1,2,3,4,5].map(s =>
            `<span class="modal-star${userStar >= s ? ' filled' : ''}" data-star="${s}" data-id="${data.id}">★</span>`
          ).join('')}
        </div>
        <div class="modal-action-btns">
          <button class="btn-primary${inWL  ? ' active' : ''}" id="modalWatchlistBtn"
                  onclick="toggleModalWatchlist(${data.id})">
            ${inWL ? '✓ In Watchlist' : '🔖 Add to Watchlist'}
          </button>
          <button class="btn-heart${inFav ? ' active' : ''}" id="modalFavBtn"
                  onclick="toggleModalFavourite(${data.id})">
            ${inFav ? '❤️ In Favourites' : '🤍 Add to Favourites'}
          </button>
          <button class="btn-share"
                  onclick="shareMovie(${data.id}, '${escAttr(title)}')">📤 Share</button>
        </div>
      </div>
    </div>

    ${trailer ? `
      <div class="modal-trailer">
        <h3 class="section-subtitle">🎬 Trailer</h3>
        <div class="trailer-wrap">
          <iframe src="https://www.youtube.com/embed/${trailer.key}?rel=0"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen></iframe>
        </div>
      </div>` : ''}

    ${cast.length ? `
      <div class="modal-cast">
        <h3 class="section-subtitle">🎭 Cast</h3>
        <div class="cast-row">
          ${cast.map(actor => {
            const photo = actor.profile_path ? `${IMG_BASE}${actor.profile_path}` : PLACEHOLDER_AVATAR;
            return `
              <div class="cast-card">
                <img src="${photo}" alt="${escHtml(actor.name)}"
                     onerror="this.src='${PLACEHOLDER_AVATAR}'" />
                <div class="cast-name">${escHtml(actor.name)}</div>
                <div class="cast-character">${escHtml(actor.character || '')}</div>
              </div>`;
          }).join('')}
        </div>
      </div>` : ''}

    <div class="modal-similar">
      <h3 class="section-subtitle">🎯 More Like This</h3>
      <div class="scroll-row" id="modalSimilarRow"></div>
    </div>`;

  // Wire up modal star ratings
  inner.querySelectorAll('.modal-star').forEach(star => {
    star.addEventListener('click', () => {
      setUserRating(data.id, parseInt(star.dataset.star), null, inner);
    });
  });

  // Load similar movies
  loadModalSimilar(data.id, type);
  // Refresh "Because you watched" row
  loadBecauseYouWatched();
}

async function loadModalSimilar(id, type = 'movie') {
  const row  = document.getElementById('modalSimilarRow');
  if (!row) return;
  renderSkeletons(row, 8);

  const data = await apiFetch(`/${type}/${id}/similar`);
  row.innerHTML = '';

  if (!data?.results?.length) {
    row.innerHTML = '<p class="row-error">No similar titles found.</p>';
    return;
  }
  data.results.slice(0, 15).forEach(m =>
    row.appendChild(createMovieCard(m, { isTV: type === 'tv', showCompare: false }))
  );
}

function closeModal() {
  const modal  = document.getElementById('movieModal');
  const iframe = modal.querySelector('iframe');
  if (iframe) { const s = iframe.src; iframe.src = ''; iframe.src = s; }
  modal.classList.remove('open');
  toggleBodyScroll(false);
}

function initModal() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('movieModal').addEventListener('click', e => {
    if (e.target.id === 'movieModal') closeModal();
  });
}

// Modal watchlist / favourite helpers
// NOTE: state.modalType tracks the last opened modal's media type (movie/tv),
// since onclick handlers in the generated markup can't pass the type param.
async function toggleModalWatchlist(id) {
  const wl  = lsGet(LS.WATCHLIST) || [];
  const idx = wl.findIndex(m => m.id === id);
  const btn = document.getElementById('modalWatchlistBtn');
  if (idx === -1) {
    const d = await apiFetch(`/${state.modalType || 'movie'}/${id}`);
    if (!d) return;
    wl.push(stripForStorage({ ...d, addedAt: Date.now(), media_type: state.modalType || 'movie' }));
    lsSet(LS.WATCHLIST, wl);
    showToast('Added to Watchlist 🔖');
    if (btn) { btn.textContent = '✓ In Watchlist'; btn.classList.add('active'); }
  } else {
    const removed = wl.splice(idx, 1)[0];
    lsSet(LS.WATCHLIST, wl);
    if (btn) { btn.textContent = '🔖 Add to Watchlist'; btn.classList.remove('active'); }
    showToast('Removed from Watchlist', 'success', () => {
      const w2 = lsGet(LS.WATCHLIST) || [];
      w2.splice(idx, 0, removed); lsSet(LS.WATCHLIST, w2);
      if (btn) { btn.textContent = '✓ In Watchlist'; btn.classList.add('active'); }
    });
  }
}

async function toggleModalFavourite(id) {
  const favs = lsGet(LS.FAVOURITES) || [];
  const idx  = favs.findIndex(m => m.id === id);
  const btn  = document.getElementById('modalFavBtn');
  if (idx === -1) {
    const d = await apiFetch(`/${state.modalType || 'movie'}/${id}`);
    if (!d) return;
    favs.push(stripForStorage({ ...d, addedAt: Date.now(), media_type: state.modalType || 'movie' }));
    lsSet(LS.FAVOURITES, favs);
    showToast('Added to Favourites ❤️');
    if (btn) { btn.textContent = '❤️ In Favourites'; btn.classList.add('active'); }
  } else {
    const removed = favs.splice(idx, 1)[0];
    lsSet(LS.FAVOURITES, favs);
    if (btn) { btn.textContent = '🤍 Add to Favourites'; btn.classList.remove('active'); }
    showToast('Removed from Favourites', 'success', () => {
      const f2 = lsGet(LS.FAVOURITES) || [];
      f2.splice(idx, 0, removed); lsSet(LS.FAVOURITES, f2);
      if (btn) { btn.textContent = '❤️ In Favourites'; btn.classList.add('active'); }
    });
  }
}

async function toggleHeroWatchlist(id) {
  const wl  = lsGet(LS.WATCHLIST) || [];
  const idx = wl.findIndex(m => m.id === id);
  const btn = document.getElementById('heroWatchlistBtn');
  if (idx === -1) {
    const d = await apiFetch(`/${state.modalType || 'movie'}/${id}`);
    if (!d) return;
    wl.push(stripForStorage({ ...d, addedAt: Date.now(), media_type: state.modalType || 'movie' }));
    lsSet(LS.WATCHLIST, wl);
    showToast('Added to Watchlist 🔖');
    if (btn) { btn.textContent = '✓ In Watchlist'; btn.classList.add('active'); }
  } else {
    wl.splice(idx, 1);
    lsSet(LS.WATCHLIST, wl);
    showToast('Removed from Watchlist');
    if (btn) { btn.textContent = '🔖 Add to Watchlist'; btn.classList.remove('active'); }
  }
}

// ============================================================
// === WATCHLIST ===
// ============================================================

function toggleWatchlist(movie, btn) {
  const wl  = lsGet(LS.WATCHLIST) || [];
  const idx = wl.findIndex(m => m.id === movie.id);
  if (idx === -1) {
    wl.push(stripForStorage({ ...movie, addedAt: Date.now() }));
    lsSet(LS.WATCHLIST, wl);
    btn?.classList.add('active');
    showToast('Added to Watchlist 🔖');
  } else {
    const removed = wl.splice(idx, 1)[0];
    lsSet(LS.WATCHLIST, wl);
    btn?.classList.remove('active');
    showToast('Removed from Watchlist', 'success', () => {
      const w2 = lsGet(LS.WATCHLIST) || [];
      w2.splice(idx, 0, removed); lsSet(LS.WATCHLIST, w2);
      btn?.classList.add('active');
    });
  }
}

function toggleFavourite(movie, btn) {
  const favs = lsGet(LS.FAVOURITES) || [];
  const idx  = favs.findIndex(m => m.id === movie.id);
  if (idx === -1) {
    favs.push(stripForStorage({ ...movie, addedAt: Date.now() }));
    lsSet(LS.FAVOURITES, favs);
    btn?.classList.add('active');
    showToast('Added to Favourites ❤️');
  } else {
    const removed = favs.splice(idx, 1)[0];
    lsSet(LS.FAVOURITES, favs);
    btn?.classList.remove('active');
    showToast('Removed from Favourites', 'success', () => {
      const f2 = lsGet(LS.FAVOURITES) || [];
      f2.splice(idx, 0, removed); lsSet(LS.FAVOURITES, f2);
      btn?.classList.add('active');
    });
  }
}

function toggleWatched(id, card, btn) {
  const watched = lsGet(LS.WATCHED) || [];
  const idx     = watched.indexOf(id);

  if (idx === -1) {
    watched.push(id);
    lsSet(LS.WATCHED, watched);
    card?.classList.add('watched');
    const wrap = card?.querySelector('.card-poster-wrap');
    if (wrap && !wrap.querySelector('.watched-overlay')) {
      const ov = document.createElement('div');
      ov.className = 'watched-overlay';
      ov.innerHTML = '<span>✓</span>';
      wrap.appendChild(ov);
    }
    btn?.classList.add('active');
    showToast('Marked as Watched ✓');
  } else {
    watched.splice(idx, 1);
    lsSet(LS.WATCHED, watched);
    card?.classList.remove('watched');
    card?.querySelector('.watched-overlay')?.remove();
    btn?.classList.remove('active');
    showToast('Unmarked as Watched');
  }
}

function setUserRating(id, rating, card = null, container = null) {
  const ratings = lsGet(LS.RATINGS) || {};
  ratings[id] = rating;
  lsSet(LS.RATINGS, ratings);
  showToast(`Rated ${rating} star${rating !== 1 ? 's' : ''} ★`);

  const scope = container || card || document;
  scope.querySelectorAll(`.card-star[data-id="${id}"], .modal-star[data-id="${id}"]`).forEach(s => {
    s.classList.toggle('filled', parseInt(s.dataset.star) <= rating);
  });
}

function renderWatchlist() {
  const grid   = document.getElementById('watchlistGrid');
  const empty  = document.getElementById('watchlistEmpty');
  const sortBy = document.getElementById('watchlistSort').value;
    const list   = sortMovieList(lsGet(LS.WATCHLIST) || [], sortBy);
  grid.innerHTML = '';
  empty.style.display = list.length ? 'none' : 'flex';
  list.forEach(m => grid.appendChild(createMovieCard(m)));
  renderStats();
}

function renderFavourites() {
  const grid   = document.getElementById('favouritesGrid');
  const empty  = document.getElementById('favouritesEmpty');
  const sortBy = document.getElementById('favouritesSort').value;
    const list   = sortMovieList(lsGet(LS.FAVOURITES) || [], sortBy);
  grid.innerHTML = '';
  empty.style.display = list.length ? 'none' : 'flex';
  list.forEach(m => grid.appendChild(createMovieCard(m)));
  renderStats();
}

// ===== Library stats (renders a compact stats panel in the watchlist header) =====
function renderStats() {
  const panel = document.getElementById('statsPanel');
  if (!panel) return;
  const watched   = lsGet(LS.WATCHED) || [];
  const wl        = lsGet(LS.WATCHLIST) || [];
  const favs      = lsGet(LS.FAVOURITES) || [];
  const ratings   = lsGet(LS.RATINGS) || {};
  const ratedKeys = Object.keys(ratings);
  const avgRating = ratedKeys.length
    ? (ratedKeys.reduce((sum, k) => sum + Number(ratings[k]), 0) / ratedKeys.length).toFixed(1)
    : '–';
  const watchedMinutes = watched.reduce((acc, id) => {
    const movie = [...wl, ...favs].find(m => m.id === id);
    const mins  = movie?.runtime || movie?.episode_run_time?.[0] || 0;
    return acc + Number(mins || 0);
  }, 0);
  const hours = Math.floor(watchedMinutes / 60);
  const mins  = watchedMinutes % 60;
  const runtimeStr = watchedMinutes ? (hours ? `${hours}h${mins ? ` ${mins}m` : ''}` : `${mins}m`) : '–';
  panel.innerHTML = `
    <div class="stat-tile"><span class="stat-tile-val">${wl.length}</span><span class="stat-tile-label">In Watchlist</span></div>
    <div class="stat-tile"><span class="stat-tile-val">${favs.length}</span><span class="stat-tile-label">Favourites</span></div>
    <div class="stat-tile"><span class="stat-tile-val">${watched.length}</span><span class="stat-tile-label">Watched</span></div>
    <div class="stat-tile"><span class="stat-tile-val">★ ${avgRating}</span><span class="stat-tile-label">Avg Rating</span></div>
    <div class="stat-tile"><span class="stat-tile-val">🕐 ${runtimeStr}</span><span class="stat-tile-label">Watched Runtime</span></div>`;
}

function sortMovieList(list, sortBy) {
  return [...list].sort((a, b) => {
    switch (sortBy) {
      case 'rating'    : return (b.vote_average || 0) - (a.vote_average || 0);
      case 'title'     : return (a.title || a.name || '').localeCompare(b.title || b.name || '');
      case 'year'      : return new Date(b.release_date || b.first_air_date || 0)
                              - new Date(a.release_date || a.first_air_date || 0);
      case 'dateAdded' :
      default          : return (b.addedAt || 0) - (a.addedAt || 0);
    }
  });
}

function exportWatchlist() {
  downloadJSON(lsGet(LS.WATCHLIST) || [], 'cinematch-watchlist.json');
  showToast('Watchlist exported ⬇');
}

function exportFavourites() {
  downloadJSON(lsGet(LS.FAVOURITES) || [], 'cinematch-favourites.json');
  showToast('Favourites exported ⬇');
}

// Import a JSON list (export of the same format) into watchlist or favourites.
// Entries are validated and merged by id — duplicates are skipped (keeping the newer entry).
function importList(input, listType) {
  const file = input.files?.[0];
  if (!file) return;
  const lsKey = listType === 'favourites' ? LS.FAVOURITES : LS.WATCHLIST;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error('Expected a JSON array of movies');
      const valid = parsed.filter(m => m && m.id && (m.title || m.name));
      if (!valid.length) throw new Error('No valid movie entries found in the file');
      const existing = lsGet(lsKey) || [];
      const existingById = new Map(existing.map(m => [m.id, m]));
      valid.forEach(m => {
        const e = existingById.get(m.id);
        // Keep the newer entry on conflict (compare addedAt timestamps)
        if (!e || (m.addedAt || 0) > (e.addedAt || 0)) {
          existingById.set(m.id, { ...m, media_type: m.media_type || 'movie' });
        }
      });
      const merged = [...existingById.values()];
      lsSet(lsKey, merged);
      if (listType === 'watchlist') { renderWatchlist(); showWatchlist(); }
      else { renderFavourites(); showFavourites(); }
      showToast(`Imported ${valid.length} items (${merged.length - existing.length} new, ${valid.length - (merged.length - existing.length)} duplicates skipped) 📥`);
    } catch (err) {
      console.error('[CineBench] Import failed:', err);
      showToast('Import failed: ' + (err.message || 'invalid file'), 'error');
    }
    input.value = ''; // allow re-importing the same file
  };
  reader.readAsText(file);
}
window.importList = importList;

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a    = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

// ============================================================
// === RECOMMENDATIONS ===
// ============================================================

function initMoodPicker() {
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filterGenres  = [btn.dataset.genre];
      state.filterSort    = 'popularity.desc';
      state.filterRating  = 0;
      state.filterYearFrom = '';
      state.filterYearTo   = '';
      runFilterSearch();
    });
  });
}

async function surpriseMe() {
  const page = Math.floor(Math.random() * 100) + 1;
  const data = await apiFetch('/movie/popular', { page });
  if (!data?.results?.length) { showToast('Could not find a surprise movie.', 'error'); return; }
  const movie = data.results[Math.floor(Math.random() * data.results.length)];
  openModal(movie.id, 'movie');
}

/** Weighted local recommendation score */
function calcScore(movie, preferredGenreIds = []) {
  const vote    = (movie.vote_average || 0) * 0.4;
  const popNorm = Math.min((movie.popularity || 0) / 1000, 1) * 0.3;
  const gids    = (movie.genre_ids || []).map(String);
  const prefs   = preferredGenreIds.map(String);
  const match   = gids.filter(g => prefs.includes(g)).length;
  const gMatch  = prefs.length ? (match / Math.max(gids.length, 1)) * 0.3 : 0;
  return vote + popNorm + gMatch;
}

// Genre quiz
function showQuiz() {
  document.getElementById('quizModal').classList.add('open');
  toggleBodyScroll(true);
}

function renderQuizGenres() {
  const container = document.getElementById('quizGenres');
  container.innerHTML = state.genres.map(g =>
    `<button class="quiz-genre-btn" data-id="${g.id}">${escHtml(g.name)}</button>`
  ).join('');

  let selected   = [];
  const submitBtn = document.getElementById('quizSubmit');
  const countEl   = document.querySelector('#quizSelected strong');

  container.querySelectorAll('.quiz-genre-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const gid = btn.dataset.id;
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        selected = selected.filter(s => s !== gid);
      } else if (selected.length < 3) {
        btn.classList.add('selected');
        selected.push(gid);
      }
      countEl.textContent   = selected.length;
      submitBtn.disabled    = selected.length !== 3;
    });
  });

  // Only attach submit listener once
  submitBtn.onclick = () => {
    lsSet(LS.GENRE_PREFS, selected);
    lsSet(LS.QUIZ_DONE, true);
    document.getElementById('quizModal').classList.remove('open');
    toggleBodyScroll(false);
    showToast('Preferences saved! 🎬');
    loadPreferredGenreRows();
  };
}

async function loadPreferredGenreRows() {
  const prefs = lsGet(LS.GENRE_PREFS);
  if (!prefs?.length) return;

  const homeRows = document.getElementById('homeRows');

  for (const gid of [...prefs].reverse()) {
    if (document.getElementById(`prefRow_${gid}`)) continue;
    const genre = state.genres.find(g => String(g.id) === String(gid));
    if (!genre) continue;

    const section = document.createElement('div');
    section.className = 'row-section';
    section.id = `prefRow_${gid}`;
    section.innerHTML = `
      <h2 class="row-title">⭐ ${escHtml(genre.name)} Picks For You</h2>
      <div class="scroll-row-wrap">
        <button class="row-arrow row-arrow-left"  data-row="pref_${gid}">‹</button>
        <div class="scroll-row" id="pref_${gid}Row"></div>
        <button class="row-arrow row-arrow-right" data-row="pref_${gid}">›</button>
      </div>`;
    homeRows.insertBefore(section, homeRows.firstChild);

    // Wire arrows
    section.querySelectorAll('.row-arrow').forEach(btn => {
      btn.addEventListener('click', () => {
        const r   = section.querySelector('.scroll-row');
        const amt = r.clientWidth * 0.8;
        r.scrollBy({ left: btn.classList.contains('row-arrow-left') ? -amt : amt, behavior: 'smooth' });
      });
    });

    await loadRow(`pref_${gid}Row`, '/discover/movie', {
      with_genres: gid, sort_by: 'popularity.desc',
    });
  }
}

// Recently viewed
function addRecentlyViewed(movie) {
  let recent = lsGet(LS.RECENTLY_VIEWED) || [];
  recent = [movie, ...recent.filter(m => m.id !== movie.id)].slice(0, 10);
  lsSet(LS.RECENTLY_VIEWED, recent);
  loadRecentlyViewed();
}

function filterByGenre(genreId, genreName) {
  closeModal();
  state.filterGenres  = [String(genreId)];
  state.filterSort    = 'popularity.desc';
  state.filterRating  = 0;
  state.filterYearFrom = '';
  state.filterYearTo   = '';
  document.getElementById('searchViewTitle').textContent = `Genre: ${genreName}`;
  runFilterSearch();
}

// ============================================================
// === COMPARE ===
// ============================================================

// Restore previously selected comparison pair across page reloads
function restoreCompare() {
  const saved = lsGet(LS.COMPARE) || [];
  if (saved.length === 2) {
    state.compareMovies = saved.slice(0, 2);
    const bar = document.getElementById('compareBar');
    bar.style.display = 'flex';
    document.getElementById('compareBarText').textContent = 'Compare: 2/2 selected';
    document.getElementById('compareNowBtn').disabled = false;
    // Highlight the matching card buttons in the current view
    document.querySelectorAll('.card-action-btn[data-action="compare"]').forEach(b => {
      b.classList.toggle('active', state.compareMovies.some(m => m.id === Number(b.dataset.id)));
    });
  }
}
function persistCompare() {
  lsSet(LS.COMPARE, state.compareMovies);
}
function toggleCompare(movie, btn) {
  const idx      = state.compareMovies.findIndex(m => m.id === movie.id);
  const bar      = document.getElementById('compareBar');
  const barText  = document.getElementById('compareBarText');
  const nowBtn   = document.getElementById('compareNowBtn');
  if (idx !== -1) {
    state.compareMovies.splice(idx, 1);
    btn?.classList.remove('active');
  } else {
    if (state.compareMovies.length >= 2) {
      showToast('Only 2 movies can be compared at a time.', 'info');
      return;
    }
    state.compareMovies.push(movie);
    btn?.classList.add('active');
  }
  const count   = state.compareMovies.length;
  bar.style.display      = count > 0 ? 'flex' : 'none';
  barText.textContent    = `Compare: ${count}/2 selected`;
  nowBtn.disabled        = count !== 2;
  persistCompare();
}

function clearCompare() {
  state.compareMovies = [];
  document.getElementById('compareBar').style.display = 'none';
  document.querySelectorAll('.card-action-btn[data-action="compare"]').forEach(b => b.classList.remove('active'));
  persistCompare();
}

async function openCompare() {
  if (state.compareMovies.length !== 2) return;

  const modal = document.getElementById('compareModal');
  const wrap  = document.getElementById('compareTableWrap');
  modal.classList.add('open');
  toggleBodyScroll(true);
  wrap.innerHTML = '<div class="compare-loading">Loading comparison…</div>';

  const [a, b] = await Promise.all([
    apiFetch(`/${state.compareMovies[0].media_type || 'movie'}/${state.compareMovies[0].id}`),
    apiFetch(`/${state.compareMovies[1].media_type || 'movie'}/${state.compareMovies[1].id}`),
  ]);

  if (!a || !b) { wrap.innerHTML = '<p class="modal-error">Could not load data.</p>'; return; }

  const imgA = a.poster_path ? `${IMG_BASE}${a.poster_path}` : PLACEHOLDER_POSTER;
  const imgB = b.poster_path ? `${IMG_BASE}${b.poster_path}` : PLACEHOLDER_POSTER;

  const rows = [
    ['Poster',
     `<img src="${imgA}" style="width:72px;border-radius:6px" onerror="this.src='${PLACEHOLDER_POSTER}'" />`,
     `<img src="${imgB}" style="width:72px;border-radius:6px" onerror="this.src='${PLACEHOLDER_POSTER}'" />`],
    ['Title',       escHtml(a.title || a.name),   escHtml(b.title || b.name)],
    ['Release',     a.release_date || a.first_air_date || 'N/A', b.release_date || b.first_air_date || 'N/A'],
    ['Rating',      `★ ${a.vote_average?.toFixed(1) ?? 'N/A'}`, `★ ${b.vote_average?.toFixed(1) ?? 'N/A'}`],
    ['Votes',       a.vote_count?.toLocaleString() ?? 'N/A', b.vote_count?.toLocaleString() ?? 'N/A'],
    ['Runtime',     formatRuntime(a.runtime || (a.episode_run_time ? a.episode_run_time[0] : 0)),
                    formatRuntime(b.runtime || (b.episode_run_time ? b.episode_run_time[0] : 0))],
    ['Popularity',  Math.round(a.popularity || 0),  Math.round(b.popularity || 0)],
    ['Genres',      (a.genres || []).map(g => g.name).join(', ') || 'N/A',
                    (b.genres || []).map(g => g.name).join(', ') || 'N/A'],
    ['Language',    a.original_language?.toUpperCase() ?? 'N/A', b.original_language?.toUpperCase() ?? 'N/A'],
    ['Overview',    escHtml((a.overview || 'N/A').substring(0, 100)) + '…',
                    escHtml((b.overview || 'N/A').substring(0, 100)) + '…'],
  ];

  wrap.innerHTML = `
    <table class="compare-table">
      <thead>
        <tr>
          <th>Attribute</th>
          <th>${escHtml(a.title)}</th>
          <th>${escHtml(b.title)}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(([label, va, vb]) => `
          <tr>
            <td class="compare-label">${label}</td>
            <td>${va}</td>
            <td>${vb}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function closeCompare() {
  document.getElementById('compareModal').classList.remove('open');
  toggleBodyScroll(false);
}

// Share — mediaType falls back to state.modalType when shared from the modal,
// since the inline onclick cannot pass the media type. 'movie' otherwise.
async function shareMovie(id, title, mediaType) {
  const type = mediaType || state.modalType || 'movie';
  const url  = `https://www.themoviedb.org/${type}/${id}`;
  if (navigator.share) {
    try { await navigator.share({ title, url, text: `Check out "${title}"!` }); }
    catch { /* user cancelled */ }
  } else {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard! 📋');
    } catch {
      showToast('Could not copy link.', 'error');
    }
  }
}

// ============================================================
// === UTILS ===
// ============================================================

function lsGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { console.warn('[CineBench] localStorage write failed:', e); }
}

// Trim bulky TMDB fields before saving to localStorage to avoid quota limits
// and keep stored lists portable (watchlist/favourites import works anywhere).
function stripForStorage(movie) {
  const {
    videos, credits, similar, recommendations,
    release_dates, belongs_to_collection, production_companies,
    production_countries, spoken_languages, homepage,
    imdb_id, status, original_title, original_name, ...rest
  } = movie;
  return rest;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

/**
 * Display a toast notification.
 * @param {string}   message
 * @param {string}   type          — 'success' | 'error' | 'info'
 * @param {Function} undoCallback  — optional; shows Undo button with 5 s window
 */
function showToast(message, type = 'success', undoCallback = null) {
  const container = document.getElementById('toastContainer');
  const toast     = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-msg">${message}</span>
    ${undoCallback ? '<button class="toast-undo">Undo</button>' : ''}
    <button class="toast-dismiss">✕</button>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  const remove = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  };

  const timer = setTimeout(remove, 5000);
  toast.querySelector('.toast-dismiss').addEventListener('click', () => { clearTimeout(timer); remove(); });

  if (undoCallback) {
    toast.querySelector('.toast-undo').addEventListener('click', () => {
      clearTimeout(timer);
      undoCallback();
      toast.remove();
      showToast('Action undone ↩');
    });
  }
}

// ============================================================
// === VIEW MANAGEMENT ===
// ============================================================

const VIEWS = ['homeView', 'searchView', 'watchlistView', 'favouritesView'];

function switchView(viewId) {
  VIEWS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === viewId ? '' : 'none';
  });
  state.currentView = viewId;
  window.scrollTo({ top: 0 });
}

function setActiveLink(linkId) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById(linkId)?.classList.add('active');
}

function showHome() {
  switchView('homeView');
  setActiveLink('linkHome');
}

function showWatchlist() {
  switchView('watchlistView');
  setActiveLink('linkWatchlist');
  renderWatchlist();
}

function showFavourites() {
  switchView('favouritesView');
  setActiveLink('linkFavourites');
  renderFavourites();
}

// ============================================================
// === INIT ===
// ============================================================

function initTheme() {
  const saved = lsGet(LS.THEME) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);

  document.getElementById('themeToggle').addEventListener('click', () => {
    const cur  = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    lsSet(LS.THEME, next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function initNavbar() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
  });
  document.getElementById('navHamburger').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('open');
  });
}

function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
}

function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initClearHistory() {
  document.getElementById('clearHistory').addEventListener('click', () => {
    lsSet(LS.SEARCH_HISTORY, []);
    document.getElementById('searchHistoryBar').style.display = 'none';
    showToast('Search history cleared');
  });
}

function initKeyboard() {
  document.addEventListener('keydown', e => {
    // Escape closes any open modal
    if (e.key === 'Escape') {
      closeModal();
      closeCompare();
      document.getElementById('searchDropdown').style.display = 'none';
    }

    // Arrow key card navigation
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      const focused = document.activeElement;
      if (!focused?.classList.contains('movie-card')) return;
      const cards = [...document.querySelectorAll('.movie-card:not(.skeleton-card)')];
      const idx   = cards.indexOf(focused);
      const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 5, ArrowUp: -5 }[e.key];
      const next  = idx + delta;
      if (next >= 0 && next < cards.length) {
        e.preventDefault();
        cards[next].focus();
        cards[next].scrollIntoView({ block: 'nearest' });
      }
    }
  });
}

async function init() {
  if (!API_KEY) {
    console.error('[CineBench] Critical: TMDB API Key is missing! Check your .env file.');
    alert('API Key is missing. Please check your .env file and restart the server.');
  }

  try {
    initTheme();
    initNavbar();
    initBackToTop();
    initSearch();
    initFilters();
    initModal();
    initMoodPicker();
    initClearHistory();
    initKeyboard();
    setupRowArrows();

    document.getElementById('surpriseBtn').addEventListener('click', surpriseMe);

    // Compare modal: close on backdrop click
    document.getElementById('compareModal').addEventListener('click', e => {
      if (e.target.id === 'compareModal') closeCompare();
    });

    // Genre quiz modal: close on backdrop click only after quiz done
    document.getElementById('quizModal').addEventListener('click', e => {
      if (e.target.id === 'quizModal' && lsGet(LS.QUIZ_DONE)) {
        document.getElementById('quizModal').classList.remove('open');
      }
    });

    // Load genres (needed for quiz + filters)
    await loadGenres();

    // Render saved search history
    renderSearchHistory();

    // Show genre quiz on first visit
    if (!lsGet(LS.QUIZ_DONE)) {
      setTimeout(showQuiz, 800);
    } else {
      loadPreferredGenreRows();
    }

    // Load all home content
    await loadAllHomeSections();
    // Restore the last saved comparison pair
    restoreCompare();
  } catch (err) {
    console.error('[CineMatch] Initialization failed:', err);
  }
}

document.addEventListener('DOMContentLoaded', init);

// Expose functions to window for HTML onclick attributes (Vite/ESM scoping fix)
window.showHome         = showHome;
window.showWatchlist    = showWatchlist;
window.showFavourites   = showFavourites;
window.closeMobileMenu  = closeMobileMenu;
window.retrySearch      = retrySearch;
window.renderWatchlist  = renderWatchlist;
window.renderFavourites = renderFavourites;
window.exportWatchlist  = exportWatchlist;
window.exportFavourites = exportFavourites;
window.closeCompare     = closeCompare;
window.openCompare      = openCompare;
window.clearCompare     = clearCompare;
window.closeModal       = closeModal;
window.toggleModalWatchlist = toggleModalWatchlist;
window.toggleModalFavourite = toggleModalFavourite;
window.shareMovie       = shareMovie;
window.filterByGenre    = filterByGenre;