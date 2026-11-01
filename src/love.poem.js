/**
 * 如果浪漫可以被编译
 * If Love Could Be Compiled
 *
 * 数学给光以形状；时间让相遇成为陪伴。
 * 我们无法预知所有明天，却可以认真选择每一个今天。
 * 这个模块不是橱窗里的诗：每一帧都从这里经过。
 */
export const palette = Object.freeze({
  night: '#050711', starlight: '#7B9CFF',
  tenderness: '#FF86B7', heartbeat: '#FF4D79',
  tomorrow: '#FFD6A0', paper: '#EAF0FF',
});

// 永恒不必是无穷循环。愿意再次选择，就是下一次心跳。
export function heartbeatAt(seconds, touch = 0) {
  const moment = (seconds * 0.78) % 1;
  const first = Math.exp(-(((moment - 0.12) / 0.045) ** 2));
  const echo = Math.exp(-(((moment - 0.28) / 0.065) ** 2));
  return 1 + first * 0.045 + echo * 0.022 + touch * 0.075;
}

// 在同一个方程里，允许每一点拥有不同的深度。
export function heartPoint(angle, depth = 0, closeness = 1) {
  const x = 16 * Math.sin(angle) ** 3;
  const y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle)
          - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);
  return { x: x / 18 * closeness, y: -y / 18 * closeness, z: depth };
}

// 蓄势，半秒静默，绽放；再从不同的远方回到同一个答案。
export const emotionalScore = Object.freeze({
  bloom: { gather: 10, silence: 12, burst: 12.6, vortex: 15.5, returnAt: 18, reborn: 22 },
  confession: { dissolve: 3, read: 10, release: 19, rest: 27 },
  interactionCooldown: .8,
});

export const alternatives = [
  '我们终将走向不同的远方，但那些并肩的时刻永远闪光。',
  '我想把所有未完成的梦，写成和你有关的下一行。',
  '愿我们既有奔赴山海的勇气，也有珍惜眼前人的温柔。',
  '世界是一场漫长的运算，而相遇是最不可思议的答案。',
];

export const letter = `/*
 * Dear You,
 *
 * 我曾尝试定义永恒，
 * 却发现时间从不接受这样的变量。
 *
 * 于是我把每一次相遇，
 * 写进不会遗失的记忆。
 */

const love = {
    beginning: "初见",
    duration: Infinity,
    destination: "与你并肩的未来"
};

function everyTomorrow() {
    return choose(you);
}`;

export const acts = [
  {
    name: '初始化', en: 'INITIALIZATION', duration: 18,
    code: `// Trying to understand love...\n\nconst universe = new Universe();\nconst me = new OrdinaryPerson();\n\nlet heartbeat = 0;\nlet memories = [];\nlet forever = undefined;`,
    poems: ['在遇见你之前，', '世界只是无数等待执行的指令。'],
    status: 'INITIALIZING EMOTIONS…  /  LOADING MEMORIES…',
  },
  {
    name: '异常', en: 'THE EXCEPTION', duration: 22,
    code: `while (world.isRunning) {\n    heartbeat++;\n\n    if (you.appear) {\n        heartbeat = Infinity;\n        break;\n    }\n}\n\n// WARNING: Unexpected emotion detected.\n// Variable "heartbeat" exceeds expected range.\n// Possible cause: YOU.`,
    poems: ['我以为所有心动都有迹可循。', '直到你成为唯一的例外。'],
    status: 'UNEXPECTED EMOTION DETECTED  /  POSSIBLE CAUSE: YOU',
  },
  {
    name: '编译', en: 'BLOOMING IN CODE', duration: 28,
    code: `function compileLove(memories, tenderness) {\n    const moments = memories.map(\n        memory => memory.turnIntoStarlight()\n    );\n\n    return moments.reduce(\n        (universe, light) => universe + light,\n        tenderness\n    );\n}`,
    poems: ['原来最温柔的程序，', '不需要复杂的算法。', '只需要一个人，', '让漫长岁月有了值得期待的答案。'],
    status: 'COMPILING TENDERNESS  /  TURNING MEMORIES INTO LIGHT',
  },
  {
    name: '心动', en: 'ONE IN A UNIVERSE', duration: 34,
    poems: ['世界有千万种可能。', '而我偏偏，想与你共享余生的每一次日出。', '爱不是程序的输出，', '而是我愿意不断运行的过程。'],
    status: 'COMPILATION SUCCESSFUL',
  },
  {
    name: '诗行', en: 'COMMENTS FOR A LIFETIME', duration: 34,
    code: letter,
    poems: ['若世界是一场永不停歇的编译，', '愿我们在各自的征途中闪闪发光。', '愿所有未曾说出口的温柔，', '都有一个值得奔赴的方向。'],
    status: 'EVERY TOMORROW  /  RETURN CHOOSE(YOU)',
  },
  {
    name: '继续', en: 'STILL RUNNING', duration: 36,
    poems: ['倘若浪漫可以被编译，', '愿你是我永不终止的程序。'],
    status: 'BUILD SUCCESSFUL  /  0 ERRORS. 0 WARNINGS.',
  },
];

export const stills = [
  { name: '封面', act: -1, seconds: 0 },
  { name: 'A · 编译', act: 2, seconds: 13 },
  { name: 'B · 心动', act: 3, seconds: 29 },
  { name: '把余生写成注释', act: 4, seconds: 15 },
  { name: '代码解码', act: 1, seconds: 7 },
  { name: '粒子成诗', act: 2, seconds: 12 },
  { name: '绽放重生', act: 3, seconds: 21.8 },
  { name: '最终告白', act: 5, seconds: 15 },
  { name: '永恒之心', act: 5, seconds: 32 },
];
