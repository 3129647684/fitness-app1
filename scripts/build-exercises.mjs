import fs from 'node:fs';

const src = process.argv[2] || 'C:/Users/Lenovo/AppData/Local/Temp/exercises_full.json';
const out = process.argv[3] || 'd:/社会实践总/BodyDataApp/assets/data/exercises.json';

const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
if (!Array.isArray(raw)) throw new Error('源文件不是数组');

const zh = {
  chest: '胸', back: '背', legs: '腿', shoulders: '肩', triceps: '三头', biceps: '二头',
  neck: '斜方肌', forearms: '前臂', calves: '小腿', glutes: '臀部', abs: '腹部',
  stretching: '拉伸', cardio: '有氧', full_body: '全身',
};

function key(cat, target) {
  switch (cat) {
    case 'chest': return 'chest';
    case 'back': return 'back';
    case 'shoulders': return 'shoulders';
    case 'neck': return 'neck';
    case 'lower arms': return 'forearms';
    case 'lower legs': return 'calves';
    case 'cardio': return 'cardio';
    case 'upper legs': return target === 'glutes' ? 'glutes' : 'legs';
    case 'upper arms': return target === 'triceps' ? 'triceps' : 'biceps';
    case 'waist': return 'abs';
    default: return 'full_body';
  }
}

const rows = raw.map((d) => {
  let k = key(d.category, d.target);
  if (/stretch/i.test(d.name || '')) k = 'stretching';
  const ins = d.instructions || {};
  let desc = (ins.zh || ins.en || '').trim();
  if (desc.length > 120) desc = desc.slice(0, 120) + '…';
  return {
    id: String(d.id),
    name: String(d.name),
    bodyPart: k,
    muscle: zh[k],
    equipment: d.equipment ? String(d.equipment) : '',
    mediaId: `${d.id}-${d.media_id}`,
    desc,
  };
});

fs.writeFileSync(out, JSON.stringify(rows));

console.log(`生成完成: ${rows.length} 条 -> ${out}`);
const cnt = {};
rows.forEach((r) => { cnt[r.bodyPart] = (cnt[r.bodyPart] || 0) + 1; });
console.log('分类分布:');
console.log(Object.entries(cnt)
  .sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `  ${zh[k]}(${k}) = ${v}`)
  .join('\n'));