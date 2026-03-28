import { useState, useEffect, useCallback } from 'react'
import BackButton from '../../components/BackButton'

const WORDS = [
  'APPLE', 'BRAVE', 'CRANE', 'DANCE', 'EAGLE',
  'FAITH', 'GRAPE', 'HAPPY', 'IMAGE', 'JOKER',
  'KNIFE', 'LEMON', 'MAGIC', 'NOBLE', 'OCEAN',
  'PEARL', 'QUEEN', 'RIVER', 'SUGAR', 'TOWER',
  'ULTRA', 'VIVID', 'WATER', 'YOUTH', 'ZEBRA',
  'ALARM', 'BEACH', 'CHUNK', 'DRIFT', 'ELITE',
  'FLAME', 'GHOST', 'HOBBY', 'INPUT', 'JUICE',
  'KAYAK', 'LLAMA', 'MEDAL', 'NERVE', 'OLIVE',
  'PIZZA', 'QUEST', 'RANCH', 'SALAD', 'TRAIN',
  'UNION', 'VALVE', 'WHALE', 'WORLD', 'PIXEL',
]

const MAX_GUESSES = 6

type LetterState = 'correct' | 'present' | 'absent' | 'empty'

function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(5).fill('absent')
  const answerChars = answer.split('')
  const guessChars = guess.split('')

  // First pass: correct positions
  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = 'correct'
      answerChars[i] = '#'
      guessChars[i] = '*'
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === '*') continue
    const idx = answerChars.indexOf(guessChars[i])
    if (idx !== -1) {
      result[i] = 'present'
      answerChars[idx] = '#'
    }
  }

  return result
}

const ROWS = Array.from({ length: MAX_GUESSES }, (_, i) => i)

export default function Wordle() {
  const [answer, setAnswer] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)])
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [won, setWon] = useState(false)
  const [lost, setLost] = useState(false)

  const allResults = guesses.map(g => evaluateGuess(g, answer))

  // Keyboard state
  const keyStates: Record<string, LetterState> = {}
  allResults.forEach((results, gi) => {
    guesses[gi].split('').forEach((letter, li) => {
      const state = results[li]
      const prev = keyStates[letter]
      if (prev === 'correct') return
      if (prev === 'present' && state !== 'correct') return
      keyStates[letter] = state
    })
  })

  const handleSubmit = useCallback(() => {
    if (currentInput.length !== 5 || won || lost) return
    const newGuesses = [...guesses, currentInput.toUpperCase()]
    setGuesses(newGuesses)
    if (currentInput.toUpperCase() === answer) {
      setWon(true)
    } else if (newGuesses.length >= MAX_GUESSES) {
      setLost(true)
    }
    setCurrentInput('')
  }, [currentInput, guesses, won, lost, answer])

  const handleKey = useCallback((key: string) => {
    if (won || lost) return
    if (key === 'ENTER') {
      handleSubmit()
    } else if (key === 'BACK' || key === 'BACKSPACE') {
      setCurrentInput(prev => prev.slice(0, -1))
    } else if (/^[A-Z]$/.test(key) && currentInput.length < 5) {
      setCurrentInput(prev => prev + key)
    }
  }, [won, lost, currentInput, handleSubmit])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return
      const key = e.key.toUpperCase()
      if (key === 'ENTER') {
        e.preventDefault()
        handleKey('ENTER')
      } else if (key === 'BACKSPACE') {
        handleKey('BACK')
      } else if (/^[A-Z]$/.test(key)) {
        handleKey(key)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleKey])

  const reset = () => {
    setAnswer(WORDS[Math.floor(Math.random() * WORDS.length)])
    setGuesses([])
    setCurrentInput('')
    setWon(false)
    setLost(false)
  }

  const keyBg = (state: LetterState) => {
    switch (state) {
      case 'correct': return 'bg-emerald-600 text-white'
      case 'present': return 'bg-amber-600 text-white'
      case 'absent': return 'bg-slate-700 text-slate-400'
      default: return 'bg-slate-600 text-white'
    }
  }

  const cellBg = (state: LetterState) => {
    switch (state) {
      case 'correct': return 'bg-emerald-600 border-emerald-500'
      case 'present': return 'bg-amber-600 border-amber-500'
      case 'absent': return 'bg-slate-700 border-slate-600'
      default: return 'bg-slate-800 border-slate-700'
    }
  }

  const KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

  return (
    <div>
      <BackButton />
      <h1 className="text-2xl font-bold text-center mb-4">猜单词</h1>

      <div className="max-w-[340px] mx-auto mb-4">
        {ROWS.map((row) => {
          const guess = guesses[row]
          const results = guess ? allResults[row] : null
          const isCurrentRow = row === guesses.length

          return (
            <div key={row} className="grid grid-cols-5 gap-1.5 mb-1.5">
              {Array.from({ length: 5 }, (_, col) => {
                const letter = guess
                  ? guess[col]
                  : isCurrentRow
                  ? currentInput[col] || ''
                  : ''
                const state = results ? results[col] : 'empty'

                return (
                  <div
                    key={col}
                    className={`aspect-square rounded flex items-center justify-center text-2xl font-bold border-2
                      ${cellBg(state)}
                      transition-all`}
                  >
                    {letter}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="max-w-[400px] mx-auto">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1 mb-1">
            {ri === 2 && (
              <button
                onClick={() => handleKey('ENTER')}
                className="px-3 py-3 bg-slate-600 rounded text-xs font-bold text-white"
              >
                确认
              </button>
            )}
            {row.split('').map(letter => (
              <button
                key={letter}
                onClick={() => handleKey(letter)}
                className={`w-9 h-12 rounded font-bold text-sm transition-colors ${keyBg(keyStates[letter] || 'empty')}`}
              >
                {letter}
              </button>
            ))}
            {ri === 2 && (
              <button
                onClick={() => handleKey('BACK')}
                className="px-3 py-3 bg-slate-600 rounded text-sm font-bold text-white"
              >
                ←
              </button>
            )}
          </div>
        ))}
      </div>

      {(won || lost) && (
        <div className="text-center mt-4">
          <p className={`text-lg font-semibold mb-2 ${won ? 'text-emerald-400' : 'text-red-400'}`}>
            {won ? '猜对了！' : `答案是 ${answer}`}
          </p>
          <button onClick={reset} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
            再来一局
          </button>
        </div>
      )}
    </div>
  )
}
