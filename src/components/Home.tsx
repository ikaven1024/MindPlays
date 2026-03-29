import { Link } from 'react-router-dom'

const games = [
  { path: '/tictactoe', name: '井字棋', icon: '✕◯', desc: '两人轮流在3×3棋盘落子，三子连线获胜', color: 'from-blue-500 to-cyan-500' },
  { path: '/memory', name: '记忆翻牌', icon: '🃏', desc: '翻开两张相同的牌进行配对，考验记忆力', color: 'from-purple-500 to-pink-500' },
  { path: '/2048', name: '2048', icon: '🔢', desc: '滑动合并相同数字，目标达到2048', color: 'from-amber-500 to-orange-500' },
  { path: '/minesweeper', name: '扫雷', icon: '💣', desc: '翻开安全格子，根据数字推理标记地雷', color: 'from-emerald-500 to-teal-500' },
  { path: '/sudoku', name: '数独', icon: '🧩', desc: '9×9格填入数字，每行每列每宫不重复', color: 'from-rose-500 to-red-500' },
  { path: '/wordle', name: '猜单词', icon: '📝', desc: '6次机会猜出一个5字母英文单词', color: 'from-indigo-500 to-violet-500' },
  { path: '/trueorfalse', name: 'True-False', icon: '🔍', desc: '逆向推理隐藏规则，锻炼逻辑思维', color: 'from-cyan-500 to-blue-500' },
  { path: '/makenumbers', name: '凑十', icon: '🔺', desc: '三角棋盘放数字牌，凑成10即可收集', color: 'from-yellow-500 to-amber-500' },
]

export default function Home() {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          思维游戏合集
        </h1>
        <p className="text-slate-400">选择一个游戏开始挑战吧</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {games.map((game) => (
          <Link
            key={game.path}
            to={game.path}
            className="group block bg-slate-800 rounded-xl border border-slate-700 p-5 transition-all hover:border-indigo-500/50 hover:bg-slate-750 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl shrink-0`}>
                {game.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100 group-hover:text-white">
                  {game.name}
                </h2>
                <p className="text-sm text-slate-400 mt-1">{game.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
