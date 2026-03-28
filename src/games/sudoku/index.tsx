import { useState, useCallback } from 'react'
import BackButton from '../../components/BackButton'

type Board = (number | null)[][]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isValid(board: Board, r: number, c: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[r][i] === num) return false
    if (board[i][c] === num) return false
  }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++)
      if (board[br + dr][bc + dc] === num) return false
  return true
}

function solve(board: Board): boolean {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== null) continue
      const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
      for (const num of nums) {
        if (isValid(board, r, c, num)) {
          board[r][c] = num
          if (solve(board)) return true
          board[r][c] = null
        }
      }
      return false
    }
  return true
}

function generatePuzzle(difficulty: number = 40): { puzzle: Board; solution: Board } {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(null))
  solve(board)
  const solution = board.map(r => [...r]) as Board
  const puzzle = board.map(r => [...r])

  const positions = shuffle(Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9]))
  for (let i = 0; i < difficulty; i++) {
    const [r, c] = positions[i]
    puzzle[r][c] = null
  }

  return { puzzle, solution }
}

export default function Sudoku() {
  const [{ puzzle, solution }, setGameData] = useState(() => generatePuzzle())
  const [board, setBoard] = useState<(number | null)[][]>(() => puzzle.map(r => [...r]))
  const [selected, setSelected] = useState<[number, number] | null>(null)
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const [won, setWon] = useState(false)

  const isOriginal = (r: number, c: number) => puzzle[r][c] !== null

  const handleSelect = (r: number, c: number) => {
    if (isOriginal(r, c) || won) return
    setSelected([r, c])
  }

  const handleInput = useCallback((num: number) => {
    if (!selected || won) return
    const [r, c] = selected
    if (isOriginal(r, c)) return

    const newBoard = board.map(row => [...row])
    newBoard[r][c] = num
    setBoard(newBoard)

    // check errors
    const newErrors = new Set(errors)
    const key = `${r}-${c}`
    if (num !== solution[r][c]) {
      newErrors.add(key)
    } else {
      newErrors.delete(key)
    }
    setErrors(newErrors)

    // check win
    const allFilled = newBoard.every(row => row.every(v => v !== null))
    const allCorrect = newBoard.every((row, ri) =>
      row.every((v, ci) => v === solution[ri][ci])
    )
    if (allFilled && allCorrect) setWon(true)
  }, [selected, board, errors, solution, won])

  const handleErase = useCallback(() => {
    if (!selected || won) return
    const [r, c] = selected
    if (isOriginal(r, c)) return
    const newBoard = board.map(row => [...row])
    newBoard[r][c] = null
    setBoard(newBoard)
    const newErrors = new Set(errors)
    newErrors.delete(`${r}-${c}`)
    setErrors(newErrors)
  }, [selected, board, errors, won])

  const reset = () => {
    const data = generatePuzzle()
    setGameData(data)
    setBoard(data.puzzle.map(r => [...r]))
    setSelected(null)
    setErrors(new Set())
    setWon(false)
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const num = parseInt(e.key)
    if (num >= 1 && num <= 9) {
      handleInput(num)
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      handleErase()
    }
  }, [handleInput, handleErase])

  const selectedNum = selected ? board[selected[0]][selected[1]] : null

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} className="outline-none">
      <BackButton />
      <h1 className="text-2xl font-bold text-center mb-4">数独</h1>

      <div className="bg-slate-800 rounded-xl p-1 max-w-[360px] mx-auto">
        <div className="grid grid-cols-9 gap-px">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selected?.[0] === r && selected?.[1] === c
              const isHighlighted = selectedNum !== null && cell === selectedNum
              const isError = errors.has(`${r}-${c}`)
              const borderR = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-slate-500' : ''
              const borderB = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-slate-500' : ''

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleSelect(r, c)}
                  className={`aspect-square flex items-center justify-center text-lg font-medium
                    ${borderR} ${borderB}
                    ${isSelected ? 'bg-indigo-600' : isHighlighted ? 'bg-slate-700' : 'bg-slate-800'}
                    ${isError ? 'text-red-400' : isOriginal(r, c) ? 'text-slate-100 font-bold' : 'text-indigo-300'}
                    ${!isOriginal(r, c) ? 'cursor-pointer hover:bg-slate-700' : ''}
                    transition-colors`}
                >
                  {cell || ''}
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="max-w-[360px] mx-auto mt-4">
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => handleInput(n)}
              className="py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-lg font-bold transition-colors"
            >
              {n}
            </button>
          ))}
          <button
            onClick={handleErase}
            className="py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-400 transition-colors"
          >
            擦除
          </button>
        </div>
      </div>

      {won && (
        <div className="text-center mt-6">
          <p className="text-lg font-semibold text-emerald-400 mb-3">恭喜完成数独！</p>
          <button onClick={reset} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
            新一局
          </button>
        </div>
      )}

      {!won && (
        <div className="text-center mt-4">
          <button onClick={reset} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            换一题
          </button>
        </div>
      )}
    </div>
  )
}
