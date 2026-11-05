// 小游戏清单：每新增一个游戏，在下面复制一条记录即可。
// 游戏文件放在 games/游戏目录/index.html，path 相对于 games.html。
// 必填：title、path。其余字段可省略；color 使用 #RRGGBB 格式。
// 可选：cover: "./games/游戏目录/cover.png"，作为卡片封面。
window.GAME_LIST = [
  {
    title: "留白",
    description: "一小片鼠尾草绿，什么也不用做。",
    path: "./games/blank/index.html",
    category: "放空片刻",
    color: "#dce5d8"
  },
  // 新增示例（删除每行开头的 //，修改内容即可）：
  // {
  //   title: "游戏名字",
  //   description: "用一句话介绍这个小世界。",
  //   path: "./games/my-game/index.html",
  //   category: "轻松一刻",
  //   color: "#eaded0"
  // },
];
