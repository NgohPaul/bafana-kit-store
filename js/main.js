const SHOPIFY_API   = 'https://bafana-bafana-5.myshopify.com/api/2024-01/graphql.json';
const SHOPIFY_TOKEN = 'cdb151548aff66750a9460fdbe70d766';

// ─── Product Routing ───
function navigateToProduct(card) {
  const handle  = (card.dataset.handle || '').toLowerCase();
  const titleEl = card.querySelector('.product-card__name');
  const title   = (titleEl ? titleEl.textContent : '').trim().toLowerCase();
  if (handle.includes('away') || title.includes('away')) {
    window.location.href = 'away-product.html';
  } else {
    window.location.href = 'product.html';
  }
}

// ─── Cart Badge ───
function updateCartBadge(n) {
  const count = Math.max(0, parseInt(n, 10) || 0);
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = count);
}

function findShopifyCartId() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const val = localStorage.getItem(key) || '';
    if (!val.includes('gid://shopify/Cart/')) continue;
    try {
      const obj = JSON.parse(val);
      const id = obj?.id || obj?.cartId || obj?.cart?.id;
      if (typeof id === 'string' && id.includes('gid://shopify/Cart/')) return id;
    } catch (_) {}
    const match = val.match(/gid:\/\/shopify\/Cart\/[^"'\s,}]*/);
    if (match) return match[0];
  }
  return null;
}

async function fetchShopifyCartCount() {
  const el = document.getElementById('shopify-cart');
  const cartId = el?.getAttribute('cart-id') || el?.cartId || findShopifyCartId();
  if (!cartId) return 0;
  try {
    const res = await fetch(SHOPIFY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN },
      body: JSON.stringify({ query: `{ cart(id: ${JSON.stringify(cartId)}) { totalQuantity } }` }),
    });
    const json = await res.json();
    const count = json?.data?.cart?.totalQuantity;
    return typeof count === 'number' ? count : 0;
  } catch (_) { return 0; }
}

function countFromEventDetail(detail) {
  if (!detail) return null;
  if (typeof detail.totalQuantity === 'number') return detail.totalQuantity;
  if (typeof detail.count         === 'number') return detail.count;
  if (typeof detail.itemCount     === 'number') return detail.itemCount;
  const cart = detail.cart || detail.data?.cart;
  if (cart) {
    if (typeof cart.totalQuantity === 'number') return cart.totalQuantity;
    const edges = cart.lines?.edges;
    if (Array.isArray(edges)) return edges.reduce((s, e) => s + (e.node?.quantity || 0), 0);
    if (Array.isArray(cart.lines)) return cart.lines.reduce((s, l) => s + (l.quantity || 0), 0);
  }
  if (Array.isArray(detail.lines)) return detail.lines.reduce((s, l) => s + (l.quantity || 0), 0);
  return null;
}

function syncCartBadge(evt) {
  if (evt?.detail) {
    const n = countFromEventDetail(evt.detail);
    if (n !== null) { updateCartBadge(n); return; }
  }
  fetchShopifyCartCount().then(updateCartBadge);
}

// ═══════════════════════════════════════════
// CUSTOM CART DRAWER
// ═══════════════════════════════════════════

function _injectDrawerStyles() {
  if (document.getElementById('bafanaDrawerStyles')) return;
  const s = document.createElement('style');
  s.id = 'bafanaDrawerStyles';
  s.textContent = `
    .bfk-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      z-index: 10000; opacity: 0; pointer-events: none;
      transition: opacity 0.3s ease;
    }
    .bfk-overlay.open { opacity: 1; pointer-events: all; }

    .bfk-drawer {
      position: fixed; top: 0; right: -480px; bottom: 0;
      width: 420px; max-width: 100vw;
      background: #fff; z-index: 10001;
      display: flex; flex-direction: column;
      transition: right 0.35s cubic-bezier(.4,0,.2,1);
      box-shadow: -4px 0 32px rgba(0,0,0,0.18);
    }
    .bfk-overlay.open .bfk-drawer { right: 0; }

    .bfk-drawer__head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 20px; border-bottom: 1px solid #e5e7eb;
      background: #1a6b3a;
    }
    .bfk-drawer__title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; }
    .bfk-drawer__close {
      background: rgba(255,255,255,0.15); border: none; color: #fff;
      width: 32px; height: 32px; border-radius: 50%; font-size: 16px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .bfk-drawer__close:hover { background: rgba(255,255,255,0.3); }

    .bfk-drawer__body {
      flex: 1; overflow-y: auto; padding: 16px 20px;
      transition: opacity 0.2s;
    }
    .bfk-drawer__body.updating { opacity: 0.45; pointer-events: none; }
    .bfk-drawer__empty {
      text-align: center; padding: 48px 24px;
      color: #6b7280; font-size: 15px; line-height: 1.6;
    }
    .bfk-drawer__empty-icon { font-size: 40px; margin-bottom: 12px; }
    .bfk-drawer__loading {
      text-align: center; padding: 48px 24px; color: #6b7280;
    }
    .bfk-drawer__error {
      text-align: center; padding: 32px 24px; color: #e11d48; font-size: 14px;
    }

    .bfk-item {
      display: flex; gap: 14px; align-items: flex-start;
      padding: 14px 0; border-bottom: 1px solid #f3f4f6;
    }
    .bfk-item:last-child { border-bottom: none; }
    .bfk-item__img {
      width: 80px; height: 80px; border-radius: 10px;
      object-fit: contain; background: #f3f4f6;
      border: 1px solid #e5e7eb; flex-shrink: 0;
    }
    .bfk-item__details { flex: 1; min-width: 0; }
    .bfk-item__name {
      font-weight: 700; font-size: 14px; color: #111827;
      margin: 0 0 2px; line-height: 1.3;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .bfk-item__variant { font-size: 12px; color: #6b7280; margin: 0 0 6px; }
    .bfk-item__price { font-size: 15px; font-weight: 800; color: #1a6b3a; margin: 0 0 8px; }

    /* Quantity controls */
    .bfk-item__controls {
      display: flex; align-items: center; gap: 6px;
    }
    .bfk-qty-btn {
      width: 30px; height: 30px; border-radius: 8px;
      border: 1px solid #e5e7eb; background: #f9fafb;
      color: #111827; font-size: 18px; font-weight: 600; line-height: 1;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, border-color 0.15s; flex-shrink: 0;
    }
    .bfk-qty-btn:hover { background: #e5e7eb; border-color: #d1d5db; }
    .bfk-qty-btn:active { transform: scale(0.93); }
    .bfk-qty-val {
      min-width: 28px; text-align: center;
      font-weight: 700; font-size: 14px; color: #111827;
    }
    .bfk-remove-btn {
      margin-left: 4px; background: none; border: none;
      color: #e11d48; font-size: 12px; font-weight: 600;
      cursor: pointer; padding: 4px 6px; border-radius: 4px;
      transition: background 0.15s; white-space: nowrap;
    }
    .bfk-remove-btn:hover { background: #fff0f2; }

    .bfk-drawer__foot {
      padding: 16px 20px; border-top: 2px solid #f3f4f6;
      background: #fafafa;
    }
    .bfk-drawer__total-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 14px;
    }
    .bfk-drawer__total-label { font-size: 14px; color: #6b7280; font-weight: 600; }
    .bfk-drawer__total-amount { font-size: 20px; font-weight: 800; color: #111827; }
    .bfk-drawer__note { font-size: 11px; color: #9ca3af; text-align: center; margin-bottom: 10px; }
    .bfk-drawer__checkout {
      display: block; width: 100%; padding: 14px;
      background: #1a6b3a; color: #fff;
      text-align: center; text-decoration: none;
      border-radius: 10px; font-size: 15px; font-weight: 800;
      letter-spacing: 0.5px; border: none; cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .bfk-drawer__checkout:hover { background: #155830; transform: translateY(-1px); }
    .bfk-drawer__continue {
      display: block; width: 100%; padding: 11px;
      background: none; border: 1px solid #e5e7eb; color: #374151;
      border-radius: 10px; font-size: 13px; font-weight: 600;
      cursor: pointer; margin-top: 8px; transition: background 0.15s;
      text-align: center;
    }
    .bfk-drawer__continue:hover { background: #f9fafb; }
  `;
  document.head.appendChild(s);
}

function _injectDrawerHTML() {
  if (document.getElementById('bfkCartOverlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'bfkCartOverlay';
  overlay.className = 'bfk-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="bfk-drawer" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div class="bfk-drawer__head">
        <h2 class="bfk-drawer__title">🛒 Your Cart</h2>
        <button class="bfk-drawer__close" id="bfkDrawerClose" aria-label="Close cart">✕</button>
      </div>
      <div class="bfk-drawer__body" id="bfkDrawerBody">
        <div class="bfk-drawer__loading">Loading your cart…</div>
      </div>
      <div class="bfk-drawer__foot" id="bfkDrawerFoot" style="display:none;">
        <div class="bfk-drawer__total-row">
          <span class="bfk-drawer__total-label">Total</span>
          <span class="bfk-drawer__total-amount" id="bfkDrawerTotal">R 0</span>
        </div>
        <p class="bfk-drawer__note">Incl. VAT · Free nationwide delivery</p>
        <a class="bfk-drawer__checkout" id="bfkDrawerCheckout" href="#">Proceed to Checkout</a>
        <button class="bfk-drawer__continue" onclick="closeCartDrawer()">Continue Shopping</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeCartDrawer(); });
  document.body.appendChild(overlay);
  document.getElementById('bfkDrawerClose').addEventListener('click', closeCartDrawer);
}

const _CART_QUERY = `{
  cart(id: CART_ID) {
    totalQuantity checkoutUrl
    cost { totalAmount { amount } }
    lines(first: 20) {
      edges { node {
        id quantity
        merchandise {
          ... on ProductVariant {
            title price { amount }
            product { title featuredImage { url altText } }
          }
        }
      }}
    }
  }
}`;

async function _fetchCart(cartId) {
  const res = await fetch(SHOPIFY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN },
    body: JSON.stringify({ query: _CART_QUERY.replace('CART_ID', JSON.stringify(cartId)) }),
  });
  const json = await res.json();
  return json?.data?.cart;
}

async function _cartLineUpdate(lineId, quantity) {
  const cartId = findShopifyCartId();
  if (!cartId) return;
  const body = document.getElementById('bfkDrawerBody');
  if (body) body.classList.add('updating');
  try {
    if (quantity <= 0) {
      await fetch(SHOPIFY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN },
        body: JSON.stringify({ query: `mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
          cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
            cart { totalQuantity } userErrors { message }
          }
        }`, variables: { cartId, lineIds: [lineId] } }),
      });
    } else {
      await fetch(SHOPIFY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN },
        body: JSON.stringify({ query: `mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
          cartLinesUpdate(cartId: $cartId, lines: $lines) {
            cart { totalQuantity } userErrors { message }
          }
        }`, variables: { cartId, lines: [{ id: lineId, quantity }] } }),
      });
    }
    await _loadDrawerItems();
  } catch (e) {
    console.error('[BafanaKit] Cart update failed:', e);
    if (body) body.classList.remove('updating');
  }
}

async function _loadDrawerItems() {
  const body = document.getElementById('bfkDrawerBody');
  const foot = document.getElementById('bfkDrawerFoot');
  if (!body) return;

  const isRefresh = body.classList.contains('updating');
  if (!isRefresh) {
    body.innerHTML = '<div class="bfk-drawer__loading">Loading your cart…</div>';
    if (foot) foot.style.display = 'none';
  }

  const cartId = findShopifyCartId();
  if (!cartId) {
    body.classList.remove('updating');
    body.innerHTML = `<div class="bfk-drawer__empty"><div class="bfk-drawer__empty-icon">🛒</div>Your cart is empty — go grab a kit! 🇿🇦</div>`;
    return;
  }

  try {
    const cart = await _fetchCart(cartId);

    if (!cart || cart.totalQuantity === 0) {
      body.classList.remove('updating');
      body.innerHTML = `<div class="bfk-drawer__empty"><div class="bfk-drawer__empty-icon">🛒</div>Your cart is empty — go grab a kit! 🇿🇦</div>`;
      if (foot) foot.style.display = 'none';
      updateCartBadge(0);
      return;
    }

    body.innerHTML = cart.lines.edges.map(({ node: line }) => {
      const m       = line.merchandise;
      const img     = m.product?.featuredImage?.url || '';
      const alt     = m.product?.featuredImage?.altText || m.product?.title || 'Jersey';
      const name    = m.product?.title || 'Bafana Bafana Jersey';
      const variant = (m.title && m.title !== 'Default Title') ? m.title : '';
      const unit    = parseFloat(m.price?.amount || 0);
      const lineTotal = (unit * line.quantity).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      return `
        <div class="bfk-item">
          <img class="bfk-item__img" src="${img}" alt="${alt}" loading="lazy">
          <div class="bfk-item__details">
            <p class="bfk-item__name">${name}</p>
            ${variant ? `<p class="bfk-item__variant">${variant}</p>` : ''}
            <p class="bfk-item__price">R ${lineTotal}</p>
            <div class="bfk-item__controls">
              <button class="bfk-qty-btn" data-action="dec" data-id="${line.id}" data-qty="${line.quantity}">−</button>
              <span class="bfk-qty-val">${line.quantity}</span>
              <button class="bfk-qty-btn" data-action="inc" data-id="${line.id}" data-qty="${line.quantity}">+</button>
              <button class="bfk-remove-btn" data-action="remove" data-id="${line.id}">Remove</button>
            </div>
          </div>
        </div>`;
    }).join('');

    // Event delegation for qty/remove buttons
    body.classList.remove('updating');
    body.onclick = e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id  = btn.dataset.id;
      const qty = parseInt(btn.dataset.qty || 1, 10);
      if (btn.dataset.action === 'inc')    _cartLineUpdate(id, qty + 1);
      if (btn.dataset.action === 'dec')    _cartLineUpdate(id, qty - 1);
      if (btn.dataset.action === 'remove') _cartLineUpdate(id, 0);
    };

    const totalAmt = parseFloat(cart.cost.totalAmount.amount)
      .toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const totalEl    = document.getElementById('bfkDrawerTotal');
    const checkoutEl = document.getElementById('bfkDrawerCheckout');
    if (totalEl)    totalEl.textContent = `R ${totalAmt}`;
    if (checkoutEl) checkoutEl.href = cart.checkoutUrl;

    updateCartBadge(cart.totalQuantity);
    if (foot) foot.style.display = 'block';

  } catch (e) {
    body.classList.remove('updating');
    body.innerHTML = `<div class="bfk-drawer__error">Could not load cart. Please try again.</div>`;
    console.error('[BafanaKit] Cart drawer load failed:', e);
  }
}

function goToCart() {
  _injectDrawerStyles();
  _injectDrawerHTML();
  const overlay = document.getElementById('bfkCartOverlay');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  _loadDrawerItems();
}

function closeCartDrawer() {
  const overlay = document.getElementById('bfkCartOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  localStorage.removeItem('bafanaCart');

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  if (hamburgerBtn && mobileDrawer) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileDrawer.setAttribute('aria-hidden', String(!isOpen));
    });
  }

  document.querySelectorAll('.navbar__link').forEach(link => {
    if (link.href === window.location.href) link.classList.add('active');
  });

  ['shopify-cart-updated','shopify-line-added','shopify-line-removed','shopify-line-updated','cart-updated'].forEach(name => {
    document.addEventListener(name, syncCartBadge);
    window.addEventListener(name, syncCartBadge);
  });

  syncCartBadge();
  setInterval(syncCartBadge, 4000);
});

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-enter');
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCartDrawer();
});

// ─── Legacy modal controls (kept for compatibility) ───
function showModal(title, item) {
  const modal = document.getElementById('cartModal');
  if (!modal) return;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('orderSummary').innerHTML = `
    <b>Jersey:</b> ${item.product}<br>
    <b>Name:</b>   ${item.name}<br>
    <b>Number:</b> #${item.number}<br>
    <b>Size:</b>   ${item.size}<br>
    <b>Price:</b>  R ${item.price.toLocaleString('en-ZA')}
  `;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('cartModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.addEventListener('click', e => {
  const modal = document.getElementById('cartModal');
  if (modal && e.target === modal) closeModal();
});
