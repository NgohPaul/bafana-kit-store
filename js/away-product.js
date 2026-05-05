/* ═══════════════════════════════════════════════
   BAFANA KIT — AWAY PRODUCT PAGE INTERACTIONS
   ═══════════════════════════════════════════════ */

// ─── Tab Switching ───
function switchTab(btn, id) {
  document.querySelectorAll('.product-tabs__btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.product-tabs__panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  document.getElementById('tab-' + id).classList.add('active');
}

// ─── Find the hidden Shopify button for the away product ───
function getHiddenShopifyBtn(selector) {
  const items = document.querySelectorAll('[data-handle]');
  for (const item of items) {
    const handle = (item.dataset.handle || '').toLowerCase();
    if (handle && handle.includes('away')) {
      const btn = item.querySelector(selector);
      if (btn) return btn;
    }
  }
  return null;
}

// ─── Add to Cart ───
function addToCart() {
  const btn = getHiddenShopifyBtn('.hidden-shopify-add');
  if (btn) {
    btn.click();
    return;
  }
  const cart = document.getElementById('shopify-cart');
  if (cart) cart.showModal();
}

// ─── Buy Now ───
function buyNow() {
  const btn = getHiddenShopifyBtn('.hidden-shopify-buy');
  if (btn) {
    btn.click();
    return;
  }
  window.location.href = 'https://bafana-bafana-5.myshopify.com';
}
