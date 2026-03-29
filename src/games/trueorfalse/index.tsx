import { useState, useCallback, useRef } from 'react'
import BackButton from '../../components/BackButton'

// ======================== 类型定义 ========================

type Shape = 'square' | 'triangle'
type Size = 'big' | 'small'
type CardColor = 'red' | 'blue'
type Dots = 1 | 2
type Difficulty = 1 | 2

interface Card {
  shape: Shape
  size: Size
  color: CardColor
  dots: Dots
  id: number
}

interface Rule {
  id: number
  label: string
  check: (card: Card) => boolean
}

interface HistoryItem {
  card: Card
  result: boolean
  round: number
}

// ======================== 常量 ========================

const RULES: Rule[] = [
  { id: 0, label: '形状是方形', check: (c) => c.shape === 'square' },
  { id: 1, label: '形状是三角', check: (c) => c.shape === 'triangle' },
  { id: 2, label: '大小是大', check: (c) => c.size === 'big' },
  { id: 3, label: '大小是小', check: (c) => c.size === 'small' },
  { id: 4, label: '颜色是红色', check: (c) => c.color === 'red' },
  { id: 5, label: '颜色是蓝色', check: (c) => c.color === 'blue' },
  { id: 6, label: '点数是1点', check: (c) => c.dots === 1 },
  { id: 7, label: '点数是两点', check: (c) => c.dots === 2 },
]

// 4 个属性类别，每类 2 条互斥规则
const RULE_CATEGORIES: { name: string; rules: [Rule, Rule] }[] = [
  { name: '形状', rules: [RULES[0], RULES[1]] },
  { name: '大小', rules: [RULES[2], RULES[3]] },
  { name: '颜色', rules: [RULES[4], RULES[5]] },
  { name: '点数', rules: [RULES[6], RULES[7]] },
]

const FILL_COLORS: Record<CardColor, string> = { red: '#EF4444', blue: '#3B82F6' }

// ======================== 工具函数 ========================

function generateCards(): Card[] {
  const cards: Card[] = []
  let id = 0
  for (const shape of ['square', 'triangle'] as Shape[])
    for (const size of ['big', 'small'] as Size[])
      for (const color of ['red', 'blue'] as CardColor[])
        for (const dots of [1, 2] as Dots[])
          cards.push({ shape, size, color, dots, id: id++ })
  return cards
}

// 根据难度生成隐藏规则（二级时从不同类别选取，保证有牌能同时满足）
function generateHiddenRules(difficulty: Difficulty): Rule[] {
  if (difficulty === 1) {
    return [RULES[Math.floor(Math.random() * RULES.length)]]
  }
  // 二级：随机选 2 个不同类别，每个类别随机选 1 条
  const shuffled = [...RULE_CATEGORIES].sort(() => Math.random() - 0.5)
  return [
    shuffled[0].rules[Math.floor(Math.random() * 2)],
    shuffled[1].rules[Math.floor(Math.random() * 2)],
  ]
}

// 检查卡片是否满足所有隐藏规则
function checkCard(card: Card, rules: Rule[]): boolean {
  return rules.every((r) => r.check(card))
}

// ======================== 卡片 SVG 渲染 ========================

function CardSVG({ card, size }: { card: Card; size: number }) {
  const w = size
  const h = size
  const cx = w / 2
  const cy = h / 2
  const fill = FILL_COLORS[card.color]
  const s = card.size === 'big' ? size * 0.32 : size * 0.2

  const shapeEl =
    card.shape === 'square' ? (
      <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} fill={fill} rx={s * 0.08} />
    ) : (
      <polygon points={`${cx},${cy - s} ${cx - s},${cy + s} ${cx + s},${cy + s}`} fill={fill} />
    )

  const dotR = s * 0.18
  const dotY = card.shape === 'triangle' ? cy + s * 0.22 : cy
  const dotsEl =
    card.dots === 1 ? (
      <circle cx={cx} cy={dotY} r={dotR} fill="white" />
    ) : (
      <>
        <circle cx={cx - s * 0.3} cy={dotY} r={dotR} fill="white" />
        <circle cx={cx + s * 0.3} cy={dotY} r={dotR} fill="white" />
      </>
    )

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <rect
        x={1.5}
        y={1.5}
        width={w - 3}
        height={h - 3}
        rx={8}
        fill="white"
        stroke="#D1D5DB"
        strokeWidth={1.5}
      />
      {shapeEl}
      {dotsEl}
    </svg>
  )
}

// ======================== 规则标签渲染 ========================

// 双行布局：分类名 + 符号
function RuleTag({ id }: { id: number }) {
  const entry: Record<number, { name: string; symbol: React.ReactNode }> = {
    0: { name: '方形', symbol: <span className="text-base leading-none">■</span> },
    1: { name: '三角', symbol: <span className="text-base leading-none">▲</span> },
    2: { name: '大', symbol: <span className="text-xl font-black leading-none">大</span> },
    3: { name: '小', symbol: <span className="text-xs font-bold leading-none">小</span> },
    4: { name: '红', symbol: <span className="text-base font-bold leading-none text-red-500">红</span> },
    5: { name: '蓝', symbol: <span className="text-base font-bold leading-none text-blue-500">蓝</span> },
    6: { name: '一点', symbol: <span className="text-base leading-none tracking-widest">●</span> },
    7: { name: '两点', symbol: <span className="text-base leading-none tracking-widest">●●</span> },
  }
  const item = entry[id]
  if (!item) return null
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-slate-400 leading-none">{item.name}</span>
      {item.symbol}
    </div>
  )
}

// ======================== 弹窗组件 ========================

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose?: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-600 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// ======================== 主游戏组件 ========================

export default function TrueOrFalse() {
  const allCards = useRef(generateCards()).current
  const historyEndRef = useRef<HTMLDivElement>(null)

  // 难度与隐藏规则
  const [difficulty, setDifficulty] = useState<Difficulty>(1)
  const [hiddenRules, setHiddenRules] = useState<Rule[]>(() => generateHiddenRules(1))

  // 游戏状态
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [round, setRound] = useState(0)
  // 弹窗状态
  const [guessIds, setGuessIds] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showTip, setShowTip] = useState(false)

  // 新手引导状态
  const [showOnboarding, setShowOnboarding] = useState(true)

  const tipTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const showTipModal = useCallback(() => {
    setShowTip(true)
    if (tipTimer.current) clearTimeout(tipTimer.current)
    tipTimer.current = setTimeout(() => setShowTip(false), 1500)
  }, [])

  // ---- 操作逻辑 ----

  const handleSelect = useCallback(
    (card: Card) => {
      setSelectedCard((prev) => (prev?.id === card.id ? null : card))
    },
    [],
  )

  const handlePlay = useCallback(() => {
    if (!selectedCard) {
      showTipModal()
      return
    }

    const result = checkCard(selectedCard, hiddenRules)
    const newRound = round + 1
    setRound(newRound)
    setHistory((prev) => [...prev, { card: selectedCard, result, round: newRound }])
    setSelectedCard(null)

    setTimeout(() => {
      historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [selectedCard, hiddenRules, round, showTipModal])

  // 猜规则弹窗：切换选中某条规则
  const toggleGuess = useCallback(
    (ruleId: number) => {
      setGuessIds((prev) =>
        prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId],
      )
    },
    [],
  )

  const handleGuess = useCallback(() => {
    if (guessIds.length !== difficulty) return
    const correct =
      guessIds.length === hiddenRules.length &&
      guessIds.every((id) => hiddenRules.some((r) => r.id === id))
    setIsCorrect(correct)
    setShowResult(true)
    setGuessIds([])
  }, [guessIds, hiddenRules, difficulty])

  // 重置游戏（可同时切换难度）
  const handleRestart = useCallback((newDifficulty?: Difficulty) => {
    const d = newDifficulty ?? difficulty
    setDifficulty(d)
    setHiddenRules(generateHiddenRules(d))
    setSelectedCard(null)
    setHistory([])
    setRound(0)
    setShowResult(false)
    setGuessIds([])
    setIsCorrect(false)
    setShowOnboarding(true)
  }, [difficulty])

  // 动态提示文本
  const getHintText = () => {
    if (history.length === 0) return '从牌库中选一张牌，点击「出牌」来探测隐藏规则'
    if (history.length <= 2) return '观察卡片被分到 True 还是 False，找出规律'
    return '在下方选择你认为的规则，提交答案'
  }

  // 规则描述文本
  const ruleTags = hiddenRules.map((r) => r.id)

  // ---- 渲染 ----

  return (
    <div className="pb-6 select-none">
      {/* ====== 顶部导航区 ====== */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <BackButton />
          <h1 className="text-xl font-bold mt-2">真假推理</h1>
          <p className="text-slate-400 text-sm mt-0.5">猜隐藏规则，练逻辑思维</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* 难度切换 */}
          <div className="flex bg-slate-700 rounded-lg p-0.5 text-sm">
            {([1, 2] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  if (d !== difficulty) handleRestart(d)
                }}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  difficulty === d
                    ? 'bg-indigo-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d === 1 ? '一级' : '二级'}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleRestart()}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 active:scale-95 text-white rounded-lg text-sm font-medium transition-all"
          >
            重新开始
          </button>
        </div>
      </div>

      {/* ====== 新手引导卡片 ====== */}
      {showOnboarding && history.length === 0 && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-4">
          <h2 className="text-sm font-bold text-indigo-300 mb-2">玩法说明</h2>
          <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside mb-3">
            <li>系统隐藏了 {difficulty === 1 ? '1' : '2'} 条规则（如「颜色是红色」）</li>
            <li>从牌库选一张牌，点击「出牌」</li>
            <li>系统告诉你这张牌是 True（符合）还是 False（不符合）</li>
            <li>多出几张牌收集线索，推理出隐藏规则</li>
            <li>在底部选择规则并提交</li>
          </ol>
          <button
            onClick={() => setShowOnboarding(false)}
            className="w-full py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
          >
            开始游戏
          </button>
        </div>
      )}

      {/* ====== 动态提示条 ====== */}
      <div className="bg-slate-800/50 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
        <span className="text-amber-400 text-sm shrink-0">💡</span>
        <p className="text-xs text-slate-400">{getHintText()}</p>
        <span className="ml-auto text-xs text-slate-600 shrink-0">
          {difficulty === 1 ? '一级 · 选1项' : '二级 · 选2项'}
        </span>
      </div>

      {/* ====== 牌库 + 出牌按钮（第一步操作，最醒目）====== */}
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 mb-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span>🎴</span> 选择一张牌进行出牌
          <button
            onClick={handlePlay}
            disabled={!selectedCard}
            className="ml-auto px-4 py-1.5 rounded-lg font-medium text-sm transition-all active:scale-95
              bg-emerald-500 hover:bg-emerald-600 text-white
              disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            出牌
          </button>
        </h2>
        <div className="grid grid-cols-8 gap-1.5 justify-items-center">
          {allCards
            .filter((card) => !history.some((h) => h.card.id === card.id))
            .sort((a, b) => {
              const shape = a.shape.localeCompare(b.shape)
              if (shape !== 0) return shape
              const color = a.color.localeCompare(b.color)
              if (color !== 0) return color
              const size = a.size.localeCompare(b.size)
              if (size !== 0) return size
              return a.dots - b.dots
            })
            .map((card) => (
            <div
              key={card.id}
              onClick={() => handleSelect(card)}
              className={`cursor-pointer rounded-lg p-0.5 transition-all duration-200
                ${
                  selectedCard?.id === card.id
                    ? 'ring-2 ring-indigo-400 scale-110 shadow-lg shadow-indigo-500/30'
                    : 'hover:scale-105 hover:shadow-md'
                }
              `}
            >
              <CardSVG card={card} size={56} />
            </div>
          ))}
        </div>
      </div>

      {/* ====== 出牌历史记录 ====== */}
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 mb-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span>📋</span> 出牌历史记录
          {round > 0 && (
            <span className="ml-auto text-xs text-slate-500">共 {round} 轮</span>
          )}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {/* True 栏 */}
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-2">
            <h3 className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1">
              <span>✓</span> True
            </h3>
            <div className="grid grid-cols-4 gap-1 min-h-[52px]">
              {history.filter((h) => h.result).length === 0 ? (
                <p className="text-slate-600 text-xs flex items-center justify-center col-span-4">暂无</p>
              ) : (
                history
                  .filter((h) => h.result)
                  .map((item) => (
                    <div key={item.card.id}>
                      <CardSVG card={item.card} size={48} />
                    </div>
                  ))
              )}
            </div>
          </div>
          {/* False 栏 */}
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-2">
            <h3 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
              <span>✗</span> False
            </h3>
            <div className="grid grid-cols-4 gap-1 min-h-[52px]">
              {history.filter((h) => !h.result).length === 0 ? (
                <p className="text-slate-600 text-xs flex items-center justify-center col-span-4">暂无</p>
              ) : (
                history
                  .filter((h) => !h.result)
                  .map((item) => (
                    <div key={item.card.id}>
                      <CardSVG card={item.card} size={48} />
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
        <div ref={historyEndRef} />
      </div>

      {/* ====== 规则选择区（按类别分组）====== */}
      <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span>🔍</span> 选择你猜的规则
        </h2>
        <div className="flex flex-wrap gap-4 justify-center">
          {RULE_CATEGORIES.map((cat) => (
            <div key={cat.name} className="flex gap-2">
              {cat.rules.map((rule) => {
                const selected = guessIds.includes(rule.id)
                return (
                  <button
                    key={rule.id}
                    onClick={() => toggleGuess(rule.id)}
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200
                      ${
                        selected
                          ? 'bg-indigo-500 text-white ring-2 ring-indigo-300 scale-105 shadow-lg shadow-indigo-500/30'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:scale-105'
                      }`}
                  >
                    <RuleTag id={rule.id} />
                  </button>
                )
              })}
            </div>
          ))}
          {/* 提交按钮 */}
          <button
            onClick={handleGuess}
            disabled={guessIds.length !== difficulty}
            className="h-14 px-5 rounded-xl font-medium text-sm transition-all active:scale-95 shrink-0
              bg-amber-500 hover:bg-amber-600 text-white
              disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            提交
          </button>
        </div>
        {difficulty === 2 && (
          <p className={`text-center text-xs mt-2 ${guessIds.length > 2 ? 'text-red-400' : 'text-slate-500'}`}>
            已选 {guessIds.length}/2
          </p>
        )}
      </div>

      {/* ====== 结果判定弹窗 ====== */}
      {showResult && (
        <ModalOverlay>
          <div className="text-center">
            {isCorrect ? (
              <>
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="text-xl font-bold text-green-400 mb-1">恭喜你，答对啦！</h3>
                <p className="text-slate-400 text-sm mb-6 flex items-center justify-center gap-2">
                  隐藏规则是：
                  {ruleTags.map((id) => (
                    <span key={id} className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700">
                      <RuleTag id={id} />
                    </span>
                  ))}
                </p>
                <button
                  onClick={() => handleRestart()}
                  className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
                >
                  重新开始
                </button>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">💪</div>
                <h3 className="text-xl font-bold text-amber-400 mb-1">再试试，继续收集线索吧</h3>
                <p className="text-slate-400 text-sm mb-6">隐藏规则不是你想的那样哦</p>
                <button
                  onClick={() => setShowResult(false)}
                  className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
                >
                  继续游戏
                </button>
              </>
            )}
          </div>
        </ModalOverlay>
      )}

      {/* ====== 操作提示弹窗 ====== */}
      {showTip && (
        <ModalOverlay onClose={() => setShowTip(false)}>
          <p className="text-center text-amber-400 font-medium">请先选择一张卡片哦</p>
        </ModalOverlay>
      )}
    </div>
  )
}
