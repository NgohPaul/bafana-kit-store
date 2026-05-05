/* ═══════════════════════════════════════════════
   BAFANA KIT — MAIN JS (Global Cart, Navbar, Utils)
   ═══════════════════════════════════════════════ */

// ─── Shopify Config ───
const SHOPIFY_DOMAIN = 'bafana-bafana-5.myshopify.com';
const SHOPIFY_TOKEN  = 'cdb151548aff66750a9460fdbe70d766';

// ─── Cart Badge (for custom cart counter) ───
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('bafanaCart') || '[]');
  const count = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = count);
}

// ─── Cart Persistence ───
function getCart() {
  return JSON.parse(localStorage.getItem('bafanaCart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('bafanaCart', JSON.stringify(cart));
  updateCartBadge();
}

// ─── Navigate to cart ───
function goToCart() {
  // Open the Shopify cart modal if present
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

  updateCartBadge();
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
