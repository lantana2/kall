// Грубая оценка калорий/БЖУ на 100 г по названию блюда (офлайн-режим).
// Модель даёт только НАЗВАНИЕ, поэтому калории прикидываем по категории
// (ключевым словам). Это намеренно приблизительно — вес правит пользователь.

// [регэксп по названию, {ккал, белки, жиры, углеводы} на 100 г]
const RULES = [
  [/\b(fries|chips|fried potato)\b/, { calories: 310, protein: 4, fat: 15, carbs: 40 }],
  [/\b(pizza)\b/, { calories: 270, protein: 11, fat: 10, carbs: 33 }],
  [/\b(burger|hamburger|cheeseburger)\b/, { calories: 290, protein: 15, fat: 16, carbs: 25 }],
  [/\b(sandwich|sub|panini|toast|po' boy|po boy|burrito|taco|wrap|shawarma|kebab roll)\b/, { calories: 250, protein: 12, fat: 10, carbs: 28 }],
  [/\b(sushi|maki|sashimi|nigiri|temaki|roll)\b/, { calories: 145, protein: 8, fat: 4, carbs: 20 }],
  [/\b(dumpling|pelmeni|pierogi|gyoza|wonton|ravioli|momo|khinkali|manti|vareniki)\b/, { calories: 230, protein: 9, fat: 9, carbs: 28 }],
  [/\b(noodle|pasta|spaghetti|ramen|udon|soba|mac|lasagna|lasagne|fettuccine|penne|pad thai)\b/, { calories: 180, protein: 7, fat: 6, carbs: 25 }],
  [/\b(rice|risotto|pilaf|biryani|paella|fried rice|jollof)\b/, { calories: 150, protein: 3, fat: 3, carbs: 30 }],
  [/\b(cake|pie|tart|pastry|cookie|donut|doughnut|brownie|muffin|cheesecake|baklava|tiramisu|cupcake|croissant|eclair|pudding)\b/, { calories: 360, protein: 5, fat: 18, carbs: 45 }],
  [/\b(ice cream|gelato|sorbet)\b/, { calories: 210, protein: 4, fat: 11, carbs: 25 }],
  [/\b(chocolate|candy|caramel|fudge|praline)\b/, { calories: 500, protein: 6, fat: 30, carbs: 55 }],
  [/\b(pancake|waffle|crepe|blini|blintz|dosa)\b/, { calories: 230, protein: 6, fat: 8, carbs: 33 }],
  [/\b(bread|bun|bagel|baguette|loaf|roll|naan|pita|tortilla|focaccia|brioche)\b/, { calories: 270, protein: 9, fat: 4, carbs: 50 }],
  [/\b(salad|slaw|tabbouleh)\b/, { calories: 90, protein: 2, fat: 6, carbs: 6 }],
  [/\b(soup|broth|borscht|borsch|ramen soup|chowder|bisque|gazpacho|pho|shchi|solyanka)\b/, { calories: 55, protein: 3, fat: 2, carbs: 6 }],
  [/\b(stew|curry|goulash|chili|ragout|tagine|casserole)\b/, { calories: 130, protein: 9, fat: 7, carbs: 8 }],
  [/\b(omelet|omelette|frittata|scrambled|egg)\b/, { calories: 155, protein: 13, fat: 11, carbs: 1 }],
  [/\b(cheese|brie|camembert|mozzarella|cheddar)\b/, { calories: 350, protein: 23, fat: 28, carbs: 3 }],
  [/\b(chicken|poultry|turkey|duck)\b/, { calories: 200, protein: 25, fat: 11, carbs: 0 }],
  [/\b(fish|salmon|tuna|seafood|shrimp|prawn|cod|trout|herring|mackerel|squid|octopus|crab|lobster)\b/, { calories: 160, protein: 22, fat: 7, carbs: 0 }],
  [/\b(beef|steak|pork|lamb|veal|meat|sausage|bacon|ham|ribs|brisket|kebab|shashlik)\b/, { calories: 260, protein: 20, fat: 20, carbs: 2 }],
  [/\b(yogurt|oatmeal|porridge|cereal|granola|muesli)\b/, { calories: 95, protein: 4, fat: 2, carbs: 15 }],
  [/\b(smoothie|juice|cocktail|latte|coffee|tea|milkshake|lemonade|soda)\b/, { calories: 50, protein: 1, fat: 0, carbs: 11 }],
  [/\b(apple|banana|berry|berries|mango|orange|grape|melon|peach|pear|pineapple|strawberr|fruit)\b/, { calories: 60, protein: 1, fat: 0, carbs: 14 }],
  [/\b(vegetable|veggie|broccoli|carrot|spinach|cabbage|tomato|cucumber)\b/, { calories: 45, protein: 2, fat: 0, carbs: 8 }],
];

const DEFAULT = { calories: 200, protein: 8, fat: 9, carbs: 22 };

// Возвращает {calories, protein, fat, carbs} на 100 г для названия блюда.
export function estimateNutrition(label) {
  const s = String(label || '').toLowerCase();
  for (const [re, n] of RULES) {
    if (re.test(s)) return n;
  }
  return DEFAULT;
}
