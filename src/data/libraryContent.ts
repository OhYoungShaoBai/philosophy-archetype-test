export interface ArchetypeGuideNote {
  guideQuestion: string;
  bridgeNote: string;
}

export interface LibraryPathStep {
  label: string;
  title: string;
  description: string;
  targetKind: 'archetype' | 'philosopher' | 'school' | 'reading';
  targetId: string;
}

export interface LibraryPath {
  id: 'my-archetype' | 'five-domains' | 'school-map';
  eyebrow: string;
  title: string;
  description: string;
  steps: LibraryPathStep[];
}

export const archetypeGuideNotes: Record<string, ArchetypeGuideNote> = {
  'empirical-calibrator': {
    guideQuestion: '当证据还不完整时，你怎样决定哪些承诺已经值得开始？',
    bridgeNote: '可以从休谟的有限知识进入，再把杜威的实验精神当作行动校准器。',
  },
  'rational-configurer': {
    guideQuestion: '一套好规则应该先保护一致性，还是先容纳例外经验？',
    bridgeNote: '从康德的条件追问进入，再看罗尔斯如何把私人判断翻译成公共理由。',
  },
  'idea-builder': {
    guideQuestion: '当一个标签限制了你，你会先改写语言，还是先改变生活处境？',
    bridgeNote: '从观念论和存在主义进入，理解命名、自由与责任如何互相牵动。',
  },
  'natural-observer': {
    guideQuestion: '哪些习惯正在滋养你，哪些只是因为熟悉而继续占据生活？',
    bridgeNote: '从斯宾诺莎的自然整体和亚里士多德的实践智慧进入，会更容易读懂这种稳健。',
  },
  'purpose-guardian': {
    guideQuestion: '你守护的“应当”是在养成生活，还是在替差异提前关门？',
    bridgeNote: '从目的论、儒家修身和理学传统进入，可以把方向感读成长期工夫。',
  },
  'relation-weaver': {
    guideQuestion: '在一个关系难题里，谁需要被接住，谁又需要被允许退出？',
    bridgeNote: '过程哲学、关系本体论和关怀伦理能帮你把“连接”读得更清楚。',
  },
  'consequence-mender': {
    guideQuestion: '一次有效修补之外，你还希望留下什么可靠边界和长期能力？',
    bridgeNote: '从实用主义和后果主义进入，再让批判理论提醒你追问伤害从何而来。',
  },
  'principle-gatekeeper': {
    guideQuestion: '面对极端后果时，你最不愿交换的原则要怎样被重新说明？',
    bridgeNote: '义务论、权利论和自由主义能帮助你把边界感读成尊严的条件。',
  },
  'virtue-cultivator': {
    guideQuestion: '你最近的选择正在把你养成什么样的人，这个方向值得继续吗？',
    bridgeNote: '德性伦理和儒家修身适合把一次选择放回长期习惯与共同体中阅读。',
  },
  'care-coordinator': {
    guideQuestion: '哪些照护应该留给私人善意，哪些必须被公共规则共同承担？',
    bridgeNote: '关怀伦理能看见具体脆弱，共和主义和杜威式公共生活能补上制度想象。',
  },
  'freedom-advocate': {
    guideQuestion: '你想保留的自由依赖哪些看不见的关系、制度和公共条件？',
    bridgeNote: '密尔、萨特和尼采可以分别打开自由的边界、重量和创造性危险。',
  },
  'polis-designer': {
    guideQuestion: '一条公共规则如何同时建造共同善，又给异质生活留下出口？',
    bridgeNote: '从亚里士多德、卢梭和罗尔斯进入，适合把好生活读成公共设计问题。',
  },
  'community-inheritor': {
    guideQuestion: '你珍惜的传统正在保护什么，又可能让谁失去重新命名的声音？',
    bridgeNote: '儒家、社群主义和麦金太尔能帮你分辨传统的承载力与压力。',
  },
  'equality-revaluator': {
    guideQuestion: '一条看似中立的规则方便了谁、压低了谁，又可以怎样修补？',
    bridgeNote: '批判理论、平等主义和关怀伦理会把个人不适推进到结构分析。',
  },
  'absurd-clear-sighted': {
    guideQuestion: '当终极保证撤走之后，你仍愿意为什么保持清醒和负责？',
    bridgeNote: '从加缪、萨特和庄子进入，可以把荒诞读成不投降的生活姿态。',
  },
};

export const libraryLearningPaths: LibraryPath[] = [
  {
    id: 'my-archetype',
    eyebrow: 'Path 01',
    title: '按我的原型读下去',
    description: '从一个原型开始，依次看它的判断方式、相邻思想家、流派语言和第一本书。',
    steps: [
      {
        label: '原型',
        title: '先读原型画像',
        description: '把结果当作入口，先看它真正想保护什么，以及压力下容易失衡在哪里。',
        targetKind: 'archetype',
        targetId: 'empirical-calibrator',
      },
      {
        label: '思想家',
        title: '再找相邻思想家',
        description: '思想家不是标准答案，而是帮你把一种直觉读得更细的邻座。',
        targetKind: 'philosopher',
        targetId: 'hume',
      },
      {
        label: '流派',
        title: '把直觉翻译成流派',
        description: '流派标签用于定位问题，不用于把人固定成某一种主义。',
        targetKind: 'school',
        targetId: 'empiricism',
      },
      {
        label: '阅读',
        title: '最后选一本入口书',
        description: '先读与你结果相关的章节，不急着一次读完整个思想史。',
        targetKind: 'reading',
        targetId: 'hume-enquiry-human-understanding',
      },
    ],
  },
  {
    id: 'five-domains',
    eyebrow: 'Path 02',
    title: '按五领域追问',
    description: '从认识、真实、伦理、公共生活和人生方向五个问题，横向拆开自己的判断习惯。',
    steps: [
      {
        label: '认识',
        title: '我怎样相信一个说法',
        description: '先看经验主义与怀疑主义，理解为什么确定性总需要被校准。',
        targetKind: 'school',
        targetId: 'empiricism',
      },
      {
        label: '真实',
        title: '我怎样理解存在',
        description: '再看过程哲学，把真实读成事件、变化和相互生成。',
        targetKind: 'school',
        targetId: 'process-philosophy',
      },
      {
        label: '伦理',
        title: '我怎样对人负责',
        description: '进入关怀伦理，看具体脆弱性如何补足抽象原则。',
        targetKind: 'school',
        targetId: 'care-ethics',
      },
      {
        label: '公共',
        title: '我怎样面对共同规则',
        description: '公共理性会要求私人信念转化成他人也能讨论的理由。',
        targetKind: 'school',
        targetId: 'public-reason',
      },
      {
        label: '意义',
        title: '我怎样承担人生方向',
        description: '存在主义适合进入没有预设答案时的自由、责任和不安。',
        targetKind: 'school',
        targetId: 'existentialism',
      },
    ],
  },
  {
    id: 'school-map',
    eyebrow: 'Path 03',
    title: '按流派谱系串联',
    description: '从一种主义走向它的邻近问题，看看思想之间不是孤岛，而是互相牵引的地图。',
    steps: [
      {
        label: '结构',
        title: '理性主义',
        description: '先理解概念、推理和内部连贯为什么能给混乱处境搭骨架。',
        targetKind: 'school',
        targetId: 'rationalism',
      },
      {
        label: '边界',
        title: '义务论',
        description: '再看原则为何不能完全被后果吞没，尊严如何成为不可交换的门槛。',
        targetKind: 'school',
        targetId: 'deontology',
      },
      {
        label: '公共',
        title: '共和主义',
        description: '把个人原则推进公共生活，追问怎样避免任意支配。',
        targetKind: 'school',
        targetId: 'republicanism',
      },
      {
        label: '修正',
        title: '批判理论',
        description: '最后检查制度和语言如何塑造处境，让地图保持可修正。',
        targetKind: 'school',
        targetId: 'critical-theory',
      },
    ],
  },
];
