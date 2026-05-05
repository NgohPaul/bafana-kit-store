/* ═══════════════════════════════════════════════
   BAFANA KIT — PRODUCT PAGE INTERACTIONS
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

// ─── Add to Cart (custom cart + Shopify cart) ───
function addToCart() {
  const nameInput = document.getElementById('nameInput');
  const name = nameInput ? nameInput.value.trim().toUpperCase() : 'No name';

  const item = {
    id:       Date.now(),
    product:  'Bafana Bafana Home Jersey 2025',
    name:     name || 'No name',
    number:   state.playerNumber,
    size:     state.playerSize,
    price:    1499,
    qty:      1,
    image:    './images/jersey-front.png',
  };

  // Save to custom local cart
  const cart = getCart();
  cart.push(item);
  saveCart(cart);

  // Also add to Shopify cart if available
  const shopifyCart = document.getElementById('shopify-cart');
  if (shopifyCart) {
    // Find the add-to-cart button inside the Shopify context and trigger it
    const shopifyAddBtn = document.getElementById('shopifyAddBtn');
    if (shopifyAddBtn) {
      shopifyAddBtn.click();
      return; // Shopify cart modal will open
    }
  }

  // Show custom modal
  showModal('Added to Cart!', item);
}

function buyNow() {
  const nameInput = document.getElementById('nameInput');
  const name = nameInput ? nameInput.value.trim().toUpperCase() : 'No name';

  const item = {
    id:      Date.now(),
    product: 'Bafana Bafana Home Jersey 2025',
    name,
    number:  state.playerNumber,
    size:    state.playerSize,
    price:   1499,
    qty:     1,
    image:   './images/jersey-front.png',
  };

  const cart = getCart();
  cart.push(item);
  saveCart(cart);

  // Try Shopify buyNow
  const shopifyStore = document.querySelector('shopify-store');
  const shopifyAddBtn = document.getElementById('shopifyAddBtn');
  if (shopifyStore && shopifyAddBtn) {
    // Use Shopify's native buyNow
    try {
      shopifyStore.buyNow(new Event('click'));
    } catch(e) {
      window.location.href = 'checkout.html';
    }
    return;
  }

  window.location.href = 'checkout.html';
}
