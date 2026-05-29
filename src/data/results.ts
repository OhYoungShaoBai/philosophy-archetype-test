import type { Archetype } from '../lib/types';

export const archetypes: Archetype[] = [
  {
    id: 'architect-reason',
    title: '理性的筑城者',
    englishTitle: 'The Architect of Reason',
    shortName: '筑城者',
    vector: { truth: 95, meaning: 86, ethics: 78, society: 24 },
    image: '/illustrations/architect-reason.png',
    summary: '你习惯把混乱的世界先变成结构，再判断自己该站在哪里。',
    insight:
      '你相信清晰的概念、可追问的理由和稳定的秩序。面对复杂问题时，你不急着表态，而是先寻找它背后的骨架：定义是否准确，推理是否完整，价值之间是否一致。你并不排斥情感，只是不愿让情感替代理解。',
    blindSpot:
      '你可能会把尚未成形的生命经验过早装进体系里。偶尔允许暧昧存在，并不等于放弃理性。',
    philosophers: ['柏拉图', '笛卡尔', '朱熹'],
    schools: ['理性主义', '理念论', '新儒家理学'],
    readingHint: '适合从《理想国》或《谈谈方法》开始，观察思想如何为世界搭起脚手架。',
  },
  {
    id: 'skeptic-mist',
    title: '雾中的怀疑者',
    englishTitle: 'The Skeptic in the Mist',
    shortName: '怀疑者',
    vector: { truth: 9, meaning: 42, ethics: 46, society: 50 },
    image: '/illustrations/skeptic-mist.png',
    summary: '你不轻易把任何答案当成终点，因为你知道确定性常常只是雾里的灯。',
    insight:
      '你对宏大叙事保持距离，也会警惕那些过分顺滑的解释。你更信任经验、证据和反复校正的判断。对你来说，怀疑不是冷漠，而是一种诚实：在看清之前，不急着相信。',
    blindSpot:
      '持续怀疑会保护你免于轻信，也可能让你错过投入。某些选择不需要绝对确定，只需要足够真诚。',
    philosophers: ['休谟', '皮浪', '王充'],
    schools: ['经验主义', '怀疑主义', '实证精神'],
    readingHint: '适合读休谟关于因果与习惯的讨论，感受怀疑如何成为一种清醒。',
  },
  {
    id: 'keeper-meaning',
    title: '意义的守夜人',
    englishTitle: 'The Keeper of Meaning',
    shortName: '守夜人',
    vector: { truth: 64, meaning: 96, ethics: 75, society: 68 },
    image: '/illustrations/keeper-meaning.png',
    summary: '你在意人为什么活着，也在意那些看似无用却支撑灵魂的东西。',
    insight:
      '你很难满足于“事情就是这样”。你会追问目标、承诺、记忆和价值的来源，并倾向于把人生理解为一种需要守护的秩序。你对传统、责任和长久之物有天然敏感，不愿让效率吞没意义。',
    blindSpot:
      '当你太想保护意义时，可能会对变化过度警惕。意义有时不是继承来的，而是在改变中重新长出来的。',
    philosophers: ['亚里士多德', '孔子', '泰勒'],
    schools: ['目的论', '德性伦理', '共同善思想'],
    readingHint: '适合读《尼各马可伦理学》和《论语》，看见意义如何落在日常实践里。',
  },
  {
    id: 'wanderer-absurd',
    title: '荒诞的漫游者',
    englishTitle: 'The Wanderer of the Absurd',
    shortName: '漫游者',
    vector: { truth: 35, meaning: 5, ethics: 32, society: 82 },
    image: '/illustrations/wanderer-absurd.png',
    summary: '你知道世界未必回答人，但人仍可以在沉默中选择自己的姿态。',
    insight:
      '你对现成意义保持怀疑，却不因此退回麻木。你更愿意承认人生的裂缝、偶然和不确定，然后在其中创造行动。你珍惜自由，也理解自由并不总是轻盈，它常常伴随着孤独和责任。',
    blindSpot:
      '拒绝虚假的意义很珍贵，但不要把所有稳定关系都误认为束缚。某些承诺也可能是自由的形状。',
    philosophers: ['加缪', '萨特', '庄子'],
    schools: ['存在主义', '荒诞主义', '逍遥思想'],
    readingHint: '适合读《西西弗神话》或《庄子》内篇，感受人在荒诞中的轻与重。',
  },
  {
    id: 'torchbearer-principle',
    title: '准则的执灯者',
    englishTitle: 'The Torchbearer of Principle',
    shortName: '执灯者',
    vector: { truth: 70, meaning: 72, ethics: 98, society: 48 },
    image: '/illustrations/torchbearer-principle.png',
    summary: '你相信有些事不能只问结果，还要问我们是否仍配得上自己的原则。',
    insight:
      '你对公正、承诺和边界有强烈敏感。面对诱人的捷径，你会追问：如果每个人都这样做，世界会变成什么样？你重视人的尊严，也愿意为不可让渡的原则付出代价。',
    blindSpot:
      '原则能照亮道路，也可能遮住具体的人。你最有力量的时候，是原则与同情同时在场。',
    philosophers: ['康德', '罗尔斯', '孟子'],
    schools: ['义务论', '契约论', '性善论'],
    readingHint: '适合读康德伦理学入门和《正义论》的基本问题，理解原则为何不是冷硬的规定。',
  },
  {
    id: 'mender-world',
    title: '尘世的修补者',
    englishTitle: 'The Mender of the World',
    shortName: '修补者',
    vector: { truth: 44, meaning: 45, ethics: 4, society: 58 },
    image: '/illustrations/mender-world.png',
    summary: '你关心思想能否真的减轻痛苦，而不只是把痛苦解释得更漂亮。',
    insight:
      '你天然把哲学拉回地面：它是否改善处境，是否减少伤害，是否让更多人活得好一点。你愿意调整规则、妥协方案，也愿意承认现实世界里很少有完美答案。',
    blindSpot:
      '务实不是庸俗，但太快计算得失时，可能会忽略某些不能被换算的尊严和承诺。',
    philosophers: ['密尔', '杜威', '墨子'],
    schools: ['功利主义', '实用主义', '兼爱思想'],
    readingHint: '适合读密尔和杜威，看看“有用”如何成为一种严肃的伦理问题。',
  },
  {
    id: 'firemaker-freedom',
    title: '自由的造火者',
    englishTitle: 'The Firemaker of Freedom',
    shortName: '造火者',
    vector: { truth: 55, meaning: 23, ethics: 38, society: 97 },
    image: '/illustrations/firemaker-freedom.png',
    summary: '你不愿只继承别人给出的生活样式，而想亲手点燃自己的可能性。',
    insight:
      '你对规训、标签和默认路径保持警觉。你相信人应该有权重新命名自己，重新选择关系、事业和价值。你身上有一种创造性的反抗：不是为了破坏一切，而是为了证明生命可以另有形状。',
    blindSpot:
      '自由不是永远离开，也包括承担自己点燃的火。真正的自我创造，需要能经受时间检验的选择。',
    philosophers: ['尼采', '密尔', '李贽'],
    schools: ['个人主义', '自由主义', '生命哲学'],
    readingHint: '适合读尼采的格言式文本和《论自由》，辨认自由与任性的边界。',
  },
  {
    id: 'weaver-commons',
    title: '城邦的编织者',
    englishTitle: 'The Weaver of the Commons',
    shortName: '编织者',
    vector: { truth: 57, meaning: 78, ethics: 68, society: 2 },
    image: '/illustrations/weaver-commons.png',
    summary: '你理解人不是孤岛，好的生活总要在关系、制度和共同记忆中被编织出来。',
    insight:
      '你关注个体之外的东西：公共生活、共同责任、传统如何塑造人，制度如何保护或伤害人。你不轻易把“个人选择”当作所有问题的答案，因为你知道选择总发生在某种共同世界里。',
    blindSpot:
      '共同体能承载人，也可能压低差异。你需要持续警惕：被维护的秩序，是否仍给少数声音留下空间。',
    philosophers: ['亚里士多德', '孔子', '桑德尔'],
    schools: ['社群主义', '政治哲学', '礼治思想'],
    readingHint: '适合读亚里士多德的城邦观和桑德尔的公共哲学，理解“我们”如何塑造“我”。',
  },
];
