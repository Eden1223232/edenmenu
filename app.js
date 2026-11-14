const menuGrid = document.querySelector("#menuGrid");
const currentShiftSection = document.querySelector("#currentShiftSection");
const currentShiftGrid = document.querySelector("#currentShiftGrid");
const newArrivalsSection = document.querySelector("#newArrivals");
const newArrivalsTrack = document.querySelector("#newArrivalsTrack");
const newArrivalsDots = document.querySelector("#newArrivalsDots");
const newArrivalsStatus = document.querySelector("#newArrivalsStatus");
const filters = document.querySelector("#filters");
const menuSearch = document.querySelector("#menuSearch");
const cartDialog = document.querySelector("#cartDialog");
const cartItemsElement = document.querySelector("#cartItems");
const cartEmptyElement = document.querySelector("#cartEmpty");
const cartTotalElement = document.querySelector("#cartTotal");
const cartCountElements = document.querySelectorAll("[data-cart-count]");
const headerCartButton = document.querySelector("#headerCartButton");
const floatingCartButton = document.querySelector("#floatingCartButton");
const checkoutForm = document.querySelector("#checkoutForm");
const checkoutSubmit = document.querySelector("#checkoutSubmit");
const orderStatus = document.querySelector("#orderStatus");
const accountButton = document.querySelector("#accountButton");
const accountDialog = document.querySelector("#accountDialog");
const accountForm = document.querySelector("#accountForm");
const accountGuest = document.querySelector("#accountGuest");
const accountSignedIn = document.querySelector("#accountSignedIn");
const accountNameField = document.querySelector("#accountNameField");
const accountSubmit = document.querySelector("#accountSubmit");
const accountStatus = document.querySelector("#accountStatus");
const accountOrdersStatus = document.querySelector("#accountOrdersStatus");
const currentOrdersElement = document.querySelector("#customerCurrentOrders");
const historyOrdersElement = document.querySelector("#customerOrderHistory");
const checkoutCustomerName = document.querySelector("#checkoutCustomerName");
const checkoutCustomerPhone = document.querySelector("#checkoutCustomerPhone");
const deliveryFields = document.querySelector("#deliveryFields");
const orderToast = document.querySelector("#orderToast");
const defaultCategoryId = "seti";
const productDialog = document.querySelector("#productDialog");
const productDetail = document.querySelector("#productDetail");
let selectedProductId = null;
const cartStorageKey = "edenfood-cart-v1";
const pendingStorageKey = "edenfood-pending-order-v1";
const apiBase = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:3000"
  : "https://app.edenfood.xyz";

const menuCategories = [...window.EDEN_MENU];

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const parsePriceKopecks = (value) => {
  const match = String(value || "").match(/(?:^|\s|\+)(\d+(?:[.,]\d+)?)\s*руб/i);
  if (!match) return null;
  return Math.round(Number(match[1].replace(",", ".")) * 100);
};

const formatPrice = (kopecks) => {
  const rubles = kopecks / 100;
  return `${Number.isInteger(rubles) ? rubles : rubles.toFixed(2).replace(".", ",")} руб`;
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

let currentShiftSignature = "";
async function refreshCurrentShifts() {
  if (!currentShiftSection || !currentShiftGrid) return;
  try {
    const response = await fetchWithTimeout(
      `${apiBase}/api/public-shifts`,
      { method: "GET", cache: "no-store", credentials: "omit", headers: { Accept: "application/json" } },
      5000,
    );
    if (!response.ok) return;
    const payload = await response.json();
    const shifts = Array.isArray(payload?.shifts) ? payload.shifts : [];
    const signature = JSON.stringify(shifts);
    if (signature === currentShiftSignature) return;
    currentShiftSignature = signature;
    if (!shifts.length) {
      currentShiftGrid.replaceChildren();
      currentShiftSection.hidden = true;
      return;
    }

    currentShiftGrid.innerHTML = shifts.map((shift) => {
      const name = String(shift?.name || "Команда EDEN");
      const title = String(shift?.title || "Команда EDEN");
      const photoUrl = /^https:\/\/edenfood\.xyz\/assets\/team\/(?:victor|anya)-shift\.webp$/.test(String(shift?.photoUrl || ""))
        ? shift.photoUrl
        : "";
      const initial = Array.from(name.trim())[0] || "E";
      return `<button class="shift-person" type="button" aria-label="Порадовать анимацией: ${escapeHtml(name)}, ${escapeHtml(title)}" aria-pressed="false">
        <div class="shift-person-photo">
          <span class="shift-person-initial" ${photoUrl ? "hidden" : ""} aria-hidden="true">${escapeHtml(initial)}</span>
          ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(name)}" loading="lazy" decoding="async">` : ""}
          <span class="shift-person-live-dot" aria-label="На смене" title="Сейчас на смене"></span>
        </div>
        <div class="shift-person-copy"><small>СЕЙЧАС НА СМЕНЕ</small><strong>${escapeHtml(name)}</strong><span>${escapeHtml(title)}</span></div>
        <span class="shift-person-burst" aria-hidden="true" hidden><i>✦</i><i>✧</i><i>✦</i><i>✷</i><i>✧</i><i>✦</i></span>
      </button>`;
    }).join("");
    currentShiftGrid.querySelectorAll(".shift-person-photo img").forEach((image) => {
      image.addEventListener("error", () => {
        image.remove();
        const fallback = image.parentElement?.querySelector(".shift-person-initial");
        if (fallback) fallback.hidden = false;
      }, { once: true });
    });
    currentShiftSection.hidden = false;
  } catch {
    // Keep the last known shift display during a temporary network interruption.
  }
}

const normalizedName = (value) =>
  String(value || "")
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replaceAll("ё", "е")
    .replace(/\s+/g, " ");

menuCategories.forEach((category) => {
  category.items.forEach((item, index) => {
    item.catalogId ||= `edenfood-${category.id}-${String(index + 1).padStart(3, "0")}`;
    item.priceKopecks = parsePriceKopecks(item.price);
    item.available = item.sellable !== false && item.priceKopecks !== null;
  });
});

const snackImages = new Map([
  ["Картошка фри", "assets/snacks/fries.webp"],
  ["Палочки моцарелла", "assets/snacks/cheese-sticks.webp"],
  ["Нагетсы", "assets/snacks/nuggets.webp"],
  ["Картофельные шарики", "assets/snacks/potato-balls.webp"],
]);

const stableItemSort = (category, rankItem) => {
  const originalIndex = new Map(category.items.map((item, index) => [item, index]));
  category.items.sort(
    (left, right) =>
      rankItem(left) - rankItem(right) ||
      originalIndex.get(left) - originalIndex.get(right),
  );
};

const garnishes = menuCategories.find((category) => category.id === "garnishes");
if (garnishes) {
  const garnishOrder = new Map([
    ["Картошка фри", 0],
    ["Палочки моцарелла", 1],
    ["Нагетсы", 2],
    ["Картофельные шарики", 3],
  ]);
  garnishes.items.forEach((item) => {
    item.offerSnackSauces = true;
    const image = snackImages.get(item.name);
    if (image) {
      item.image = image;
      item.imageFit = "cover";
    }
  });
  stableItemSort(garnishes, (item) => garnishOrder.get(item.name) ?? 100);
}

const desserts = menuCategories.find((category) => category.id === "desserts");
if (desserts) {
  stableItemSort(desserts, (item) => {
    if (item.name.startsWith("Пончик")) return 0;
    if (item.name.startsWith("Чизкейк")) return 1;
    return 2;
  });
}

const featuredCategoryOrder = [
  "street_rolls",
  "seti",
  "urumaki",
  "roll_vtemp",
  "desserts",
  "garnishes",
  "soups",
  "miniroll",
  "cold_drinks",
  "coffee",
  "tea",
  "drink_addons",
  "products",
];
const categoryRank = new Map(
  featuredCategoryOrder.map((categoryId, index) => [categoryId, index]),
);
const originalCategoryIndex = new Map(
  menuCategories.map((category, index) => [category, index]),
);
menuCategories.sort(
  (left, right) =>
    (categoryRank.get(left.id) ?? 100) - (categoryRank.get(right.id) ?? 100) ||
    originalCategoryIndex.get(left) - originalCategoryIndex.get(right),
);

const catalogById = new Map(
  menuCategories.flatMap((category) =>
    category.items.map((item) => [item.catalogId, item]),
  ),
);
const snackSauceItems = (menuCategories.find((category) => category.id === "sauces")?.items || [])
  .filter((item) => item.isSnackSauce);
let currentNewArrival = 0;
let newArrivalsPaused = false;
let newArrivalsHovering = false;
let newArrivalsFocused = false;
let newArrivalsTimer = 0;
let newArrivalItems = [];

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(cartStorageKey) || "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
    return Object.fromEntries(
      Object.entries(stored)
        .map(([id, quantity]) => [id, Math.min(20, Math.max(0, Math.floor(Number(quantity))))])
        .filter(([id, quantity]) => catalogById.has(id) && quantity > 0),
    );
  } catch {
    return {};
  }
}

let cart = readCart();
let activeCategoryId = menuCategories.some(
  (category) => category.id === defaultCategoryId,
)
  ? defaultCategoryId
  : "all";
let searchQuery = "";
let submitting = false;
let toastTimer = 0;
let customer = null;
let customerOrders = [];
let accountMode = "login";

function cartLines() {
  return Object.entries(cart)
    .map(([id, quantity]) => ({ item: catalogById.get(id), quantity }))
    .filter((line) => line.item && line.item.available)
    .sort((left, right) => left.item.name.localeCompare(right.item.name, "ru"));
}

function cartSummary() {
  return cartLines().reduce(
    (summary, line) => ({
      count: summary.count + line.quantity,
      totalKopecks:
        summary.totalKopecks + line.item.priceKopecks * line.quantity,
    }),
    { count: 0, totalKopecks: 0 },
  );
}

function persistCart() {
  try {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  } catch {
    /* The cart still works for the current page when storage is unavailable. */
  }
}

function quantityControlMarkup(item, compact = false) {
  if (item.enquiryOnly) {
    return `<a class="product-enquiry" href="https://t.me/edenfood?text=${encodeURIComponent(`Здравствуйте! Хочу заказать ${item.name}. Подскажите цену.`)}" target="_blank" rel="noreferrer">Уточнить и заказать ↗</a>`;
  }
  if (!item.available)
    return '<span class="unavailable-label">Временно недоступно</span>';
  const quantity = cart[item.catalogId] || 0;
  const id = escapeHtml(item.catalogId);
  if (!quantity)
    return `
      <button class="add-to-cart ${compact ? "add-to-cart--compact" : ""}" type="button"
        data-cart-action="increase" data-item-id="${id}"
        aria-label="Добавить ${escapeHtml(item.name)} в корзину">
        <span aria-hidden="true">+</span><strong>Добавить</strong>
      </button>`;
  return `
    <div class="quantity-control ${compact ? "quantity-control--compact" : ""}" aria-label="Количество ${escapeHtml(item.name)}">
      <button type="button" data-cart-action="decrease" data-item-id="${id}" aria-label="Уменьшить количество">−</button>
      <strong>${quantity}</strong>
      <button type="button" data-cart-action="increase" data-item-id="${id}" aria-label="Увеличить количество">+</button>
    </div>`;
}

function makeButton(category, active) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = category.label;
  button.dataset.category = category.id;
  button.className = active ? "active" : "";
  button.setAttribute("aria-pressed", String(active));
  return button;
}

function itemCard(item) {
  const article = document.createElement("article");
  article.className = "menu-item";
  article.dataset.catalogId = item.catalogId;
  const imageClass =
    item.imageFit === "cover"
      ? "item-image item-image--cover"
      : item.imageFit === "contain"
        ? "item-image item-image--contain"
        : "item-image";
  const imageMarkup = item.image
    ? `<img class="${imageClass}" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">`
    : `<div class="item-image item-image-placeholder" aria-hidden="true"><span>${escapeHtml(item.name)}</span></div>`;
  const newBadge = item.isNew ? '<span class="item-new-badge">Новинка!</span>' : "";
  article.innerHTML = `
    <button class="product-image-button" type="button" data-product-id="${escapeHtml(item.catalogId)}" aria-label="Фото и состав: ${escapeHtml(item.name)}">${imageMarkup}${newBadge}<span class="image-expand" aria-hidden="true">↗</span></button>
    <div class="item-body">
      <div class="item-top">
        <h4><button class="product-name-button" type="button" data-product-id="${escapeHtml(item.catalogId)}">${escapeHtml(item.name)}</button></h4>
        <span class="price-stack">
          ${item.originalPriceKopecks ? `<span class="sale-badge">Акция</span><s class="old-price">${escapeHtml(formatPrice(item.originalPriceKopecks))}</s>` : ""}
          <span class="price">${escapeHtml(item.price)}</span>
        </span>
      </div>
      <p class="item-desc">${escapeHtml(item.description || "Состав уточните у администратора.")}</p>
      ${item.meta ? `<div class="item-meta"><span>${escapeHtml(item.meta)}</span></div>` : ""}
      <div class="item-purchase">${quantityControlMarkup(item)}</div>
    </div>
  `;
  const image = article.querySelector("img");
  image?.addEventListener(
    "error",
    () => {
      const placeholder = document.createElement("div");
      placeholder.className = "item-image item-image-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.innerHTML = `<span>${escapeHtml(item.name)}</span>`;
      image.replaceWith(placeholder);
    },
    { once: true },
  );
  return article;
}

function textMenu(category, items) {
  const menu = document.createElement("div");
  menu.className = "text-menu";

  (category.groups || []).forEach((group) => {
    const groupItems = items.filter((item) => item.group === group.id);
    if (!groupItems.length) return;
    const section = document.createElement("section");
    section.className = "text-menu-group";
    section.innerHTML = `<h4 class="text-menu-group-title">${escapeHtml(group.label)}</h4>`;
    const list = document.createElement("div");
    list.className = "text-menu-list";

    groupItems.forEach((item) => {
      const row = document.createElement("article");
      row.className = "text-menu-item";
      row.dataset.catalogId = item.catalogId;
      row.innerHTML = `
        <h5 class="text-menu-name">
          ${escapeHtml(item.name)}
          ${item.meta ? `<small>${escapeHtml(item.meta)}</small>` : ""}
        </h5>
        <span class="text-menu-leader" aria-hidden="true"></span>
        <div class="text-menu-purchase">
          <span class="price">${escapeHtml(item.price)}</span>
          ${quantityControlMarkup(item, true)}
        </div>`;
      list.append(row);
    });
    section.append(list);
    menu.append(section);
  });
  return menu;
}

function renderMenu() {
  menuGrid.innerHTML = "";
  filters.querySelectorAll("button").forEach((button) => {
    const selected = button.dataset.category === (searchQuery ? "all" : activeCategoryId);
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const searchStatus = document.querySelector("#menuSearchStatus");
  document.querySelector("#clearMenuSearch").hidden = !searchQuery;
  if (searchQuery) {
    const results = window.EdenMenuSearch.search(menuCategories, searchQuery);
    document.querySelector("#menuTitle").textContent = "Нашли для вас";
    searchStatus.textContent = `Найдено: ${results.length} · Поиск по всему меню, независимо от раздела`;
    results.forEach(({item, category}) => {
      const card = itemCard(item);
      const label = document.createElement("span");
      label.className = "search-category-label";
      label.textContent = category.label;
      card.querySelector(".item-body").prepend(label);
      menuGrid.append(card);
    });
    if (!results.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Ничего не нашли. Попробуйте часть названия или ингредиент: «фила», «лосось», «креветка».";
      menuGrid.append(empty);
    }
    return;
  }
  searchStatus.textContent = "Ищем во всех разделах. Можно написать «фила», Philadelphia или название с опечаткой.";
  const categories =
    activeCategoryId === "all"
      ? menuCategories
      : menuCategories.filter((category) => category.id === activeCategoryId);
  let renderedCount = 0;
  const currentCategory = menuCategories.find((category) => category.id === activeCategoryId);
  document.querySelector("#menuTitle").textContent = searchQuery ? "Нашли для вас" : currentCategory?.label || "Всё меню EDEN";
  categories.forEach((category) => {
    const items = category.items;
    if (!items.length) return;
    const title = document.createElement("div");
    title.className = "category-title";
    title.id = category.id;
    title.innerHTML = `<span>${String(items.length).padStart(2, "0")}</span><h3>${escapeHtml(category.label)}</h3>`;
    if (category.description) title.insertAdjacentHTML("beforeend", `<p class="category-description">${escapeHtml(category.description)}</p>`);
    const featuredItems =
      category.layout === "text-list"
        ? items.filter((item) => item.display === "card")
        : [];
    const listedItems =
      category.layout === "text-list"
        ? items.filter((item) => item.display !== "card")
        : [];
    const content =
      category.layout === "text-list"
        ? [
            ...featuredItems.map(itemCard),
            ...(listedItems.length ? [textMenu(category, listedItems)] : []),
          ]
        : items.map(itemCard);
    menuGrid.append(title, ...content);
    renderedCount += items.length;
  });
  if (!renderedCount) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "По этому запросу ничего не найдено.";
    menuGrid.append(empty);
  }
}

function updateCartIndicators() {
  const summary = cartSummary();
  cartCountElements.forEach((element) => {
    element.textContent = String(summary.count);
  });
  document.querySelectorAll("[data-cart-total]").forEach((element) => {
    element.textContent = formatPrice(summary.totalKopecks);
  });
  headerCartButton?.classList.toggle("has-items", summary.count > 0);
  floatingCartButton?.classList.toggle("has-items", summary.count > 0);
  if (checkoutSubmit) checkoutSubmit.disabled = !summary.count || submitting;
}

function renderCart() {
  const lines = cartLines();
  const availableSnackSauces = snackSauceItems.filter((item) => item.available);
  const lineItemsMarkup = lines
    .map(
      ({ item, quantity }) => `
        <article class="cart-line">
          <div class="cart-line-copy">
            <strong>${escapeHtml(item.name)}</strong>
            <small>${escapeHtml(item.meta || "")} ${item.meta ? "·" : ""} ${escapeHtml(formatPrice(item.priceKopecks))}</small>
          </div>
          ${quantityControlMarkup(item, true)}
          <b>${escapeHtml(formatPrice(item.priceKopecks * quantity))}</b>
        </article>`,
    )
    .join("");
  const sauceAddonsMarkup =
    lines.some(({ item }) => item.offerSnackSauces) && availableSnackSauces.length
      ? `
        <section class="cart-sauce-addons" aria-label="Соусы к гарнирам и закускам">
          <div class="cart-sauce-heading">
            <strong>Добавить соус к закуске?</strong>
            <span>По желанию · порция 30 г</span>
          </div>
          <div class="cart-sauce-options">
            ${availableSnackSauces
              .map((item) => {
                const quantity = cart[item.catalogId] || 0;
                return `
                  <button class="cart-sauce-option" type="button"
                    data-cart-action="increase" data-item-id="${escapeHtml(item.catalogId)}"
                    aria-label="Добавить ${escapeHtml(item.name)} за ${escapeHtml(formatPrice(item.priceKopecks))}">
                    <span>${escapeHtml(item.name)}${quantity ? `<small>В корзине: ${quantity}</small>` : ""}</span>
                    <b>+${escapeHtml(formatPrice(item.priceKopecks))}</b>
                  </button>`;
              })
              .join("")}
          </div>
        </section>`
      : "";
  cartItemsElement.innerHTML = `${lineItemsMarkup}${sauceAddonsMarkup}`;
  cartEmptyElement.hidden = Boolean(lines.length);
  cartItemsElement.hidden = !lines.length;
  const summary = cartSummary();
  cartTotalElement.textContent = formatPrice(summary.totalKopecks);
  updateCartIndicators();
}

function changeQuantity(id, delta) {
  const item = catalogById.get(id);
  if (!item?.available) return;
  const next = Math.min(20, Math.max(0, (cart[id] || 0) + delta));
  if (next) cart[id] = next;
  else delete cart[id];
  persistCart();
  renderMenu();
  renderNewArrivals();
  renderCart();
  if (productDialog?.open) renderProductDetail();
}

function handleCartAction(event) {
  const button = event.target.closest("button[data-cart-action]");
  if (!button) return;
  changeQuantity(
    button.dataset.itemId,
    button.dataset.cartAction === "increase" ? 1 : -1,
  );
}

function renderFilters() {
  const all = { id: "all", label: "Все меню" };
  const filterCategories = [all, ...menuCategories];
  filters.replaceChildren(
    ...filterCategories.map((category) =>
      makeButton(category, category.id === activeCategoryId),
    ),
  );
}

function selectCategory(button) {
  activateCategory(button.dataset.category);
}

function activateCategory(id, scroll = true) {
  if (id !== "all" && !menuCategories.some((category) => category.id === id)) return;
  filters.querySelectorAll("button").forEach((item) => {
    const active = item.dataset.category === id;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  activeCategoryId = id;
  searchQuery = "";
  menuSearch.value = "";
  renderMenu();
  document.querySelectorAll("[data-select-category]").forEach((item) => item.classList.toggle("is-selected", item.dataset.selectCategory === id));
  if (scroll) requestAnimationFrame(() => document.querySelector("#menu").scrollIntoView({ behavior: "smooth", block: "start" }));
}

function renderCategoryTiles() {
  const tiles = document.querySelector("#categoryTiles");
  tiles.innerHTML = menuCategories.map((category, index) => {
    const photo = category.items.find((item) => item.image)?.image;
    return `<a class="category-tile ${index >= 8 ? "category-tile--extra" : ""}" href="#menu" data-select-category="${escapeHtml(category.id)}">
      ${photo ? `<img src="${escapeHtml(photo)}" alt="" loading="lazy" decoding="async">` : '<span class="category-wordmark" aria-hidden="true">EDEN</span>'}
      <span class="category-tile-copy"><strong>${escapeHtml(category.label)}</strong><small>${category.items.length} позиций <span aria-hidden="true">↗</span></small></span>
      ${category.id === "street_rolls" ? '<span class="new-tag">НОВИНКА</span>' : ''}</a>`;
  }).join("");
  tiles.querySelectorAll("img").forEach((image) => image.addEventListener("error", () => image.remove(), { once: true }));
}

function reducedMotionRequested() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || false;
}

function stopNewArrivalsTimer() {
  window.clearInterval(newArrivalsTimer);
  newArrivalsTimer = 0;
}

function updateNewArrivalsTimer() {
  stopNewArrivalsTimer();
  if (
    newArrivalItems.length < 2 ||
    newArrivalsPaused ||
    newArrivalsHovering ||
    newArrivalsFocused ||
    document.hidden ||
    reducedMotionRequested()
  ) return;
  newArrivalsTimer = window.setInterval(() => {
    setNewArrival(currentNewArrival + 1);
  }, 5600);
}

function setNewArrival(index, announce = false) {
  if (!newArrivalItems.length) return;
  currentNewArrival = (index + newArrivalItems.length) % newArrivalItems.length;
  newArrivalsTrack.style.transform = `translateX(-${currentNewArrival * 100}%)`;
  newArrivalsTrack.querySelectorAll(".new-arrival-slide").forEach((slide, slideIndex) => {
    const active = slideIndex === currentNewArrival;
    slide.setAttribute("aria-hidden", String(!active));
    slide.inert = !active;
  });
  newArrivalsDots.querySelectorAll("button").forEach((dot, dotIndex) => {
    const active = dotIndex === currentNewArrival;
    dot.classList.toggle("is-active", active);
    dot.setAttribute("aria-current", active ? "true" : "false");
  });
  if (announce) {
    newArrivalsStatus.textContent = `Новинка ${currentNewArrival + 1} из ${newArrivalItems.length}: ${newArrivalItems[currentNewArrival].name}`;
  }
}

function renderNewArrivals() {
  const focusedControl = newArrivalsTrack.contains(document.activeElement)
    ? {
        action: document.activeElement.dataset.cartAction,
        itemId: document.activeElement.dataset.itemId,
        productId: document.activeElement.dataset.productId,
      }
    : null;
  newArrivalItems = [...catalogById.values()].filter((item) => item.isNew && (item.available || item.showInNewArrivals));
  newArrivalsSection.hidden = newArrivalItems.length === 0;
  stopNewArrivalsTimer();
  if (!newArrivalItems.length) return;
  currentNewArrival = Math.min(currentNewArrival, newArrivalItems.length - 1);
  newArrivalsTrack.innerHTML = newArrivalItems.map((item, index) => `
    <article class="new-arrival-slide" aria-label="Новинка ${index + 1} из ${newArrivalItems.length}" aria-hidden="true" inert>
      <button class="new-arrival-photo" type="button" data-product-id="${escapeHtml(item.catalogId)}" aria-label="Посмотреть ${escapeHtml(item.name)}">
        ${item.image
          ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`
          : `<span class="new-arrival-placeholder" aria-hidden="true">EDEN</span>`}
        <span class="new-arrival-badge">Новинка</span>
        <span class="new-arrival-photo-hint">Смотреть состав <span aria-hidden="true">↗</span></span>
      </button>
      <div class="new-arrival-copy">
        <p class="eyebrow">Попробуйте первым</p>
        <h3><button type="button" data-product-id="${escapeHtml(item.catalogId)}">${escapeHtml(item.name)}</button></h3>
        ${item.meta ? `<span class="new-arrival-meta">${escapeHtml(item.meta)}</span>` : ""}
        <p class="new-arrival-description">${escapeHtml(item.description || "Новинка меню EDEN.")}</p>
        <div class="new-arrival-purchase">
          <strong>${escapeHtml(item.price)}</strong>
          ${item.originalPriceKopecks ? `<s>${escapeHtml(formatPrice(item.originalPriceKopecks))}</s>` : ""}
          ${quantityControlMarkup(item)}
        </div>
      </div>
    </article>`).join("");
  newArrivalsDots.innerHTML = newArrivalItems.map((item, index) =>
    `<button type="button" aria-label="Показать новинку ${index + 1}: ${escapeHtml(item.name)}" aria-current="false" data-new-arrival-index="${index}"></button>`,
  ).join("");
  newArrivalsTrack.querySelectorAll("img").forEach((image) => image.addEventListener("error", () => {
    const placeholder = document.createElement("span");
    placeholder.className = "new-arrival-placeholder";
    placeholder.textContent = "EDEN";
    image.replaceWith(placeholder);
  }, { once: true }));
  const toggle = newArrivalsSection.querySelector("[data-new-arrivals-toggle]");
  toggle.disabled = reducedMotionRequested();
  toggle.textContent = reducedMotionRequested() ? "Без анимации" : newArrivalsPaused ? "▶ Продолжить" : "Ⅱ Пауза";
  toggle.setAttribute("aria-label", reducedMotionRequested()
    ? "Автопрокрутка отключена настройкой уменьшения движения"
    : newArrivalsPaused ? "Продолжить автопрокрутку" : "Приостановить автопрокрутку");
  setNewArrival(currentNewArrival);
  if (focusedControl) {
    const replacement = [...newArrivalsTrack.querySelectorAll("button")].find((button) =>
      (focusedControl.action && button.dataset.cartAction === focusedControl.action && button.dataset.itemId === focusedControl.itemId) ||
      (focusedControl.productId && button.dataset.productId === focusedControl.productId),
    );
    replacement?.focus({ preventScroll: true });
  }
  updateNewArrivalsTimer();
}

function renderProductDetail() {
  const item = catalogById.get(selectedProductId);
  if (!item) return;
  productDetail.innerHTML = `<div class="product-detail-photo">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` : '<span>EDENFOOD</span>'}${item.isNew ? '<span class="item-new-badge">Новинка!</span>' : ''}</div>
    <div class="product-detail-copy"><p class="eyebrow">Меню EDEN</p><h2 id="productTitle">${escapeHtml(item.name)}</h2>
      <p>${escapeHtml(item.description || "Состав уточните у администратора.")}</p>
      <small>${escapeHtml(item.meta || "")}</small>
      <div class="product-detail-purchase"><strong>${escapeHtml(item.price)}</strong>${quantityControlMarkup(item)}</div>
      ${item.imageNote ? `<small class="image-note">${escapeHtml(item.imageNote)}</small>` : ''}</div>`;
}

function openProduct(id) {
  if (!catalogById.has(id)) return;
  selectedProductId = id;
  renderProductDetail();
  if (!productDialog.open) productDialog.showModal();
}

function openCart() {
  updateCheckoutIdentity();
  renderCart();
  if (!cartDialog.open) cartDialog.showModal();
}

function updateDeliveryFields() {
  const service = checkoutForm.querySelector(
    'input[name="serviceType"]:checked',
  )?.value;
  const delivery = service === "DELIVERY";
  deliveryFields.hidden = !delivery;
  deliveryFields.querySelectorAll("input[data-delivery-required]").forEach((input) => {
    input.required = delivery;
  });
}

function setOrderStatus(message, type = "") {
  orderStatus.textContent = message;
  orderStatus.className = `order-status ${type}`.trim();
}

function randomRequestId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `web_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

function requestIdForPayload(payload) {
  const signature = JSON.stringify(payload);
  try {
    const stored = JSON.parse(localStorage.getItem(pendingStorageKey) || "null");
    if (stored?.signature === signature && stored.requestId)
      return stored.requestId;
    const requestId = randomRequestId();
    localStorage.setItem(
      pendingStorageKey,
      JSON.stringify({ signature, requestId }),
    );
    return requestId;
  } catch {
    return randomRequestId();
  }
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  orderToast.textContent = message;
  orderToast.hidden = false;
  toastTimer = window.setTimeout(() => {
    orderToast.hidden = true;
  }, 9000);
}

function setAccountStatus(message, type = "") {
  if (!accountStatus) return;
  accountStatus.textContent = message;
  accountStatus.className = `account-status ${type}`.trim();
}

function setAccountOrdersStatus(message, type = "") {
  if (!accountOrdersStatus) return;
  accountOrdersStatus.textContent = message;
  accountOrdersStatus.className = `account-status ${type}`.trim();
}

function updateCheckoutIdentity() {
  if (checkoutCustomerName) checkoutCustomerName.value = customer?.name || "";
  if (checkoutCustomerPhone) checkoutCustomerPhone.value = customer?.phone || "";
  if (accountButton) {
    accountButton.textContent = customer ? "Мои заказы" : "Войти / регистрация";
    accountButton.setAttribute("aria-label", customer ? "Открыть мои заказы" : "Войти или зарегистрироваться");
  }
}

function setAccountMode(mode) {
  accountMode = mode === "register" ? "register" : "login";
  accountNameField.hidden = accountMode !== "register";
  const password = accountForm.elements.namedItem("password");
  password.autocomplete = accountMode === "register" ? "new-password" : "current-password";
  accountSubmit.textContent = accountMode === "register" ? "Создать аккаунт" : "Войти";
  document.querySelectorAll("[data-account-mode]").forEach((button) => {
    const active = button.dataset.accountMode === accountMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  setAccountStatus("");
}

function setCustomer(value) {
  customer = value || null;
  accountGuest.hidden = Boolean(customer);
  accountSignedIn.hidden = !customer;
  if (customer) {
    document.querySelector("#accountCustomerName").textContent = customer.name;
    document.querySelector("#accountCustomerPhone").textContent = customer.phone;
    accountForm.reset();
  }
  updateCheckoutIdentity();
  renderCustomerOrders();
}

function orderDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Дата уточняется"
    : parsed.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function orderCardMarkup(order) {
  const statusClass = order.status === "READY" || order.status === "PAID"
    ? "is-ready"
    : order.status === "CANCELLED"
      ? "is-error"
      : order.status === "PAID"
        ? "is-paid"
        : "";
  const serviceNames = { DINE_IN: "На месте", TAKEAWAY: "Самовывоз", DELIVERY: "Доставка" };
  const service = serviceNames[order.serviceType] || order.serviceType;
  const address = order.serviceType === "DELIVERY"
    ? [order.deliveryCity, order.deliveryStreet, order.deliveryHouse ? `дом ${order.deliveryHouse}` : "", order.deliveryApartment ? `кв. ${order.deliveryApartment}` : ""].filter(Boolean).join(", ")
    : "";
  const meta = [service, order.guestCount ? `${order.guestCount} персон` : "", address].filter(Boolean).join(" · ");
  return `<article class="customer-order-card">
    <div class="customer-order-top"><div><div class="customer-order-title">Заказ №${escapeHtml(order.number)}</div><div class="customer-order-date">${escapeHtml(orderDate(order.orderedAt))}${meta ? ` · ${escapeHtml(meta)}` : ""}</div></div>
      <span class="customer-order-status ${statusClass}">${escapeHtml(order.statusLabel || "Статус обновляется")}</span></div>
    <p class="customer-order-items">${escapeHtml(order.itemsSummary || "Состав заказа уточняется")}</p>
    ${order.customerNote ? `<p class="customer-order-date">Примечание: ${escapeHtml(order.customerNote)}</p>` : ""}
    ${order.cancellationReason ? `<p class="customer-order-date">Причина: ${escapeHtml(order.cancellationReason)}</p>` : ""}
    <div class="customer-order-total"><span>Сумма</span><strong>${escapeHtml(formatPrice(order.totalKopecks))}</strong></div>
  </article>`;
}

function renderCustomerOrders() {
  if (!currentOrdersElement || !historyOrdersElement) return;
  const active = customerOrders.filter((order) => !["PAID", "CANCELLED"].includes(order.status));
  const history = customerOrders.filter((order) => ["PAID", "CANCELLED"].includes(order.status));
  currentOrdersElement.innerHTML = active.length
    ? active.map(orderCardMarkup).join("")
    : '<div class="customer-orders-empty">Активных заказов пока нет. После отправки новый заказ появится здесь, а статус будет обновляться автоматически.</div>';
  historyOrdersElement.innerHTML = history.length
    ? history.map(orderCardMarkup).join("")
    : '<div class="customer-orders-empty">Завершённые и отменённые заказы будут храниться здесь.</div>';
}

async function customerApi(path, options = {}, timeoutMs = 12000) {
  const response = await fetchWithTimeout(`${apiBase}${path}`, {
    ...options,
    credentials: "include",
  }, timeoutMs);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Не удалось связаться с EDEN");
  return data;
}

async function refreshCustomerOrders() {
  if (!customer) return;
  try {
    const data = await customerApi("/api/customer-orders", { headers: { Accept: "application/json" } });
    customerOrders = data.orders || [];
    renderCustomerOrders();
    setAccountOrdersStatus("Статусы заказов обновляются автоматически.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("Войдите")) {
      customerOrders = [];
      setCustomer(null);
      setAccountOrdersStatus("Сессия завершилась. Войдите ещё раз.", "is-error");
      return;
    }
    setAccountOrdersStatus(error instanceof Error ? error.message : "Не удалось обновить заказы", "is-error");
  }
}

async function loadCustomerAccount() {
  try {
    const data = await customerApi("/api/customer-auth/me", { headers: { Accept: "application/json" } });
    setCustomer(data.customer);
    if (data.customer) void refreshCustomerOrders();
  } catch {
    setCustomer(null);
  }
}

async function openAccountDialog(mode) {
  if (!customer && mode) setAccountMode(mode);
  if (!accountDialog.open) accountDialog.showModal();
  if (customer) void refreshCustomerOrders();
}

async function submitCustomerAuth(event) {
  event.preventDefault();
  const form = new FormData(accountForm);
  const payload = {
    phone: String(form.get("phone") || "").trim(),
    password: String(form.get("password") || ""),
  };
  if (accountMode === "register") payload.name = String(form.get("name") || "").trim();
  accountSubmit.disabled = true;
  setAccountStatus(accountMode === "register" ? "Создаём аккаунт…" : "Входим…");
  try {
    const data = await customerApi(`/api/customer-auth/${accountMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    customerOrders = [];
    setCustomer(data.customer);
    setAccountOrdersStatus("Аккаунт открыт. Здесь будут видны этапы заказа.");
    setAccountTab("current");
    void refreshCustomerOrders();
  } catch (error) {
    setAccountStatus(error instanceof Error ? error.message : "Не удалось войти", "is-error");
  } finally {
    accountSubmit.disabled = false;
  }
}

function setAccountTab(tab) {
  const history = tab === "history";
  currentOrdersElement.hidden = history;
  historyOrdersElement.hidden = !history;
  document.querySelectorAll("[data-order-tab]").forEach((button) => {
    const active = button.dataset.orderTab === (history ? "history" : "current");
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

async function logoutCustomer() {
  try {
    await customerApi("/api/customer-auth/logout", { method: "POST" });
  } catch {
    /* Clear the local view even if the network is unavailable. */
  }
  customerOrders = [];
  setCustomer(null);
  setAccountMode("login");
  setAccountStatus("Вы вышли из аккаунта.", "is-ok");
}

async function submitOrder(event) {
  event.preventDefault();
  if (submitting || !cartSummary().count) return;
  if (!customer) {
    cartDialog.close();
    await openAccountDialog("login");
    setAccountStatus("Чтобы оформить заказ и видеть его статус, войдите или зарегистрируйтесь.");
    return;
  }
  const form = new FormData(checkoutForm);
  const guestCount = String(form.get("guestCount") || "").trim();
  const basePayload = {
    serviceType: String(form.get("serviceType") || ""),
    customerName: customer.name,
    customerPhone: customer.phone,
    guestCount: guestCount ? Number(guestCount) : null,
    customerNote: String(form.get("customerNote") || ""),
    deliveryCity: String(form.get("deliveryCity") || ""),
    deliveryStreet: String(form.get("deliveryStreet") || ""),
    deliveryHouse: String(form.get("deliveryHouse") || ""),
    deliveryApartment: String(form.get("deliveryApartment") || ""),
    items: cartLines().map((line) => ({
      menuItemId: line.item.catalogId,
      quantity: line.quantity,
    })),
  };
  const payload = {
    ...basePayload,
    clientRequestId: requestIdForPayload(basePayload),
  };
  submitting = true;
  checkoutSubmit.disabled = true;
  setOrderStatus("Отправляем заказ официанту…", "is-loading");
  try {
    const response = await fetchWithTimeout(
      `${apiBase}/api/public-orders`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      20000,
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(result.error || "Не удалось отправить заказ");
    cart = {};
    persistCart();
    try {
      localStorage.removeItem(pendingStorageKey);
    } catch {
      /* Nothing else is required after a successful submission. */
    }
    checkoutForm.reset();
    updateCheckoutIdentity();
    updateDeliveryFields();
    renderMenu();
    renderCart();
    setOrderStatus("");
    cartDialog.close();
    showToast(
      `Заказ №${result.number} отправлен официанту. Его подтверждение и готовность будут видны в личном кабинете.`,
    );
    setAccountTab("current");
    setAccountOrdersStatus(`Заказ №${result.number} отправлен. Ожидайте подтверждения официанта.`, "is-ok");
    if (!accountDialog.open) accountDialog.showModal();
    void refreshCustomerOrders();
  } catch (error) {
    const message =
      error?.name === "AbortError"
        ? "Не получили подтверждение за 20 секунд. Корзина сохранена. Проверьте интернет и отправьте ещё раз — повтор не создаст дубль. Если срочно, позвоните +373 68 299 125."
        : error instanceof TypeError
          ? "Не удалось связаться с сервером. Проверьте интернет и повторите отправку — корзина сохранена."
        : error instanceof Error
          ? error.message
          : "Не удалось отправить заказ. Попробуйте ещё раз.";
    setOrderStatus(message, "is-error");
    if (message.includes("Войдите в аккаунт")) {
      cartDialog.close();
      await openAccountDialog("login");
      setAccountStatus("Войдите в аккаунт, чтобы отправить заказ.");
    }
  } finally {
    submitting = false;
    updateCartIndicators();
  }
}

async function syncCatalog() {
  try {
    const response = await fetchWithTimeout(
      `${apiBase}/api/public-menu?v=price-update-20261017`,
      { headers: { Accept: "application/json" } },
      8000,
    );
    if (!response.ok) return;
    const data = await response.json();
    const live = new Map((data.items || []).map((item) => [item.id, item]));
    catalogById.forEach((item, id) => {
      if (item.enquiryOnly) return;
      const current = live.get(id);
      if (!current || normalizedName(current.name) !== normalizedName(item.name)) {
        item.available = false;
        delete cart[id];
        return;
      }
      item.available = true;
      item.priceKopecks = current.priceKopecks;
      item.price = formatPrice(current.priceKopecks);
    });
    persistCart();
    renderMenu();
    renderNewArrivals();
    renderCart();
    if (productDialog?.open) renderProductDetail();
  } catch {
    /* Static prices remain visible; the server still verifies them at checkout. */
  }
}

renderFilters();
renderCategoryTiles();
renderMenu();
renderNewArrivals();
renderCart();
updateDeliveryFields();
void syncCatalog();

const mercedesProgressElements = {
  count: document.querySelector('#mercedesPaidCount'),
  announcement: document.querySelector('#mercedesAnnouncementCount'),
  fill: document.querySelector('#mercedesProgressFill'),
  meter: document.querySelector('#mercedesProgressMeter'),
  status: document.querySelector('#mercedesProgressStatus'),
  orderButton: document.querySelector('#mercedesOrderButton'),
  announcementLink: document.querySelector('.mercedes-announcement'),
};

async function refreshMercedesRaffle() {
  if (!mercedesProgressElements.count) return;
  try {
    const response = await fetchWithTimeout(`${apiBase}/api/mercedes-raffle`, {}, 6500);
    if (!response.ok) throw new Error('raffle unavailable');
    const raffle = await response.json();
    const total = 50;
    const count = Math.min(total, Math.max(0, Number(raffle.paidCount) || 0));
    mercedesProgressElements.count.textContent = String(count);
    mercedesProgressElements.announcement.textContent = String(count);
    mercedesProgressElements.fill.style.width = `${count / total * 100}%`;
    mercedesProgressElements.meter.setAttribute('aria-valuenow', String(count));
    mercedesProgressElements.announcementLink?.setAttribute('aria-label', `Розыгрыш Mercedes, ${count} из ${total} номеров`);
    mercedesProgressElements.status.textContent = count >= total
      ? 'Все 50 номеров распределены. Скоро объявим время живого финала.'
      : count === 0
        ? 'После оплаты первого сета появится номер 1 из 50.'
        : `Оплачено ${count} из ${total} сетов. Осталось ${total - count} номеров.`;
    if (mercedesProgressElements.orderButton) {
      mercedesProgressElements.orderButton.disabled = count >= total;
      mercedesProgressElements.orderButton.innerHTML = count >= total
        ? 'Все номера розыгрыша заняты'
        : 'Заказать сет · 5&nbsp;000 ₽ <span aria-hidden="true">↗</span>';
    }
  } catch {
    mercedesProgressElements.status.textContent = 'Счётчик временно не обновился. Попробуйте обновить страницу.';
  }
}

void refreshMercedesRaffle();
window.setInterval(() => {
  if (!document.hidden) void refreshMercedesRaffle();
}, 15000);
void refreshCurrentShifts();
window.setInterval(() => {
  if (!document.hidden) void refreshCurrentShifts();
}, 15000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) void refreshCurrentShifts();
});

let shiftHoldTimer = 0;
let shiftCelebrateTimer = 0;
let shiftHoldCard = null;
let shiftHoldPoint = null;
let shiftHoldTriggered = false;
let suppressShiftClickUntil = 0;
let celebratingShiftCard = null;
function celebrateShiftPerson(card) {
  if (!card) return;
  window.clearTimeout(shiftCelebrateTimer);
  if (celebratingShiftCard && celebratingShiftCard !== card) {
    celebratingShiftCard.classList.remove("is-celebrating");
    celebratingShiftCard.setAttribute("aria-pressed", "false");
    const oldBurst = celebratingShiftCard.querySelector(".shift-person-burst");
    if (oldBurst) oldBurst.hidden = true;
  }
  const burst = card.querySelector(".shift-person-burst");
  if (burst) burst.hidden = false;
  card.classList.remove("is-celebrating");
  void card.offsetWidth;
  celebratingShiftCard = card;
  card.classList.add("is-celebrating");
  card.setAttribute("aria-pressed", "true");
  shiftCelebrateTimer = window.setTimeout(() => {
    card.classList.remove("is-celebrating");
    card.setAttribute("aria-pressed", "false");
    if (burst) burst.hidden = true;
    if (celebratingShiftCard === card) celebratingShiftCard = null;
  }, 2500);
}
function clearShiftHold() {
  window.clearTimeout(shiftHoldTimer);
  shiftHoldTimer = 0;
  shiftHoldCard = null;
  shiftHoldPoint = null;
  shiftHoldTriggered = false;
}
currentShiftGrid?.addEventListener("pointerdown", (event) => {
  const card = event.target.closest(".shift-person");
  if (!card || !event.isPrimary || (event.button !== undefined && event.button > 0)) return;
  clearShiftHold();
  shiftHoldCard = card;
  shiftHoldPoint = { x: event.clientX, y: event.clientY };
  shiftHoldTriggered = false;
  shiftHoldTimer = window.setTimeout(() => {
    if (shiftHoldCard !== card) return;
    shiftHoldTriggered = true;
    suppressShiftClickUntil = Date.now() + 550;
    celebrateShiftPerson(card);
  }, 480);
}, { passive: true });
window.addEventListener("pointermove", (event) => {
  if (!shiftHoldCard || !shiftHoldPoint) return;
  if (Math.hypot(event.clientX - shiftHoldPoint.x, event.clientY - shiftHoldPoint.y) > 12) clearShiftHold();
}, { passive: true });
window.addEventListener("pointerup", () => {
  if (shiftHoldTriggered) suppressShiftClickUntil = Date.now() + 550;
  clearShiftHold();
}, { passive: true });
window.addEventListener("pointercancel", clearShiftHold, { passive: true });
window.addEventListener("blur", clearShiftHold);
currentShiftGrid?.addEventListener("contextmenu", (event) => {
  if (event.target.closest(".shift-person.is-celebrating")) event.preventDefault();
});
currentShiftGrid?.addEventListener("click", (event) => {
  const card = event.target.closest(".shift-person");
  if (!card) return;
  if (Date.now() < suppressShiftClickUntil) {
    event.preventDefault();
    return;
  }
  celebrateShiftPerson(card);
});
document.querySelector('#mercedesOrderButton')?.addEventListener('click', () => {
  const item = catalogById.get('edenfood-seti-016');
  if (!item?.available) {
    showToast('Сет временно недоступен.');
    return;
  }
  changeQuantity(item.catalogId, 1);
  openCart();
});

filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (button) selectCategory(button);
});
menuGrid.addEventListener("click", handleCartAction);
menuGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-id]");
  if (button) openProduct(button.dataset.productId);
});
newArrivalsTrack.addEventListener("click", handleCartAction);
newArrivalsTrack.addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-id]");
  if (button) openProduct(button.dataset.productId);
});
newArrivalsSection.querySelector("[data-new-arrivals-previous]").addEventListener("click", () => {
  setNewArrival(currentNewArrival - 1, true);
  updateNewArrivalsTimer();
});
newArrivalsSection.querySelector("[data-new-arrivals-next]").addEventListener("click", () => {
  setNewArrival(currentNewArrival + 1, true);
  updateNewArrivalsTimer();
});
newArrivalsSection.querySelector("[data-new-arrivals-toggle]").addEventListener("click", (event) => {
  newArrivalsPaused = !newArrivalsPaused;
  const button = event.currentTarget;
  button.textContent = newArrivalsPaused ? "▶ Продолжить" : "Ⅱ Пауза";
  button.setAttribute("aria-pressed", String(newArrivalsPaused));
  button.setAttribute("aria-label", newArrivalsPaused ? "Продолжить автопрокрутку" : "Приостановить автопрокрутку");
  updateNewArrivalsTimer();
});
newArrivalsDots.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-new-arrival-index]");
  if (!button) return;
  setNewArrival(Number(button.dataset.newArrivalIndex), true);
  updateNewArrivalsTimer();
});
newArrivalsSection.addEventListener("mouseenter", () => {
  newArrivalsHovering = true;
  updateNewArrivalsTimer();
});
newArrivalsSection.addEventListener("mouseleave", () => {
  newArrivalsHovering = false;
  updateNewArrivalsTimer();
});
newArrivalsSection.addEventListener("focusin", () => {
  newArrivalsFocused = true;
  updateNewArrivalsTimer();
});
newArrivalsSection.addEventListener("focusout", () => {
  window.setTimeout(() => {
    newArrivalsFocused = newArrivalsSection.contains(document.activeElement);
    updateNewArrivalsTimer();
  }, 0);
});
let newArrivalPointerStart = null;
newArrivalsSection.querySelector("#newArrivalsViewport").addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch") return;
  newArrivalPointerStart = event.clientX;
  newArrivalsHovering = true;
  updateNewArrivalsTimer();
});
newArrivalsSection.querySelector("#newArrivalsViewport").addEventListener("pointerup", (event) => {
  if (newArrivalPointerStart === null) return;
  const distance = event.clientX - newArrivalPointerStart;
  newArrivalPointerStart = null;
  if (Math.abs(distance) > 45) setNewArrival(currentNewArrival + (distance < 0 ? 1 : -1), true);
  newArrivalsHovering = false;
  updateNewArrivalsTimer();
});
newArrivalsSection.querySelector("#newArrivalsViewport").addEventListener("pointercancel", () => {
  newArrivalPointerStart = null;
  newArrivalsHovering = false;
  updateNewArrivalsTimer();
});
document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-select-category]");
  if (!link) return;
  event.preventDefault();
  activateCategory(link.dataset.selectCategory);
  history.replaceState(null, "", `#menu/${link.dataset.selectCategory}`);
});
document.querySelector("#moreCategories").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const expanded = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(expanded));
  document.querySelector("#categoryTiles").classList.toggle("show-all", expanded);
  button.textContent = expanded ? "Свернуть разделы ↑" : "Показать все разделы ↓";
});
document.querySelector("#closeProduct").addEventListener("click", () => productDialog.close());
productDialog.addEventListener("click", (event) => {
  if (event.target === productDialog) productDialog.close();
});
productDetail.addEventListener("click", handleCartAction);
if (location.hash.startsWith("#menu/")) activateCategory(location.hash.slice(6), true);
cartItemsElement.addEventListener("click", handleCartAction);
menuSearch.addEventListener("input", (event) => {
  searchQuery = event.target.value.trim().toLowerCase();
  renderMenu();
});
document.querySelector("#clearMenuSearch").addEventListener("click", () => {
  searchQuery = "";
  menuSearch.value = "";
  renderMenu();
  menuSearch.focus();
});
document.querySelector("#categoriesPrevious")?.addEventListener("click", () =>
  filters.scrollBy({ left: -Math.max(260, filters.clientWidth * 0.7), behavior: "smooth" }),
);
document.querySelector("#categoriesNext")?.addEventListener("click", () =>
  filters.scrollBy({ left: Math.max(260, filters.clientWidth * 0.7), behavior: "smooth" }),
);
headerCartButton?.addEventListener("click", openCart);
floatingCartButton?.addEventListener("click", openCart);
document.querySelector("#closeCart")?.addEventListener("click", () => cartDialog.close());
cartDialog.addEventListener("click", (event) => {
  if (event.target === cartDialog) cartDialog.close();
});
checkoutForm.addEventListener("change", (event) => {
  if (event.target.matches('input[name="serviceType"]')) updateDeliveryFields();
});
checkoutForm.addEventListener("submit", submitOrder);
accountButton?.addEventListener("click", () => void openAccountDialog());
document.querySelector("#closeAccount")?.addEventListener("click", () => accountDialog.close());
accountDialog?.addEventListener("click", (event) => {
  if (event.target === accountDialog) accountDialog.close();
});
document.querySelectorAll("[data-account-mode]").forEach((button) => {
  button.addEventListener("click", () => setAccountMode(button.dataset.accountMode));
});
accountForm?.addEventListener("submit", submitCustomerAuth);
document.querySelector("#accountLogout")?.addEventListener("click", logoutCustomer);
document.querySelectorAll("[data-order-tab]").forEach((button) => {
  button.addEventListener("click", () => setAccountTab(button.dataset.orderTab));
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && customer) void refreshCustomerOrders();
  updateNewArrivalsTimer();
});
window.setInterval(() => {
  if (!document.hidden && customer) void refreshCustomerOrders();
}, 15000);
void loadCustomerAccount();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
              .register("/sw.js?v=night-market-20261114-v1", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {
        /* Ordering remains available online when offline caching is unsupported. */
      });
  });
}
