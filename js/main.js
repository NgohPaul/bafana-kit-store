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

// Scan ALL localStorage keys for a Shopify cart GID (works regardless of key name)
function findShopifyCartId() {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const val = localStorage.getItem(key) || '';
    if (!val.includes('gid://shopify/Cart/')) continue;
    // Try parsed object first
    try {
      const obj = JSON.parse(val);
      const id = obj?.id || obj?.cartId || obj?.cart?.id;
      if (typeof id === 'string' && id.includes('gid://shopify/Cart/')) return id;
    } catch (_) {}
    // Raw string
    const match = val.match(/gid:\/\/shopify\/Cart\/[^"'\s,}]*/);
    if (match) return match[0];
  }
  return null;
}

async function fetchShopifyCartCount() {
  // Also check the shopify-cart element for a cart-id attribute
  const el = document.getElementById('shopify-cart');
  const cartId =
    el?.getAttribute('cart-id') ||
    el?.cartId ||
    findShopifyCartId();

  if (!cartId) return 0;

  try {
    const res = await fetch(SHOPIFY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({
        query: `{ cart(id: ${JSON.stringify(cartId)}) { totalQuantity } }`,
      }),
    });
    const json = await res.json();
    const count = json?.data?.cart?.totalQuantity;
    return typeof count === 'number' ? count : 0;
  } catch (_) {
    return 0;
  }
}

// Extract count from any shape of Shopify cart event detail
function countFromEventDetail(detail) {
  if (!detail) return null;
  if (typeof detail.totalQuantity === 'number') return detail.totalQuantity;
  if (typeof detail.count         === 'number') return detail.count;
  if (typeof detail.itemCount     === 'number') return detail.itemCount;
  const cart = detail.cart || detail.data?.cart;
  if (cart) {
    if (typeof cart.totalQuantity === 'number') return cart.totalQuantity;
    const edges = cart.lines?.edges;
    if (Array.isArray(edges))
      return edges.reduce((s, e) => s + (e.node?.quantity || 0), 0);
    if (Array.isArray(cart.lines))
      return cart.lines.reduce((s, l) => s + (l.quantity || 0), 0);
  }
  if (Array.isArray(detail.lines))
    return detail.lines.reduce((s, l) => s + (l.quantity || 0), 0);
  return null;
}

function syncCartBadge(evt) {
  // 1. Try event detail — fastest, most accurate
  if (evt?.detail) {
    const n = countFromEventDetail(evt.detail);
    if (n !== null) { updateCartBadge(n); return; }
  }
  // 2. Try shopify-cart element property
  const el = document.getElementById('shopify-cart');
  if (el) {
    const n = el.totalQuantity ?? el.itemCount ?? el.count;
    if (typeof n === 'number') { updateCartBadge(n); return; }
  }
  // 3. Async Storefront API fallback
  fetchShopifyCartCount().then(updateCartBadge);
}

// ─── Navigate to cart ───
function goToCart() {
  const cart = document.getElementById('shopify-cart');
  if (cart && typeof cart.showModal === 'function') {
    cart.showModal();
  } else if (cart) {
    cart.setAttribute('open', '');
  }
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', () => {
  // Wipe stale custom-cart data so it never interferes
  localStorage.removeItem('bafanaCart');

  // Hamburger menu
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  if (hamburgerBtn && mobileDrawer) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileDrawer.setAttribute('aria-hidden', String(!isOpen));
    });
  }

  // Active nav link
  document.querySelectorAll('.navbar__link').forEach(link => {
    if (link.href === window.location.href) link.classList.add('active');
  });

  // Listen for Shopify cart events
  [
    'shopify-cart-updated',
    'shopify-line-added',
    'shopify-line-removed',
    'shopify-line-updated',
    'cart-updated',
  ].forEach(name => {
    document.addEventListener(name, syncCartBadge);
    window.addEventListener(name, syncCartBadge);
  });

  // Observe shopify-cart element for ANY DOM/attribute change
  const cartEl = document.getElementById('shopify-cart');
  if (cartEl) {
    new MutationObserver(() => syncCartBadge())
      .observe(cartEl, { childList: true, subtree: true, attributes: true });
  }

  // Initial fetch + poll every 4 seconds
  syncCartBadge();
  setInterval(syncCartBadge, 4000);
});

// ─── Page enter animation ───
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-enter');
});

// ─── Modal Controls ───
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
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
