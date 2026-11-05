// 小游戏清单：每新增一个游戏，在下面复制一条记录即可。
// 游戏文件放在 games/游戏目录/index.html，path 相对于 games.html。
// 必填：title、path。其余字段可省略；color 使用 #RRGGBB 格式。
// 可选：cover: "./games/游戏目录/cover.png"，作为卡片封面。
// locales 按全局语言提供 title、description、category；缺少翻译时回退到基础字段。
window.GAME_LIST = [
  {
    title: "留白",
    description: "一小片鼠尾草绿，什么也不用做。",
    path: "./games/blank/index.html",
    category: "放空片刻",
    color: "#dce5d8",
    locales: {
      en: { title: "Stillness", description: "A little sage-green space. Nothing you need to do.", category: "A quiet moment" },
      ja: { title: "余白", description: "セージグリーンの小さな空間。何もしなくていい。", category: "ひとやすみ" },
      ko: { title: "여백", description: "아무것도 하지 않아도 좋은 작은 초록 공간.", category: "잠깐의 여유" },
      fr: { title: "Une pause", description: "Un petit espace vert sauge. Rien à faire, juste être là.", category: "Un instant de calme" },
      de: { title: "Stille", description: "Ein kleines Stück Salbeigrün. Du musst nichts tun.", category: "Ein stiller Moment" },
      es: { title: "Una pausa", description: "Un rincón verde salvia. No tienes que hacer nada.", category: "Un momento de calma" },
      'pt-BR': { title: "Uma pausa", description: "Um cantinho verde-sálvia. Sem precisar fazer nada.", category: "Um momento de calma" }
    }
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
