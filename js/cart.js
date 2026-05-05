/* ═══════════════════════════════════════════════
   BAFANA KIT — CART PAGE LOGIC
   ═══════════════════════════════════════════════ */

function renderCartPage() {
  const cart = getCart();
  const container = document.getElementById('cartItemsList');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<p class="cart-empty">Your cart is empty. <a href="collection.html">Continue shopping</a></p>';
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = 'R 0';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item__image">
        <img src="${item.image}" alt="${item.product}">
      </div>
      <div class="cart-item__details">
        <h3 class="cart-item__name">${item.product}</h3>
        <p class="cart-item__meta">Name: ${item.name} | #${item.number} | Size: ${item.size}</p>
        <div class="cart-item__qty-row">
          <button onclick="changeQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${item.id}, +1)">+</button>
          <button class="cart-item__remove" onclick="removeItem(${item.id})">Remove</button>
        </div>
      </div>
      <div class="cart-item__price">R ${(item.price * item.qty).toLocaleString('en-ZA')}</div>
    </div>
  `).join('');

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = `R ${total.toLocaleString('en-ZA')}`;
}

function changeQty(id, delta) {
  const cart = getCart().map(item => {
    if (item.id === id) item.qty = Math.max(1, item.qty + delta);
    return item;
  });
  saveCart(cart);
  renderCartPage();
}

function removeItem(id) {
  const cart = getCart().filter(item => item.id !== id);
  saveCart(cart);
  renderCartPage();
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cartItemsList')) {
    renderCartPage();
  }
});
