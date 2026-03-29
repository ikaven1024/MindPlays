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
const RULE_CATEGORIES: [Rule, Rule][] = [
  [RULES[0], RULES[1]], // 形状
  [RULES[2], RULES[3]], // 大小
  [RULES[4], RULES[5]], // 颜色
  [RULES[6], RULES[7]], // 点数
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
    shuffled[0][Math.floor(Math.random() * 2)],
    shuffled[1][Math.floor(Math.random() * 2)],
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

// 单字形象化展示：形状用符号、大小用字号、颜色用字色、点数用圆点
function RuleTag({ id }: { id: number }) {
  switch (id) {
    case 0: return <span className="text-base leading-none">■</span>
    case 1: return <span className="text-base leading-none">▲</span>
    case 2: return <span className="text-xl font-black leading-none">大</span>
    case 3: return <span className="text-xs font-bold leading-none">小</span>
    case 4: return <span className="text-base font-bold leading-none text-red-500">红</span>
    case 5: return <span className="text-base font-bold leading-none text-blue-500">蓝</span>
    case 6: return <span className="text-base leading-none tracking-widest">●</span>
    case 7: return <span className="text-base leading-none tracking-widest">●●</span>
    default: return null
  }
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
  const [animating, setAnimating] = useState(false)

  // 弹窗状态
  const [guessIds, setGuessIds] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showTip, setShowTip] = useState(false)

  const tipTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const showTipModal = useCallback(() => {
    setShowTip(true)
    if (tipTimer.current) clearTimeout(tipTimer.current)
    tipTimer.current = setTimeout(() => setShowTip(false), 1500)
  }, [])

  // ---- 操作逻辑 ----

  const handleSelect = useCallback(
    (card: Card) => {
      if (animating) return
      setSelectedCard((prev) => (prev?.id === card.id ? null : card))
    },
    [animating],
  )

  const handlePlay = useCallback(() => {
    if (!selectedCard) {
      showTipModal()
      return
    }
    if (animating) return

    const result = checkCard(selectedCard, hiddenRules)
    const newRound = round + 1
    setRound(newRound)
    setHistory((prev) => [...prev, { card: selectedCard, result, round: newRound }])
    setAnimating(true)

    setTimeout(() => {
      historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)

    setTimeout(() => {
      setAnimating(false)
      setSelectedCard(null)
    }, 1000)
  }, [selectedCard, hiddenRules, round, animating, showTipModal])

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
    setAnimating(false)
    setShowResult(false)
    setGuessIds([])
    setIsCorrect(false)
  }, [difficulty])

  // 规则描述文本
  const ruleTags = hiddenRules.map((r) => r.id)

  // ---- 渲染 ----

  return (
    <div className="pb-6 select-none">
      {/* ====== 顶部导航区 ====== */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <BackButton />
          <h1 className="text-xl font-bold mt-2">True-False 逆向推理游戏</h1>
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

      {/* 难度说明 */}
      <p className="text-xs text-slate-500 mb-2">
        {difficulty === 1
          ? '当前难度：一级 — 隐藏 1 条规则，选 1 项提交'
          : '当前难度：二级 — 隐藏 2 条规则（需同时满足），选 2 项提交'}
      </p>

      {/* 规则卡片选择区 */}
      <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 mb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {RULES.map((rule) => {
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
          {/* 提交按钮 */}
          <button
            onClick={handleGuess}
            disabled={guessIds.length !== difficulty}
            className="h-14 px-5 rounded-xl font-medium text-sm transition-all active:scale-95
              bg-amber-500 hover:bg-amber-600 text-white shrink-0
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

      {/* ====== 底部牌库区 ====== */}
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span>🎴</span> 牌库
        </h2>
        <div className="flex items-center gap-3">
          <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1 flex-1">
            <div className="flex gap-2.5 w-max">
              {allCards.filter((card) => !history.some((h) => h.card.id === card.id)).map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleSelect(card)}
                  className={`cursor-pointer rounded-xl p-1 transition-all duration-200 shrink-0
                    ${
                      selectedCard?.id === card.id
                        ? 'ring-2 ring-indigo-400 scale-110 shadow-lg shadow-indigo-500/30'
                        : 'hover:scale-105 hover:shadow-md'
                    }
                    ${animating ? 'pointer-events-none opacity-70' : ''}
                  `}
                >
                  <CardSVG card={card} size={72} />
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handlePlay}
            disabled={!selectedCard || animating}
            className="h-[80px] px-6 rounded-xl font-medium text-sm transition-all active:scale-95 shrink-0
              disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
              bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            出牌
          </button>
        </div>
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
