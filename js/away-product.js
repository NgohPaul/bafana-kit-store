/* ═══════════════════════════════════════════════
   BAFANA KIT — AWAY PRODUCT PAGE  (v7)
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

// ─── Resolve away jersey variant + product data ───
let _productCache = null;

async function _getProduct() {
  if (_productCache) return _productCache;

  const json = await _gql(`{
    products(first: 10) {
      edges { node {
        handle
        title
        featuredImage { url altText }
        variants(first: 1) { edges { node { id } } }
      }}
    }
  }`);

  for (const { node } of json?.data?.products?.edges || []) {
    if (node.handle.toLowerCase().includes('away')) {
      _productCache = {
        variantId: node.variants.edges[0]?.node?.id || null,
        title:     node.title || 'Bafana Bafana Away Jersey 2026',
        image:     node.featuredImage?.url || './images/away-jersey-front.png',
      };
      return _productCache;
    }
  }
  // Fallback with local image
  _productCache = {
    variantId: null,
    title: 'Bafana Bafana Away Jersey 2026',
    image: './images/away-jersey-front.png',
  };
  return _productCache;
}

// ─── Cart helpers ───
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
  const el = document.getElementById('shopify-cart');
  if (el) el.setAttribute('cart-id', id);
}

async function _addLine(cartId, merchandiseId) {
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

// ─── Cart Notification ───
let _notifTimer = null;

function showCartNotif(imgSrc, title) {
  const notif = document.getElementById('cartNotif');
  if (!notif) return;
  const img  = notif.querySelector('.cart-notif__img');
  const name = notif.querySelector('.cart-notif__name');
  if (img)  { img.src = imgSrc; img.alt = title; }
  if (name) name.textContent = title;

  const prog = notif.querySelector('.cart-notif__progress');
  if (prog) { prog.classList.remove('running'); void prog.offsetWidth; prog.classList.add('running'); }

  notif.classList.add('open');
  notif.setAttribute('aria-hidden', 'false');
  clearTimeout(_notifTimer);
  _notifTimer = setTimeout(closeCartNotif, 5000);
}

function closeCartNotif() {
  const notif = document.getElementById('cartNotif');
  if (!notif) return;
  notif.classList.remove('open');
  notif.setAttribute('aria-hidden', 'true');
  clearTimeout(_notifTimer);
}

// ─── Add to Cart ───
async function addToCart() {
  const addBtn = document.querySelector('.btn--primary');
  const origText = addBtn?.textContent;
  if (addBtn) { addBtn.disabled = true; addBtn.textContent = 'Adding…'; }

  try {
    const product = await _getProduct();
    if (!product?.variantId) throw new Error('Product variant not found');

    let cart;
    const existingId = _getStoredCartId();
    if (existingId) {
      try { cart = await _addLine(existingId, product.variantId); }
      catch (_) { cart = await _createCart(product.variantId); }
    } else {
      cart = await _createCart(product.variantId);
    }

    if (!cart) throw new Error('Cart operation returned no data');
    _storeCartId(cart.id);
    if (typeof updateCartBadge === 'function') updateCartBadge(cart.totalQuantity);

    showCartNotif(product.image, product.title);

  } catch (e) {
    console.error('[BafanaKit] Add to cart failed:', e.message);
    alert('Could not add to cart. Please try again.');
  } finally {
    if (addBtn) { addBtn.disabled = false; addBtn.textContent = origText; }
  }
}

// ─── Buy Now ───
async function buyNow() {
  const buyBtn = document.querySelector('.btn--secondary');
  const origText = buyBtn?.textContent;
  if (buyBtn) { buyBtn.disabled = true; buyBtn.textContent = 'Please wait…'; }

  try {
    const product = await _getProduct();
    if (!product?.variantId) throw new Error('Product variant not found');

    const cart = await _createCart(product.variantId);
    const checkoutUrl = cart?.checkoutUrl;
    if (!checkoutUrl) throw new Error('No checkout URL returned');

    window.location.href = checkoutUrl;
  } catch (e) {
    console.error('[BafanaKit] Buy now failed:', e.message);
    window.location.href = 'https://bafana-bafana-5.myshopify.com';
  } finally {
    if (buyBtn) { buyBtn.disabled = false; buyBtn.textContent = origText; }
  }
}
