import { useState, useCallback } from 'react'
import BackButton from '../../components/BackButton'

type Player = 'X' | 'O' | null
type Board = Player[]

const lines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function checkWinner(board: Board): { winner: Player; line: number[] | null } {
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] }
    }
  }
  return { winner: null, line: null }
}

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 })

  const { winner, line } = checkWinner(board)
  const isDraw = !winner && board.every(Boolean)

  const status = winner
    ? `${winner} 获胜!`
    : isDraw
    ? '平局!'
    : `${xIsNext ? 'X' : 'O'} 的回合`

  const handleClick = useCallback((i: number) => {
    if (board[i] || checkWinner(board).winner) return
    const next = [...board]
    next[i] = xIsNext ? 'X' : 'O'
    setBoard(next)
    setXIsNext(!xIsNext)

    const result = checkWinner(next)
    if (result.winner) {
      setScore(s => ({ ...s, [result.winner!]: s[result.winner!] + 1 }))
    } else if (next.every(Boolean)) {
      setScore(s => ({ ...s, draw: s.draw + 1 }))
    }
  }, [board, xIsNext])

  const reset = () => {
    setBoard(Array(9).fill(null))
    setXIsNext(true)
  }

  return (
    <div>
      <BackButton />
      <h1 className="text-2xl font-bold text-center mb-4">井字棋</h1>

      <div className="flex justify-center gap-6 mb-4 text-sm">
        <span className={xIsNext && !winner && !isDraw ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
          X: {score.X}
        </span>
        <span className="text-slate-500">平局: {score.draw}</span>
        <span className={!xIsNext && !winner && !isDraw ? 'text-rose-400 font-bold' : 'text-slate-400'}>
          O: {score.O}
        </span>
      </div>

      <p className="text-center mb-4 text-lg font-semibold">{status}</p>

      <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={`aspect-square rounded-lg text-4xl font-bold transition-all
              ${cell ? 'cursor-default' : 'cursor-pointer hover:bg-slate-700'}
              ${line?.includes(i) ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'}
              ${cell === 'X' ? 'text-cyan-400' : 'text-rose-400'}`}
          >
            {cell}
          </button>
        ))}
      </div>

      {(winner || isDraw) && (
        <div className="text-center mt-4">
          <button onClick={reset} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
            再来一局
          </button>
        </div>
      )}
    </div>
  )
}
