/* ═══════════════════════════════════════════════
   BAFANA KIT — SHOPIFY STOREFRONT CART ENGINE
   ═══════════════════════════════════════════════ */

const SF_DOMAIN = 'bafana-bafana-5.myshopify.com';
const SF_TOKEN  = 'cdb151548aff66750a9460fdbe70d766';
const SF_API    = `https://${SF_DOMAIN}/api/2024-01/graphql.json`;

const CART_ID_KEY = 'bafana_shopify_cart_id';

// ─── GraphQL helper ───
async function sfQuery(query, variables = {}) {
  const res = await fetch(SF_API, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SF_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) console.error('Shopify GQL errors:', json.errors);
  return json.data;
}

// ─── Create a new cart ───
async function createCart(lines = []) {
  const data = await sfQuery(`
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost { totalAmount { amount currencyCode } }
          lines(first: 50) {
            edges { node {
              id quantity
              merchandise { ... on ProductVariant { id title product { title } price { amount currencyCode } } }
            }}
          }
        }
        userErrors { field message }
      }
    }
  `, { input: { lines } });
  return data?.cartCreate?.cart;
}

// ─── Get existing cart ───
async function getShopifyCart(cartId) {
  const data = await sfQuery(`
    query getCart($id: ID!) {
      cart(id: $id) {
        id checkoutUrl totalQuantity
        cost { totalAmount { amount currencyCode } }
        lines(first: 50) {
          edges { node {
            id quantity
            merchandise { ... on ProductVariant {
              id title
              product { title }
              price { amount currencyCode }
              image { url altText }
            }}
          }}
        }
      }
    }
  `, { id: cartId });
  return data?.cart;
}

// ─── Add line items ───
async function cartAddLines(cartId, lines) {
  const data = await sfQuery(`
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id checkoutUrl totalQuantity
          cost { totalAmount { amount currencyCode } }
          lines(first: 50) {
            edges { node {
              id quantity
              merchandise { ... on ProductVariant {
                id title
                product { title }
                price { amount currencyCode }
                image { url altText }
              }}
            }}
          }
        }
        userErrors { field message }
      }
    }
  `, { cartId, lines });
  return data?.cartLinesAdd?.cart;
}

// ─── Remove line items ───
async function cartRemoveLines(cartId, lineIds) {
  const data = await sfQuery(`
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id checkoutUrl totalQuantity
          lines(first: 50) {
            edges { node {
              id quantity
              merchandise { ... on ProductVariant {
                id title product { title }
                price { amount currencyCode }
              }}
            }}
          }
        }
        userErrors { field message }
      }
    }
  `, { cartId, lineIds });
  return data?.cartLinesRemove?.cart;
}

// ─── Update line quantity ───
async function cartUpdateLines(cartId, lines) {
  const data = await sfQuery(`
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id checkoutUrl totalQuantity
          cost { totalAmount { amount currencyCode } }
          lines(first: 50) {
            edges { node {
              id quantity
              merchandise { ... on ProductVariant {
                id title product { title }
                price { amount currencyCode }
                image { url altText }
              }}
            }}
          }
        }
        userErrors { field message }
      }
    }
  `, { cartId, lines });
  return data?.cartLinesUpdate?.cart;
}

// ─── Get or create cart ───
async function getOrCreateCart() {
  const savedId = localStorage.getItem(CART_ID_KEY);
  if (savedId) {
    const cart = await getShopifyCart(savedId);
    if (cart) return cart;
  }
  const cart = await createCart();
  localStorage.setItem(CART_ID_KEY, cart.id);
  return cart;
}

// ─── PUBLIC: Add to cart and go to checkout ───
async function shopifyAddToCart(variantId, quantity = 1, attributes = []) {
  showCartLoading(true);
  try {
    let cart = await getOrCreateCart();
    cart = await cartAddLines(cart.id, [{ merchandiseId: variantId, quantity, attributes }]);
    localStorage.setItem(CART_ID_KEY, cart.id);
    updateCartBadge(cart.totalQuantity);
    renderCartDrawer(cart);
    showCartDrawer();
  } catch (e) {
    console.error('Add to cart error:', e);
    alert('Something went wrong. Please try again.');
  } finally {
    showCartLoading(false);
  }
}

// ─── PUBLIC: Buy Now — skip cart, go direct to checkout ───
async function shopifyBuyNow(variantId, quantity = 1, attributes = []) {
  showCartLoading(true);
  try {
    const cart = await createCart([{ merchandiseId: variantId, quantity, attributes }]);
    localStorage.setItem(CART_ID_KEY, cart.id);
    updateCartBadge(cart.totalQuantity);
    window.location.href = cart.checkoutUrl;
  } catch (e) {
    console.error('Buy now error:', e);
    alert('Something went wrong. Please try again.');
  } finally {
    showCartLoading(false);
  }
}

// ─── PUBLIC: Remove a line item ───
async function shopifyRemoveLine(lineId) {
  const cartId = localStorage.getItem(CART_ID_KEY);
  if (!cartId) return;
  showCartLoading(true);
  try {
    const cart = await cartRemoveLines(cartId, [lineId]);
    updateCartBadge(cart.totalQuantity);
    renderCartDrawer(cart);
  } catch (e) {
    console.error('Remove line error:', e);
  } finally {
    showCartLoading(false);
  }
}

// ─── PUBLIC: Update line quantity ───
async function shopifyUpdateQty(lineId, quantity) {
  const cartId = localStorage.getItem(CART_ID_KEY);
  if (!cartId) return;
  if (quantity <= 0) { shopifyRemoveLine(lineId); return; }
  showCartLoading(true);
  try {
    const cart = await cartUpdateLines(cartId, [{ id: lineId, quantity }]);
    updateCartBadge(cart.totalQuantity);
    renderCartDrawer(cart);
  } catch (e) {
    console.error('Update qty error:', e);
  } finally {
    showCartLoading(false);
  }
}

// ─── PUBLIC: Open cart and refresh ───
async function openCart() {
  const cart = await getOrCreateCart();
  updateCartBadge(cart.totalQuantity);
  renderCartDrawer(cart);
  showCartDrawer();
}

// ─── Update nav cart count badge ───
function updateCartBadge(count) {
  document.querySelectorAll('#cartCount').forEach(el => {
    el.textContent = count || 0;
  });
}

// ─── Show/hide loading state ───
function showCartLoading(on) {
  const btn = document.getElementById('addToCartBtn');
  const buy = document.getElementById('buyNowBtn');
  if (btn) { btn.disabled = on; btn.textContent = on ? 'Adding...' : btn.dataset.label; }
  if (buy) { buy.disabled = on; }
}

// ─── Cart Drawer DOM ───
function showCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartDrawer(cart) {
  const body = document.getElementById('cartDrawerBody');
  const footer = document.getElementById('cartDrawerFooter');
  if (!body) return;

  const lines = cart?.lines?.edges || [];

  if (lines.length === 0) {
    body.innerHTML = `
      <div class="cart-drawer__empty">
        <div class="cart-drawer__empty-icon">🛒</div>
        <p>Your cart is empty</p>
        <a href="collection.html" onclick="closeCartDrawer()">Browse Kits →</a>
      </div>`;
    if (footer) footer.innerHTML = '';
    return;
  }

  body.innerHTML = lines.map(({ node }) => {
    const v = node.merchandise;
    const price = parseFloat(v.price.amount);
    const total = (price * node.quantity).toFixed(2);
    const img = v.image?.url || './images/jersey-front.png';
    return `
    <div class="cart-drawer__item" data-line-id="${node.id}">
      <div class="cart-drawer__item-img">
        <img src="${img}" alt="${v.product.title}">
      </div>
      <div class="cart-drawer__item-info">
        <p class="cart-drawer__item-name">${v.product.title}</p>
        <p class="cart-drawer__item-variant">${v.title !== 'Default Title' ? v.title : ''}</p>
        <div class="cart-drawer__item-row">
          <div class="cart-drawer__qty">
            <button onclick="shopifyUpdateQty('${node.id}', ${node.quantity - 1})">−</button>
            <span>${node.quantity}</span>
            <button onclick="shopifyUpdateQty('${node.id}', ${node.quantity + 1})">+</button>
          </div>
          <span class="cart-drawer__item-price">ZAR ${total}</span>
        </div>
        <button class="cart-drawer__remove" onclick="shopifyRemoveLine('${node.id}')">Remove</button>
      </div>
    </div>`;
  }).join('');

  const totalAmt = parseFloat(cart.cost?.totalAmount?.amount || 0).toFixed(2);
  const currency = cart.cost?.totalAmount?.currencyCode || 'ZAR';

  if (footer) {
    footer.innerHTML = `
      <div class="cart-drawer__subtotal">
        <span>Subtotal</span>
        <span>${currency} ${totalAmt}</span>
      </div>
      <p class="cart-drawer__note">Shipping & taxes calculated at checkout</p>
      <a href="${cart.checkoutUrl}" class="btn btn--primary cart-drawer__checkout-btn" target="_blank">
        Checkout — ${currency} ${totalAmt}
      </a>
      <button class="btn btn--secondary" onclick="closeCartDrawer()" style="margin-top:10px;">Continue Shopping</button>
    `;
  }
}

// ─── Init: load cart count on every page ───
document.addEventListener('DOMContentLoaded', async () => {
  const cartId = localStorage.getItem(CART_ID_KEY);
  if (cartId) {
    try {
      const cart = await getShopifyCart(cartId);
      if (cart) updateCartBadge(cart.totalQuantity);
    } catch(e) {}
  }
});
