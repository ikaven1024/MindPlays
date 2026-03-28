import { useState, useCallback, useRef } from 'react'
import BackButton from '../../components/BackButton'

// ======================== 类型定义 ========================

type Shape = 'square' | 'triangle'
type Size = 'big' | 'small'
type CardColor = 'red' | 'blue'
type Dots = 1 | 2

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

const FILL_COLORS: Record<CardColor, string> = { red: '#EF4444', blue: '#3B82F6' }

// 生成全部16张不重复卡片
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

// ======================== 卡片 SVG 渲染 ========================

function CardSVG({ card, w, h }: { card: Card; w: number; h: number }) {
  const cx = w / 2
  const cy = h / 2
  const fill = FILL_COLORS[card.color]
  const s = card.size === 'big' ? Math.min(w, h) * 0.32 : Math.min(w, h) * 0.2

  // 形状：方形用 rect，三角用 polygon
  const shapeEl =
    card.shape === 'square' ? (
      <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} fill={fill} rx={s * 0.08} />
    ) : (
      <polygon points={`${cx},${cy - s} ${cx - s},${cy + s} ${cx + s},${cy + s}`} fill={fill} />
    )

  // 圆点：三角形的视觉中心偏下（重心位置）
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

  // 游戏核心状态
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [hiddenRule, setHiddenRule] = useState<Rule>(
    () => RULES[Math.floor(Math.random() * RULES.length)],
  )
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [round, setRound] = useState(0)
  const [lastResult, setLastResult] = useState<boolean | null>(null)
  const [animating, setAnimating] = useState(false)

  // 弹窗状态
  const [showGuess, setShowGuess] = useState(false)
  const [guessId, setGuessId] = useState(-1)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showTip, setShowTip] = useState(false)

  // 自动关闭提示弹窗
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

    const result = hiddenRule.check(selectedCard)
    const newRound = round + 1
    setRound(newRound)
    setHistory((prev) => [...prev, { card: selectedCard, result, round: newRound }])
    setLastResult(result)
    setAnimating(true)

    setTimeout(() => {
      historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)

    setTimeout(() => {
      setAnimating(false)
      setSelectedCard(null)
      setLastResult(null)
    }, 1000)
  }, [selectedCard, hiddenRule, round, animating, showTipModal])

  const handleGuess = useCallback(() => {
    if (guessId < 0) return
    const correct = guessId === hiddenRule.id
    setIsCorrect(correct)
    setShowGuess(false)
    setShowResult(true)
    setGuessId(-1)
  }, [guessId, hiddenRule])

  const handleRestart = useCallback(() => {
    setSelectedCard(null)
    setHiddenRule(RULES[Math.floor(Math.random() * RULES.length)])
    setHistory([])
    setRound(0)
    setLastResult(null)
    setAnimating(false)
    setShowGuess(false)
    setShowResult(false)
    setGuessId(-1)
    setIsCorrect(false)
  }, [])

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
        <button
          onClick={handleRestart}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white rounded-lg text-sm font-medium transition-all shrink-0"
        >
          重新开始
        </button>
      </div>

      {/* ====== 中间核心区 ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* 左侧：推理线索区 */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <span>📋</span> 出牌历史记录
            {round > 0 && (
              <span className="ml-auto text-xs text-slate-500">共 {round} 轮</span>
            )}
          </h2>
          <div className="max-h-60 md:max-h-72 overflow-y-auto space-y-2 pr-1">
            {history.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-10">
                请先选择卡片出牌，收集线索吧
              </p>
            ) : (
              history.map((item) => (
                <div
                  key={item.round}
                  className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
                    item.result
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  <span className="text-xs text-slate-500 font-mono w-7 shrink-0">
                    #{item.round}
                  </span>
                  <div className="shrink-0">
                    <CardSVG card={item.card} w={36} h={46} />
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      item.result ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {item.result ? '✓ True' : '✗ False'}
                  </span>
                </div>
              ))
            )}
            <div ref={historyEndRef} />
          </div>
        </div>

        {/* 右侧：当前操作区 */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex flex-col">
          {/* 卡片预览 */}
          <div className="flex-1 flex items-center justify-center min-h-[170px]">
            {selectedCard ? (
              <div className={`transition-all duration-300 ${animating ? 'scale-110' : 'scale-100'}`}>
                <CardSVG card={selectedCard} w={110} h={140} />
                {/* 出牌反馈 */}
                {lastResult !== null && (
                  <div
                    className={`text-center mt-2 text-lg font-bold ${
                      lastResult ? 'text-green-400' : 'text-red-400'
                    }`}
                    style={{ animation: 'bounce 0.5s ease' }}
                  >
                    {lastResult ? '✓ True' : '✗ False'}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 text-sm border-2 border-dashed border-slate-600 rounded-xl w-[110px] h-[140px] flex items-center justify-center">
                请选一张卡片
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 mt-3">
            <button
              onClick={handlePlay}
              disabled={!selectedCard || animating}
              className="flex-1 py-3 rounded-lg font-medium text-sm transition-all active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              出牌
            </button>
            <button
              onClick={() => {
                setGuessId(-1)
                setShowGuess(true)
              }}
              className="flex-1 py-3 rounded-lg font-medium text-sm transition-all active:scale-95
                bg-amber-500 hover:bg-amber-600 text-white"
            >
              猜规则
            </button>
          </div>
        </div>
      </div>

      {/* ====== 底部牌库区 ====== */}
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <span>🎴</span> 牌库
        </h2>
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-2.5 w-max">
            {allCards.map((card) => (
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
                <CardSVG card={card} w={64} h={84} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ====== 猜规则弹窗 ====== */}
      {showGuess && (
        <ModalOverlay onClose={() => setShowGuess(false)}>
          <h3 className="text-lg font-bold mb-4 text-center">选择你认为的隐藏规则</h3>
          <div className="space-y-2 mb-5">
            {RULES.map((rule) => (
              <button
                key={rule.id}
                onClick={() => setGuessId(rule.id)}
                className={`w-full py-2.5 px-4 rounded-lg text-sm text-left transition-all
                  ${
                    guessId === rule.id
                      ? 'bg-indigo-500 text-white ring-2 ring-indigo-300'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                {rule.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGuess(false)}
              className="flex-1 py-2.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-sm transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleGuess}
              disabled={guessId < 0}
              className="flex-1 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              提交答案
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ====== 结果判定弹窗 ====== */}
      {showResult && (
        <ModalOverlay>
          <div className="text-center">
            {isCorrect ? (
              <>
                <div className="text-5xl mb-3">🎉</div>
                <h3 className="text-xl font-bold text-green-400 mb-1">恭喜你，答对啦！</h3>
                <p className="text-slate-400 text-sm mb-6">
                  隐藏规则是：{hiddenRule.label}
                </p>
                <button
                  onClick={handleRestart}
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
