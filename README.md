# MindPlays

一个思维游戏合集 Web 应用，收录了多款经典益智游戏，开箱即玩。

## 包含游戏

| 游戏 | 说明 |
|------|------|
| 井字棋 | 两人轮流在 3×3 棋盘落子，三子连线获胜 |
| 记忆翻牌 | 翻开两张相同的牌进行配对，考验记忆力 |
| 2048 | 滑动合并相同数字，目标达到 2048 |
| 扫雷 | 翻开安全格子，根据数字推理标记地雷 |
| 数独 | 9×9 格填入数字，每行每列每宫不重复 |
| 猜单词 | 6 次机会猜出一个 5 字母英文单词 |
| True-False | 逆向推理隐藏规则，锻炼逻辑思维 |

## 技术栈

- **框架**: React 19 + TypeScript 5.9
- **构建工具**: Vite 8
- **样式**: Tailwind CSS 4
- **路由**: react-router-dom 7
- **包管理器**: pnpm

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 项目结构

```
src/
├── main.tsx              # 入口文件
├── App.tsx               # 路由定义
├── index.css             # 全局样式
├── components/
│   ├── Layout.tsx        # 全局布局（顶栏 + 内容区）
│   ├── Home.tsx          # 首页，展示游戏列表
│   └── BackButton.tsx    # 返回按钮组件
└── games/
    ├── tictactoe/        # 井字棋
    ├── memory/           # 记忆翻牌
    ├── 2048/             # 2048
    ├── minesweeper/      # 扫雷
    ├── sudoku/           # 数独
    ├── wordle/           # 猜单词
    └── trueorfalse/      # True-False 逻辑推理
```

## 添加新游戏

1. 在 `src/games/` 下创建新目录和 `index.tsx` 文件
2. 在 `App.tsx` 添加路由
3. 在 `Home.tsx` 的 `games` 数组中添加入口

## License

MIT
