/* ═══════════════════════════════════════════════
   BAFANA KIT — HOME PRODUCT PAGE  (v6)
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

// ─── Storefront API ───
const _API   = 'https://bafana-bafana-5.myshopify.com/api/2024-01/graphql.json';
const _TOKEN = 'cdb151548aff66750a9460fdbe70d766';

async function _gql(query, variables) {
  const res = await fetch(_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': _TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error('Storefront API error: ' + res.status);
  return res.json();
}

// ─── Resolve home jersey variant ID ───
let _variantId = null;

async function _getVariantId() {
  if (_variantId) return _variantId;

  const json = await _gql(`{
    products(first: 10) {
      edges { node {
        handle
        variants(first: 1) { edges { node { id availableForSale } } }
      }}
    }
  }`);

  for (const { node } of json?.data?.products?.edges || []) {
    if (!node.handle.toLowerCase().includes('away')) {
      _variantId = node.variants.edges[0]?.node?.id || null;
      return _variantId;
    }
  }
  return null;
}

// ─── Cart ID helpers ───
function _getStoredCartId() {
  const el = document.getElementById('shopify-cart');
  if (el?.getAttribute('cart-id')) return el.getAttribute('cart-id');

  for (let i = 0; i < localStorage.length; i++) {
    const val = localStorage.getItem(localStorage.key(i)) || '';
    if (val.includes('gid://shopify/Cart/')) {
      const m = val.match(/gid:\/\/shopify\/Cart\/[^"'\s,}]*/);
      if (m) return m[0];
    }
  }
  return null;
}

function _storeCartId(id) {
  localStorage.setItem('shopify_cart_id', id);
  // Also set it on the shopify-cart element so it syncs its display
  const el = document.getElementById('shopify-cart');
  if (el) el.setAttribute('cart-id', id);
}

// ─── Add line to existing cart, return updated cart ───
async function _addLineToCart(cartId, merchandiseId) {
  const json = await _gql(`
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { id totalQuantity checkoutUrl }
        userErrors { message }
      }
    }
  `, { cartId, lines: [{ merchandiseId, quantity: 1 }] });

  const errs = json?.data?.cartLinesAdd?.userErrors;
  if (errs?.length) throw new Error(errs[0].message);
  return json?.data?.cartLinesAdd?.cart;
}

// ─── Create a new cart with one item, return cart ───
async function _createCart(merchandiseId) {
  const json = await _gql(`
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { id totalQuantity checkoutUrl }
        userErrors { message }
      }
    }
  `, { input: { lines: [{ merchandiseId, quantity: 1 }] } });

  const errs = json?.data?.cartCreate?.userErrors;
  if (errs?.length) throw new Error(errs[0].message);
  return json?.data?.cartCreate?.cart;
}

// ─── Add to Cart ───
async function addToCart() {
  const addBtn = document.querySelector('.btn--primary');
  const origText = addBtn?.textContent;
  if (addBtn) { addBtn.disabled = true; addBtn.textContent = 'Adding…'; }

  try {
    const variantId = await _getVariantId();
    if (!variantId) throw new Error('Product variant not found');

    let cart;
    const existingCartId = _getStoredCartId();
    if (existingCartId) {
      try {
        cart = await _addLineToCart(existingCartId, variantId);
      } catch (_) {
        // Cart may have expired — create a fresh one
        cart = await _createCart(variantId);
      }
    } else {
      cart = await _createCart(variantId);
    }

    if (!cart) throw new Error('Cart operation returned no data');
    _storeCartId(cart.id);
    if (typeof updateCartBadge === 'function') updateCartBadge(cart.totalQuantity);

    // Open the Shopify cart drawer
    const cartEl = document.getElementById('shopify-cart');
    if (cartEl?.showModal) cartEl.showModal();

  } catch (e) {
    console.error('[BafanaKit] Add to cart failed:', e.message);
    alert('Could not add to cart. Please try again.');
  } finally {
    if (addBtn) { addBtn.disabled = false; addBtn.textContent = origText; }
  }
}

// ─── Buy Now — goes directly to Shopify checkout ───
async function buyNow() {
  const buyBtn = document.querySelector('.btn--secondary');
  const origText = buyBtn?.textContent;
  if (buyBtn) { buyBtn.disabled = true; buyBtn.textContent = 'Please wait…'; }

  try {
    const variantId = await _getVariantId();
    if (!variantId) throw new Error('Product variant not found');

    // Always create a fresh single-item cart to get a clean checkout URL
    const cart = await _createCart(variantId);
    const checkoutUrl = cart?.checkoutUrl;
    if (!checkoutUrl) throw new Error('No checkout URL returned');

    window.location.href = checkoutUrl;

  } catch (e) {
    console.error('[BafanaKit] Buy now failed:', e.message);
    // Hard fallback to Shopify store
    window.location.href = 'https://bafana-bafana-5.myshopify.com';
  } finally {
    if (buyBtn) { buyBtn.disabled = false; buyBtn.textContent = origText; }
  }
}
