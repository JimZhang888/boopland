# 添加小游戏

开始开发前请阅读根目录的 [H5_GAME_RULES.md](../H5_GAME_RULES.md)。该文件统一规定一屏布局、分辨率适配、返回大厅、并行开发分工和交付检查；下面是登记步骤的简版。

1. 在本目录下新建游戏文件夹，例如 `my-game`，入口文件命名为 `index.html`。
2. 打开项目根目录的 `gamelist.js`，在 `window.GAME_LIST` 数组中增加一条记录（记录之间用逗号分隔）：

   ```js
   {
     title: "游戏名字",
     description: "用一句话介绍游戏。",
     path: "./games/my-game/index.html",
     category: "轻松一刻",
     color: "#eaded0"
   }
   ```

   `title` 和 `path` 必填；其他字段可省略。`color` 是六位十六进制封面底色，也可以添加 `cover: "./games/my-game/cover.png"` 使用图片封面。大厅按清单顺序排列。
3. 刷新 `games.html`。无需构建、后端或安装依赖，可以直接双击打开，也可以通过普通静态服务器访问。

游戏内返回大厅的链接：`<a href="../../games.html">返回大厅</a>`。

`blank` 是纯色示例：只有鼠尾草绿色背景和返回大厅按钮。

并行开发时，每个任务只修改自己的游戏目录，提供清单记录给集成人，由集成人统一更新 `gamelist.js`。
