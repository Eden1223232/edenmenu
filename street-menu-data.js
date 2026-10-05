(function addStreetRolls() {
  if (!Array.isArray(window.EDEN_MENU)) window.EDEN_MENU = [];
  const variants = [
    ["bonito", "Бонито", "Жареный лосось, авокадо, сыр, рис, нори, стружка тунца, соевый соус."],
    ["kaliforniya", "Калифорния", "Креветка, авокадо, огурец, икра летучей рыбы, рис, нори, соевый соус."],
    ["kaliforniya-v-kunzhute", "Калифорния в кунжуте", "Креветка, авокадо, огурец, кунжут, сыр, рис, нори, соевый соус."],
    ["kaliforniya-s-lososem", "Калифорния с лососем", "Лосось, огурец, авокадо, сыр, икра летучей рыбы, рис, нори, соевый соус."],
    ["kaliforniya-s-ugrem", "Калифорния с угрём", "Угорь, авокадо, огурец, сыр, икра летучей рыбы, рис, нори, соевый соус."],
    ["philadelphia", "Филадельфия", "Лосось, авокадо, сыр, рис, нори, соевый соус."],
    ["filadelfiya-v-kunzhute", "Филадельфия в кунжуте", "Лосось, огурец, сыр, кунжут, рис, нори, соевый соус."],
  ];
  const street = {
    id: "street_rolls",
    label: "Стрит-роллы",
    description: "Любимые сочетания в новом формате — роллы в тубусе EDENFOOD. Удобно взять с собой. Цену выбранного варианта уточняйте при заказе.",
    items: variants.map(([slug, name, composition]) => ({
      catalogId: `edenfood-street-${slug}`,
      name: `Стрит-ролл ${name}`,
      price: "Цена уточняется",
      meta: "Ролл в тубусе",
      description: `Состав: ${composition}`,
      image: `assets/street-rolls/${slug}.webp`,
      imageFit: "cover",
      imageNote: "На фото — визуализация фирменной упаковки EDENFOOD. Оформление при выдаче может отличаться.",
      enquiryOnly: true,
      sellable: false,
    })),
  };
  if (!window.EDEN_MENU.some((category) => category.id === street.id)) window.EDEN_MENU.push(street);
  const tube = window.EDEN_MENU.find((category) => category.id === "tubus")?.items[0];
  if (tube) {
    tube.image = "assets/street-rolls/philadelphia.webp";
    tube.imageNote = "На фото — визуализация фирменной упаковки EDENFOOD. Ролл оплачивается отдельно.";
  }
})();
