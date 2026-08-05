const menuGrid = document.querySelector("#menuGrid");
const filters = document.querySelector("#filters");
const menuSearch = document.querySelector("#menuSearch");
const orderUrl = "https://t.me/edenfood";
let activeCategoryId = "all";
let searchQuery = "";

function makeButton(category, active) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = category.label;
  button.dataset.category = category.id;
  button.className = active ? "active" : "";
  return button;
}

function itemCard(item) {
  const article = document.createElement("article");
  article.className = "menu-item";
  const imageMarkup = item.image
    ? `<img class="item-image" src="${item.image}" alt="${item.name}" loading="lazy">`
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
    ? window.EDEN_MENU
    : window.EDEN_MENU.filter((category) => category.id === activeCategoryId);
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
  filters.append(makeButton(all, true), ...window.EDEN_MENU.map((category) => makeButton(category, false)));

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    filters.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
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
