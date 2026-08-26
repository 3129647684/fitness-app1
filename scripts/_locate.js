const t = require('fs').readFileSync('app/(tabs)/record.tsx', 'utf8').split('\n');
const keys = ['今日运动记录', '运动类型', 'SportPickerModal', 'SportDurationModal', 'CustomSportModal', 'FoodPickerModal()', 'exerciseType !== '];
t.forEach((l, i) => {
  for (const k of keys) {
    if (l.includes(k)) { console.log((i + 1) + ': ' + l.trim()); break; }
  }
});