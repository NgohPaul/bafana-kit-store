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
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = count ?? '0');
}

function syncCartBadge() {
  // Try Shopify cart web component first
  const shopifyCart = document.getElementById('shopify-cart');
  if (shopifyCart && typeof shopifyCart.getLines === 'function') {
    try {
      const lines = shopifyCart.getLines() || [];
      const count = lines.reduce((sum, l) => sum + (l.quantity || 1), 0);
      updateCartBadge(count);
      return;
    } catch(e) { /* fall through to localStorage */ }
  }
  // Fallback: localStorage
  const cart = JSON.parse(localStorage.getItem('bafanaCart') || '[]');
  const count = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
  updateCartBadge(count);
}

// ─── Cart Persistence ───
function getCart() {
  return JSON.parse(localStorage.getItem('bafanaCart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('bafanaCart', JSON.stringify(cart));
  syncCartBadge();
}

// ─── Navigate to cart ───
function goToCart() {
  const shopifyCart = document.getElementById('shopify-cart');
  if (shopifyCart) {
    shopifyCart.showModal();
  } else {
    window.location.href = '/cart.html';
  }
}

// ─── Hamburger Toggle ───
document.addEventListener('DOMContentLoaded', () => {
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
    if (link.href === window.location.href) {
      link.classList.add('active');
    }
  });

  syncCartBadge();

  // Listen for Shopify cart web component events
  const events = [
    'shopify-cart-updated',
    'shopify-line-added',
    'shopify-line-removed',
    'shopify-line-updated',
    'cart-updated',
  ];
  events.forEach(evtName => {
    document.addEventListener(evtName, syncCartBadge);
    window.addEventListener(evtName, syncCartBadge);
  });

  // Also poll the Shopify cart every 2 seconds as a safety net
  setInterval(syncCartBadge, 2000);
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

// Close on backdrop click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('cartModal');
  if (modal && e.target === modal) closeModal();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ─── Page enter animation ───
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-enter');
});
