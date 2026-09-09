const menuGrid = document.querySelector("#menuGrid");
const filters = document.querySelector("#filters");
const menuSearch = document.querySelector("#menuSearch");
const orderUrl = "https://t.me/edenfood";
const defaultCategoryId = "seti";
const menuCategories = [
  ...window.EDEN_MENU.filter((category) => category.id === defaultCategoryId),
  ...window.EDEN_MENU.filter((category) => category.id !== defaultCategoryId),
];
let activeCategoryId = menuCategories.some((category) => category.id === defaultCategoryId)
  ? defaultCategoryId
  : "all";
let searchQuery = "";

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
  const imageClass = item.imageFit === "cover" ? "item-image item-image--cover" : "item-image";
  const imageMarkup = item.image
    ? `<img class="${imageClass}" src="${item.image}" alt="${item.name}" loading="lazy">`
    : `<div class="item-image item-image-placeholder" aria-hidden="true"><span>${item.name}</span></div>`;
  article.innerHTML = `
    ${imageMarkup}
    <div class="item-body">
      <div class="item-top">
        <h4>${item.name}</h4>
        <span class="price">${item.price}</span>
      </div>
      <p class="item-desc">${item.description}</p>
      ${item.meta ? `<div class="item-meta"><span>${item.meta}</span></div>` : ""}
      <a class="order-link" href="${orderUrl}" target="_blank" rel="noreferrer">Заказать в Telegram</a>
    </div>
  `;
  return article;
}

function matchesSearch(item) {
  if (!searchQuery) return true;
  const haystack = `${item.name} ${item.description} ${item.meta} ${item.price}`.toLowerCase();
  return haystack.includes(searchQuery);
}

function renderMenu() {
  menuGrid.innerHTML = "";
  const categories = activeCategoryId === "all"
    ? menuCategories
    : menuCategories.filter((category) => category.id === activeCategoryId);
  let renderedCount = 0;

  categories.forEach((category) => {
    const items = category.items.filter(matchesSearch);
    if (!items.length) return;
    const title = document.createElement("div");
    title.className = "category-title";
    title.id = category.id;
    title.innerHTML = `<span>${String(items.length).padStart(2, "0")}</span><h3>${category.label}</h3>`;
    menuGrid.append(title, ...items.map(itemCard));
    renderedCount += items.length;
  });

  if (!renderedCount) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "По этому запросу ничего не найдено.";
    menuGrid.append(empty);
  }
}

function renderFilters() {
  const all = { id: "all", label: "Все меню" };
  const filterCategories = [
    ...menuCategories.filter((category) => category.id === defaultCategoryId),
    all,
    ...menuCategories.filter((category) => category.id !== defaultCategoryId),
  ];
  filters.append(...filterCategories.map((category) => makeButton(category, category.id === activeCategoryId)));

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    filters.querySelectorAll("button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    activeCategoryId = button.dataset.category;
    renderMenu();
  });
}

renderFilters();
renderMenu();

menuSearch.addEventListener("input", (event) => {
  searchQuery = event.target.value.trim().toLowerCase();
  renderMenu();
});
