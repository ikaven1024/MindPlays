import { useState, useEffect, useCallback, useRef } from 'react'
import BackButton from '../../components/BackButton'

// Board: 3-row triangle
//      [0]
//    [1] [2]
//   [3] [4] [5]

const ROWS = [[0], [1, 2], [3, 4, 5]]

// All lines to check (horizontal rows + diagonals + inner diagonals)
const LINES = [
  [1, 2],    // Row 1
  [3, 4, 5], // Row 2
  [0, 1, 3], // Left diagonal
  [0, 2, 5], // Right diagonal
  [1, 4],    // Inner left diagonal
  [2, 4],    // Inner right diagonal
]

const LINE_LABELS = ['[1,2]', '[3,4,5]', '[0,1,3]', '[0,2,5]', '[1,4]', '[2,4]']

type Mode = 'select' | 'pvp' | 'pve'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function createDeck(): number[] {
  const deck: number[] = []
  for (let n = 0; n <= 9; n++) {
    for (let i = 0; i < 5; i++) deck.push(n)
  }
  return shuffle(deck)
}

interface State {
  board: number[][]
  deck: number[]
  player: number
  card: number | null
  scores: [number, number]
  phase: 'play' | 'over'
  msg: string
  glow: number[]
  showRules: boolean
}

function initState(): State {
  const d = createDeck()
  return {
    board: Array.from({ length: 6 }, () => []),
    deck: d.slice(1),
    player: 0,
    card: d[0],
    scores: [0, 0],
    phase: 'play',
    msg: '',
    glow: [],
    showRules: false,
  }
}

// Simulate placing a card and return how many cards would be collected
function simulatePlace(board: number[][], card: number, ci: number): number {
  const newBoard = board.map((st, j) => j === ci ? [...st, card] : [...st])
  let collected = 0
  const glowCells = new Set<number>()

  for (const line of LINES) {
    if (!line.every(idx => newBoard[idx].length > 0)) continue
    const sum = line.reduce((a, idx) => a + newBoard[idx][newBoard[idx].length - 1], 0)
    if (sum === 10) {
      for (const idx of line) {
        if (!glowCells.has(idx)) {
          collected += newBoard[idx].length
          glowCells.add(idx)
        }
      }
    }
  }
  return collected
}

// AI: pick the best cell for the given card
function aiPickCell(board: number[][], card: number): number {
  // Phase 1: find cells that score
  const scoring: { ci: number; collected: number }[] = []
  for (let ci = 0; ci < 6; ci++) {
    const collected = simulatePlace(board, card, ci)
    if (collected > 0) scoring.push({ ci, collected })
  }
  if (scoring.length > 0) {
    // Pick the one that collects the most cards
    scoring.sort((a, b) => b.collected - a.collected)
    return scoring[0].ci
  }

  // Phase 2: avoid placing where opponent's next card could score
  // For each cell, count how many card values (0-9) would let opponent score
  const dangerScores = Array.from({ length: 6 }, (_, ci) => {
    const testBoard = board.map((st, j) => j === ci ? [...st, card] : [...st])
    let dangerCount = 0
    for (let oppCard = 0; oppCard <= 9; oppCard++) {
      for (let oci = 0; oci < 6; oci++) {
        if (simulatePlace(testBoard, oppCard, oci) > 0) {
          dangerCount++
          break // only count once per oppCard
        }
      }
    }
    return dangerCount
  })

  const minDanger = Math.min(...dangerScores)
  const safeCells = dangerScores
    .map((d, ci) => ({ ci, danger: d }))
    .filter(x => x.danger === minDanger)
    .map(x => x.ci)

  // Among safe cells, prefer empty cells (preserve stacking options)
  const emptySafe = safeCells.filter(ci => board[ci].length === 0)
  const pool = emptySafe.length > 0 ? emptySafe : safeCells

  return pool[Math.floor(Math.random() * pool.length)]
}

export default function MakeNumbers() {
  const [mode, setMode] = useState<Mode>('select')
  const [s, set] = useState<State>(initState)
  const aiRef = useRef(false)

  const isAI = mode === 'pve'
  const aiPlayer = 1 // AI is always player 2

  const playerName = useCallback((p: number) => {
    if (isAI && p === aiPlayer) return '电脑'
    return `玩家 ${p + 1}`
  }, [isAI])

  const place = useCallback((ci: number) => {
    set(p => {
      if (p.phase !== 'play' || p.card === null) return p

      // Place card on cell
      const board = p.board.map((st, j) =>
        j === ci ? [...st, p.card!] : [...st]
      )

      // Find all lines summing to 10 (check before any removal)
      const hitLines: number[][] = []

      for (const line of LINES) {
        if (!line.every(idx => board[idx].length > 0)) continue
        const sum = line.reduce((a, idx) => a + board[idx][board[idx].length - 1], 0)
        if (sum === 10) hitLines.push(line)
      }

      // Collect all cards from hit lines (deduplicate cells)
      let collected = 0
      const glowCells = new Set<number>()
      for (const line of hitLines) {
        for (const idx of line) {
          if (!glowCells.has(idx)) {
            collected += board[idx].length
            glowCells.add(idx)
          }
        }
      }

      const finalBoard = board.map((st, j) => glowCells.has(j) ? [] : st)
      const scores: [number, number] = [...p.scores] as [number, number]
      scores[p.player] += collected

      const deckEmpty = p.deck.length === 0
      const pName = (isAI && p.player === aiPlayer) ? '电脑' : `玩家 ${p.player + 1}`

      if (deckEmpty) {
        return {
          ...p,
          board: finalBoard,
          card: null,
          scores,
          phase: 'over',
          msg: collected > 0
            ? `${pName} 收集了 ${collected} 张牌！游戏结束！`
            : '游戏结束！',
          glow: [...glowCells],
          showRules: p.showRules,
        }
      }

      return {
        ...p,
        board: finalBoard,
        deck: p.deck.slice(1),
        card: p.deck[0],
        player: 1 - p.player,
        scores,
        phase: 'play',
        msg: collected > 0
          ? `${pName} 收集了 ${collected} 张牌！`
          : '',
        glow: [...glowCells],
        showRules: p.showRules,
      }
    })
  }, [isAI])

  // AI auto-play
  useEffect(() => {
    if (!isAI || s.phase !== 'play' || s.player !== aiPlayer || s.card === null) return
    if (aiRef.current) return
    aiRef.current = true

    const ci = aiPickCell(s.board, s.card)
    const timer = setTimeout(() => {
      place(ci)
      aiRef.current = false
    }, 600)

    return () => {
      clearTimeout(timer)
      aiRef.current = false
    }
  }, [isAI, s.phase, s.player, s.card, s.board, place])

  // Clear glow animation
  useEffect(() => {
    if (s.glow.length > 0) {
      const t = setTimeout(() => set(p => ({ ...p, glow: [] })), 800)
      return () => clearTimeout(t)
    }
  }, [s.glow])

  const startGame = (m: 'pvp' | 'pve') => {
    setMode(m)
    set(initState())
  }

  const winner =
    s.scores[0] > s.scores[1] ? 1 :
    s.scores[1] > s.scores[0] ? 2 : 0

  const winnerName = winner === 0 ? null : playerName(winner - 1)
  const canPlace = s.phase === 'play' && s.card !== null && !(isAI && s.player === aiPlayer)

  // Mode selection screen
  if (mode === 'select') {
    return (
      <div>
        <BackButton />
        <h1 className="text-2xl font-bold text-center mb-1">凑十</h1>
        <p className="text-center text-slate-500 text-xs mb-8">Make Numbers</p>

        <div className="flex flex-col items-center gap-4 mt-8">
          <p className="text-slate-400 text-sm mb-2">选择游戏模式</p>
          <button
            onClick={() => startGame('pvp')}
            className="w-48 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-center"
          >
            人人对战
          </button>
          <button
            onClick={() => startGame('pve')}
            className="w-48 px-6 py-3 bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors font-medium text-center"
          >
            人机对战
          </button>
        </div>

        {/* Rules */}
        <div className="max-w-sm mx-auto mt-8">
          <div className="bg-slate-800 rounded-lg p-4 text-xs text-slate-400 leading-relaxed">
            <p className="font-medium text-slate-300 mb-2">游戏规则</p>
            <p>50 张牌（0-9 各 5 张），两人轮流摸牌放入三角棋盘。</p>
            <p>棋盘上任意线（横线或对角线）顶牌之和 = 10 时，该线上所有牌归当前玩家。</p>
            <p>已放的格子可覆盖。牌堆抽完后，手牌最多的玩家获胜。</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <BackButton />
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-center flex-1">凑十</h1>
        <button
          onClick={() => setMode('select')}
          className="text-xs text-slate-500 hover:text-slate-300 underline"
        >
          切换模式
        </button>
      </div>
      <p className="text-center text-slate-500 text-xs mb-4">
        {mode === 'pvp' ? '人人对战' : '人机对战'}
      </p>

      {/* Rules toggle */}
      <div className="text-center mb-3">
        <button
          onClick={() => set(p => ({ ...p, showRules: !p.showRules }))}
          className="text-xs text-slate-500 hover:text-slate-300 underline"
        >
          {s.showRules ? '隐藏规则' : '游戏规则'}
        </button>
      </div>

      {s.showRules && (
        <div className="bg-slate-800 rounded-lg p-3 mb-4 text-xs text-slate-400 leading-relaxed">
          <p>50 张牌（0-9 各 5 张），两人轮流摸牌放入三角棋盘。</p>
          <p>棋盘上任意线（横线或对角线）顶牌之和 = 10 时，该线上所有牌归当前玩家。</p>
          <p>已放的格子可覆盖。牌堆抽完后，手牌最多的玩家获胜。</p>
        </div>
      )}

      {/* Scores */}
      <div className="flex justify-center gap-4 mb-3">
        {([0, 1] as const).map(p => (
          <div
            key={p}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              s.player === p && s.phase === 'play'
                ? p === 0
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {playerName(p)}
            <span className="ml-2 text-yellow-400 font-bold">{s.scores[p]}</span> 张
          </div>
        ))}
      </div>

      {/* Turn indicator */}
      {s.phase === 'play' && (
        <p className="text-center mb-2 text-slate-300 text-sm">
          {isAI && s.player === aiPlayer ? '电脑思考中...' : `${playerName(s.player)} 的回合`}
        </p>
      )}

      {/* Message */}
      {s.msg && (
        <p className="text-center mb-2 text-yellow-400 font-bold text-sm animate-pulse">
          {s.msg}
        </p>
      )}

      {/* Drawn card */}
      {s.card !== null && (
        <div className="flex justify-center items-center gap-3 mb-4">
          <span className="text-slate-400 text-sm">
            {isAI && s.player === aiPlayer ? '电脑的牌' : '抽到的牌'}
          </span>
          <div className={`w-14 h-[4.5rem] rounded-lg flex items-center justify-center text-3xl font-bold shadow-lg shadow-amber-900/20 ${
            isAI && s.player === aiPlayer
              ? 'bg-slate-700 border-2 border-rose-500 text-rose-300 shadow-rose-900/30'
              : 'bg-gradient-to-br from-amber-50 to-amber-200 border-2 border-amber-600 text-amber-900'
          }`}>
            {isAI && s.player === aiPlayer ? '?' : s.card}
          </div>
          {!(isAI && s.player === aiPlayer) && (
            <span className="text-slate-500 text-xs">点击棋盘放置</span>
          )}
        </div>
      )}

      {/* Board */}
      <div className="flex flex-col items-center gap-2 mb-4">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-2">
            {row.map(ci => {
              const stack = s.board[ci]
              const top = stack.length > 0 ? stack[stack.length - 1] : null
              const glowing = s.glow.includes(ci)

              return (
                <button
                  key={ci}
                  onClick={() => place(ci)}
                  disabled={!canPlace}
                  className={`w-16 h-20 rounded-lg text-3xl font-bold transition-all duration-200 relative
                    ${top !== null
                      ? 'bg-gradient-to-br from-amber-50 to-amber-200 border-2 border-amber-700 text-amber-900'
                      : canPlace
                        ? 'bg-slate-800/80 border-2 border-dashed border-slate-500 text-slate-500'
                        : 'bg-slate-800/50 border-2 border-dashed border-slate-700 text-slate-700'}
                    ${canPlace ? 'cursor-pointer hover:scale-110 hover:border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/20 active:scale-95' : 'cursor-default'}
                    ${glowing ? 'ring-4 ring-yellow-400 scale-110 shadow-lg shadow-yellow-400/40' : ''}
                  `}
                >
                  {top !== null ? (
                    <>
                      {top}
                      {stack.length > 1 && (
                        <span className="absolute top-0.5 right-1 text-[10px] bg-amber-700 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                          {stack.length}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-base opacity-30">{ci}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Line sums preview */}
      <div className="flex flex-wrap justify-center gap-2 mb-3 text-xs">
        {LINES.map((line, li) => {
          const allFilled = line.every(i => s.board[i].length > 0)
          const sum = allFilled
            ? line.reduce((a, i) => a + s.board[i][s.board[i].length - 1], 0)
            : null
          const isTen = sum === 10

          return (
            <span
              key={li}
              className={`px-2 py-1 rounded ${
                isTen ? 'bg-yellow-600 text-white font-bold' :
                allFilled ? 'bg-slate-700 text-slate-300' :
                'bg-slate-800 text-slate-600'
              }`}
            >
              {LINE_LABELS[li]}={allFilled ? sum : '?'}
            </span>
          )
        })}
      </div>

      {/* Deck */}
      <p className="text-center text-slate-500 text-sm">
        牌堆剩余: <span className="text-slate-300 font-medium">{s.deck.length}</span> 张
      </p>

      {/* Game Over */}
      {s.phase === 'over' && (
        <div className="text-center mt-6">
          <div className="text-2xl font-bold text-white mb-2">
            {winnerName ? `${winnerName} 获胜！` : '平局！'}
          </div>
          <div className="flex justify-center gap-8 mb-4">
            <div className="text-center">
              <div className="text-blue-400 text-sm">{playerName(0)}</div>
              <div className="text-2xl font-bold text-white">{s.scores[0]}</div>
            </div>
            <div className="text-slate-600 text-2xl self-end pb-1">:</div>
            <div className="text-center">
              <div className="text-rose-400 text-sm">{playerName(1)}</div>
              <div className="text-2xl font-bold text-white">{s.scores[1]}</div>
            </div>
          </div>
          <button
            onClick={() => set(initState())}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium"
          >
            再来一局
          </button>
        </div>
      )}
    </div>
  )
}
