// 小游戏清单：每新增一个游戏，在下面复制一条记录即可。
// 游戏文件放在 games/游戏目录/index.html，path 相对于 games.html。
// 必填：title、path。其余字段可省略；color 使用 #RRGGBB 格式。
// 可选：cover: "./games/游戏目录/cover.png"，作为卡片封面。
// category 只选：休闲、益智、解谜、动作、策略、棋牌；分类译名由大厅统一提供。
// tags 可选：包含 "推荐" 时展示在大厅推荐区，例如 tags: ["推荐"]。
// locales 按全局语言提供 title、description；缺少翻译时回退到基础字段。
window.GAME_LIST = [
  {
    title: "南通长牌",
    description: "一盏茶，一副长牌。与两位电脑牌友玩双将，碰杠听胡，慢慢过招。",
    path: "./games/nantong-changpai/index.html",
    category: "棋牌",
    tags: ["推荐"],
    color: "#e6ebdc",
    cover: "./games/nantong-changpai/cover.svg",
    locales: {
      en: { title: "Nantong Long Cards", description: "A cup of tea and a traditional card game. Play two computer opponents, form sets, and discover double-general scoring." },
      ja: { title: "南通長牌", description: "お茶と一緒に、二人のコンピューターと長牌対戦。ポン・カン・和了で楽しむ双将ルール。" },
      ko: { title: "난퉁 장패", description: "차 한 잔과 전통 카드 놀이. 컴퓨터 친구 둘과 쌍장 규칙으로 퐁, 깡, 승리를 즐겨요." },
      fr: { title: "Cartes de Nantong", description: "Un thé et un jeu traditionnel. Affrontez deux adversaires virtuels et découvrez les règles des deux généraux." },
      de: { title: "Nantong-Langkarten", description: "Eine Tasse Tee und ein traditionelles Kartenspiel gegen zwei Computer. Entdecke die Regeln mit zwei Generälen." },
      es: { title: "Cartas de Nantong", description: "Un té y un juego tradicional. Juega contra dos rivales y descubre las reglas de los dos generales." },
      'pt-BR': { title: "Cartas de Nantong", description: "Um chá e um jogo tradicional. Enfrente dois oponentes e descubra as regras dos dois generais." }
    }
  },
  {
    title: "纸间衣橱",
    description: "给手绘纸娃娃搭一身日常：自由穿搭、场景挑战与小店委托，把喜欢的造型存成明信片。",
    path: "./games/paper-wardrobe/index.html",
    category: "休闲",
    tags: ["推荐"],
    color: "#e4e8d8",
    cover: "./games/paper-wardrobe/cover.svg",
    locales: {
      en: { title: "Paper Wardrobe", description: "Style a hand-drawn paper doll, explore themed scenes and little commissions, and save your favorite looks as postcards." },
      ja: { title: "紙のクローゼット", description: "手描きの紙人形を自由に着せ替え。シーンへの挑戦や小さな依頼を楽しみ、お気に入りをポストカードに。" },
      ko: { title: "종이 옷장", description: "손으로 그린 종이 인형을 꾸며요. 자유 코디, 테마 도전과 작은 의뢰를 즐기고 마음에 드는 모습을 엽서로 간직해요." },
      fr: { title: "Garde-robe de papier", description: "Habillez une poupée dessinée à la main, explorez des scènes et des commandes, puis gardez vos tenues en cartes postales." },
      de: { title: "Papierkleiderschrank", description: "Style eine gezeichnete Papierpuppe, erfülle Szenen und kleine Aufträge und bewahre Lieblingsoutfits als Postkarten." },
      es: { title: "Armario de papel", description: "Viste una muñeca dibujada a mano, explora escenas y pequeños encargos y guarda tus conjuntos favoritos como postales." },
      'pt-BR': { title: "Guarda-roupa de papel", description: "Vista uma boneca desenhada à mão, explore cenas e pequenos pedidos e guarde seus looks favoritos como cartões-postais." }
    }
  },
  {
    title: "发条小镇",
    description: "陪小机器人走过六章手绘冒险：点亮钟楼、唤醒温室、平衡吊桥，让星邮列车重新出发。",
    path: "./games/clockwork-town/index.html",
    category: "解谜",
    tags: ["推荐"],
    color: "#e4e7d7",
    cover: "./games/clockwork-town/cover.svg",
    locales: {
      en: { title: "Clockwork Town", description: "Six hand-drawn chapters with a little robot. Light the tower, revive a greenhouse, balance a bridge and restart the mail train." },
      ja: { title: "ぜんまいの街", description: "小さなロボットと六章の手描き冒険へ。塔を照らし、温室を育て、橋を直し、星便を出発させよう。" },
      ko: { title: "태엽 마을", description: "작은 로봇과 손그림 모험 여섯 장을 떠나요. 탑과 온실을 깨우고 다리를 고쳐 우편차를 출발시켜요." },
      fr: { title: "La ville mécanique", description: "Six chapitres dessinés avec un petit robot. Rallumez la tour, réveillez la serre, équilibrez le pont et relancez le courrier." },
      de: { title: "Uhrwerkstädtchen", description: "Sechs gezeichnete Kapitel mit einem kleinen Roboter. Erhelle den Turm, belebe das Gewächshaus, repariere die Brücke und starte die Postbahn." },
      es: { title: "Pueblo de cuerda", description: "Seis capítulos dibujados con un pequeño robot. Ilumina la torre, revive el invernadero, equilibra el puente y reactiva el tren postal." },
      'pt-BR': { title: "Vila de corda", description: "Seis capítulos desenhados com um pequeno robô. Ilumine a torre, reviva a estufa, equilibre a ponte e reative o trem postal." }
    }
  },
  {
    title: "纸上防线 · MaxTD",
    description: "部署小队、搭起迷宫，在手绘沙盘上守住一波又一波。",
    path: "./games/maxtd/index.html",
    category: "策略",
    tags: ["推荐"],
    color: "#e8ead9",
    cover: "./games/maxtd/cover.svg",
    locales: {
      en: { title: "Paperline TD · MaxTD", description: "Deploy a squad, shape a maze, and hold the line through endless waves." },
      ja: { title: "紙の防衛線 · MaxTD", description: "部隊を配置して迷路を作り、手描きの戦場で迫る敵を迎え撃とう。" },
      ko: { title: "종이 방어선 · MaxTD", description: "부대를 배치하고 미로를 만들어 끝없이 밀려오는 적을 막아 보세요." },
      fr: { title: "Paperline TD · MaxTD", description: "Déployez votre équipe, tracez un labyrinthe et résistez à des vagues sans fin." },
      de: { title: "Paperline TD · MaxTD", description: "Platziere dein Team, baue ein Labyrinth und halte endlose Gegnerwellen auf." },
      es: { title: "Paperline TD · MaxTD", description: "Despliega tu equipo, crea un laberinto y resiste oleadas sin fin." },
      'pt-BR': { title: "Paperline TD · MaxTD", description: "Posicione sua equipe, construa um labirinto e resista a ondas sem fim." }
    }
  },
  {
    title: "一个消消乐",
    description: "交换手绘小动物，把同色的小快乐，三个三个连起来。",
    path: "./games/animal-match/index.html",
    category: "益智",
    tags: ["推荐"],
    color: "#f2eddf",
    cover: "./games/animal-match/cover.svg",
    locales: {
      en: { title: "A Little Match", description: "Swap hand-drawn animal friends and line up three little joys." },
      ja: { title: "ちいさなマッチ", description: "手描きの動物たちを入れ替えて、同じ色の幸せを3つ並べよう。" },
      ko: { title: "작은 매치", description: "손으로 그린 동물 친구를 바꿔 같은 색의 작은 행복 셋을 맞춰요." },
      fr: { title: "Petits accords", description: "Échangez des animaux dessinés à la main et alignez trois petits bonheurs." },
      de: { title: "Kleines Tierglück", description: "Tausche handgezeichnete Tierfreunde und verbinde drei kleine Freuden." },
      es: { title: "Pequeñas coincidencias", description: "Intercambia animales dibujados a mano y une tres pequeñas alegrías." },
      'pt-BR': { title: "Pequenos encontros", description: "Troque bichinhos desenhados à mão e combine três pequenas alegrias." }
    }
  },
  {
    title: "行李箱收纳师",
    description: "转一转，放一放，把旅行小物装得刚刚好。六段旅程，收集六枚出发印章。",
    path: "./games/suitcase-story/index.html",
    category: "解谜",
    color: "#e3e9dc",
    cover: "./games/suitcase-story/cover.svg",
    locales: {
      en: { title: "Suitcase Stories", description: "Turn, tuck, and find a just-right place for every travel essential. Six little journeys, six stamps to collect." },
      ja: { title: "スーツケースの物語", description: "回して、並べて、旅の小物をぴったり収納。6つの旅で出発スタンプを集めよう。" },
      ko: { title: "여행 가방 정리사", description: "돌리고 놓으며 여행 소품의 자리를 찾아요. 여섯 여행에서 출발 도장을 모아 보세요." },
      fr: { title: "Petite valise", description: "Tournez et rangez chaque objet à sa juste place. Six petits voyages et six tampons à collectionner." },
      de: { title: "Kleine Kofferreise", description: "Drehen, packen und für jedes Reiseding den richtigen Platz finden. Sechs Reisen, sechs Stempel zum Sammeln." },
      es: { title: "Pequeña maleta", description: "Gira y encuentra el lugar perfecto para cada objeto. Seis pequeños viajes y seis sellos para coleccionar." },
      'pt-BR': { title: "Pequena mala", description: "Gire e ache o lugar certinho para cada objeto. Seis pequenas viagens e seis carimbos para colecionar." }
    }
  },
  {
    title: "动物连连看",
    description: "绕个小弯，让相同的小伙伴相遇。动物与水果，两套手绘图案慢慢连。",
    path: "./games/animal-link/index.html",
    category: "益智",
    color: "#e6eadb",
    cover: "./games/animal-link/cover.svg",
    locales: {
      en: { title: "Animal Links", description: "A little detour brings matching friends together. Connect hand-drawn animals and fruit at your own pace." },
      ja: { title: "どうぶつ四川省", description: "すこし遠回りして、同じ仲間と出会おう。手描きのどうぶつとくだものを、ゆっくりつなぐパズル。" },
      ko: { title: "동물 연결하기", description: "작은 길을 따라 같은 친구를 만나요. 손그림 동물과 과일을 천천히 연결해 보세요." },
      fr: { title: "Liens animaux", description: "Un petit détour réunit les amis. Reliez animaux et fruits dessinés à la main, à votre rythme." },
      de: { title: "Tierpaare", description: "Ein kleiner Umweg bringt Freunde zusammen. Verbinde handgezeichnete Tiere und Früchte in deinem Tempo." },
      es: { title: "Conecta animales", description: "Un pequeño rodeo reúne a los amigos. Conecta animales y frutas dibujados a mano, sin prisas." },
      'pt-BR': { title: "Conecta bichinhos", description: "Uma pequena volta reúne os amigos. Conecte animais e frutas desenhados à mão no seu ritmo." }
    }
  },
  {
    title: "纸间拼图 · 图片华容道",
    description: "滑动纸片，把风景慢慢拼回来。三种难度，也能用自己的照片挑战数字滑块。",
    path: "./games/picture-slide/index.html",
    category: "益智",
    color: "#e7e9dc",
    cover: "./games/picture-slide/cover.svg",
    locales: {
      en: { title: "Paper Pieces · Sliding Puzzle", description: "Slide little paper tiles to restore a landscape. Three sizes, number hints, and your own photographs." },
      ja: { title: "紙のパズル · スライドパズル", description: "紙のピースを動かして風景を元どおりに。3つの難しさと番号ヒント、自分の写真でも遊べます。" },
      ko: { title: "종이 조각 · 슬라이드 퍼즐", description: "종이 조각을 움직여 풍경을 완성해요. 세 가지 크기, 숫자 힌트와 내 사진으로도 즐겨요." },
      fr: { title: "Puzzle de papier · Taquin", description: "Glissez les pièces pour retrouver un paysage. Trois formats, des numéros et vos propres photos." },
      de: { title: "Papierpuzzle · Schiebespiel", description: "Schiebe kleine Papierteile zu einem Bild. Drei Größen, Zahlenhilfe und deine eigenen Fotos." },
      es: { title: "Piezas de papel · Puzzle", description: "Desliza las piezas para recomponer un paisaje. Tres tamaños, pistas numéricas y tus propias fotos." },
      'pt-BR': { title: "Pedaços de papel · Quebra-cabeça", description: "Deslize as peças para montar uma paisagem. Três tamanhos, dicas numéricas e suas próprias fotos." }
    }
  },
  {
    title: "猫咪推箱子",
    description: "帮小猫收拾新家，把纸箱推到爪印上，在 12 间手绘小屋里慢慢动脑筋。",
    path: "./games/cat-sokoban/index.html",
    category: "益智",
    color: "#e9eadc",
    cover: "./games/cat-sokoban/cover.svg",
    locales: {
      en: { title: "Cat & Crates", description: "Help a little cat move in. Push crates onto paw prints in twelve cozy, hand-drawn rooms." },
      ja: { title: "ねこの箱運び", description: "ねこのお引っ越しをお手伝い。12の手描きのお部屋で、箱を肉球マークへ運ぼう。" },
      ko: { title: "고양이 상자 밀기", description: "고양이의 새집 정리를 도와요. 손으로 그린 12개 방에서 상자를 발자국 위로 밀어요." },
      fr: { title: "Chat & cartons", description: "Aidez un petit chat à emménager : poussez les cartons sur les empreintes dans douze pièces dessinées au crayon." },
      de: { title: "Katze & Kisten", description: "Hilf einer Katze beim Einzug und schiebe Kisten auf Pfotenspuren in zwölf gemütlichen, gezeichneten Räumen." },
      es: { title: "Gato y cajas", description: "Ayuda a un gatito con la mudanza. Lleva las cajas a las huellas en doce acogedoras habitaciones dibujadas a mano." },
      'pt-BR': { title: "Gato e caixas", description: "Ajude um gatinho na mudança. Leve as caixas até as patinhas em doze quartos aconchegantes desenhados à mão." }
    }
  },
  {
    title: "云间来信 · 跳一跳",
    description: "和小夏一起，按住蓄力、松开起跳，在花朵与薄雾间走向下一座浮岛。",
    path: "./games/cloud-leap/index.html",
    category: "动作",
    color: "#e6eadb",
    cover: "./games/cloud-leap/cover.svg",
    locales: {
      en: { title: "Cloud Letters · Jump", description: "Hold to charge, release to leap, and join a little girl among flowers and floating islands." },
      ja: { title: "雲からの手紙 · ジャンプ", description: "長押しで力をため、離してジャンプ。少女と花や霧に包まれた浮島を旅しよう。" },
      ko: { title: "구름 편지 · 점프", description: "눌러 힘을 모으고 놓아서 점프해요. 소녀와 함께 꽃과 안개 사이의 떠 있는 섬을 여행해요." },
      fr: { title: "Lettres des nuages · Sauts", description: "Maintenez puis relâchez pour sauter avec une petite fille entre fleurs et îles flottantes." },
      de: { title: "Wolkenpost · Hüpfspiel", description: "Halten, loslassen und mit einem kleinen Mädchen über blühende Inseln in den Wolken springen." },
      es: { title: "Cartas de las nubes · Saltos", description: "Mantén y suelta para saltar con una niña entre flores, niebla e islas flotantes." },
      'pt-BR': { title: "Cartas das nuvens · Saltos", description: "Segure e solte para pular com uma menina entre flores, névoa e ilhas flutuantes." }
    }
  },
  {
    title: "上班摸鱼",
    description: "按住摸鱼，松手工作。识破老板的假动作，带着快乐准时下班。",
    path: "./games/office-slacker/index.html",
    category: "休闲",
    color: "#e8eadc",
    cover: "./games/office-slacker/cover.svg",
    locales: {
      en: { title: "Office Slacker", description: "Hold to slack, release to work. Dodge the boss’s tricks and make it to clock-out." },
      ja: { title: "こっそりサボり", description: "押してサボる、離して仕事。上司のフェイントを見抜いて定時退社！" },
      ko: { title: "월급 루팡", description: "누르면 딴짓, 떼면 업무. 사장님의 속임수를 피하고 무사히 퇴근해요." },
      fr: { title: "Pause au bureau", description: "Maintenez pour flâner, relâchez pour travailler. Déjouez les feintes du patron !" },
      de: { title: "Büro-Auszeit", description: "Halten zum Faulenzen, loslassen zum Arbeiten. Durchschaue die Tricks des Chefs!" },
      es: { title: "Escapada de oficina", description: "Mantén para holgazanear, suelta para trabajar. ¡Esquiva los trucos del jefe!" },
      'pt-BR': { title: "Folga no escritório", description: "Segure para enrolar, solte para trabalhar. Escape dos truques do chefe!" }
    }
  },
  {
    title: "九宫格探险·迷雾篇",
    description: "翻开迷雾中的九宫格，在战斗、补给和奇遇之间取舍，闯过五层手绘秘境。",
    path: "./games/ninefold-quest/index.html",
    category: "策略",
    color: "#e5e9dc",
    cover: "./games/ninefold-quest/cover.svg",
    locales: {
      en: { title: "Ninefold Quest", description: "Reveal misty tiles, weigh battles against supplies, and explore five hand-drawn realms." },
      ja: { title: "九マスの冒険・霧の章", description: "霧のマスをめくり、戦闘と補給を選びながら、手描きの五つの秘境を進もう。" },
      ko: { title: "아홉 칸 모험 · 안개 편", description: "안개 속 칸을 열고 전투와 보급을 선택하며 손으로 그린 다섯 세계를 탐험해요." },
      fr: { title: "Neuf cases d’aventure", description: "Dissipez la brume, choisissez vos combats et explorez cinq royaumes dessinés au crayon." },
      de: { title: "Neun-Felder-Abenteuer", description: "Lüfte den Nebel, wäge Kämpfe und Vorräte ab und erkunde fünf gezeichnete Welten." },
      es: { title: "Aventura en nueve casillas", description: "Despeja la niebla, elige combates y provisiones y explora cinco reinos dibujados a mano." },
      'pt-BR': { title: "Aventura em nove casas", description: "Revele a névoa, escolha entre combates e suprimentos e explore cinco reinos desenhados à mão." }
    }
  },
  {
    title: "弹珠派对",
    description: "瞄准，松手！几十颗弹珠连发，炸弹连锁爆破，攒满能量一路击穿。",
    path: "./games/marble-rush/index.html",
    category: "休闲",
    color: "#e5e7d8",
    cover: "./games/marble-rush/cover.svg",
    locales: {
      en: { title: "Marble Party", description: "Aim and release a shower of marbles. Chain explosions and charge a piercing burst!" },
      ja: { title: "ビー玉パーティー", description: "狙って離してビー玉連射！爆弾を連鎖させ、エネルギーをためて貫こう。" },
      ko: { title: "구슬 파티", description: "조준하고 놓으면 구슬이 쏟아져요! 연쇄 폭발과 관통 난사를 즐겨 보세요." },
      fr: { title: "Fête des billes", description: "Visez et lancez une pluie de billes. Explosions en chaîne et tirs perçants !" },
      de: { title: "Murmelparty", description: "Zielen und eine Murmelsalve loslassen. Kettenreaktionen und geladene Durchschüsse!" },
      es: { title: "Fiesta de canicas", description: "Apunta y suelta una lluvia de canicas. ¡Explosiones en cadena y ráfagas perforantes!" },
      'pt-BR': { title: "Festa de bolinhas", description: "Mire e solte uma chuva de bolinhas. Explosões em cadeia e rajadas perfurantes!" }
    }
  },
  {
    title: "迷你割草",
    description: "飞叶绕身，种子开路。在手绘草地上升级成长，守住三分钟。",
    path: "./games/mini-mow/index.html",
    category: "动作",
    color: "#e8eddc",
    cover: "./games/mini-mow/cover.svg",
    locales: {
      en: { title: "Mini Meadow", description: "Orbiting leaves, flying seeds. Grow stronger and survive three minutes in a pencil-drawn meadow." },
      ja: { title: "ちいさな草原", description: "葉と種で戦い、強くなって、手描きの草原で3分間生き延びよう。" },
      ko: { title: "작은 풀밭", description: "잎과 씨앗으로 싸우며 성장하고 손으로 그린 풀밭에서 3분을 버텨요." },
      fr: { title: "Petite prairie", description: "Feuilles en orbite et graines volantes : survivez trois minutes dans une prairie au crayon." },
      de: { title: "Kleine Wiese", description: "Kreisende Blätter und fliegende Samen: Wachse und überlebe drei Minuten auf der Bleistiftwiese." },
      es: { title: "Mini pradera", description: "Hojas orbitales y semillas voladoras. Mejora y sobrevive tres minutos en una pradera a lápiz." },
      'pt-BR': { title: "Mini campina", description: "Folhas ao redor e sementes voadoras. Evolua e sobreviva três minutos numa campina a lápis." }
    }
  },
  {
    title: "俄罗斯方块",
    description: "一块一块慢慢叠，拼出整齐的小快乐。",
    path: "./games/tetris/index.html",
    category: "益智",
    color: "#e4e7dc",
    cover: "./games/tetris/cover.svg",
    locales: {
      en: { title: "Tetris", description: "Stack a little joy, one block at a time." },
      ja: { title: "テトリス", description: "ひとつずつ重ねて、小さな喜びをそろえよう。" },
      ko: { title: "테트리스", description: "한 블록씩 차곡차곡, 작은 기쁨을 쌓아요." },
      fr: { title: "Tetris", description: "Empilez un peu de joie, un bloc à la fois." },
      de: { title: "Tetris", description: "Stapele kleine Freuden, Stein für Stein." },
      es: { title: "Tetris", description: "Apila pequeñas alegrías, un bloque cada vez." },
      'pt-BR': { title: "Tetris", description: "Empilhe pequenas alegrias, um bloco de cada vez." }
    }
  },
  {
    title: "24 点",
    description: "四张数字牌，加减乘除，拼出刚刚好的 24。",
    path: "./games/twenty-four/index.html",
    category: "益智",
    color: "#e5e9d9",
    cover: "./games/twenty-four/cover.svg",
    locales: {
      en: { title: "Make 24", description: "Four number cards and a little arithmetic. Can you make 24?" },
      ja: { title: "24 パズル", description: "4枚の数字カードと四則演算で、ぴったり24をつくろう。" },
      ko: { title: "24 만들기", description: "숫자 카드 네 장과 사칙연산으로 정확히 24를 만들어 보세요." },
      fr: { title: "Faire 24", description: "Quatre cartes et un peu de calcul pour arriver exactement à 24." },
      de: { title: "Mach 24", description: "Vier Zahlenkarten und die vier Grundrechenarten. Schaffst du genau 24?" },
      es: { title: "Haz 24", description: "Cuatro cartas y las cuatro operaciones para llegar justo a 24." },
      'pt-BR': { title: "Faça 24", description: "Quatro cartas e as quatro operações para chegar exatamente a 24." }
    }
  },
  {
    title: "纸飞机",
    description: "驾驶铅笔画的纸飞机，在草稿纸的天空里躲闪、射击。",
    path: "./games/paper-flight/index.html",
    category: "动作",
    color: "#f4f1e6",
    cover: "./games/paper-flight/cover.svg",
    locales: {
      en: { title: "Paper Flight", description: "Fly a pencil-drawn paper plane. Dodge and shoot across a notebook sky." },
      ja: { title: "紙飛行機", description: "鉛筆で描いた紙飛行機で、ノートの空をよけて撃って飛ぼう。" },
      ko: { title: "종이비행기", description: "연필로 그린 종이비행기를 타고 노트 속 하늘에서 피하고 쏘아요." },
      fr: { title: "Vol de papier", description: "Pilotez un avion dessiné au crayon. Esquivez et tirez dans un ciel de papier." },
      de: { title: "Papierflug", description: "Fliege durch einen Bleistifthimmel. Weiche aus und schieße mit deinem Papierflieger." },
      es: { title: "Vuelo de papel", description: "Pilota un avión dibujado a lápiz. Esquiva y dispara por un cielo de papel." },
      'pt-BR': { title: "Voo de papel", description: "Pilote um avião desenhado a lápis. Desvie e atire pelo céu de um caderno." }
    }
  },
  {
    title: "垂直极限",
    description: "戴上矿工帽，在铅笔画的地底世界里一路向下，勇闯 999 层。",
    path: "./games/core-descent/index.html",
    category: "动作",
    color: "#eee5d4",
    cover: "./games/core-descent/cover.svg",
    locales: {
      en: { title: "Vertical Limit", description: "Put on your miner’s hat and descend 999 pencil-drawn floors." },
      ja: { title: "垂直の限界", description: "探検帽をかぶって、鉛筆画の地底世界で999階を目指そう。" },
      ko: { title: "수직의 한계", description: "탐험 모자를 쓰고 연필로 그린 지하 세계의 999층을 향해 내려가요." },
      fr: { title: "Limite verticale", description: "Enfilez votre casque et descendez 999 étages dessinés au crayon." },
      de: { title: "Vertikales Limit", description: "Setz deinen Helm auf und erkunde 999 mit Bleistift gezeichnete Ebenen." },
      es: { title: "Límite vertical", description: "Ponte el casco y desciende 999 pisos dibujados a lápiz." },
      'pt-BR': { title: "Limite vertical", description: "Coloque seu capacete e desça 999 andares desenhados a lápis." }
    }
  },
  {
    title: "纸上贪吃蛇",
    description: "在方格纸上吃掉小苹果，和铅笔画的小蛇一起慢慢长大。",
    path: "./games/paper-snake/index.html",
    category: "休闲",
    color: "#f2eee3",
    cover: "./games/paper-snake/cover.svg",
    locales: {
      en: { title: "Paper Snake", description: "Eat little apples and grow a pencil-drawn snake on graph paper." },
      ja: { title: "紙のヘビ", description: "方眼紙の上でリンゴを食べて、鉛筆のヘビを少しずつ育てよう。" },
      ko: { title: "종이 뱀", description: "모눈종이 위에서 사과를 먹고 연필로 그린 작은 뱀을 키워요." },
      fr: { title: "Serpent de papier", description: "Mangez des pommes et faites grandir un serpent au crayon sur du papier quadrillé." },
      de: { title: "Papierschlange", description: "Iss kleine Äpfel und lass eine Bleistiftschlange auf kariertem Papier wachsen." },
      es: { title: "Serpiente de papel", description: "Come manzanas y haz crecer una serpiente a lápiz en papel cuadriculado." },
      'pt-BR': { title: "Cobrinha de papel", description: "Coma maçãs e faça uma cobrinha a lápis crescer no papel quadriculado." }
    }
  },
  {
    title: "钢铁洪流",
    description: "驾驶铅笔画的坦克，击破砖墙，在熟悉的炮火声中守住基地。",
    path: "./games/steel-tide/index.html",
    category: "动作",
    color: "#edf0e2",
    cover: "./games/steel-tide/cover.svg",
    locales: {
      en: { title: "Steel Tide", description: "Drive a pencil-drawn tank, break through brick walls, and defend your base." },
      ja: { title: "鋼鉄の奔流", description: "鉛筆で描いた戦車を操り、レンガを撃ち抜いて基地を守ろう。" },
      ko: { title: "강철의 물결", description: "연필로 그린 탱크를 조종하고 벽돌을 부수며 기지를 지켜요." },
      fr: { title: "Marée d’acier", description: "Pilotez un char dessiné au crayon, brisez les murs et défendez votre base." },
      de: { title: "Stahlflut", description: "Steuere einen Bleistiftpanzer, durchbrich Ziegelmauern und verteidige deine Basis." },
      es: { title: "Marea de acero", description: "Pilota un tanque a lápiz, rompe muros de ladrillo y defiende tu base." },
      'pt-BR': { title: "Maré de aço", description: "Pilote um tanque a lápis, destrua muros de tijolos e defenda sua base." }
    }
  },
  {
    title: "五子棋",
    description: "在纸上落一颗棋子，和三档 AI 慢慢过招。",
    path: "./games/gomoku/index.html",
    category: "棋牌",
    color: "#e9e8da",
    cover: "./games/gomoku/cover.svg",
    locales: {
      en: { title: "Gomoku", description: "Place a stone on paper and challenge three levels of AI." },
      ja: { title: "五目並べ", description: "紙の盤に石を打ち、3段階の AI とゆっくり対局。" },
      ko: { title: "오목", description: "종이 위에 돌을 놓고 세 가지 난이도의 AI와 겨뤄요." },
      fr: { title: "Gomoku", description: "Posez vos pierres sur le papier et défiez trois niveaux d’IA." },
      de: { title: "Gomoku", description: "Setze Steine aufs Papier und spiele gegen drei KI-Stufen." },
      es: { title: "Gomoku", description: "Coloca piedras sobre papel y reta a tres niveles de IA." },
      'pt-BR': { title: "Gomoku", description: "Coloque pedras no papel e desafie três níveis de IA." }
    }
  },
  {
    title: "叠叠高",
    description: "看准时机叠起纸块，把小小的快乐，一层层送向云朵。",
    path: "./games/paper-stack/index.html",
    category: "休闲",
    color: "#e5e8d6",
    cover: "./games/paper-stack/cover.svg",
    locales: {
      en: { title: "Paper Stack", description: "Time each tap and stack little paper blocks up toward the clouds." },
      ja: { title: "つみつみタワー", description: "タイミングを合わせて紙のブロックを積み、雲に近づこう。" },
      ko: { title: "차곡차곡 탑", description: "타이밍을 맞춰 종이 블록을 쌓고 구름에 조금 더 가까이 가요." },
      fr: { title: "Tour de papier", description: "Empilez des blocs de papier au bon moment pour rejoindre les nuages." },
      de: { title: "Papierturm", description: "Stapele Papierblöcke im richtigen Moment bis hinauf zu den Wolken." },
      es: { title: "Torre de papel", description: "Apila bloques de papel en el momento justo para acercarte a las nubes." },
      'pt-BR': { title: "Torre de papel", description: "Empilhe blocos de papel na hora certa para chegar mais perto das nuvens." }
    }
  },
  {
    title: "一键钓鱼",
    description: "和小猫坐在湖边，抛一竿、等一等，把小小惊喜收进鱼篓。",
    path: "./games/one-cast/index.html",
    category: "休闲",
    color: "#e1e8dc",
    cover: "./games/one-cast/cover.svg",
    locales: {
      en: { title: "One Cast", description: "Cast, wait, and reel in little surprises with a cat by the lake." },
      ja: { title: "ひと押し釣り", description: "湖畔の猫と、投げて、待って、小さな驚きを釣り上げよう。" },
      ko: { title: "원터치 낚시", description: "호숫가 고양이와 줄을 던지고 기다려 작은 기쁨을 낚아요." },
      fr: { title: "Un lancer", description: "Lancez, attendez et pêchez de petites surprises avec un chat au bord du lac." },
      de: { title: "Ein Wurf", description: "Wirf aus, warte und angle mit einer Katze kleine Überraschungen am See." },
      es: { title: "Un lance", description: "Lanza, espera y pesca pequeñas sorpresas con un gato junto al lago." },
      'pt-BR': { title: "Uma fisgada", description: "Lance, espere e pesque pequenas surpresas com um gato à beira do lago." }
    }
  },
  {
    title: "我是老司机",
    description: "握好小方向盘，在手绘停车场里慢慢转弯、倒车，把每一格停得刚刚好。",
    path: "./games/old-driver/index.html",
    category: "休闲",
    color: "#e3e7d7",
    cover: "./games/old-driver/cover.svg",
    locales: {
      en: { title: "Parking Pro", description: "Steer, reverse, and find the perfect spot in eight hand-drawn parking challenges." },
      ja: { title: "駐車の達人", description: "手描きの駐車場でゆっくり曲がって、バックして、8つの課題に挑戦。" },
      ko: { title: "주차의 달인", description: "손으로 그린 주차장에서 회전과 후진을 연습하고 8개 과제에 도전해요." },
      fr: { title: "As du créneau", description: "Braquez, reculez et trouvez la place parfaite dans huit défis dessinés au crayon." },
      de: { title: "Parkprofi", description: "Lenke, fahre rückwärts und meistere acht handgezeichnete Parkübungen." },
      es: { title: "As del aparcamiento", description: "Gira, retrocede y encuentra el sitio perfecto en ocho retos dibujados a mano." },
      'pt-BR': { title: "Ás do volante", description: "Vire, dê ré e encontre a vaga perfeita em oito desafios desenhados à mão." }
    }
  },
  {
    title: "一笔修路",
    description: "用一条不交叉的小路连接每一户，绕过树木、石头和池塘。",
    path: "./games/one-road/index.html",
    category: "益智",
    color: "#e6ebdb",
    cover: "./games/one-road/cover.svg",
    locales: {
      en: { title: "One Road", description: "Connect every home with one unbroken road. Wind around trees, rocks and ponds without crossing your path." },
      ja: { title: "ひと筆の道", description: "木、岩、池を避けながら、交差しない一本の道ですべての家をつなごう。" },
      ko: { title: "한 줄 길 잇기", description: "나무, 바위, 연못을 피해 교차하지 않는 하나의 길로 모든 집을 이어요." },
      fr: { title: "Un seul chemin", description: "Reliez chaque maison par une route sans croisement, en contournant arbres, rochers et mares." },
      de: { title: "Ein Weg", description: "Verbinde jedes Haus mit einem Weg ohne Kreuzungen und umgehe Bäume, Steine und Teiche." },
      es: { title: "Un solo camino", description: "Conecta todas las casas con una ruta sin cruces, rodeando árboles, rocas y estanques." },
      'pt-BR': { title: "Um só caminho", description: "Conecte todas as casas com uma estrada sem cruzamentos, contornando árvores, pedras e lagos." }
    }
  },
  {
    title: "九宫格探险",
    description: "带上口粮与勇气，在九格森林里选择路线，把每一小步走得更远。",
    path: "./games/nine-grid/index.html",
    category: "策略",
    color: "#e7e9da",
    cover: "./games/nine-grid/cover.svg",
    locales: {
      en: { title: "Nine Little Steps", description: "Plan a path through nine woodland tiles, balancing battles, treasure and supplies." },
      ja: { title: "九マスの旅", description: "食料と勇気を持って、怪物・宝箱・補給の九マスを歩こう。" },
      ko: { title: "아홉 칸의 모험", description: "식량과 용기를 챙겨 전투, 보물, 보급 사이로 안전한 길을 찾아요." },
      fr: { title: "Neuf petits pas", description: "Tracez votre route entre monstres, trésors et provisions sur neuf cases de forêt." },
      de: { title: "Neun kleine Schritte", description: "Plane deinen Weg über neun Waldfelder zwischen Monstern, Schätzen und Vorräten." },
      es: { title: "Nueve pequeños pasos", description: "Planea tu ruta por nueve casillas entre monstruos, tesoros y provisiones." },
      'pt-BR': { title: "Nove pequenos passos", description: "Planeje sua rota por nove casas entre monstros, tesouros e provisões." }
    }
  },
  {
    title: "快递分拣局",
    description: "看清包裹面单，把每一份期待送到对的站点，挑战连续送达。",
    path: "./games/parcel-sorter/index.html",
    category: "休闲",
    color: "#e4e8d8",
    cover: "./games/parcel-sorter/cover.svg",
    locales: {
      en: { title: "Parcel Club", description: "Read the labels, sort parcels into matching stations and build a delivery streak." },
      ja: { title: "小包仕分け局", description: "ラベルを見て、小包を正しい届け先へ。連続お届けに挑戦しよう。" },
      ko: { title: "택배 분류소", description: "라벨을 보고 알맞은 목적지로 택배를 보내며 연속 배송에 도전해요." },
      fr: { title: "Le tri des colis", description: "Lisez les étiquettes, triez les colis et enchaînez les bonnes livraisons." },
      de: { title: "Paketpost", description: "Lies die Etiketten, sortiere Pakete zur passenden Station und schaffe eine Liefer-Serie." },
      es: { title: "Club de paquetes", description: "Lee las etiquetas, envía los paquetes al destino correcto y encadena entregas." },
      'pt-BR': { title: "Clube das encomendas", description: "Leia as etiquetas, envie cada encomenda ao destino certo e faça entregas em sequência." }
    }
  },
  {
    title: "反着来",
    description: "大脑说向左，你偏要向右。用相反的操作，挑战 60 秒条件反射。",
    path: "./games/reverse-command/index.html",
    category: "益智",
    color: "#e6ebde",
    cover: "./games/reverse-command/cover.svg",
    locales: {
      en: { title: "Do the Opposite", description: "Your brain says left. You go right. Reverse directions and colors in a 60-second reflex challenge." },
      ja: { title: "あべこべ", description: "頭が左と言ったら右へ。方向と色を反対に選ぶ、60秒の反射神経チャレンジ。" },
      ko: { title: "반대로 해요", description: "머리가 왼쪽이라면 오른쪽으로. 방향과 색상을 반대로 고르는 60초 도전." },
      fr: { title: "À contre-sens", description: "Votre cerveau dit gauche ? Allez à droite. Inversez directions et couleurs pendant 60 secondes." },
      de: { title: "Genau andersherum", description: "Dein Kopf sagt links? Geh nach rechts. Wähle 60 Sekunden lang die entgegengesetzten Richtungen und Farben." },
      es: { title: "Al revés", description: "Tu mente dice izquierda, tú vas a la derecha. Invierte direcciones y colores durante 60 segundos." },
      'pt-BR': { title: "Ao contrário", description: "Sua cabeça diz esquerda, você vai à direita. Inverta direções e cores em um desafio de 60 segundos." }
    }
  },
  {
    title: "水彩分类",
    description: "在玻璃瓶之间轻轻倒水，把同色归到一起，整理一小页温柔的颜色。",
    path: "./games/water-sort/index.html",
    category: "益智",
    color: "#e9ecdf",
    cover: "./games/water-sort/cover.svg",
    locales: {
      en: { title: "Watercolor Sort", description: "Pour between little glass bottles and bring matching colors together through 24 gentle puzzles." },
      ja: { title: "水彩ソート", description: "小さな瓶の水を注いで、同じ色をひとつに。24ページの色のパズル。" },
      ko: { title: "수채화 정렬", description: "유리병 사이로 물을 옮겨 같은 색을 모아요. 24개의 차분한 퍼즐을 즐겨요." },
      fr: { title: "Tri aquarelle", description: "Versez entre les flacons et réunissez les mêmes couleurs dans 24 petits puzzles." },
      de: { title: "Wasserfarben", description: "Gieße zwischen kleinen Fläschchen und sammle gleiche Farben in 24 entspannten Rätseln." },
      es: { title: "Ordena colores", description: "Vierte entre frascos y reúne los mismos colores en 24 tranquilos rompecabezas." },
      'pt-BR': { title: "Separe as cores", description: "Despeje entre frascos e reúna as mesmas cores em 24 quebra-cabeças tranquilos." }
    }
  },
  {
    title: "铅笔扫雷",
    description: "在方格纸上读懂数字、画下小旗，慢慢解开一页扫雷。",
    path: "./games/pencil-mines/index.html",
    category: "益智",
    color: "#e2e7d5",
    cover: "./games/pencil-mines/cover.svg",
    locales: {
      en: { title: "Pencil Mines", description: "Follow the numbers, sketch little flags, and clear a minefield on squared paper." },
      ja: { title: "えんぴつマイン", description: "方眼紙の数字を読み、小さな旗を描いて地雷を探そう。" },
      ko: { title: "연필 지뢰찾기", description: "모눈종이의 숫자를 읽고 작은 깃발을 그리며 지뢰를 피해요." },
      fr: { title: "Démineur au crayon", description: "Suivez les chiffres et dessinez des drapeaux sur une page de démineur." },
      de: { title: "Bleistift-Minen", description: "Lies die Zahlen und zeichne kleine Flaggen auf dein Minenfeld aus Papier." },
      es: { title: "Minas a lápiz", description: "Sigue los números y dibuja banderitas para despejar un campo de minas de papel." },
      'pt-BR': { title: "Minas a lápis", description: "Siga os números e desenhe bandeirinhas para desvendar um campo minado de papel." }
    }
  },
  {
    title: "弹弓快递",
    description: "拉动弹弓，借一点风和反弹，把每个包裹稳稳送进远处的邮箱。",
    path: "./games/slingshot-post/index.html",
    category: "益智",
    color: "#e4e8d5",
    cover: "./games/slingshot-post/cover.svg",
    locales: {
      en: { title: "Slingshot Post", description: "Pull, aim and deliver parcels with a little wind, a clever bounce and a trusty slingshot." },
      ja: { title: "ぱちんこ郵便", description: "ぱちんこを引いて、風と跳ね返りを味方に、遠くのポストへ小包を届けよう。" },
      ko: { title: "새총 우체국", description: "새총을 당겨 바람과 반사를 이용하고, 먼 우체통에 작은 소포를 배달해요." },
      fr: { title: "Poste au lance-pierre", description: "Visez et livrez vos colis grâce au vent, aux rebonds et à un fidèle lance-pierre." },
      de: { title: "Schleuderpost", description: "Zieh die Schleuder zurück und bringe Pakete mit Wind und geschickten Abprallern zum Briefkasten." },
      es: { title: "Correo con tirachinas", description: "Apunta y entrega paquetes con ayuda del viento, los rebotes y tu fiel tirachinas." },
      'pt-BR': { title: "Correio de estilingue", description: "Mire e entregue pacotes com a ajuda do vento, dos saltos e de um fiel estilingue." }
    }
  },
  {
    title: "合成小猫",
    description: "投下小猫，碰一碰长大；挤挤碰碰连锁合成，装满一纸箱的快乐。",
    path: "./games/cat-merge/index.html",
    category: "休闲",
    color: "#e7e8d8",
    cover: "./games/cat-merge/cover.svg",
    locales: {
      en: { title: "Kitty Merge", description: "Drop little cats, merge matching pairs and build scoring chains in a cozy cardboard box." },
      ja: { title: "ねこ合体", description: "小さなねこを落として、同じ子同士を合体。連鎖で箱いっぱいの幸せを育てよう。" },
      ko: { title: "고양이 합치기", description: "고양이를 떨어뜨리고 같은 냥이를 합쳐요. 연쇄 합성으로 상자 가득 행복과 점수를 쌓아요." },
      fr: { title: "Chats à fusionner", description: "Lâchez des chats, fusionnez les paires et enchaînez les points dans un carton douillet." },
      de: { title: "Katzen vereinen", description: "Lass kleine Katzen fallen, vereine gleiche Paare und sammle Kettenpunkte in einem gemütlichen Karton." },
      es: { title: "Fusiona gatitos", description: "Deja caer gatitos, une parejas iguales y encadena puntos en una acogedora caja de cartón." },
      'pt-BR': { title: "Junte os gatinhos", description: "Solte gatinhos, junte pares iguais e faça sequências de pontos em uma caixa aconchegante." }
    }
  },
  {
    title: "黄金矿工",
    description: "看准方向放下钩子，抓住黄金和钻石，用一点好运走过六片手绘矿区。",
    path: "./games/gold-miner/index.html",
    category: "休闲",
    color: "#e8dfc8",
    cover: "./games/gold-miner/cover.svg",
    locales: {
      en: { title: "Gold Miner", description: "Time your hook, haul in gold and diamonds, and explore six hand-drawn mines with a little luck." },
      ja: { title: "金鉱ほり", description: "向きを見てフックを下ろし、金やダイヤを集めよう。手描きの6つの鉱区で小さな幸運探し。" },
      ko: { title: "황금 광부", description: "방향을 보고 갈고리를 내려 금과 다이아몬드를 모으고, 손그림 광구 여섯 곳을 탐험해요." },
      fr: { title: "Chercheur d’or", description: "Lancez le crochet au bon moment, remontez or et diamants et explorez six mines dessinées à la main." },
      de: { title: "Goldgräber", description: "Wirf den Haken im richtigen Moment aus, sammle Gold und Diamanten und erkunde sechs handgezeichnete Minen." },
      es: { title: "Minero de oro", description: "Lanza el gancho a tiempo, recoge oro y diamantes y explora seis minas dibujadas a mano." },
      'pt-BR': { title: "Garimpeiro", description: "Solte o gancho na hora certa, recolha ouro e diamantes e explore seis minas desenhadas à mão." }
    }
  },
  {
    title: "纸间祖玛",
    description: "转动小青蛙，串起三颗同色彩珠，让连锁消除开满纸上的小花园。",
    path: "./games/paper-zuma/index.html",
    category: "休闲",
    color: "#e5ead9",
    cover: "./games/paper-zuma/cover.svg",
    locales: {
      en: { title: "Paper Zuma", description: "Aim a little frog, match three colorful marbles and set off joyful chains across six paper gardens." },
      ja: { title: "紙のズーマ", description: "小さなカエルで同じ色を三つつなごう。六つの紙の庭で、連鎖の花を咲かせて。" },
      ko: { title: "종이 주마", description: "작은 개구리로 같은 색 구슬 셋을 모아요. 여섯 종이 정원에서 즐거운 연쇄를 만들어요." },
      fr: { title: "Zuma de papier", description: "Visez avec une grenouille, alignez trois billes de même couleur et créez des chaînes dans six jardins de papier." },
      de: { title: "Papier-Zuma", description: "Ziele mit dem kleinen Frosch, verbinde drei gleichfarbige Kugeln und starte Kettenreaktionen in sechs Papiergärten." },
      es: { title: "Zuma de papel", description: "Apunta con una ranita, junta tres canicas del mismo color y crea cadenas en seis jardines de papel." },
      'pt-BR': { title: "Zuma de papel", description: "Mire com um sapinho, junte três bolinhas da mesma cor e crie sequências em seis jardins de papel." }
    }
  },
  {
    title: "蜘蛛纸牌",
    description: "一张张理顺纸牌，把八组同花色从 K 排到 A，享受一局安静的经典纸牌。",
    path: "./games/spider-solitaire/index.html",
    category: "棋牌",
    color: "#e4eadb",
    cover: "./games/spider-solitaire/cover.svg",
    locales: {
      en: { title: "Spider Solitaire", description: "Collect eight suited runs from King to Ace in a quiet, hand-drawn card game." },
      ja: { title: "スパイダー", description: "同じマークをKからAまで並べて8組を完成。紙の風合いで楽しむ定番カードゲーム。" },
      ko: { title: "스파이더 카드", description: "같은 무늬를 K부터 A까지 정리해 8세트를 모으는 차분한 종이 카드 게임." },
      fr: { title: "Solitaire Spider", description: "Rassemblez huit suites du Roi à l’As dans un jeu de cartes aux doux traits de crayon." },
      de: { title: "Spider-Solitär", description: "Sammle acht Folgen vom König bis zum Ass in einem ruhigen Kartenspiel mit Papiercharme." },
      es: { title: "Solitario Spider", description: "Reúne ocho secuencias del rey al as en un tranquilo juego de cartas dibujado a mano." },
      'pt-BR': { title: "Paciência Spider", description: "Reúna oito sequências do rei ao ás em um tranquilo jogo de cartas com traços de lápis." }
    }
  },
  {
    title: "割绳子",
    description: "划断绳子，收集星星，让糖果荡进小兔子的嘴里。翻开 12 页甜甜的小冒险。",
    path: "./games/cut-the-rope/index.html",
    category: "益智",
    color: "#e9eddf",
    cover: "./games/cut-the-rope/cover.svg",
    locales: {
      en: { title: "Snip & Sweet", description: "Snip ropes, gather stars and swing a candy to a little bunny through 12 sweet puzzles." },
      ja: { title: "ロープとキャンディ", description: "ロープを切って星を集め、うさぎにキャンディを届けよう。12ページの甘い冒険。" },
      ko: { title: "밧줄과 사탕", description: "밧줄을 잘라 별을 모으고 토끼에게 사탕을 주세요. 12개의 달콤한 퍼즐이 기다려요." },
      fr: { title: "Coupe et bonbon", description: "Coupez les cordes, cueillez les étoiles et offrez un bonbon au lapin dans 12 petits puzzles." },
      de: { title: "Seil & Süßes", description: "Schneide Seile, sammle Sterne und schwinge ein Bonbon zum Häschen in 12 süßen Rätseln." },
      es: { title: "Corta y endulza", description: "Corta cuerdas, recoge estrellas y lleva un caramelo al conejito en 12 dulces puzles." },
      'pt-BR': { title: "Corte e doce", description: "Corte cordas, recolha estrelas e leve uma bala ao coelhinho em 12 doces desafios." }
    }
  },
  {
    title: "纸间飞钩",
    description: "按住挂钩，松手飞跃。带着一条小围巾，在十二页纸间冒险里收集星光。",
    path: "./games/paper-hook/index.html",
    category: "动作",
    color: "#e3e9d8",
    cover: "./games/paper-hook/cover.svg",
    locales: {
      en: { title: "Paper Hook", description: "Hold to hook, release to fly. Swing a little stick figure through 12 paper adventures and collect starlight." },
      ja: { title: "紙のフック", description: "長押しでフック、離して空へ。小さな棒人間と12ページの冒険で星のひかりを集めよう。" },
      ko: { title: "종이 갈고리", description: "꾹 눌러 연결하고 놓아서 날아요. 작은 스틱맨과 12개의 종이 모험에서 별빛을 모으세요." },
      fr: { title: "Crochet de papier", description: "Accrochez, balancez-vous et envolez-vous dans 12 aventures de papier à la recherche des étoiles." },
      de: { title: "Papierhaken", description: "Halten, einhaken, losfliegen. Schwinge durch 12 kleine Papierabenteuer und sammle Sternenlicht." },
      es: { title: "Gancho de papel", description: "Mantén para enganchar y suelta para volar. Recorre 12 aventuras de papel y recoge estrellas." },
      'pt-BR': { title: "Gancho de papel", description: "Segure para prender e solte para voar. Atravesse 12 aventuras de papel e colete estrelas." }
    }
  },
  {
    title: "纸上迷你高尔夫",
    description: "轻轻拖动，松手挥杆。越过斜坡、沙坑和纸上机关，用最少的杆数走完九洞小旅程。",
    path: "./games/paper-golf/index.html",
    category: "休闲",
    color: "#dce5cb",
    cover: "./games/paper-golf/cover.svg",
    locales: {
      en: { title: "Paper Mini Golf", description: "Pull back, release and swing across nine paper holes. Master slopes, sand and little mechanisms in as few strokes as possible." },
      ja: { title: "紙のミニゴルフ", description: "引いて、離して、小さな一打。坂や砂地、紙の仕掛けを越え、少ない打数で9ホールをめぐろう。" },
      ko: { title: "종이 미니 골프", description: "살짝 당겼다 놓아 보세요. 경사와 모래, 종이 장치를 넘어 적은 타수로 아홉 홀을 완주해요." },
      fr: { title: "Mini-golf de papier", description: "Tirez, relâchez et parcourez neuf trous de papier. Franchissez pentes, sable et mécanismes en un minimum de coups." },
      de: { title: "Papier-Minigolf", description: "Ziehen, loslassen und neun Papierbahnen meistern. Überwinde Hänge, Sand und kleine Mechanismen mit wenigen Schlägen." },
      es: { title: "Minigolf de papel", description: "Tira, suelta y recorre nueve hoyos de papel. Supera pendientes, arena y mecanismos con el mínimo de golpes." },
      'pt-BR': { title: "Minigolfe de papel", description: "Puxe, solte e percorra nove buracos de papel. Supere ladeiras, areia e mecanismos com o mínimo de tacadas." }
    }
  },
  {
    title: "小鸡过马路",
    description: "找准空隙穿过车流，等火车走远，踩着漂木再往前一步。一次小小的手绘出走。",
    path: "./games/chicken-crossing/index.html",
    category: "动作",
    color: "#dce5d2",
    cover: "./games/chicken-crossing/cover.svg",
    locales: {
      en: { title: "Little Chicken Crossing", description: "Find a gap in traffic, wait for the train, and ride drifting logs. Just one more hop in a hand-drawn world." },
      ja: { title: "ひよこの道わたり", description: "車のすき間を見つけ、電車を待ち、丸太に乗ってもう一歩。手描きの世界で小さな冒険。" },
      ko: { title: "병아리 길 건너기", description: "차 사이를 지나고 기차를 기다리고 통나무를 타고 한 걸음 더. 손그림 세상 속 작은 나들이." },
      fr: { title: "La traversée du poussin", description: "Évitez les voitures, attendez le train et montez sur des rondins. Encore un petit saut dans un monde dessiné au crayon." },
      de: { title: "Küken auf Wanderschaft", description: "Lücken im Verkehr finden, auf Züge warten und auf Baumstämmen treiben. Noch ein Hüpfer durch eine gezeichnete Welt." },
      es: { title: "El paseo del pollito", description: "Busca huecos entre coches, espera al tren y viaja en troncos. Un saltito más por un mundo dibujado a mano." },
      'pt-BR': { title: "A travessia do pintinho", description: "Ache brechas no trânsito, espere o trem e pegue carona em troncos. Mais um pulinho num mundo desenhado à mão." }
    }
  },
  {
    title: "森林炸弹人",
    description: "放下炸弹，炸开木箱，捡起道具。用连锁爆炸围住对手，也给自己留一条林间退路。",
    path: "./games/forest-bomber/index.html",
    category: "动作",
    color: "#e4e9d2",
    cover: "./games/forest-bomber/cover.svg",
    locales: {
      en: { title: "Forest Bomber", description: "Plant bombs, break crates and gather power-ups. Chain explosions to corner rivals, and always keep an escape route." },
      ja: { title: "森のボンバーフォックス", description: "爆弾で木箱を壊し、アイテムを集めよう。連鎖爆発で相手を囲み、自分の逃げ道も忘れずに。" },
      ko: { title: "숲속 폭탄 여우", description: "폭탄으로 상자를 부수고 아이템을 모아요. 연쇄 폭발로 상대를 몰아넣고 탈출로도 남겨 두세요." },
      fr: { title: "Bombes en forêt", description: "Posez des bombes, brisez les caisses et ramassez des bonus. Piégez vos rivaux par des réactions en chaîne, en gardant une issue." },
      de: { title: "Waldbomber", description: "Lege Bomben, sprenge Kisten und sammle Extras. Kreise Gegner mit Kettenreaktionen ein und lass dir einen Fluchtweg." },
      es: { title: "Bombas del bosque", description: "Coloca bombas, rompe cajas y recoge mejoras. Acorrala rivales con explosiones en cadena y deja siempre una salida." },
      'pt-BR': { title: "Bombas na floresta", description: "Coloque bombas, quebre caixas e recolha melhorias. Cerque os rivais com explosões em cadeia e deixe sempre uma saída." }
    }
  },
  {
    title: "深夜煎饼摊",
    description: "摊饼、翻面、加料、交单，交替照看两口锅，用连续出餐温暖每一位夜归人。",
    path: "./games/midnight-pancake/index.html",
    category: "休闲",
    color: "#e9eadb",
    cover: "./games/midnight-pancake/cover.svg",
    locales: {
      en: { title: "Midnight Pancakes", description: "Spread, flip, fill and serve. Juggle two griddles and keep hungry night owls happy with satisfying combos." },
      ja: { title: "深夜のクレープ屋", description: "生地を広げ、裏返し、具をのせてお渡し。二つの鉄板で夜帰る人を温め、連続提供を楽しもう。" },
      ko: { title: "심야 전병 가게", description: "반죽을 펴고 뒤집고 재료를 넣어 전달해요. 두 철판을 번갈아 보며 연속 완성의 즐거움을 느껴요." },
      fr: { title: "Crêpes de minuit", description: "Étalez, retournez, garnissez et servez. Jonglez entre deux plaques pour régaler les noctambules et enchaîner les commandes." },
      de: { title: "Mitternachts-Crêpes", description: "Verteilen, wenden, belegen und servieren. Behalte zwei Platten im Blick und verwöhne Nachtschwärmer mit leckeren Serien." },
      es: { title: "Crepes de medianoche", description: "Extiende, voltea, rellena y sirve. Atiende dos planchas y encadena pedidos para alegrar a los noctámbulos." },
      'pt-BR': { title: "Crepes da meia-noite", description: "Espalhe, vire, recheie e sirva. Cuide de duas chapas e encadeie pedidos para alegrar os clientes da madrugada." }
    }
  },
  {
    title: "铅笔数织",
    description: "跟着行列数字填格子，让小猫、盆栽、咖啡杯慢慢显现，收进十二页日常图鉴。",
    path: "./games/pencil-nonogram/index.html",
    category: "益智",
    color: "#e7eadc",
    cover: "./games/pencil-nonogram/cover.svg",
    locales: {
      en: { title: "Pencil Nonogram", description: "Follow number clues to reveal cats, plants and coffee cups. Collect twelve little pictures in your album." },
      ja: { title: "えんぴつノノグラム", description: "行と列の数字を頼りに猫や鉢植え、コーヒーカップを描こう。12枚の絵を図鑑に集めよう。" },
      ko: { title: "연필 네모로직", description: "행과 열의 숫자로 고양이, 화분, 커피잔을 완성하고 열두 장의 그림을 도감에 모아요." },
      fr: { title: "Nonogramme au crayon", description: "Suivez les nombres pour révéler chats, plantes et tasses de café. Collectionnez douze images dans votre album." },
      de: { title: "Bleistift-Nonogramm", description: "Entdecke Katzen, Pflanzen und Kaffeetassen mit Zahlenhinweisen. Sammle zwölf kleine Bilder in deinem Album." },
      es: { title: "Nonograma a lápiz", description: "Sigue las pistas numéricas y descubre gatos, plantas y tazas de café. Reúne doce dibujos en tu álbum." },
      'pt-BR': { title: "Nonograma a lápis", description: "Siga as pistas numéricas e revele gatos, plantas e xícaras de café. Colecione doze desenhos no seu álbum." }
    }
  },
  {
    title: "纸桥工程师",
    description: "用有限的木条、绳索和预算连接两岸。画出你的桥，放小车过桥，在六页工程笔记里收集星星。",
    path: "./games/paper-bridge/index.html",
    category: "益智",
    color: "#e5e9d8",
    cover: "./games/paper-bridge/cover.svg",
    locales: {
      en: { title: "Paper Bridge", description: "Build with limited timber, rope and a little budget. Test your bridge with a car across six hand-drawn crossings." },
      ja: { title: "紙の橋づくり", description: "限られた木材、ロープ、予算で両岸をつなごう。車で試運転して、6つの橋づくりノートに星を集めよう。" },
      ko: { title: "종이 다리 공학자", description: "한정된 목재와 밧줄, 예산으로 다리를 지어요. 여섯 장의 공책에서 차를 건너게 하고 별을 모으세요." },
      fr: { title: "Ponts de papier", description: "Construisez avec du bois, des cordes et un petit budget. Testez vos ponts avec une voiture dans six passages dessinés." },
      de: { title: "Papierbrücken", description: "Baue mit begrenztem Holz, Seil und Budget. Lass ein Auto über sechs gezeichnete Brücken fahren und sammle Sterne." },
      es: { title: "Puentes de papel", description: "Construye con madera, cuerdas y presupuesto limitados. Prueba tus puentes con un coche en seis cruces dibujados." },
      'pt-BR': { title: "Pontes de papel", description: "Construa com madeira, cordas e orçamento limitados. Teste suas pontes com um carro em seis travessias desenhadas." }
    }
  },
  // 新增示例（删除每行开头的 //，修改内容即可）：
  // {
  //   title: "游戏名字",
  //   description: "用一句话介绍这个小世界。",
  //   path: "./games/my-game/index.html",
  //   category: "休闲",
  //   color: "#eaded0"
  // },
];
