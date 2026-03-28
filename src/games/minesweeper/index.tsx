import { useState, useCallback } from 'react'
import BackButton from '../../components/BackButton'

const ROWS = 9
const COLS = 9
const MINES = 10

interface Cell {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

function createBoard(firstR: number, firstC: number): Cell[][] {
  const board: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false, revealed: false, flagged: false, adjacent: 0,
    }))
  )

  // place mines avoiding first click
  let placed = 0
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS)
    const c = Math.floor(Math.random() * COLS)
    if (board[r][c].mine || (Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1)) continue
    board[r][c].mine = true
    placed++
  }

  // calculate adjacent
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].mine) continue
      let count = 0
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) count++
        }
      board[r][c].adjacent = count
    }

  return board
}

function reveal(board: Cell[][], r: number, c: number): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })))
  const stack: [number, number][] = [[r, c]]
  while (stack.length > 0) {
    const [cr, cc] = stack.pop()!
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue
    const cell = newBoard[cr][cc]
    if (cell.revealed || cell.flagged || cell.mine) continue
    cell.revealed = true
    if (cell.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          stack.push([cr + dr, cc + dc])
    }
  }
  return newBoard
}

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-400',
  2: 'text-green-400',
  3: 'text-red-400',
  4: 'text-purple-400',
  5: 'text-amber-600',
  6: 'text-teal-400',
  7: 'text-slate-200',
  8: 'text-slate-400',
}

type GameState = 'playing' | 'won' | 'lost'

export default function Minesweeper() {
  const [board, setBoard] = useState<Cell[][] | null>(null)
  const [state, setState] = useState<GameState>('playing')
  const [flagMode, setFlagMode] = useState(false)
  const [time, setTime] = useState(0)
  const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null)

  const flagCount = board ? board.flat().filter(c => c.flagged).length : 0

  const startTimer = useCallback(() => {
    if (timerRef) clearInterval(timerRef)
    const id = setInterval(() => setTime(t => t + 1), 1000)
    setTimerRef(id)
  }, [timerRef])

  const stopTimer = () => {
    if (timerRef) clearInterval(timerRef)
  }

  const handleCellClick = (r: number, c: number) => {
    if (state !== 'playing') return
    if (!board) {
      const newBoard = createBoard(r, c)
      const revealed = reveal(newBoard, r, c)
      setBoard(revealed)
      startTimer()
      return
    }

    const cell = board[r][c]
    if (cell.revealed) return

    if (flagMode) {
      const newBoard = board.map(row => row.map(c => ({ ...c })))
      newBoard[r][c].flagged = !newBoard[r][c].flagged
      setBoard(newBoard)
      return
    }

    if (cell.flagged) return

    if (cell.mine) {
      // reveal all mines
      const newBoard = board.map(row => row.map(c => ({ ...c })))
      newBoard.forEach(row => row.forEach(c => { if (c.mine) c.revealed = true }))
      setBoard(newBoard)
      setState('lost')
      stopTimer()
      return
    }

    const newBoard = reveal(board, r, c)
    setBoard(newBoard)

    // check win
    const allSafe = newBoard.flat().filter(c => !c.mine).every(c => c.revealed)
    if (allSafe) {
      setState('won')
      stopTimer()
    }
  }

  const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault()
    if (state !== 'playing' || !board) return
    const cell = board[r][c]
    if (cell.revealed) return
    const newBoard = board.map(row => row.map(c => ({ ...c })))
    newBoard[r][c].flagged = !newBoard[r][c].flagged
    setBoard(newBoard)
  }

  const reset = () => {
    setBoard(null)
    setState('playing')
    setTime(0)
    if (timerRef) clearInterval(timerRef)
    setTimerRef(null)
  }

  const displayBoard: Cell[][] = board || Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false, revealed: false, flagged: false, adjacent: 0,
    }))
  )

  return (
    <div>
      <BackButton />
      <h1 className="text-2xl font-bold text-center mb-4">扫雷</h1>

      <div className="flex justify-center gap-4 mb-4">
        <div className="bg-slate-800 rounded-lg px-3 py-1 text-center">
          <span className="text-sm text-slate-400">💣 {MINES - flagCount}</span>
        </div>
        <div className="bg-slate-800 rounded-lg px-3 py-1 text-center">
          <span className="text-sm text-slate-400">⏱ {time}s</span>
        </div>
        <button
          onClick={() => setFlagMode(!flagMode)}
          className={`px-3 py-1 rounded-lg text-sm ${flagMode ? 'bg-red-600' : 'bg-slate-800 text-slate-400'}`}
        >
          {flagMode ? '🚩 标记模式' : '🚩 标记'}
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl p-2 max-w-[360px] mx-auto">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {displayBoard.flat().map((cell, idx) => {
            const r = Math.floor(idx / COLS)
            const c = idx % COLS
            return (
              <button
                key={idx}
                onClick={() => handleCellClick(r, c)}
                onContextMenu={(e) => handleRightClick(e, r, c)}
                className={`aspect-square rounded text-sm font-bold flex items-center justify-center transition-colors
                  ${cell.revealed
                    ? cell.mine
                      ? 'bg-red-900 text-red-300'
                      : 'bg-slate-700 ' + (NUMBER_COLORS[cell.adjacent] || '')
                    : cell.flagged
                    ? 'bg-amber-700 text-amber-200'
                    : 'bg-slate-600 hover:bg-slate-500 cursor-pointer'
                  }`}
              >
                {cell.revealed
                  ? cell.mine ? '💣' : (cell.adjacent || '')
                  : cell.flagged ? '🚩' : ''}
              </button>
            )
          })}
        </div>
      </div>

      {state !== 'playing' && (
        <div className="text-center mt-4">
          <p className={`text-lg font-semibold mb-3 ${state === 'won' ? 'text-emerald-400' : 'text-red-400'}`}>
            {state === 'won' ? `恭喜通关！用时 ${time} 秒` : '踩到地雷了！'}
          </p>
          <button onClick={reset} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
            重新开始
          </button>
        </div>
      )}

      <p className="text-center text-slate-500 text-xs mt-4">左键翻开 · 右键/标记模式插旗</p>
    </div>
  )
}
