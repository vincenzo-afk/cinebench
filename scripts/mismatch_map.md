# CSS↔JS mismatch mapping (JS = source of truth)

JS emits these class names that have NO CSS rules (verified by scripts/check_classes.py):

| JS class | Has CSS rule? | Fix in CSS |
|---|---|---|
| card-rating / card-title / card-year / card-stars / card-info | NO (CSS uses rating-badge, card-overlay-title/year) | Add new rules (card-title is inside card-info below poster) |
| badge-green/yellow/red | NO (CSS uses .rating-badge.green) | Add badge-* rules |
| watched-overlay | NO (CSS uses .card-watched-overlay) | Add alias rule |
| skel-poster / skel-line / skel-modal-poster | NO (CSS uses .card-skel-img / .card-skel-line) | Add alias rules |
| dropdown-info / dropdown-title / dropdown-year / dropdown-loading / dropdown-empty | NO (CSS uses .dropdown-item-info .d-title/.d-year) | Add rules |
| hero-buttons / hero-watchlist-btn / hero-error / hero-meta / hero-overview / hero-year / hero-dots(dot exists) | partial | Add missing rules |
| modal-top / modal-header-row / modal-rating / modal-vote-count / modal-meta-row / modal-user-rating / modal-star / modal-action-btns / btn-share / section-subtitle / trailer-wrap / modal-cast / cast-character / modal-similar / modal-loading / modal-error / modal-info-skel / modal-financial / cert-badge / genre-tag | NO (CSS uses modal-main/modal-meta/meta-pill/modal-actions/modal-action-btn/user-stars/user-star/modal-section-title/trailer-embed/cast-char) | Add alias rules |
| compare-label / compare-loading | NO (.compare-table .row-label exists, .compare-loading none) | Add rules |
| toast-msg / toast-dismiss / toast-${type} | partial (CSS has .toast, .toast.removing but no .toast-success/.toast-error; show anim uses .show? actually JS adds .show, CSS animates on creation only) | Add toast.show + variants + .toast-msg/.toast-dismiss |
| genre-check | NO | Add rule |
| btn-primary / btn-secondary / btn-heart | NO (CSS uses hero-btn--primary/secondary) | Add rules |
| section-subtitle | NO (modal-section-title) | Add alias |
| row-error | NO (row errors render as text in JS) | Add rule |

Action buttons: JS sets class `active` (card-action-btn.active) but CSS expects
active-watchlist / active-fav / active-compare. Fix: add `.card-action-btn.active` rule in CSS
(JS uses one `active` class for all four actions).

Search clear: CSS = `.search-clear.visible` (opacity), JS = inline style.display flex/none.
Fix JS to use classList.toggle('visible') instead of style.display.

Dropdown: JS toggles style.display none/block; CSS also has `.search-dropdown.open {display:block}`.
JS works (inline style overrides class open) — fine, but consistent: keep JS as-is.

Modal: JS emits `.modal-top` (flex, gap 28, margin-top -80, z-2) — maps to `.modal-main`.
JS emits `.modal-header-row` — flex row with cert + rating + votes.
JS emits `.modal-user-rating` — container for stars. JS `.modal-star` — the stars.
JS emits `.modal-action-btns` (flex wrap) wrapping btn-primary/btn-heart/btn-share.
JS emits `.section-subtitle` for trailer/cast/similar headings (modal-section-title in CSS).
JS emits `.cast-character` — CSS .cast-char.
JS emits `.trailer-wrap` — CSS .trailer-embed.
