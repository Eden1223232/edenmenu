const menuGrid = document.querySelector("#menuGrid");
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
const deliveryFields = document.querySelector("#deliveryFields");
const orderToast = document.querySelector("#orderToast");
const defaultCategoryId = "all";
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
  "garnishes",
  "desserts",
  "seti",
  "urumaki",
  "cold_drinks",
  "coffee",
  "tea",
  "drink_addons",
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
    item.imageFit === "cover" ? "item-image item-image--cover" : "item-image";
  const imageMarkup = item.image
    ? `<img class="${imageClass}" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">`
    : `<div class="item-image item-image-placeholder" aria-hidden="true"><span>${escapeHtml(item.name)}</span></div>`;
  article.innerHTML = `
    ${imageMarkup}
    <div class="item-body">
      <div class="item-top">
        <h4>${escapeHtml(item.name)}</h4>
        <span class="price">${escapeHtml(item.price)}</span>
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

function matchesSearch(item) {
  if (!searchQuery) return true;
  const haystack = `${item.name || ""} ${item.description || ""} ${item.meta || ""} ${item.price || ""}`.toLowerCase();
  return haystack.includes(searchQuery);
}

function renderMenu() {
  menuGrid.innerHTML = "";
  const categories =
    activeCategoryId === "all"
      ? menuCategories
      : menuCategories.filter((category) => category.id === activeCategoryId);
  let renderedCount = 0;
  categories.forEach((category) => {
    const items = category.items.filter(matchesSearch);
    if (!items.length) return;
    const title = document.createElement("div");
    title.className = "category-title";
    title.id = category.id;
    title.innerHTML = `<span>${String(items.length).padStart(2, "0")}</span><h3>${escapeHtml(category.label)}</h3>`;
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
  cartItemsElement.innerHTML = lines
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
  renderCart();
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
  filters.querySelectorAll("button").forEach((item) => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  activeCategoryId = button.dataset.category;
  searchQuery = "";
  menuSearch.value = "";
  renderMenu();
  requestAnimationFrame(() =>
    menuGrid.scrollIntoView({ behavior: "smooth", block: "start" }),
  );
}

function openCart() {
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

async function submitOrder(event) {
  event.preventDefault();
  if (submitting || !cartSummary().count) return;
  const form = new FormData(checkoutForm);
  const guestCount = String(form.get("guestCount") || "").trim();
  const basePayload = {
    serviceType: String(form.get("serviceType") || ""),
    customerName: String(form.get("customerName") || ""),
    customerPhone: String(form.get("customerPhone") || ""),
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
    updateDeliveryFields();
    renderMenu();
    renderCart();
    setOrderStatus("");
    cartDialog.close();
    showToast(
      `Заказ №${result.number} принят. Официант подтвердит его и распределит между кухней и баром.`,
    );
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
  } finally {
    submitting = false;
    updateCartIndicators();
  }
}

async function syncCatalog() {
  try {
    const response = await fetchWithTimeout(
      `${apiBase}/api/public-menu`,
      { headers: { Accept: "application/json" } },
      8000,
    );
    if (!response.ok) return;
    const data = await response.json();
    const live = new Map((data.items || []).map((item) => [item.id, item]));
    catalogById.forEach((item, id) => {
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
    renderCart();
  } catch {
    /* Static prices remain visible; the server still verifies them at checkout. */
  }
}

renderFilters();
renderMenu();
renderCart();
updateDeliveryFields();
void syncCatalog();

filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (button) selectCategory(button);
});
menuGrid.addEventListener("click", handleCartAction);
cartItemsElement.addEventListener("click", handleCartAction);
menuSearch.addEventListener("input", (event) => {
  searchQuery = event.target.value.trim().toLowerCase();
  renderMenu();
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js?v=menu-20261003", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {
        /* Ordering remains available online when offline caching is unsupported. */
      });
  });
}
