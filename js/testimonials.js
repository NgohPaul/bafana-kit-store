(function () {
  const TESTIMONIALS = [
    {
      text: "Absolutely love my Bafana Bafana jersey! The quality is top-tier and the custom name looks clean and professional. Definitely ordering again.",
      name: "Zanele P.", meta: "Soweto, Gauteng", stars: 5,
      img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "Fast delivery and perfect fit. The material feels premium and breathable. Proud to wear this on match days 🇿🇦",
      name: "Thabo R.", meta: "Port Elizabeth, Eastern Cape", stars: 5,
      img: "https://images.unsplash.com/photo-1520341280432-4749d4d7bcf9?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "The customization is what sold me. My name and number came out exactly how I wanted. Looks like an official kit!",
      name: "Kagiso M.", meta: "Bloemfontein, Free State", stars: 5,
      img: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "Great service and communication. The jersey arrived quicker than expected and looks even better in person.",
      name: "Nomsa V.", meta: "Polokwane, Limpopo", stars: 5,
      img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "Super happy with my purchase. The colors are vibrant and haven't faded after washing. Worth every rand.",
      name: "Bongani S.", meta: "Kimberley, Northern Cape", stars: 5,
      img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "Ordered for a friend and he loved it! The print quality is sharp and doesn't peel. Highly recommend.",
      name: "Mpho L.", meta: "Nelspruit, Mpumalanga", stars: 5,
      img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "Clean design, perfect sizing, and comfortable to wear. Easily one of my favorite football shirts.",
      name: "Siya T.", meta: "George, Western Cape", stars: 5,
      img: "https://images.unsplash.com/photo-1520341280432-4749d4d7bcf9?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "Customer support was helpful and the ordering process was smooth. Jersey fits perfectly and feels durable.",
      name: "Lindiwe G.", meta: "Pietermaritzburg, KwaZulu-Natal", stars: 5,
      img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "Feels like an official Bafana kit. The stitching and fabric quality are impressive for the price.",
      name: "Tshepo A.", meta: "Rustenburg, North West", stars: 5,
      img: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "I've bought jerseys before but this one stands out. Custom name looks amazing and delivery was on time. Will be back for more!",
      name: "Refiloe N.", meta: "East London, Eastern Cape", stars: 5,
      img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "Ordered the home jersey and it arrived in two days. The quality is unreal — feels exactly like what the boys wear on the pitch. Got my name and number printed on the back and I haven't taken it off since.",
      name: "Sipho M.", meta: "Johannesburg, Gauteng", stars: 5,
      img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "Bought the away green kit for my son's birthday. He absolutely loves it. The personalisation on the back came out perfectly sharp. Proper Adidas quality — worth every rand.",
      name: "Thandi K.", meta: "Cape Town, Western Cape", stars: 5,
      img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "Wore mine to the stadium and had three strangers ask me where I got it. The fit is spot on — athletic cut, breathable fabric. This is what supporting Bafana Bafana looks like.",
      name: "Lebo D.", meta: "Durban, KwaZulu-Natal", stars: 5,
      img: "https://images.unsplash.com/photo-1520341280432-4749d4d7bcf9?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "Absolutely stunning kit. I ordered three — one to wear, one to frame, one to keep sealed. The gold badge detail on the yellow is striking in person. Fast delivery, great packaging.",
      name: "Nkosi B.", meta: "Pretoria, Gauteng", stars: 5,
      img: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?w=120&h=120&fit=crop&crop=face&auto=format"
    },
    {
      text: "I was sceptical ordering online but the checkout was smooth and the jersey arrived exactly as shown. The green away kit looks even better in person. Very proud to rep South Africa.",
      name: "Ayanda N.", meta: "East London, Eastern Cape", stars: 5,
      img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face&auto=format"
    }
  ];

  let current = 0;
  let autoTimer = null;

  function animateWords(el, text) {
    el.innerHTML = '';
    text.split(' ').forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.textContent = word;
      span.style.animationDelay = (i * 0.045) + 's';
      el.appendChild(span);
      el.appendChild(document.createTextNode(' '));
    });
  }

  function buildCard(t, role) {
    const card = document.createElement('article');
    card.className = 'testim-card testim-card--' + role;
    card.innerHTML = `
      <div class="testim-card__quote-icon">"</div>
      <div class="testim-card__stars">${'★'.repeat(t.stars)}</div>
      <p class="testim-card__text"></p>
      <div class="testim-card__reviewer">
        <img class="testim-card__avatar" src="${t.img}" alt="${t.name}" loading="lazy">
        <div>
          <div class="testim-card__name">${t.name}</div>
          <div class="testim-card__meta">${t.meta}</div>
        </div>
      </div>
    `;
    if (role === 'active') {
      animateWords(card.querySelector('.testim-card__text'), t.text);
    } else {
      card.querySelector('.testim-card__text').textContent = t.text;
    }
    return card;
  }

  function render() {
    const carousel = document.getElementById('testimonialsCarousel');
    if (!carousel) return;
    carousel.innerHTML = '';

    const len = TESTIMONIALS.length;
    carousel.appendChild(buildCard(TESTIMONIALS[(current - 1 + len) % len], 'left'));
    carousel.appendChild(buildCard(TESTIMONIALS[current], 'active'));
    carousel.appendChild(buildCard(TESTIMONIALS[(current + 1) % len], 'right'));

    carousel.querySelector('.testim-card--left').addEventListener('click', () => go(-1));
    carousel.querySelector('.testim-card--right').addEventListener('click', () => go(1));

    const dotsEl = document.getElementById('testimDots');
    if (dotsEl) {
      dotsEl.innerHTML = '';
      TESTIMONIALS.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'testimonials-dot' + (i === current ? ' testimonials-dot--active' : '');
        dot.setAttribute('aria-label', 'Testimonial ' + (i + 1));
        dot.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(dot);
      });
    }
  }

  function goTo(idx) {
    current = (idx + TESTIMONIALS.length) % TESTIMONIALS.length;
    render();
    resetAuto();
  }

  function go(dir) { goTo(current + dir); }

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => go(1), 5000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    render();
    resetAuto();
    document.getElementById('testimPrev').addEventListener('click', () => go(-1));
    document.getElementById('testimNext').addEventListener('click', () => go(1));
  });
})();
