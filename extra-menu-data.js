(function addEdenBarMenu() {
  if (!Array.isArray(window.EDEN_MENU)) window.EDEN_MENU = [];

  const existingCategoryIds = new Set(window.EDEN_MENU.map((category) => category.id));
  const authorTea = (slug, name, description) =>
    [
      { volume: "700 мл", suffix: "700", price: "55 руб" },
      { volume: "1000 мл", suffix: "1000", price: "80 руб" },
      { volume: "1750 мл", suffix: "1750", price: "135 руб" },
    ].map((variant) => ({
      catalogId: `edenfood-tea-${slug}-${variant.suffix}`,
      name: `${name} · ${variant.volume}`,
      price: variant.price,
      meta: variant.volume,
      description,
      image: "",
      source: "",
    }));
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
      id: "cold_drinks",
      label: "Холодные напитки",
      layout: "text-list",
      groups: [
        { id: "lemonades", label: "Лимонады" },
        { id: "canned", label: "Напитки в банках" },
      ],
      items: [
        { name: "Лимонад классический", price: "45 руб", group: "lemonades" },
        { name: "Мохито манго", price: "45 руб", group: "lemonades" },
        { name: "Мохито вишня", price: "45 руб", group: "lemonades" },
        { name: "Манго Маракуйя", price: "45 руб", group: "lemonades" },
        { name: "Манго апельсин", price: "45 руб", group: "lemonades" },
        { name: "Малина-мята", price: "45 руб", group: "lemonades" },
        { name: "Бамбл кофе", price: "45 руб", group: "lemonades" },
        { name: "Мохито", price: "45 руб", group: "lemonades" },
        { name: "Апельсин", price: "45 руб", group: "lemonades" },
        { name: "Облепиха-маракуйя", price: "45 руб", group: "lemonades" },
        { name: "Киви", price: "45 руб", group: "lemonades" },
        { name: "Coca-Cola", price: "24 руб", meta: "330 мл", group: "canned" },
        { name: "Fanta", price: "24 руб", meta: "330 мл", group: "canned" },
        { name: "Sprite", price: "24 руб", meta: "330 мл", group: "canned" },
        { name: "Non Stop", price: "24 руб", meta: "0,5 л", group: "canned" },
        {
          name: "Сок мультифрукт",
          price: "15 руб",
          meta: "200 мл",
          description: "Мультифруктовый нектар «Наш Сік».",
          image: "assets/drinks/multifruit-juice-200ml.png",
          source: "",
          display: "card",
        },
      ],
    },
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
        ...authorTea("sea-buckthorn-orange", "Авторский чай «Облепиха-апельсин»", "Состав: облепиха, апельсин, лимон, апельсиновый сок и апельсиновый сироп."),
        ...authorTea("mango-orange", "Авторский чай «Манго-апельсин»", "Состав: сироп манго, пюре манго, апельсиновый сок, апельсин, чёрный или зелёный чай."),
        ...authorTea("berry-mix", "Авторский чай «Ягодный микс»", "Состав: малина, смородина, клубника, мёд и корица."),
        ...authorTea("citrus", "Авторский чай «Цитрусовый»", "Состав: апельсин, лимон, карамельный сироп, чёрный или зелёный чай."),
        ...authorTea("apple-vanilla-cinnamon", "Авторский чай «Яблоко, ваниль и корица»", "Состав: яблочный сироп, яблоко, корица, лимон и апельсин."),
        { catalogId: "edenfood-tea-brewed-700", sellable: false, name: "Чай заварной", price: "Цена уточняется", meta: "700 мл · в ассортименте", description: "Заварной чай в чайнике. Вкус и цену уточняйте при заказе.", image: "", source: "" },
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

  const setsCategory = window.EDEN_MENU.find((category) => category.id === "seti");
  if (setsCategory) {
    if (!setsCategory.items.some((item) => item.catalogId === "edenfood-seti-montana")) {
      setsCategory.items.push({
        catalogId: "edenfood-seti-montana",
        name: "Сет МОНТАНА",
        price: "550 руб",
        originalPriceKopecks: 62000,
        meta: "32 шт. · 1000 г.",
        description: "Состав: Филадельфия — рис, сыр, лосось; двойная креветка — рис, сыр, креветка, креветка в темпуре, огурец, трюфельный соус, икра тобико, нори; ролл с жареным лососем в огурце — рис, сыр, жареный лосось, авокадо, огурец, терияки, кунжут, нори; ролл с тунцом татаки — рис, сыр, авокадо, салат айсберг, тунец, терияки, ореховый соус, нори. Вес: 1000 г.",
        image: "assets/sets/montana.jpg",
        source: "",
      });
    }
    if (!setsCategory.items.some((item) => item.catalogId === "edenfood-seti-khrust")) {
      setsCategory.items.push({
        catalogId: "edenfood-seti-khrust",
        name: "Хруст сет",
        price: "420 руб",
        originalPriceKopecks: 45000,
        meta: "700 г.",
        description: "Состав: темпура с креветкой и авокадо — рис, сыр, креветка, салат айсберг, бекон, спайси, терияки, кунжут, темпура, нори; темпура с жареным лососем и авокадо — рис, сыр, жареный лосось, авокадо, соус терияки, темпура, кунжут, нори; темпура с угрем — рис, сыр, угорь, огурец, икра тобико, соус терияки, темпура, кунжут, нори. Вес: 700 г. Роллы в темпуре не сохраняют тепло при доставке. Мы готовим их в последний момент, но в пути они остывают. Спасибо за понимание!",
        image: "assets/sets/khrust.jpg",
        source: "",
      });
    }
  }

  const bigFila = window.EDEN_MENU
    .flatMap((category) => category.items)
    .find((item) => item.name === "БИГ ФИЛА");
  if (bigFila) {
    bigFila.meta = "Хот-дог, 1 шт.";
  }
})();
