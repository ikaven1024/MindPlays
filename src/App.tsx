import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './components/Home'
import TicTacToe from './games/tictactoe'
import Memory from './games/memory'
import Game2048 from './games/2048'
import Minesweeper from './games/minesweeper'
import Sudoku from './games/sudoku'
import Wordle from './games/wordle'
import TrueOrFalse from './games/trueorfalse'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tictactoe" element={<TicTacToe />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/2048" element={<Game2048 />} />
        <Route path="/minesweeper" element={<Minesweeper />} />
        <Route path="/sudoku" element={<Sudoku />} />
        <Route path="/wordle" element={<Wordle />} />
        <Route path="/trueorfalse" element={<TrueOrFalse />} />
      </Route>
    </Routes>
  )
}
