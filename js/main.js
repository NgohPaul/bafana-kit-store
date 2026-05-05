const SHOPIFY_API = 'https://bafana-bafana-5.myshopify.com/api/2024-01/graphql.json';
const SHOPIFY_TOKEN = 'cdb151548aff66750a9460fdbe70d766';

// ─── Product Routing ───
function navigateToProduct(card) {
  const handle = (card.dataset.handle || '').toLowerCase();
  const titleEl = card.querySelector('.product-card__name');
  const title = (titleEl ? titleEl.textContent : '').trim().toLowerCase();
  if (handle.includes('away') || title.includes('away')) {
    window.location.href = 'away-product.html';
  } else {
    window.location.href = 'product.html';
  }
}

// ─── Cart Badge ───
function updateCartBadge(count) {
  const n = parseInt(count, 10) || 0;
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = n);
}

// Read count from a Shopify cart event detail object
function countFromDetail(detail) {
  if (!detail) return null;
  if (typeof detail.totalQuantity === 'number') return detail.totalQuantity;
  if (detail.cart && typeof detail.cart.totalQuantity === 'number') return detail.cart.totalQuantity;
  if (Array.isArray(detail.lines)) return detail.lines.reduce((s, l) => s + (l.quantity || 1), 0);
  if (detail.cart && Array.isArray(detail.cart.lines?.edges))
    return detail.cart.lines.edges.reduce((s, e) => s + (e.node?.quantity || 1), 0);
  return null;
}

// Fetch cart count from Shopify Storefront API using stored cart ID
async function fetchShopifyCartCount() {
  const cartId = localStorage.getItem('shopify_cart_id')
    || localStorage.getItem('shopify-cart-id')
    || document.getElementById('shopify-cart')?.getAttribute('cart-id');
  if (!cartId) return 0;
  try {
    const res = await fetch(SHOPIFY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query: `{ cart(id: ${JSON.stringify(cartId)}) { totalQuantity } }` }),
    });
    const data = await res.json();
    return data?.data?.cart?.totalQuantity ?? 0;
  } catch (e) {
    return 0;
  }
}

function syncCartBadge(evt) {
  // 1. Try event detail (fired by Shopify web components)
  if (evt?.detail) {
    const n = countFromDetail(evt.detail);
    if (n !== null) { updateCartBadge(n); return; }
  }

  // 2. Try shopify-cart element properties
  const shopifyCart = document.getElementById('shopify-cart');
  if (shopifyCart) {
    const n = shopifyCart.totalQuantity ?? shopifyCart.itemCount ?? shopifyCart.count;
    if (typeof n === 'number') { updateCartBadge(n); return; }
  }

  // 3. Async fallback: Shopify Storefront API
  fetchShopifyCartCount().then(updateCartBadge);
}

// ─── Navigate to cart ───
function goToCart() {
  const shopifyCart = document.getElementById('shopify-cart');
  if (shopifyCart && typeof shopifyCart.showModal === 'function') {
    shopifyCart.showModal();
  } else if (shopifyCart) {
    shopifyCart.setAttribute('open', '');
  }
}

// ─── Hamburger Toggle ───
document.addEventListener('DOMContentLoaded', () => {
  // Clear stale custom cart data so it never poisons the badge
  localStorage.removeItem('bafanaCart');

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  if (hamburgerBtn && mobileDrawer) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileDrawer.setAttribute('aria-hidden', !isOpen);
    });
  }

  // Highlight active nav link
  document.querySelectorAll('.navbar__link').forEach(link => {
    if (link.href === window.location.href) link.classList.add('active');
  });

  // Listen for Shopify cart events and pass the event so we can read detail
  const cartEvents = [
    'shopify-cart-updated',
    'shopify-line-added',
    'shopify-line-removed',
    'shopify-line-updated',
    'cart-updated',
  ];
  cartEvents.forEach(name => {
    document.addEventListener(name, syncCartBadge);
    window.addEventListener(name, syncCartBadge);
  });

  // Initial sync + poll every 3 seconds as safety net
  syncCartBadge();
  setInterval(syncCartBadge, 3000);
});

// ─── Modal Controls ───
function showModal(title, item) {
  const modal = document.getElementById('cartModal');
  if (!modal) return;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('orderSummary').innerHTML = `
    <b>Jersey:</b> ${item.product}<br>
    <b>Name:</b> ${item.name}<br>
    <b>Number:</b> #${item.number}<br>
    <b>Size:</b> ${item.size}<br>
    <b>Price:</b> R ${item.price.toLocaleString('en-ZA')}
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

// ─── Page enter animation ───
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-enter');
});
