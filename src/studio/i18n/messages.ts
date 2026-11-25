export type Locale = 'en' | 'zh';

export interface Messages {
  stackPrefix: string;
  browse: string;
  author: string;
  skinClassic: string;
  skinKiroween: string;
  msgBtn: string;
  exportBtn: string;
  newBlankStack: string;
  resetDemo: string;
  openJson: string;
  exportHtmlTitle: string;
  exportHtmlDesc: string;
  shareLinkTitle: string;
  shareLinkDesc: string;
  exportJsonTitle: string;
  exportJsonDesc: string;
  muteAudio: string;
  unmuteAudio: string;
  prev: string;
  next: string;
  cardOf: (cur: number, total: number) => string;
  peekScript: string;
  stageTagline: string;
  cancel: string;
  ok: string;
  objectsLabel: string;
  paintLabel: string;
  ditherImg: string;
  patternLabel: string;
  clearArt: string;
  patSolid: string;
  patStipple: string;
  patHatch: string;
  patCheck: string;
  tabScript: string;
  tabDebug: string;
  tabProps: string;
  validAst: string;
  errorsCount: (n: number) => string;
  runHandler: (name: string) => string;
  snipNextCard: string;
  snipAsk: string;
  liveGlobals: string;
  noGlobals: string;
  emptyVal: string;
  stepModeLabel: string;
  nextStep: string;
  continueRun: string;
  pausedAt: (line: number, summary: string) => string;
  runtimeErrorPrefix: string;
  sandboxSafety: string;
  astStepsUsed: string;
  evalDisabled: string;
  execTrace: (n: number) => string;
  noTraceYet: string;
  selectedObj: (type: string) => string;
  cardStackProps: string;
  propName: string;
  propLabel: string;
  propStyle: string;
  propAccent: string;
  propLocked: string;
  propText: string;
  propVisible: string;
  propBounds: string;
  propStackTitle: string;
  propCardName: string;
  propsHint: string;
  duplicate: string;
  delete: string;
  addCard: string;
  dupCard: string;
  objCount: (n: number) => string;
  msgPlaceholder: string;
  run: string;
  ditherTitle: string;
  uploadPhoto: string;
  sampleTitle: string;
  sampleMountains: string;
  sampleSphere: string;
  algorithmLabel: string;
  atkinson1987: string;
  threshold: string;
  brightness: string;
  contrast: string;
  stampCard: string;
  toastUndone: string;
  toastRedone: string;
  toastSaved: string;
  toastBlank: string;
  toastLoaded: (title: string) => string;
  toastExportedHtml: (slug: string, kb: number) => string;
  toastExportedJson: (slug: string) => string;
  toastShareCopied: string;
  toastShareTooBig: string;
  toastShareHash: string;
  toastStamped: string;
  toastMinCard: string;
  toastLangSwitched: string;
}

export const MESSAGES: Record<Locale, Messages> = {
  en: {
    stackPrefix: 'Stack',
    browse: 'Browse',
    author: 'Author',
    skinClassic: '1987 Cream',
    skinKiroween: 'Kiroween Dusk',
    msgBtn: '⌘M Msg',
    exportBtn: 'Export',
    newBlankStack: 'New Blank Stack',
    resetDemo: 'Reset Current Demo',
    openJson: 'Open .hcstack.json...',
    exportHtmlTitle: 'Export Single-File .html',
    exportHtmlDesc: 'Offline playable file with embedded HyperTalk engine',
    shareLinkTitle: 'Copy Share Link',
    shareLinkDesc: 'Encodes stack into #stack= URL hash',
    exportJsonTitle: 'Download .hcstack.json',
    exportJsonDesc: 'Clean JSON format compatible with hypercrypt-mcp',
    muteAudio: 'Mute audio',
    unmuteAudio: 'Unmute audio',
    prev: '◀ Prev',
    next: 'Next ▶',
    cardOf: (cur, total) => `Card ${cur} of ${total}`,
    peekScript: 'Peek Script',
    stageTagline: '512×342 1-Bit · Zero Backend',
    cancel: 'Cancel',
    ok: 'OK',
    objectsLabel: 'Objects',
    paintLabel: '1-Bit Paint',
    ditherImg: 'Dither Img',
    patternLabel: 'Pattern',
    clearArt: 'Clear Art',
    patSolid: 'Solid',
    patStipple: '50%',
    patHatch: 'Hatch',
    patCheck: 'Check',
    tabScript: 'Script',
    tabDebug: 'Debug',
    tabProps: 'Props',
    validAst: '✓ Valid AST',
    errorsCount: (n) => `✗ ${n} Error(s)`,
    runHandler: (name) => `Run ${name}`,
    snipNextCard: '+ Next Card',
    snipAsk: '+ Ask',
    liveGlobals: 'Live Globals',
    noGlobals: 'No global variables set yet.',
    emptyVal: 'empty',
    stepModeLabel: 'Step Mode (Pause Each AST Line)',
    nextStep: 'Next Step',
    continueRun: 'Continue',
    pausedAt: (line, summary) => `Paused at Line ${line}: ${summary}`,
    runtimeErrorPrefix: 'Runtime Error:',
    sandboxSafety: 'Sandbox Safety',
    astStepsUsed: 'AST Steps Used',
    evalDisabled: 'DISABLED',
    execTrace: (n) => `Execution Trace (${n})`,
    noTraceYet: 'Click any scripted button or run a handler to inspect trace events.',
    selectedObj: (type) => `Selected ${type}`,
    cardStackProps: 'Card & Stack Properties',
    propName: 'Name',
    propLabel: 'Label',
    propStyle: 'Style',
    propAccent: 'Primary Accent',
    propLocked: 'Locked (Read-Only)',
    propText: 'Text Content',
    propVisible: 'Visible',
    propBounds: 'Bounds',
    propStackTitle: 'Stack Title',
    propCardName: 'Card Name',
    propsHint: 'Click any button or field on the card to edit its position, style, or HyperTalk script.',
    duplicate: 'Duplicate',
    delete: 'Delete',
    addCard: 'Card',
    dupCard: 'Dup',
    objCount: (n) => `${n} obj`,
    msgPlaceholder: 'Type any HyperTalk command, e.g. go to card 2 or play "chime"',
    run: 'Run',
    ditherTitle: 'Bill Atkinson 1-Bit Dither Importer (512×342)',
    uploadPhoto: 'Upload Photo (PNG/JPG)',
    sampleTitle: 'Or Try Built-In Sample',
    sampleMountains: 'Mountains',
    sampleSphere: '3D Sphere',
    algorithmLabel: 'Algorithm',
    atkinson1987: 'Atkinson 1987',
    threshold: 'Threshold',
    brightness: 'Brightness',
    contrast: 'Contrast',
    stampCard: 'Stamp onto Active Card',
    toastUndone: 'Undone',
    toastRedone: 'Redone',
    toastSaved: 'Saved locally',
    toastBlank: 'Created blank stack in Author Mode',
    toastLoaded: (title) => `Loaded "${title}"`,
    toastExportedHtml: (slug, kb) => `Exported standalone ${slug}.html (${kb} KB)`,
    toastExportedJson: (slug) => `Saved ${slug}.hcstack.json`,
    toastShareCopied: 'Shareable stack URL copied to clipboard!',
    toastShareTooBig: 'Stack has large pixel art—use Export .html or .hcstack.json instead!',
    toastShareHash: 'Updated URL hash—copy address bar to share!',
    toastStamped: 'Stamped 1-bit Atkinson dither artwork onto card!',
    toastMinCard: 'A stack must keep at least 1 card.',
    toastLangSwitched: 'Switched to English',
  },
  zh: {
    stackPrefix: '卡片栈',
    browse: '游玩',
    author: '创作',
    skinClassic: '1987 暖白',
    skinKiroween: '星夜万圣',
    msgBtn: '⌘M 命令',
    exportBtn: '导出',
    newBlankStack: '新建空白卡片栈',
    resetDemo: '重置当前示例',
    openJson: '导入 .hcstack.json...',
    exportHtmlTitle: '导出单文件 .html',
    exportHtmlDesc: '内置完整 HyperTalk 引擎，永久离线运行',
    shareLinkTitle: '复制分享链接',
    shareLinkDesc: '将卡片栈编码到 #stack= 网址中',
    exportJsonTitle: '下载 .hcstack.json',
    exportJsonDesc: '标准 JSON 格式，可与 hypercrypt-mcp 联动',
    muteAudio: '静音音效',
    unmuteAudio: '开启音效',
    prev: '◀ 上一卡',
    next: '下一卡 ▶',
    cardOf: (cur, total) => `第 ${cur} / ${total} 卡`,
    peekScript: '查看脚本',
    stageTagline: '512×342 1-Bit · 纯前端零后端',
    cancel: '取消',
    ok: '确定',
    objectsLabel: '控件',
    paintLabel: '1-Bit 绘画',
    ditherImg: '图片抖动',
    patternLabel: '网点',
    clearArt: '清空画布',
    patSolid: '实心',
    patStipple: '50%灰',
    patHatch: '斜纹',
    patCheck: '棋盘',
    tabScript: '脚本',
    tabDebug: '调试',
    tabProps: '属性',
    validAst: '✓ 语法正确',
    errorsCount: (n) => `✗ ${n} 处错误`,
    runHandler: (name) => `运行 ${name}`,
    snipNextCard: '+ 翻页',
    snipAsk: '+ 询问弹窗',
    liveGlobals: '全局变量监视',
    noGlobals: '暂无全局变量。',
    emptyVal: '空',
    stepModeLabel: '单步调试（每行 AST 暂停）',
    nextStep: '下一步',
    continueRun: '继续运行',
    pausedAt: (line, summary) => `暂停于第 ${line} 行：${summary}`,
    runtimeErrorPrefix: '运行错误：',
    sandboxSafety: '沙盒安全防护',
    astStepsUsed: '已执行 AST 步数',
    evalDisabled: '已禁用',
    execTrace: (n) => `执行追踪 (${n})`,
    noTraceYet: '点击任意带脚本按钮或运行处理器即可查看逐行追踪。',
    selectedObj: (type) => `当前选中：${type === 'button' ? '按钮' : '文本框'}`,
    cardStackProps: '卡片与卡片栈属性',
    propName: '名称',
    propLabel: '显示文字',
    propStyle: '样式',
    propAccent: '主强调色',
    propLocked: '只读锁定',
    propText: '文本内容',
    propVisible: '可见',
    propBounds: '位置与尺寸',
    propStackTitle: '卡片栈标题',
    propCardName: '卡片名称',
    propsHint: '点击卡片上的任意按钮或文本框，即可编辑坐标、样式或 HyperTalk 脚本。',
    duplicate: '复制',
    delete: '删除',
    addCard: '新卡',
    dupCard: '复制',
    objCount: (n) => `${n} 控件`,
    msgPlaceholder: '输入任意 HyperTalk 命令，例如 go to card 2 或 play "chime"',
    run: '运行',
    ditherTitle: 'Bill Atkinson 1-Bit 抖动图片导入 (512×342)',
    uploadPhoto: '上传本地照片 (PNG/JPG)',
    sampleTitle: '或试用内置样图',
    sampleMountains: '月夜群山',
    sampleSphere: '立体球体',
    algorithmLabel: '抖动算法',
    atkinson1987: 'Atkinson 1987',
    threshold: '普通阈值',
    brightness: '亮度',
    contrast: '对比度',
    stampCard: '印到当前卡片',
    toastUndone: '已撤销',
    toastRedone: '已重做',
    toastSaved: '已自动保存到本地',
    toastBlank: '已新建空白卡片栈并进入创作模式',
    toastLoaded: (title) => `已加载「${title}」`,
    toastExportedHtml: (slug, kb) => `已导出离线单文件 ${slug}.html (${kb} KB)`,
    toastExportedJson: (slug) => `已下载 ${slug}.hcstack.json`,
    toastShareCopied: '分享链接已复制到剪贴板！',
    toastShareTooBig: '当前像素画体积较大，建议直接导出 .html 或 .hcstack.json！',
    toastShareHash: '已更新地址栏链接，直接复制即可分享！',
    toastStamped: '已将 1-Bit Atkinson 抖动画印到当前卡片！',
    toastMinCard: '卡片栈至少需要保留 1 张卡片。',
    toastLangSwitched: '已切换为简体中文',
  },
};
