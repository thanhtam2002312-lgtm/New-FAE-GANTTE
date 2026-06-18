export const badgeColors = [
  "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  "bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300",
  "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
];

const stringColorMap = new Map<string, string>();
let colorIndex = 0;

export const getBadgeColor = (text: string) => {
  if (!text || text === '未分配' || text === '无产品线' || text === '无任务' || text === '无状态' || text === '无料号') {
    return "bg-black/5 text-[#8E8E93] dark:bg-white/10 dark:text-[#E5E5EA]";
  }
  
  if (stringColorMap.has(text)) {
    return stringColorMap.get(text)!;
  }
  
  const color = badgeColors[colorIndex % badgeColors.length];
  stringColorMap.set(text, color);
  colorIndex++;
  
  return color;
};
