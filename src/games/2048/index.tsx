import { useState, useEffect, useCallback } from 'react'
import BackButton from '../../components/BackButton'

type Grid = number[][]

function createEmpty(): Grid {
  return Array.from({ length: 4 }, () => Array(4).fill(0))
}

function addRandom(grid: Grid): Grid {
  const newGrid = grid.map(r => [...r])
  const empty: [number, number][] = []
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (newGrid[r][c] === 0) empty.push([r, c])
  if (empty.length === 0) return newGrid
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4
  return newGrid
}

function slideRow(row: number[]): { result: number[]; score: number } {
  let score = 0
  const filtered = row.filter(x => x !== 0)
  const result: number[] = []
  let i = 0
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2
      result.push(merged)
      score += merged
      i += 2
    } else {
      result.push(filtered[i])
      i++
    }
  }
  while (result.length < 4) result.push(0)
  return { result, score }
}

function moveLeft(grid: Grid): { grid: Grid; score: number; moved: boolean } {
  let totalScore = 0
  let moved = false
  const newGrid = grid.map(row => {
    const { result, score } = slideRow(row)
    totalScore += score
    if (row.some((v, i) => v !== result[i])) moved = true
    return result
  })
  return { grid: newGrid, score: totalScore, moved }
}

function rotateGrid(grid: Grid): Grid {
  const n = grid.length
  const rotated = createEmpty()
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      rotated[c][n - 1 - r] = grid[r][c]
  return rotated
}

function move(grid: Grid, direction: number): { grid: Grid; score: number; moved: boolean } {
  let g = grid.map(r => [...r])
  // rotate so we always slide left
  for (let i = 0; i < direction; i++) g = rotateGrid(g)
  const result = moveLeft(g)
  // rotate back
  let finalGrid = result.grid
  for (let i = 0; i < (4 - direction) % 4; i++) finalGrid = rotateGrid(finalGrid)
  return { grid: finalGrid, score: result.score, moved: result.moved }
}

function canMove(grid: Grid): boolean {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return true
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return true
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return true
    }
  return false
}

function has2048(grid: Grid): boolean {
  return grid.some(row => row.some(v => v >= 2048))
}

// direction: 0=left, 1=up, 2=right, 3=down
const TILE_COLORS: Record<number, string> = {
  0: 'bg-slate-800',
  2: 'bg-slate-700 text-slate-200',
  4: 'bg-slate-600 text-slate-100',
  8: 'bg-orange-700 text-white',
  16: 'bg-orange-600 text-white',
  32: 'bg-orange-500 text-white',
  64: 'bg-red-500 text-white',
  128: 'bg-yellow-500 text-white',
  256: 'bg-yellow-400 text-slate-900',
  512: 'bg-yellow-300 text-slate-900',
  1024: 'bg-amber-400 text-slate-900',
  2048: 'bg-amber-300 text-slate-900',
}

function initGame(): Grid {
  return addRandom(addRandom(createEmpty()))
}

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>(initGame)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem('2048-best') || 0))
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)

  const handleMove = useCallback((direction: number) => {
    if (gameOver) return
    setGrid(prev => {
      const result = move(prev, direction)
      if (!result.moved) return prev
      const newGrid = addRandom(result.grid)
      const newScore = score + result.score
      setScore(newScore)
      if (newScore > best) {
        setBest(newScore)
        localStorage.setItem('2048-best', String(newScore))
      }
      if (has2048(newGrid) && !won) setWon(true)
      if (!canMove(newGrid)) setGameOver(true)
      return newGrid
    })
  }, [gameOver, score, best, won])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = {
        ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3,
      }
      if (map[e.key] !== undefined) {
        e.preventDefault()
        handleMove(map[e.key])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleMove])

  // touch support
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return
    const dx = e.changedTouches[0].clientX - touchStart.x
    const dy = e.changedTouches[0].clientY - touchStart.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (Math.max(absDx, absDy) < 30) return
    if (absDx > absDy) {
      handleMove(dx > 0 ? 2 : 0)
    } else {
      handleMove(dy > 0 ? 3 : 1)
    }
    setTouchStart(null)
  }

  const reset = () => {
    setGrid(initGame())
    setScore(0)
    setGameOver(false)
    setWon(false)
  }

  return (
    <div>
      <BackButton />
      <h1 className="text-2xl font-bold text-center mb-4">2048</h1>

      <div className="flex justify-center gap-4 mb-4">
        <div className="bg-slate-800 rounded-lg px-4 py-2 text-center">
          <div className="text-xs text-slate-400">分数</div>
          <div className="text-lg font-bold">{score}</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-4 py-2 text-center">
          <div className="text-xs text-slate-400">最高</div>
          <div className="text-lg font-bold">{best}</div>
        </div>
      </div>

      <div
        className="bg-slate-800 rounded-xl p-2 max-w-[340px] mx-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-4 gap-2">
          {grid.flat().map((value, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg flex items-center justify-center font-bold transition-all
                ${TILE_COLORS[value] || 'bg-purple-500 text-white'}
                ${value >= 1024 ? 'text-lg' : 'text-2xl'}`}
            >
              {value || ''}
            </div>
          ))}
        </div>
      </div>

      {(gameOver || won) && (
        <div className="text-center mt-4">
          <p className="text-lg font-semibold mb-3">
            {won ? '恭喜达到 2048！' : '游戏结束！'}
          </p>
          <button onClick={reset} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
            重新开始
          </button>
        </div>
      )}

      <p className="text-center text-slate-500 text-xs mt-4">使用方向键或滑动操作</p>
    </div>
  )
}
