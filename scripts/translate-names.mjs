import fs from 'node:fs';

const FILE = 'd:/社会实践总/BodyDataApp/assets/data/exercises.json';
const items = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// 词典：[英文, 中文]，翻译时按英文长度降序优先替换（\b 词边界）
const DICT = [
  // 器械 / 装备
  ['resistance band', '弹力带'], ['suspend strap', '悬吊带'], ['stability ball', '健身球'],
  ['medicine ball', '药球'], ['swiss ball', '瑞士球'], ['bosu ball', '波速球'], ['lever machine', '器械机'],
  ['smith machine', '史密斯机'], ['kettlebell', '壶铃'], ['dumbbell', '哑铃'], ['trap bar', '六角杠铃'],
  ['ez bar', '曲杆杠铃'], ['cambered bar', '开胸杠铃'], ['landmine', '炮筒'], ['sledgehammer', '大锤'],
  ['bench press', '卧推'], ['barbell', '杠铃'], ['cable', '绳索'], ['pulley', '滑轮'], ['machine', '器械'],
  ['sled', '雪橇'], ['roller', '泡沫轴'], ['band', '弹力带'], ['ball', '球'], ['rope', '绳索'],
  ['bar', '杠'], ['plate', '杠铃片'], ['towel', '毛巾'], ['wall', '墙面'], ['chair', '椅子'], ['box', '跳箱'],
  ['wheel', '车轮'], ['tire', '轮胎'], ['board', '木板'], ['bench', '卧推凳'], ['ring', '吊环'],
  ['bike', '单车'], ['treadmill', '跑步机'], ['stairmaster', '台阶机'], ['elliptical', '椭圆机'],
  // 动作动词
  ['deadlift', '硬拉'], ['pullover', '上拉'], ['pull-up', '引体向上'], ['pull up', '引体向上'],
  ['pull-down', '下拉'], ['pulldown', '下拉'], ['push-up', '俯卧撑'], ['pushup', '俯卧撑'],
  ['jumping jack', '开合跳'], ['jump rope', '跳绳'], ['burpee', '波比跳'], ['thruster', '火箭推'],
  ['shoulder press', '肩推'], ['overhead press', '过头推举'], ['military press', '军式推举'],
  ['leg press', '腿举'], ['leg extension', '腿屈伸'], ['leg curl', '腿弯举'], ['chest press', '胸部推举'],
  ['calf raise', '提踵'], ['calf trampoline', '提踵弹簧'], ['wrist curl', '腕弯举'], ['wrist roller', '卷腕'],
  ['wrist rotation', '转腕'], ['wrist circle', '绕腕'], ['hip thrust', '臀冲'], ['glute bridge', '臀桥'],
  ['hip extension', '髋伸'], ['hip abduction', '髋外展'], ['hip adduction', '髋内收'], ['lateral raise', '侧平举'],
  ['lateral lunge', '侧弓步'], ['front raise', '前平举'], ['rear delt', '后束'], ['rear deltoid', '后束'],
  ['bent-over', '俯身'], ['bent over', '俯身'], ['bent-over row', '俯身划船'], ['upright row', '直立划船'],
  ['upright shoulder', '直立肩'], ['face pull', '面拉'], ['reverse fly', '反向飞鸟'], ['reverse flyes', '反向飞鸟'],
  ['reverse grip', '反握'], ['reverse crunch', '反向卷腹'], ['reverse lunge', '反向弓步'],
  ['reverse hyperextension', '反向背伸'], ['reverse row', '反向划船'], ['reverse curl', '反向弯举'],
  ['close-grip', '窄握'], ['close grip', '窄握'], ['wide-grip', '宽握'], ['wide grip', '宽握'],
  ['narrow grip', '窄握'], ['neutral grip', '中立握'], ['underhand grip', '反握'], ['overhand grip', '正握'],
  ['hammer grip', '锤式握'], ['hammer curl', '锤式弯举'], ['preacher curl', '托臂弯举'],
  ['concentration curl', '集中弯举'], ['incline curl', '上斜弯举'], ['lying curl', '仰卧弯举'],
  ['seated curl', '坐姿弯举'], ['standing curl', '站姿弯举'], ['dumbbell curl', '哑铃弯举'],
  ['zottman curl', '佐特曼弯举'], ['cross-body curl', '交叉弯举'], ['spider curl', '蜘蛛弯举'],
  ['arnold press', '阿诺德推举'], ['arnold dumbbell', '阿诺德哑铃'], ['french press', '法式臂屈伸'],
  ['skull crusher', '头后臂屈伸'], ['scull crusher', '头后臂屈伸'], ['kickback', '臂后伸'],
  ['pushdown', '下压'], ['triceps pushdown', '三头下压'], ['triceps press-down', '三头下压'],
  ['tricep pushdown', '三头下压'], ['tricep extension', '三头臂屈伸'], ['triceps extension', '三头臂屈伸'],
  ['tricep kickback', '三头臂后伸'], ['triceps dip', '三头臂屈伸'], ['bench dip', '凳上臂屈伸'],
  ['parallel bar dip', '双杠臂屈伸'], ['bicep curl', '二头弯举'], ['biceps curl', '二头弯举'],
  ['barbell curl', '杠铃弯举'], ['incline dumbbell', '上斜哑铃'], ['cross-body raise', '交叉抬举'],
  ['incline press', '上斜卧推'], ['decline press', '下斜卧推'], ['flat bench', '平板卧推凳'],
  ['flat press', '平板推举'], ['incline', '上斜'], ['decline', '下斜'], ['flat', '平板'],
  ['bench press-down', '卧推下压'], ['cable crossover', '绳索夹胸'], ['chest fly', '胸部飞鸟'],
  ['chest flyes', '胸部飞鸟'], ['pectoral fly', '胸部飞鸟'], ['butterfly', '蝴蝶夹胸'], ['fly', '飞鸟'],
  ['breast', '胸部'], ['chest', '胸'], ['pec', '胸'], ['pec-deck', '夹胸机'], ['pullover', '上拉'],
  ['lat pulldown', '高位下拉'], ['lat pull-down', '高位下拉'], ['lat raise', '肩束抬举'],
  ['shrug', '耸肩'], ['upright', '直立'], ['upright barbell row', '直立杠铃划船'],
  ['seated', '坐姿'], ['standing', '站姿'], ['lying', '仰卧'], ['prone', '俯卧'], ['kneeling', '跪姿'],
  ['suspended', '悬吊'], ['stability', '稳定'], ['stiff-leg', '硬腿'], ['stiff leg', '硬腿'],
  ['single-leg', '单腿'], ['single leg', '单腿'], ['double-leg', '双腿'], ['one-leg', '单腿'],
  ['one leg', '单腿'], ['split squat', '分腿蹲'], ['bulgarian split squat', '保加利亚分腿蹲'],
  ['goblet squat', '高脚杯深蹲'], ['front squat', '颈前深蹲'], ['back squat', '颈后深蹲'],
  ['hack squat', '哈克深蹲'], ['sumo squat', '相扑深蹲'], ['pistol squat', '手枪深蹲'],
  ['sissy squat', '西斯深蹲'], ['cossack squat', '哥萨克蹲'], ['box squat', '跳箱深蹲'],
  ['overhead squat', '过头深蹲'], ['romanian deadlift', '罗马尼亚硬拉'], ['sumo deadlift', '相扑硬拉'],
  ['jefferson deadlift', '杰斐逊硬拉'], ['trap bar deadlift', '六角杠硬拉'], ['snatch', '抓举'],
  ['clean and jerk', '挺举'], ['clean', '高翻'], ['jerk', '挺举'], ['good morning', '早安式'],
  ['hyperextension', '山羊挺身'], ['back extension', '背屈伸'], ['superman', '超人式'],
  ['back raise', '背伸'], ['bridge', '桥'], ['glute', '臀'], ['hamstring', '腘绳'], ['hamstring curl', '腘绳弯举'],
  ['quadriceps', '股四头'], ['quads', '股四头'], ['adductor', '内收'], ['adduction', '内收'],
  ['abductor', '外展'], ['abduction', '外展'], ['calf', '小腿'], ['calves', '小腿'], ['ankle', '脚踝'],
  ['heel', '脚跟'], ['toe', '脚尖'], ['forearm', '前臂'], ['wrist', '腕'], ['deltoid', '三角肌'],
  ['delt', '三角肌'], ['trapezius', '斜方肌'], ['trap', '斜方肌'], ['levator scapulae', '肩胛提肌'],
  ['scapula', '肩胛'], ['oblique', '腹斜肌'], ['abdominal', '腹'], ['abs', '腹'], ['squat', '深蹲'],
  ['squatting', '深蹲'], ['lunge', '弓步'], ['step-up', '上台阶'], ['step up', '上台阶'], ['step', '台阶'],
  ['dead bug', '死虫式'], ['bird dog', '鸟狗式'], ['elbow plank', '肘撑平板支撑'], ['plank', '平板支撑'],
  ['side plank', '侧平板支撑'], ['side lying', '侧卧'], ['side', '侧'], ['crunch', '卷腹'],
  ['sit-up', '仰卧起坐'], ['russian twist', '俄罗斯转体'], ['twist', '转体'], ['rotation', '旋转'],
  ['windscreen', '挡风玻璃式'], ['windmill', '风车'], ['flutter kick', '扑腾踢腿'], ['scissor kick', '剪刀踢'],
  ['bicycle', '自行车卷腹'], ['jackknife', '折刀卷腹'], ['mountain climber', '登山者'],
  ['climber', '登山者'], ['inchworm', '毛毛虫'], ['crab', '蟹步'], ['tuck', '屈膝收腿'],
  ['pike', '折体'], ['handstand', '倒立'], ['planche', '前水平'], ['maltese', '马耳他式'],
  ['stalder', '斯塔德尔'], ['tewi', '提维'], ['flag', '旗'], ['flags', '旗式'], ['cocoons', '蝶式卷腹'],
  ['flutter', '扑腾'], ['kayak', '皮划艇式'], ['skier', '滑雪式'], ['ski', '滑雪'],
  ['pallof', '帕洛夫'], ['anti-rotation', '抗旋转'], ['antirotation', '抗旋转'],
  ['rotational', '旋转式'], ['diagonal', '对角'], ['wood chopper', '砍柴式'], ['chopper', '砍柴'],
  ['throw', '抛掷'], ['slam', '砸击'], ['swing', '摆动'], ['clean', '高翻'], ['drive', '驱动'],
  ['press', '推举'], ['pull', '拉'], ['push', '推'], ['row', '划船'], ['raise', '抬举'],
  ['extension', '伸展'], ['extensions', '伸展'], ['flexion', '屈伸'], ['curl', '弯举'], ['curls', '弯举'],
  ['lift', '拉起'], ['lift-off', '上举'], ['dip', '臂屈伸'], ['dips', '臂屈伸'], ['raise', '抬举'],
  // 修饰
  ['alternating', '交替'], ['alternate', '交替'], ['goblet', '高脚杯'], ['hindu', '印度式'],
  ['gironda', '吉朗达式'], ['thibaudeau', '蒂博多式'], ['single', '单'], ['double', '双'], ['two-hand', '双手'],
  ['one-arm', '单臂'], ['one arm', '单臂'], ['two-armed', '双臂'], ['two-handed', '双手'],
  ['three-point', '三点'], ['four-point', '四点'], ['weighted', '负重'], ['assisted', '辅助'],
  ['isometric', '静力'], ['isometric', '静力'], ['modified', '改良'], ['advanced', '进阶'],
  ['intermediate', '中级'], ['beginner', '初级'], ['dynamic', '动态'], ['reverse', '反向'],
  ['overhead', '过头'], ['behind-the-head', '头后'], ['behind the head', '头后'], ['behind-the-neck', '颈后'],
  ['behind neck', '颈后'], ['behind the neck', '颈后'], ['front', '前'], ['rear', '后'],
  ['high', '高'], ['low', '低'], ['half', '半'], ['quarter', '四分之一'], ['deep', '深蹲到底'],
  ['full', '全程'], ['wide', '宽'], ['narrow', '窄'], ['close', '窄距'], ['open', '开'], ['straight', '直臂'],
  ['stiff', '硬腿'], ['gripless', '无握'], ['gripper', '握力器'], ['farmer', '农夫'], ['carry', '行走'],
  ['walk', '行走'], ['walking', '行走'], ['march', '行军'], ['run', '跑'], ['sprint', '冲刺'], ['jogging', '慢跑'],
  ['hop', '跳'], ['hops', '跳'], ['jump', '跳跃'], ['jumps', '跳跃'], ['crawl', '爬行'], ['climb', '攀爬'],
  ['cuban', '古巴式'], ['french', '法式'], ['copenhagen', '哥本哈根式'], ['turkish', '土耳其'],
  ['get-up', '起身'], ['get up', '起身'], ['arm', '臂'], ['arms', '臂'], ['leg', '腿'], ['legs', '腿'],
  ['torso', '躯干'], ['elbow', '肘'], ['knee', '膝'], ['knees', '膝'], ['hip', '髋'], ['hips', '髋'],
  ['shoulder', '肩'], ['shoulders', '肩'], ['neck', '颈'], ['back', '背'], ['upper back', '上背'],
  ['middle back', '中背'], ['lower back', '下背'], ['head', '头'], ['finger', '手指'], ['hands', '双手'],
  ['hand', '手'], ['foot', '脚'], ['feet', '双脚'], ['bent', '俯身'], ['bend', '弯曲'], ['leaning', '侧倾'],
  ['leaning-on', '倚靠'], ['horizontal', '水平'], ['vertical', '垂直'], ['angular', '侧向'], ['landmine', '炮筒'],
  ['inverse', '反向'], ['inverted', '倒置'], ['elevated', '抬高'], ['raised', '抬升'], ['supported', '有支撑'],
  ['unilateral', '单侧'], ['stork', '单腿平衡'], ['balance', '平衡'], ['standing calf', '站姿提踵'],
  ['bradford', '布拉德福德'], ['rocky', '洛奇式'], ['suspended', '悬吊'], ['military', '军式'],
  ['iron cross', '铁十字'], ['star', '星式'], ['hollow', '空心支撑'], ['hollow body', '空心体'],
  ['pull-up', '引体向上'], ['chin-up', '引体向上'], ['chin up', '引体向上'], ['kipping', '摆动式'],
  ['chest-to-bar', '触胸'], ['to failure', '至力竭'], ['with', '＋'], ['using', '使用'], ['without', '无'],
  ['top', '顶部'], ['bottom', '底部'], ['hip-lift', '抬髋'], ['pelvic', '骨盆'], ['tilt', '倾'],
  ['reach', '前伸'], ['rollout', '滚轮推出'], ['rollerout', '滚轮推出'], ['roll-out', '滚轮推出'],
  ['self-assisted', '自我辅助'], ['stabilization', '稳定'], ['strengthening', '强化'], ['pose', '体式'],
  ['stretch', '拉伸'], ['stretches', '拉伸'], ['stretching', '拉伸'], ['yoga', '瑜伽'], ['mobility', '活动度'],
  ['worlds greatest', '世界最伟大'], ['greatest', '最伟大'], ['surgeon', '外科医生式'], ['fell', '坠'],
  ['hover', '悬停'], ['wall sit', '靠墙静蹲'], ['wall handstand', '靠墙倒立'], ['wall press', '靠墙推'],
  ['window wiper', '仰卧举腿转'], ['wiper', '摆动'], ['v-ups', 'V字卷腹'], ['v up', 'V字卷腹'],
  ['flutter kicks', '扑腾踢腿'], ['side-to-side', '左右'], ['side band', '侧向弹力带'], ['table top', '桌面式'],
  ['band around', '环绕弹力带'], ['seated band', '坐姿弹力带'], ['standing band', '站姿弹力带'],
  ['lying band', '仰卧弹力带'], ['jackknife sit-up', '折刀卷腹'], ['frog', '青蛙式'], ['touchers', '触地'],
  ['figure', '8字形'], ['pirach', '派拉物'], ['piriformis', '梨状肌'], ['grapevine', '藤蔓步'],
  ['carioca', '摆胯步'], ['supine', '仰卧'], ['prone', '俯卧'], ['captain', '队长椅'], ['chair', '椅'],
  ['floor', '地面'], ['grasshopper', '蚱蜢式'], ['groiner', '胯部拉伸'], ['sphinx', '斯芬克斯式'],
  ['cobra', '眼镜蛇式'], ['cat', '猫式'], ['bird', '鸟式'], ['dog', '狗式'], ['swimmer', '泳者式'],
  ['crocodile', '鳄鱼式'], ['pike', '折体'], ['straddle', '横叉'], ['lizard', '蜥蜴式'], ['prayer', '祈祷式'],
  ['amazi', '阿玛兹'], ['dislocates', '绕肩'], ['shoulder dislocate', '绕肩'], ['armpull', '臂拉'],
  ['swissballs', '瑞士球'], ['suspended', '悬吊'], ['chin', '引体'], ['grip', '握法'], ['trunk', '躯干'],
  ['bowling', '保龄球式'], ['bow', '弓'], ['candle', '蜡烛式'], ['happy baby', '快乐婴儿式'],
  ['warrior', '战士式'], ['triangle', '三角式'], ['chair pose', '幻椅式'], ['picnic', '野餐式'],
  ['supine', '仰卧'], ['scorpion', '蝎子式'], ['monster', '怪兽式'], ['bear crawl', '熊爬'],
  ['duck', '鸭步'], ['frog', '青蛙式'], ['inchworm', '毛毛虫'], ['spiderman', '蜘蛛侠式'], ['zombie', '僵尸式'],
  ['gironda', '吉朗达'], ['dead-position', '死位'], ['paused', '停顿'], ['press-pause', '停顿推举'],
  ['pause', '停顿'], ['totem', '图腾'], ['windmill', '风车'], ['resistance', '抗力'], ['swiss', '瑞士'],
  ['chinese', '中式'], ['stick', '棍'], ['broomstick', '扫帚棍'], ['brachiation', '攀杠'], ['towel', '毛巾'],
  ['plate-loaded', '杠铃片'], ['pin-loaded', '插销'], ['selectorized', '插片式'], ['rotary', '旋转式'],
  ['wrist faucet', '卷腕'], ['blood flow', '血流量'], ['occlusion', '加压'],
  // 第二批次高频残留
  ['rectus femoris', '股直肌'], ['pectoralis major', '胸大肌'], ['pectoralis minor', '胸小肌'],
  ['levator scapulae', '肩胛提肌'], ['serratus anterior', '前锯肌'], ['tibialis anterior', '胫骨前肌'],
  ['erector spinae', '竖脊肌'], ['hamstrings', '腘绳肌'], ['quadriceps', '股四头肌'], ['gluteus', '臀'],
  ['adductor', '内收'], ['adductors', '内收'], ['abductor', '外展'], ['abductors', '外展'],
  ['supraspinatus', '冈上肌'], ['infraspinatus', '冈下肌'], ['teres major', '大圆肌'],
  ['posterior deltoid', '后束'], ['anterior deltoid', '前束'], ['medial deltoid', '中束'],
  ['latissimus dorsi', '背阔肌'], ['spinal', '椎'], ['spine', '脊柱'], ['scapular', '肩胛'],
  ['tibialis', '胫骨'], ['peroneals', '腓骨肌'], ['femoral', '股'], ['sternum', '胸骨'],
  ['flexor', '屈肌'], ['extensor', '伸肌'], ['calf', '小腿'], ['calves', '小腿'], ['waist', '腰'],
  ['levator', '提肌'], ['depresor', '下压'], ['retractor', '后收'], ['deltoid', '三角肌'],
  ['lever', '器械'], ['smith machine', '史密斯机'], ['smith', '史密斯'], ['hanging', '悬垂'],
  ['twisting', '旋转式'], ['twisted', '扭转'], ['parallel', '平行臂'], ['cross-over', '交叉'],
  ['crossover', '交叉'], ['crossovers', '交叉'], ['cross', '交叉'], ['bodyweight', '自重'],
  ['zercher', '泽切'], ['pendlay', '攀德莱'], ['jm', 'JM'], ['sumo', '相扑'], ['hack', '哈克'],
  ['guillotine', '断头台式'], ['skullcrusher', '头后臂屈伸'], ['skull crusher', '头后臂屈伸'],
  ['russian', '俄罗斯式'], ['janda', '简达式'], ['otis', '奥蒂斯式'], ['frankenstein', '弗兰肯斯坦式'],
  ['rocky', '洛奇式'], ['curtsey', '屈膝礼'], ['archer', '弓箭手式'], ['archer pull', '引体式'],
  ['spider', '蜘蛛式'], ['gorilla', '猩猩式'], ['pirate', '海盗式'], ['turkish get-up', '土耳其起身'],
  ['turkish', '土耳其式'], ['farmers', '农夫式'], ['farmer', '农夫式'], ['sledge', '大锤'],
  ['battling', '战斗绳索'], ['slamball', '砸球'], ['slam', '砸击'], ['renegade', '叛徒式'],
  ['seesaw', '跷跷板式'], ['windmill', '风车式'], ['judo', '柔道式'], ['boxing', '拳击'],
  ['ski', '滑雪式'], ['skier', '滑雪式'], ['burpee', '波比跳'], ['plank', '平板支撑'],
  ['bear crawl', '熊爬'], ['duck walk', '鸭步'], ['inchworm', '毛毛虫式'], ['table', '桌式'], ['jackknife', '折刀式'],
  ['straddle', '横叉'], ['split leap', '分腿跳'], ['stork', '单腿平衡'], ['superman', '超人式'],
  ['flutter', '扑腾'], ['scissor', '剪刀式'], ['flutter kick', '扑腾踢腿'], ['cocoons', '蝶式'],
  ['toe touch', '触脚尖'], ['toe touchers', '触脚尖'], ['heel touch', '触脚跟'], ['knee raise', '提膝'],
  ['hip-lift', '抬髋'], ['pelvic tilt', '骨盆前倾'], ['pelvic', '骨盆'], ['tilt', '倾'], ['criss', '十字'],
  ['lordosis', '腰椎前凸'], ['kyphosis', '驼背'], ['gymnast', '体操式'], ['calisthenics', '徒手'],
  ['tool', '器械'], ['ring', '吊环'], ['reverse curls', '反向弯举'], ['leghold', '抱腿'],
  ['chloe', '克洛伊'], ['skater', '滑冰式'], ['potty', '深蹲式'], ['gravity', '重力'],
  ['depth', '深度'], ['paused', '停顿'], ['pause', '停顿'], ['speed', '速度'], ['power', '爆发力'],
  ['explosive', '爆发式'], ['negative', '离心'], ['isometric', '静力'], ['countermovement', '预摆'],
  ['drop', '下放'], ['range of motion', '全程幅度'], ['range', '幅度'], ['full range', '全幅度'],
  ['partial', '半程'], ['halfway', '中途'], ['semi', '半'], ['eccentric', '离心'], ['concentric', '向心'],
  ['internal rotation', '内旋'], ['external rotation', '外旋'], ['internal', '内'], ['external', '外'],
  ['pronation', '旋前'], ['supination', '旋后'], ['pronated', '正握'], ['supinated', '反握'], ['pronate', '旋转'],
  ['skull', '头后'], ['rack pull', '架上拉'], ['rack', '杠铃架'], ['drag curl', '拖臂弯举'], ['drag', '拖臂'],
  ['pin presses', '增幅推举'], ['pin press', '增幅推举'], ['pin', '插销'], ['sitting', '坐姿'], ['sitted', '坐姿'],
  ['sit', '坐'], ['circular', '环绕'], ['circle', '画圆'], ['circles', '画圆'], ['rocking', '晃动'],
  ['palm-up', '掌心向上'], ['palm-down', '掌心向下'], ['palms', '掌心'], ['palm', '掌心'], ['blade', '肩胛'],
  ['fixed', '固定'], ['pov', '视角'], ['blaster', '固定托架'], ['jack', ''], ['knife', '刀式'], ['stance', '站距'],
  ['motion', '幅度'], ['astride', '分腿'], ['squad', '蹲'], ['glutes', '臀'], ['gluteus', '臀'], ['lateral', '侧'],
  ['over', ''], ['air', ''], ['forth', ''], ['revers', '反向'], ['bending', '弯曲'], ['bend', '弯曲'],
  ['swing', '摆动'], ['squad', '蹲'], ['quad', '股四头'], ['hip hinge', '髋铰链'], ['hinge', '铰链'],
  ['anti', '抗'], ['burn', '燃脂'], ['jackknife', '折刀式'], ['clap', '拍手'], ['diagonal', '对角'],
  ['sequence', '序列'], ['pro world', '职业'], ['pro', ''], ['stirrups', '镫形'], ['canvas', '帆布'],
  ['apparatus', '器械'], ['specialty', '专项'], ['utility', '通用'], ['preacher', '托臂'],
  ['captain', '队长椅'], ['stiff', '硬腿'], ['leant', '前倾'], ['reach', '前伸'], ['straddle', '横叉'],
  ['pull-ups', '引体向上'], ['push-ups', '俯卧撑'], ['sit-ups', '仰卧起坐'], ['chin-ups', '引体向上'],
  ['butt-ups', '臀桥起伏'], ['underhand', '反握'], ['overhand', '正握'], ['attachment', '配件'],
  ['middle', '中束'], ['inner', '内'], ['upper', '上'], ['lower', '下'], ['jefferson', '杰斐逊'],
  ['y-raise', 'Y字抬举'], ['rollout', '滚轮推出'], ['rollerout', '滚轮推出'], ['biceps', '二头'],
  ['concentration', '集中'], ['extended', '伸展'], ['extend', '伸展'], ['ab', '腹'], ['quads', '股四头'],
  ['rows', '划船'], ['shrugs', '耸肩'], ['flyes', '飞鸟'], ['sticks', '棍'], ['sticks', '棍'],
  // 清理噪音
  ['male', ''], ['female', ''], ['version', ''], ['exercise', ''], ['equipment', ''], ['variation', ''],
  ['on', ''], ['up', ''], ['to', ''], ['two', ''], ['and', ''], ['the', ''], ['in', ''], ['one', ''],
  ['of', ''], ['from', ''], ['against', ''], ['a', ''], ['between', ''], ['self', ''], ['off', ''],
  ['out', ''], ['through', ''], ['forward', ''], ['backward', ''], ['around', ''], ['across', ''],
  ['above', ''], ['into', ''], ['plus', ''], ['inside', ''], ['outside', ''], ['support', ''],
  ['behind', ''] , ['under', ''], ['both', ''], ['all', ''], ['for', ''], ['down', ''], ['apart', ''],
  ['left', ''], ['right', ''], ['pass', ''], ['point', ''], ['touch', ''], ['position', ''],
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RULES = DICT
  .filter(([en]) => en)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([en, zh]) => [new RegExp('\\b' + esc(en) + '\\b', 'gi'), zh]);

function translate(name) {
  let s = ' ' + name + ' ';
  for (const [re, zh] of RULES) {
    if (!re.test(s)) continue;
    re.lastIndex = 0;
    s = s.replace(re, zh);
  }
  // 清理残留：单字母标记(v/e/jm/t/sz/ab/w 等) + 版本号 + 括号空参
  s = s.replace(/\bv\.?\s*\d+\b/gi, ' ');
  s = s.replace(/\b[vjteiszsw]y?k?\b/gi, ' '); // 模糊清理常见单字母标记
  s = s.replace(/\(\s*\)|\(\s+\)/g, ' ');
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}

let stillEnglish = 0;
const leftovers = [];
for (const it of items) {
  const zh = translate(it.name);
  it.nameZh = zh;
  if (/[A-Za-z]/.test(zh)) {
    stillEnglish++;
    leftovers.push(it.name + ' => ' + zh);
  }
}

fs.writeFileSync(FILE, JSON.stringify(items));
console.log('已更新 ' + items.length + ' 条，写入 nameZh');
console.log('仍含英文: ' + stillEnglish + ' 条');
console.log('\n=== 抽样预览(胸) ===');
items.filter(i => i.bodyPart === 'chest').slice(0, 12).forEach(i => console.log('  ' + i.name + '  ->  ' + i.nameZh));
console.log('\n=== 仍含英文的样本 ===');
leftovers.slice(0, 40).forEach(l => console.log('  ' + l));