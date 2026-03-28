import { useState, useEffect } from 'react'
import BackButton from '../../components/BackButton'

const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🫐', '🍓', '🥝', '🍑']

interface Card {
  id: number
  emoji: string
  flipped: boolean
  matched: boolean
}

function createDeck(): Card[] {
  const pairs = [...EMOJIS, ...EMOJIS]
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
}

export default function Memory() {
  const [cards, setCards] = useState<Card[]>(createDeck)
  const [flippedIds, setFlippedIds] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const [lockBoard, setLockBoard] = useState(false)

  const matchedCount = cards.filter(c => c.matched).length

  useEffect(() => {
    if (matchedCount === cards.length) {
      setWon(true)
    }
  }, [matchedCount, cards.length])

  const handleFlip = (id: number) => {
    if (lockBoard) return
    const card = cards[id]
    if (card.flipped || card.matched) return
    if (flippedIds.length >= 2) return

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c)
    setCards(newCards)

    const newFlipped = [...flippedIds, id]
    setFlippedIds(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      setLockBoard(true)
      const [first, second] = newFlipped
      if (newCards[first].emoji === newCards[second].emoji) {
        setCards(prev => prev.map(c =>
          c.id === first || c.id === second ? { ...c, matched: true } : c
        ))
        setFlippedIds([])
        setLockBoard(false)
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first || c.id === second ? { ...c, flipped: false } : c
          ))
          setFlippedIds([])
          setLockBoard(false)
        }, 800)
      }
    }
  }

  const reset = () => {
    setCards(createDeck())
    setFlippedIds([])
    setMoves(0)
    setWon(false)
    setLockBoard(false)
  }

  return (
    <div>
      <BackButton />
      <h1 className="text-2xl font-bold text-center mb-4">记忆翻牌</h1>

      <div className="flex justify-center gap-6 mb-4 text-sm text-slate-400">
        <span>步数: {moves}</span>
        <span>配对: {matchedCount / 2}/{EMOJIS.length}</span>
      </div>

      <div className="grid grid-cols-4 gap-2 max-w-[320px] mx-auto">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className={`aspect-square rounded-lg text-3xl flex items-center justify-center transition-all duration-300
              ${card.flipped || card.matched
                ? 'bg-slate-700 border border-slate-600 scale-100'
                : 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer scale-100 hover:scale-105'
              }
              ${card.matched ? 'opacity-60' : ''}`}
          >
            {(card.flipped || card.matched) ? card.emoji : '?'}
          </button>
        ))}
      </div>

      {won && (
        <div className="text-center mt-6">
          <p className="text-lg font-semibold text-emerald-400 mb-3">恭喜通关！用了 {moves} 步</p>
          <button onClick={reset} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">
            再来一局
          </button>
        </div>
      )}
    </div>
  )
}
