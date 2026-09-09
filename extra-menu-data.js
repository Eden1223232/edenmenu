(function addEdenBarMenu() {
  if (!Array.isArray(window.EDEN_MENU)) window.EDEN_MENU = [];

  const existingCategoryIds = new Set(window.EDEN_MENU.map((category) => category.id));
  const tubeCategory = {
    id: "tubus",
    label: "Суши в тубусе",
    items: [
      {
        name: "Фирменный тубус для роллов",
        price: "+50 руб",
        meta: "Доплата к выбранному роллу",
        description: "Любой ролл можем поместить в фирменный тубус EDEN. Доплата за тубус — 50 руб.",
        image: "assets/tubes/eden-sushi-tube.png",
        source: "",
      },
    ],
  };

  const barCategories = [
    {
      id: "coffee",
      label: "Кофейные напитки",
      items: [
        { name: "Эспрессо", price: "20 руб", meta: "", description: "Классический насыщенный эспрессо.", image: "", source: "" },
        { name: "Двойной эспрессо", price: "35 руб", meta: "", description: "Двойная порция классического эспрессо.", image: "", source: "" },
        { name: "Американо", price: "20 руб", meta: "", description: "Эспрессо с горячей водой.", image: "", source: "" },
        { name: "Флэт уайт", price: "35 руб", meta: "", description: "Кофе с бархатистым молоком и насыщенным вкусом.", image: "", source: "" },
        { name: "Капучино", price: "30 руб", meta: "", description: "Эспрессо с молоком и плотной молочной пеной.", image: "", source: "" },
        { name: "Латте", price: "33 руб", meta: "", description: "Мягкий кофейный напиток с молоком.", image: "", source: "" },
        { name: "Какао", price: "23 руб", meta: "", description: "Горячий какао-напиток с молоком.", image: "", source: "" },
        { name: "Стиммер", price: "29 руб", meta: "", description: "Горячий молочный напиток с нежной пеной.", image: "", source: "" },
        { name: "Горячий шоколад", price: "35 руб", meta: "", description: "Густой горячий шоколад.", image: "", source: "" },
        { name: "Айс латте", price: "45 руб", meta: "", description: "Охлаждённый кофе с молоком и льдом.", image: "", source: "" },
      ],
    },
    {
      id: "tea",
      label: "Чайные напитки",
      items: [
        { name: "Чай в пакетиках", price: "15 руб", meta: "В ассортименте", description: "Чёрный или зелёный чай на выбор.", image: "", source: "" },
        { name: "Чай с джемом", price: "25 руб", meta: "", description: "Горячий чай с джемом.", image: "", source: "" },
        { name: "Авторский чай «Облепиха-апельсин»", price: "от 55 руб", meta: "700 мл — 55 руб · 1000 мл — 80 руб · 1750 мл — 135 руб", description: "Состав: облепиха, апельсин, лимон, апельсиновый сок и апельсиновый сироп.", image: "", source: "" },
        { name: "Авторский чай «Манго-апельсин»", price: "от 55 руб", meta: "700 мл — 55 руб · 1000 мл — 80 руб · 1750 мл — 135 руб", description: "Состав: сироп манго, пюре манго, апельсиновый сок, апельсин, чёрный или зелёный чай.", image: "", source: "" },
        { name: "Авторский чай «Ягодный микс»", price: "от 55 руб", meta: "700 мл — 55 руб · 1000 мл — 80 руб · 1750 мл — 135 руб", description: "Состав: малина, смородина, клубника, мёд и корица.", image: "", source: "" },
        { name: "Авторский чай «Цитрусовый»", price: "от 55 руб", meta: "700 мл — 55 руб · 1000 мл — 80 руб · 1750 мл — 135 руб", description: "Состав: апельсин, лимон, карамельный сироп, чёрный или зелёный чай.", image: "", source: "" },
        { name: "Авторский чай «Яблоко, ваниль и корица»", price: "от 55 руб", meta: "700 мл — 55 руб · 1000 мл — 80 руб · 1750 мл — 135 руб", description: "Состав: яблочный сироп, яблоко, корица, лимон и апельсин.", image: "", source: "" },
        { name: "Чай заварной", price: "Цена уточняется", meta: "700 мл · в ассортименте", description: "Заварной чай в чайнике. Вкус и цену уточняйте при заказе.", image: "", source: "" },
      ],
    },
    {
      id: "drink_addons",
      label: "Добавки к напиткам",
      items: [
        { name: "Молоко", price: "3 руб", meta: "40 мл", description: "Добавка к напитку.", image: "", source: "" },
        { name: "Сливки", price: "5 руб", meta: "20 мл", description: "Добавка к напитку.", image: "", source: "" },
        { name: "Сироп на выбор", price: "9 руб", meta: "20 мл", description: "Сироп на выбор к кофе или другому напитку.", image: "", source: "" },
        { name: "Апельсин", price: "15 руб", meta: "100 г", description: "Добавка к напитку.", image: "", source: "" },
        { name: "Мёд", price: "12 руб", meta: "50 мл", description: "Добавка к чаю или другому напитку.", image: "", source: "" },
        { name: "Лимон", price: "3 руб", meta: "10 г", description: "Добавка к напитку.", image: "", source: "" },
      ],
    },
  ];

  const hotItems = [
    {
      name: "Суши-бургер с лососем",
      price: "170 руб",
      meta: "1 шт.",
      description: "Горячий суши-бургер с лососем.",
      image: "assets/hot/sushi-burger-salmon.jpg",
      imageFit: "cover",
      source: "",
    },
    {
      name: "Суши-бургер с креветкой",
      price: "170 руб",
      meta: "1 шт.",
      description: "Горячий суши-бургер с креветкой.",
      image: "assets/hot/sushi-burger-shrimp.jpg",
      imageFit: "cover",
      source: "",
    },
    {
      name: "Суши-бургер с чукой",
      price: "170 руб",
      meta: "1 шт.",
      description: "Горячий суши-бургер с чукой.",
      image: "assets/hot/sushi-burger-chuka.jpg",
      imageFit: "cover",
      source: "",
    },
    {
      name: "Суши-хот-дог с лососем",
      price: "170 руб",
      meta: "1 шт.",
      description: "Горячий суши-хот-дог с лососем.",
      image: "assets/hot/sushi-hotdog-salmon.jpg",
      imageFit: "cover",
      source: "",
    },
    {
      name: "Суши-хот-дог с угрём",
      price: "170 руб",
      meta: "1 шт.",
      description: "Горячий суши-хот-дог с угрём.",
      image: "assets/hot/sushi-hotdog-eel.jpg",
      imageFit: "cover",
      source: "",
    },
    {
      name: "Суши-хот-дог с креветкой",
      price: "170 руб",
      meta: "1 шт.",
      description: "Горячий суши-хот-дог с креветкой.",
      image: "assets/hot/sushi-hotdog-shrimp.jpg",
      imageFit: "cover",
      source: "",
    },
  ];

  if (!existingCategoryIds.has(tubeCategory.id)) {
    window.EDEN_MENU.unshift(tubeCategory);
  }

  barCategories.forEach((category) => {
    if (!existingCategoryIds.has(category.id)) window.EDEN_MENU.push(category);
  });

  const hotCategory = window.EDEN_MENU.find((category) => category.id === "roll_vtemp");
  if (hotCategory) {
    const existingHotItemNames = new Set(hotCategory.items.map((item) => item.name));
    hotCategory.items.push(...hotItems.filter((item) => !existingHotItemNames.has(item.name)));
  } else {
    window.EDEN_MENU.push({ id: "roll_vtemp", label: "Горячие роллы", items: hotItems });
  }
})();
