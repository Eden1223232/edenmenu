(function (root) {
  "use strict";
  const letters = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
  const englishKeys = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
  const russianKeys = "йцукенгшщзхъфывапролджэячсмитьбюё";
  const stopWords = new Set(["s", "so", "v", "vo", "i", "with", "and", "the"]);
  const aliases = [
    [/^(?:philadelphia|philadelfia|filadelfia|filadelfii|filadelfiya)$/, "filadelfiya"],
    [/^phila$/, "fila"],
    [/^(?:california|kaliforniya|kalifornii|kalifornia)$/, "kaliforniya"],
    [/^(?:rolls?|rolly|roly|rol)$/, "roll"],
    [/^(?:hot|goryach.*)$/, "hot"],
    [/^(?:salmon|losos.*)$/, "losos"],
    [/^(?:eel|ugor|ugr.*)$/, "ugor"],
    [/^(?:shrimps?|prawns?|krevet.*)$/, "krevetka"],
    [/^(?:tuna|tunets|tunts.*)$/, "tunets"],
    [/^(?:chicken|kurits.*|kurin.*)$/, "kuritsa"],
    [/^(?:cheese|syr.*)$/, "syr"],
    [/^(?:baked|zapechen.*)$/, "zapechennyy"],
    [/^(?:sets?|sety|setov)$/, "set"],
  ];
  function normalize(text) {
    return String(text || "").toLowerCase().replace(/ё/g, "е")
      .replace(/(мини|mini)(?=рол|roll)/g, "$1 ")
      .replace(/[^a-zа-я0-9]+/g, " ").trim();
  }
  function canonical(word) {
    const latin = word.replace(/[а-яё]/g, (letter) => letters[letter]);
    for (const [pattern, replacement] of aliases) if (pattern.test(latin)) return replacement;
    return latin;
  }
  function tokens(text) { return normalize(text).split(/\s+/).filter(Boolean).map(canonical); }
  function keyboard(text, from, to) {
    return text.replace(/./g, (letter) => from.includes(letter) ? to[from.indexOf(letter)] : letter);
  }
  function queryTokens(query) {
    // Convert layout before punctuation removal: ; and , can stand for ж and б.
    const raw = String(query || "").toLowerCase().trim();
    return [raw, keyboard(raw, englishKeys, russianKeys), keyboard(raw, russianKeys, englishKeys)]
      .map((variant) => tokens(variant).filter((word) => !stopWords.has(word))).filter((words) => words.length);
  }
  function distance(left, right) {
    const rows = Array.from({length:left.length + 1}, () => Array(right.length + 1).fill(0));
    for (let i = 0; i <= left.length; i++) rows[i][0] = i;
    for (let j = 0; j <= right.length; j++) rows[0][j] = j;
    for (let i = 1; i <= left.length; i++) for (let j = 1; j <= right.length; j++) {
      rows[i][j] = Math.min(rows[i-1][j]+1, rows[i][j-1]+1, rows[i-1][j-1]+(left[i-1]===right[j-1] ? 0 : 1));
      if (i > 1 && j > 1 && left[i-1] === right[j-2] && left[i-2] === right[j-1]) rows[i][j] = Math.min(rows[i][j], rows[i-2][j-2]+1);
    }
    return rows[left.length][right.length];
  }
  function wordScore(query, candidate) {
    if (query === candidate) return 12;
    if (query.length >= 2 && candidate.startsWith(query)) return 9;
    if (query.length < 4 || /^\d+$/.test(query)) return 0;
    const limit = query.length >= 8 ? 2 : 1;
    if (Math.abs(query.length - candidate.length) > limit) return 0;
    const edits = distance(query, candidate);
    return edits <= limit ? 6 - edits : 0;
  }
  function search(categories, query) {
    const queries = queryTokens(query);
    if (!queries.length) return [];
    const results = [];
    categories.forEach((category) => category.items.forEach((item) => {
      const fields = [
        { words:tokens(item.name), weight:10 },
        { words:tokens(category.label || category.name), weight:3 },
        { words:tokens(`${item.description || ""} ${item.meta || ""} ${item.price || ""}`), weight:1 },
      ];
      let best = 0;
      for (const words of queries) {
        const scores = words.map((queryWord) => Math.max(0, ...fields.map((field) =>
          Math.max(0, ...field.words.map((word) => wordScore(queryWord, word))) * field.weight)));
        if (scores.every((score) => score > 0)) best = Math.max(best, scores.reduce((a,b) => a+b, 0) / words.length);
      }
      if (best) results.push({item, category, score:best});
    }));
    return results.sort((a,b) => b.score-a.score);
  }
  const api = {search};
  root.EdenMenuSearch = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
