// 小游戏清单：每新增一个游戏，在下面复制一条记录即可。
// 游戏文件放在 games/游戏目录/index.html，path 相对于 games.html。
// 必填：title、path。其余字段可省略；color 使用 #RRGGBB 格式。
// 可选：cover: "./games/游戏目录/cover.png"，作为卡片封面。
// locales 按全局语言提供 title、description、category；缺少翻译时回退到基础字段。
window.GAME_LIST = [
  {
    title: "迷你割草",
    description: "飞叶绕身，种子开路。在手绘草地上升级成长，守住三分钟。",
    path: "./games/mini-mow/index.html",
    category: "生存挑战",
    color: "#e8eddc",
    cover: "./games/mini-mow/cover.svg",
    locales: {
      en: { title: "Mini Meadow", description: "Orbiting leaves, flying seeds. Grow stronger and survive three minutes in a pencil-drawn meadow.", category: "Survival challenge" },
      ja: { title: "ちいさな草原", description: "葉と種で戦い、強くなって、手描きの草原で3分間生き延びよう。", category: "サバイバル" },
      ko: { title: "작은 풀밭", description: "잎과 씨앗으로 싸우며 성장하고 손으로 그린 풀밭에서 3분을 버텨요.", category: "생존 도전" },
      fr: { title: "Petite prairie", description: "Feuilles en orbite et graines volantes : survivez trois minutes dans une prairie au crayon.", category: "Défi de survie" },
      de: { title: "Kleine Wiese", description: "Kreisende Blätter und fliegende Samen: Wachse und überlebe drei Minuten auf der Bleistiftwiese.", category: "Überlebensspiel" },
      es: { title: "Mini pradera", description: "Hojas orbitales y semillas voladoras. Mejora y sobrevive tres minutos en una pradera a lápiz.", category: "Reto de supervivencia" },
      'pt-BR': { title: "Mini campina", description: "Folhas ao redor e sementes voadoras. Evolua e sobreviva três minutos numa campina a lápis.", category: "Desafio de sobrevivência" }
    }
  },
  {
    title: "俄罗斯方块",
    description: "一块一块慢慢叠，拼出整齐的小快乐。",
    path: "./games/tetris/index.html",
    category: "经典益智",
    color: "#e4e7dc",
    cover: "./games/tetris/cover.svg",
    locales: {
      en: { title: "Tetris", description: "Stack a little joy, one block at a time.", category: "Classic puzzle" },
      ja: { title: "テトリス", description: "ひとつずつ重ねて、小さな喜びをそろえよう。", category: "定番パズル" },
      ko: { title: "테트리스", description: "한 블록씩 차곡차곡, 작은 기쁨을 쌓아요.", category: "클래식 퍼즐" },
      fr: { title: "Tetris", description: "Empilez un peu de joie, un bloc à la fois.", category: "Puzzle classique" },
      de: { title: "Tetris", description: "Stapele kleine Freuden, Stein für Stein.", category: "Puzzle-Klassiker" },
      es: { title: "Tetris", description: "Apila pequeñas alegrías, un bloque cada vez.", category: "Puzle clásico" },
      'pt-BR': { title: "Tetris", description: "Empilhe pequenas alegrias, um bloco de cada vez.", category: "Quebra-cabeça clássico" }
    }
  },
  {
    title: "24 点",
    description: "四张数字牌，加减乘除，拼出刚刚好的 24。",
    path: "./games/twenty-four/index.html",
    category: "动动脑筋",
    color: "#e5e9d9",
    cover: "./games/twenty-four/cover.svg",
    locales: {
      en: { title: "Make 24", description: "Four number cards and a little arithmetic. Can you make 24?", category: "Brain teasers" },
      ja: { title: "24 パズル", description: "4枚の数字カードと四則演算で、ぴったり24をつくろう。", category: "頭の体操" },
      ko: { title: "24 만들기", description: "숫자 카드 네 장과 사칙연산으로 정확히 24를 만들어 보세요.", category: "두뇌 놀이" },
      fr: { title: "Faire 24", description: "Quatre cartes et un peu de calcul pour arriver exactement à 24.", category: "Remue-méninges" },
      de: { title: "Mach 24", description: "Vier Zahlenkarten und die vier Grundrechenarten. Schaffst du genau 24?", category: "Denksport" },
      es: { title: "Haz 24", description: "Cuatro cartas y las cuatro operaciones para llegar justo a 24.", category: "Juegos de ingenio" },
      'pt-BR': { title: "Faça 24", description: "Quatro cartas e as quatro operações para chegar exatamente a 24.", category: "Quebra-cabeças" }
    }
  },
  {
    title: "纸飞机",
    description: "驾驶铅笔画的纸飞机，在草稿纸的天空里躲闪、射击。",
    path: "./games/paper-flight/index.html",
    category: "轻松挑战",
    color: "#f4f1e6",
    cover: "./games/paper-flight/cover.svg",
    locales: {
      en: { title: "Paper Flight", description: "Fly a pencil-drawn paper plane. Dodge and shoot across a notebook sky.", category: "A little challenge" },
      ja: { title: "紙飛行機", description: "鉛筆で描いた紙飛行機で、ノートの空をよけて撃って飛ぼう。", category: "小さな挑戦" },
      ko: { title: "종이비행기", description: "연필로 그린 종이비행기를 타고 노트 속 하늘에서 피하고 쏘아요.", category: "작은 도전" },
      fr: { title: "Vol de papier", description: "Pilotez un avion dessiné au crayon. Esquivez et tirez dans un ciel de papier.", category: "Un petit défi" },
      de: { title: "Papierflug", description: "Fliege durch einen Bleistifthimmel. Weiche aus und schieße mit deinem Papierflieger.", category: "Eine kleine Herausforderung" },
      es: { title: "Vuelo de papel", description: "Pilota un avión dibujado a lápiz. Esquiva y dispara por un cielo de papel.", category: "Un pequeño reto" },
      'pt-BR': { title: "Voo de papel", description: "Pilote um avião desenhado a lápis. Desvie e atire pelo céu de um caderno.", category: "Um pequeno desafio" }
    }
  },
  {
    title: "纸上防线 · MaxTD",
    description: "部署小队、搭起迷宫，在手绘沙盘上守住一波又一波。",
    path: "./games/maxtd/index.html",
    category: "策略塔防",
    color: "#e8ead9",
    cover: "./games/maxtd/cover.svg",
    locales: {
      en: { title: "Paperline TD · MaxTD", description: "Deploy a squad, shape a maze, and hold the line through endless waves.", category: "Tower defense" },
      ja: { title: "紙の防衛線 · MaxTD", description: "部隊を配置して迷路を作り、手描きの戦場で迫る敵を迎え撃とう。", category: "タワーディフェンス" },
      ko: { title: "종이 방어선 · MaxTD", description: "부대를 배치하고 미로를 만들어 끝없이 밀려오는 적을 막아 보세요.", category: "타워 디펜스" },
      fr: { title: "Paperline TD · MaxTD", description: "Déployez votre équipe, tracez un labyrinthe et résistez à des vagues sans fin.", category: "Défense de tours" },
      de: { title: "Paperline TD · MaxTD", description: "Platziere dein Team, baue ein Labyrinth und halte endlose Gegnerwellen auf.", category: "Tower Defense" },
      es: { title: "Paperline TD · MaxTD", description: "Despliega tu equipo, crea un laberinto y resiste oleadas sin fin.", category: "Defensa de torres" },
      'pt-BR': { title: "Paperline TD · MaxTD", description: "Posicione sua equipe, construa um labirinto e resista a ondas sem fim.", category: "Defesa de torres" }
    }
  },
  {
    title: "垂直极限",
    description: "戴上矿工帽，在铅笔画的地底世界里一路向下，勇闯一百层。",
    path: "./games/core-descent/index.html",
    category: "轻松挑战",
    color: "#eee5d4",
    cover: "./games/core-descent/cover.svg",
    locales: {
      en: { title: "Vertical Limit", description: "Put on your miner’s hat and descend a hundred pencil-drawn floors.", category: "A little challenge" },
      ja: { title: "垂直の限界", description: "探検帽をかぶって、鉛筆画の地底世界で100階を目指そう。", category: "小さな挑戦" },
      ko: { title: "수직의 한계", description: "탐험 모자를 쓰고 연필로 그린 지하 세계의 100층을 향해 내려가요.", category: "작은 도전" },
      fr: { title: "Limite verticale", description: "Enfilez votre casque et descendez cent étages dessinés au crayon.", category: "Un petit défi" },
      de: { title: "Vertikales Limit", description: "Setz deinen Helm auf und erkunde hundert mit Bleistift gezeichnete Ebenen.", category: "Eine kleine Herausforderung" },
      es: { title: "Límite vertical", description: "Ponte el casco y desciende cien pisos dibujados a lápiz.", category: "Un pequeño reto" },
      'pt-BR': { title: "Limite vertical", description: "Coloque seu capacete e desça cem andares desenhados a lápis.", category: "Um pequeno desafio" }
    }
  },
  {
    title: "纸上贪吃蛇",
    description: "在方格纸上吃掉小苹果，和铅笔画的小蛇一起慢慢长大。",
    path: "./games/paper-snake/index.html",
    category: "经典小游戏",
    color: "#f2eee3",
    cover: "./games/paper-snake/cover.svg",
    locales: {
      en: { title: "Paper Snake", description: "Eat little apples and grow a pencil-drawn snake on graph paper.", category: "Arcade classics" },
      ja: { title: "紙のヘビ", description: "方眼紙の上でリンゴを食べて、鉛筆のヘビを少しずつ育てよう。", category: "定番ゲーム" },
      ko: { title: "종이 뱀", description: "모눈종이 위에서 사과를 먹고 연필로 그린 작은 뱀을 키워요.", category: "클래식 게임" },
      fr: { title: "Serpent de papier", description: "Mangez des pommes et faites grandir un serpent au crayon sur du papier quadrillé.", category: "Grands classiques" },
      de: { title: "Papierschlange", description: "Iss kleine Äpfel und lass eine Bleistiftschlange auf kariertem Papier wachsen.", category: "Spieleklassiker" },
      es: { title: "Serpiente de papel", description: "Come manzanas y haz crecer una serpiente a lápiz en papel cuadriculado.", category: "Clásicos de arcade" },
      'pt-BR': { title: "Cobrinha de papel", description: "Coma maçãs e faça uma cobrinha a lápis crescer no papel quadriculado.", category: "Clássicos de arcade" }
    }
  },
  {
    title: "钢铁洪流",
    description: "驾驶铅笔画的坦克，击破砖墙，在熟悉的炮火声中守住基地。",
    path: "./games/steel-tide/index.html",
    category: "经典街机",
    color: "#edf0e2",
    cover: "./games/steel-tide/cover.svg",
    locales: {
      en: { title: "Steel Tide", description: "Drive a pencil-drawn tank, break through brick walls, and defend your base.", category: "Arcade classics" },
      ja: { title: "鋼鉄の奔流", description: "鉛筆で描いた戦車を操り、レンガを撃ち抜いて基地を守ろう。", category: "定番アーケード" },
      ko: { title: "강철의 물결", description: "연필로 그린 탱크를 조종하고 벽돌을 부수며 기지를 지켜요.", category: "클래식 아케이드" },
      fr: { title: "Marée d’acier", description: "Pilotez un char dessiné au crayon, brisez les murs et défendez votre base.", category: "Classiques d’arcade" },
      de: { title: "Stahlflut", description: "Steuere einen Bleistiftpanzer, durchbrich Ziegelmauern und verteidige deine Basis.", category: "Arcade-Klassiker" },
      es: { title: "Marea de acero", description: "Pilota un tanque a lápiz, rompe muros de ladrillo y defiende tu base.", category: "Clásicos de arcade" },
      'pt-BR': { title: "Maré de aço", description: "Pilote um tanque a lápis, destrua muros de tijolos e defenda sua base.", category: "Clássicos de arcade" }
    }
  },
  {
    title: "一个消消乐",
    description: "交换手绘小动物，把同色的小快乐，三个三个连起来。",
    path: "./games/animal-match/index.html",
    category: "休闲益智",
    color: "#f2eddf",
    cover: "./games/animal-match/cover.svg",
    locales: {
      en: { title: "A Little Match", description: "Swap hand-drawn animal friends and line up three little joys.", category: "Cozy puzzles" },
      ja: { title: "ちいさなマッチ", description: "手描きの動物たちを入れ替えて、同じ色の幸せを3つ並べよう。", category: "のんびりパズル" },
      ko: { title: "작은 매치", description: "손으로 그린 동물 친구를 바꿔 같은 색의 작은 행복 셋을 맞춰요.", category: "편안한 퍼즐" },
      fr: { title: "Petits accords", description: "Échangez des animaux dessinés à la main et alignez trois petits bonheurs.", category: "Puzzles détente" },
      de: { title: "Kleines Tierglück", description: "Tausche handgezeichnete Tierfreunde und verbinde drei kleine Freuden.", category: "Entspannte Rätsel" },
      es: { title: "Pequeñas coincidencias", description: "Intercambia animales dibujados a mano y une tres pequeñas alegrías.", category: "Puzles tranquilos" },
      'pt-BR': { title: "Pequenos encontros", description: "Troque bichinhos desenhados à mão e combine três pequenas alegrias.", category: "Quebra-cabeças leves" }
    }
  },
  {
    title: "五子棋",
    description: "在纸上落一颗棋子，和三档 AI 慢慢过招。",
    path: "./games/gomoku/index.html",
    category: "经典棋类",
    color: "#e9e8da",
    cover: "./games/gomoku/cover.svg",
    locales: {
      en: { title: "Gomoku", description: "Place a stone on paper and challenge three levels of AI.", category: "Board classics" },
      ja: { title: "五目並べ", description: "紙の盤に石を打ち、3段階の AI とゆっくり対局。", category: "定番ボードゲーム" },
      ko: { title: "오목", description: "종이 위에 돌을 놓고 세 가지 난이도의 AI와 겨뤄요.", category: "클래식 보드 게임" },
      fr: { title: "Gomoku", description: "Posez vos pierres sur le papier et défiez trois niveaux d’IA.", category: "Jeux de plateau" },
      de: { title: "Gomoku", description: "Setze Steine aufs Papier und spiele gegen drei KI-Stufen.", category: "Brettspielklassiker" },
      es: { title: "Gomoku", description: "Coloca piedras sobre papel y reta a tres niveles de IA.", category: "Clásicos de mesa" },
      'pt-BR': { title: "Gomoku", description: "Coloque pedras no papel e desafie três níveis de IA.", category: "Clássicos de tabuleiro" }
    }
  },
  {
    title: "叠叠高",
    description: "看准时机叠起纸块，把小小的快乐，一层层送向云朵。",
    path: "./games/paper-stack/index.html",
    category: "轻松挑战",
    color: "#e5e8d6",
    cover: "./games/paper-stack/cover.svg",
    locales: {
      en: { title: "Paper Stack", description: "Time each tap and stack little paper blocks up toward the clouds.", category: "A little challenge" },
      ja: { title: "つみつみタワー", description: "タイミングを合わせて紙のブロックを積み、雲に近づこう。", category: "小さな挑戦" },
      ko: { title: "차곡차곡 탑", description: "타이밍을 맞춰 종이 블록을 쌓고 구름에 조금 더 가까이 가요.", category: "작은 도전" },
      fr: { title: "Tour de papier", description: "Empilez des blocs de papier au bon moment pour rejoindre les nuages.", category: "Un petit défi" },
      de: { title: "Papierturm", description: "Stapele Papierblöcke im richtigen Moment bis hinauf zu den Wolken.", category: "Eine kleine Herausforderung" },
      es: { title: "Torre de papel", description: "Apila bloques de papel en el momento justo para acercarte a las nubes.", category: "Un pequeño reto" },
      'pt-BR': { title: "Torre de papel", description: "Empilhe blocos de papel na hora certa para chegar mais perto das nuvens.", category: "Um pequeno desafio" }
    }
  },
  {
    title: "一键钓鱼",
    description: "和小猫坐在湖边，抛一竿、等一等，把小小惊喜收进鱼篓。",
    path: "./games/one-cast/index.html",
    category: "放空片刻",
    color: "#e1e8dc",
    cover: "./games/one-cast/cover.svg",
    locales: {
      en: { title: "One Cast", description: "Cast, wait, and reel in little surprises with a cat by the lake.", category: "A quiet moment" },
      ja: { title: "ひと押し釣り", description: "湖畔の猫と、投げて、待って、小さな驚きを釣り上げよう。", category: "のんびり時間" },
      ko: { title: "원터치 낚시", description: "호숫가 고양이와 줄을 던지고 기다려 작은 기쁨을 낚아요.", category: "잠깐의 여유" },
      fr: { title: "Un lancer", description: "Lancez, attendez et pêchez de petites surprises avec un chat au bord du lac.", category: "Un instant de calme" },
      de: { title: "Ein Wurf", description: "Wirf aus, warte und angle mit einer Katze kleine Überraschungen am See.", category: "Eine ruhige Minute" },
      es: { title: "Un lance", description: "Lanza, espera y pesca pequeñas sorpresas con un gato junto al lago.", category: "Un rato de calma" },
      'pt-BR': { title: "Uma fisgada", description: "Lance, espere e pesque pequenas surpresas com um gato à beira do lago.", category: "Um momento de calma" }
    }
  },
  {
    title: "我是老司机",
    description: "握好小方向盘，在手绘停车场里慢慢转弯、倒车，把每一格停得刚刚好。",
    path: "./games/old-driver/index.html",
    category: "驾驶挑战",
    color: "#e3e7d7",
    cover: "./games/old-driver/cover.svg",
    locales: {
      en: { title: "Parking Pro", description: "Steer, reverse, and find the perfect spot in eight hand-drawn parking challenges.", category: "Driving challenge" },
      ja: { title: "駐車の達人", description: "手描きの駐車場でゆっくり曲がって、バックして、8つの課題に挑戦。", category: "運転チャレンジ" },
      ko: { title: "주차의 달인", description: "손으로 그린 주차장에서 회전과 후진을 연습하고 8개 과제에 도전해요.", category: "운전 도전" },
      fr: { title: "As du créneau", description: "Braquez, reculez et trouvez la place parfaite dans huit défis dessinés au crayon.", category: "Défi de conduite" },
      de: { title: "Parkprofi", description: "Lenke, fahre rückwärts und meistere acht handgezeichnete Parkübungen.", category: "Fahrherausforderung" },
      es: { title: "As del aparcamiento", description: "Gira, retrocede y encuentra el sitio perfecto en ocho retos dibujados a mano.", category: "Reto de conducción" },
      'pt-BR': { title: "Ás do volante", description: "Vire, dê ré e encontre a vaga perfeita em oito desafios desenhados à mão.", category: "Desafio de direção" }
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
