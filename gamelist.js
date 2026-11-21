// 小游戏清单：每新增一个游戏，在下面复制一条记录即可。
// 游戏文件放在 games/游戏目录/index.html，path 相对于 games.html。
// 必填：title、path。其余字段可省略；color 使用 #RRGGBB 格式。
// 可选：cover: "./games/游戏目录/cover.png"，作为卡片封面。
// category 只选：休闲、益智、解谜、动作、策略、棋牌；分类译名由大厅统一提供。
// tags 可选：包含 "推荐" 时展示在大厅推荐区，例如 tags: ["推荐"]。
// locales 按全局语言提供 title、description；缺少翻译时回退到基础字段。
window.GAME_LIST = [
  {
    title: "纸上农场",
    description: "开垦播种、养鸡养牛，把收获做成面包与果酱，慢慢经营自己的治愈农场。",
    path: "./games/paper-farm/index.html",
    category: "休闲",
    color: "#e5e9d8",
    cover: "./games/paper-farm/cover.svg",
    locales: {
      en: { title: "Paper Farm", description: "Sow crops, raise animals and make bread and jam. Grow your own peaceful little farm." },
      ja: { title: "紙の農場", description: "畑を耕し、鶏や牛を育て、パンとジャムを作ろう。のんびり育つ癒やしの農場。" },
      ko: { title: "종이 농장", description: "밭을 일구고 동물을 키우며 빵과 잼을 만들어요. 나만의 편안한 농장을 가꿔요." },
      fr: { title: "Ferme de papier", description: "Cultivez, élevez des animaux et préparez pain et confiture. Votre petite ferme paisible grandit." },
      de: { title: "Papierfarm", description: "Baue Pflanzen an, halte Tiere und mache Brot und Marmelade. Deine kleine Farm wächst in Ruhe." },
      es: { title: "Granja de papel", description: "Cultiva, cría animales y prepara pan y mermelada. Haz crecer tu pequeña y tranquila granja." },
      'pt-BR': { title: "Fazenda de papel", description: "Plante, crie animais e prepare pão e geleia. Cultive sua pequena fazenda com tranquilidade." }
    }
  },
  {
    title: "小鱼化鲲",
    description: "吃掉小鱼，灵巧冲刺，历经六种形态，最终成为自在吞潮的北冥鲲。",
    path: "./games/little-kun/index.html",
    category: "动作",
    color: "#dfe8dc",
    cover: "./games/little-kun/cover.svg",
    locales: {
      en: { title: "Little Fish, Great Kun", description: "Eat smaller fish, dash past danger and grow through six forms into Kun, a mythical giant of the sea." },
      ja: { title: "小魚から鯤へ", description: "小魚を食べ、すいっと危険をかわそう。六つの姿を経て、魚群を引き寄せる北冥の鯤へ。" },
      ko: { title: "작은 물고기, 전설의 곤", description: "작은 물고기를 먹고 돌진으로 위험을 피하세요. 여섯 모습을 거쳐 바다의 전설 곤이 되세요." },
      fr: { title: "Petit poisson, grand Kun", description: "Mangez les petits poissons, évitez le danger et passez par six formes jusqu’au géant mythique Kun." },
      de: { title: "Kleiner Fisch, großer Kun", description: "Friss kleine Fische, sprinte an Gefahren vorbei und wachse durch sechs Gestalten zum sagenhaften Kun." },
      es: { title: "Pequeño pez, gran Kun", description: "Come peces pequeños, esquiva peligros y crece a través de seis formas hasta ser el mítico Kun." },
      'pt-BR': { title: "Pequeno peixe, grande Kun", description: "Coma peixes menores, desvie dos perigos e cresça por seis formas até virar o lendário Kun." }
    }
  },
  {
    title: "一页侦探",
    description: "一张现场速写，几份证词。寻找物证中的矛盾，把三个小小悬案还原成完整的故事。",
    path: "./games/one-page-detective/index.html",
    category: "解谜",
    color: "#e6e8da",
    cover: "./games/one-page-detective/cover.svg",
    locales: {
      en: { title: "One-Page Detective", description: "One scene, a few witnesses. Find clues, challenge contradictions and piece together three little mysteries." },
      ja: { title: "一枚の探偵", description: "一枚の現場といくつかの証言。証拠から矛盾を見つけ、三つの小さな事件を解き明かそう。" },
      ko: { title: "한 장의 탐정", description: "한 장의 현장과 몇 가지 증언. 증거로 모순을 찾고 세 가지 작은 사건의 진실을 맞춰요." },
      fr: { title: "Détective sur une page", description: "Un lieu, quelques témoins. Trouvez les indices, confrontez les contradictions et résolvez trois petits mystères." },
      de: { title: "Ein-Seiten-Detektiv", description: "Ein Schauplatz, ein paar Aussagen. Sammle Beweise, entdecke Widersprüche und löse drei kleine Rätsel." },
      es: { title: "Detective de una página", description: "Un lugar y varios testigos. Reúne pruebas, descubre contradicciones y resuelve tres pequeños misterios." },
      'pt-BR': { title: "Detetive de uma página", description: "Um cenário e algumas testemunhas. Encontre provas, revele contradições e resolva três pequenos mistérios." }
    }
  },
  {
    title: "纸上台球",
    description: "一方绿绒，一段闲暇。瞄准、蓄力、落袋，独自清台或与朋友来一局八球。",
    path: "./games/paper-billiards/index.html",
    category: "休闲",
    color: "#dce4d6",
    cover: "./games/paper-billiards/cover.svg",
    locales: {
      en: { title: "Paper Billiards", description: "A quiet moment on green felt. Aim, set your power and sink each shot. Practice solo or play local 8-ball with a friend." },
      ja: { title: "紙のビリヤード", description: "緑のラシャでひと休み。狙って、引いて、ポケットへ。ひとりで練習、ふたりでエイトボール。" },
      ko: { title: "종이 당구", description: "초록 천 위에서 잠깐의 여유. 조준하고 힘을 조절해 넣어요. 혼자 연습하거나 친구와 8볼 한 판." },
      fr: { title: "Billard sur papier", description: "Un moment calme sur le tapis vert. Visez et dosez vos coups, en solo ou à deux au jeu de la 8." },
      de: { title: "Papierbillard", description: "Eine ruhige Runde auf grünem Tuch. Zielen, dosieren und versenken. Allein üben oder 8-Ball zu zweit spielen." },
      es: { title: "Billar de papel", description: "Un rato de calma sobre el tapete verde. Apunta y ajusta la potencia. Practica a solas o juega bola 8 con un amigo." },
      'pt-BR': { title: "Bilhar de papel", description: "Um momento de calma no pano verde. Mire e ajuste a força. Treine sozinho ou jogue bola 8 com um amigo." }
    }
  },
  {
    title: "小小流水线",
    description: "铺设传送带，切割、染色与旋转，让纸上小工厂自动完成一张张订单。",
    path: "./games/tiny-factory/index.html",
    category: "策略",
    color: "#e5e9d9",
    cover: "./games/tiny-factory/cover.svg",
    locales: {
      en: { title: "Tiny Factory", description: "Build conveyor belts, cut, paint and rotate shapes. Let your little paper factory fulfill each order." },
      ja: { title: "ちいさな生産ライン", description: "ベルトを敷き、形を切って色を塗り、回転させよう。紙の工場が小さな注文を自動で完成。" },
      ko: { title: "작은 생산 라인", description: "벨트를 놓고 모양을 자르고 색칠하고 회전시켜요. 종이 공장이 주문을 자동으로 완성해요." },
      fr: { title: "Petite usine", description: "Posez des tapis, découpez, colorez et tournez les formes. Votre usine de papier réalise les commandes." },
      de: { title: "Kleine Fabrik", description: "Baue Förderbänder, schneide, färbe und drehe Formen. Deine Papierfabrik erfüllt kleine Aufträge von selbst." },
      es: { title: "Pequeña fábrica", description: "Construye cintas, corta, pinta y gira figuras. Tu pequeña fábrica de papel completará los pedidos." },
      'pt-BR': { title: "Pequena fábrica", description: "Monte esteiras, corte, pinte e gire formas. Sua pequena fábrica de papel completa cada pedido sozinha." }
    }
  },
  {
    title: "骰隐江湖",
    description: "四枚骰子，六场比武。分配出招、格挡与调息，让小点数化作出奇制胜的武侠连招。",
    path: "./games/dice-jianghu/index.html",
    category: "策略",
    color: "#e7e9db",
    cover: "./games/dice-jianghu/cover.svg",
    locales: {
      en: { title: "Dice & Jianghu", description: "Four dice, six martial duels. Strike, guard and recover; turn small rolls into powerful skill combinations." },
      ja: { title: "骰子の江湖", description: "四つの骰子で六つの決闘へ。攻撃・防御・調息に振り分け、小さな目を強力な連携技に変えよう。" },
      ko: { title: "주사위 강호", description: "네 주사위와 여섯 대결. 공격, 방어, 회복에 배치하고 작은 눈을 강력한 무공 조합으로 바꿔 보세요." },
      fr: { title: "Dés du Jianghu", description: "Quatre dés, six duels. Frappez, parez et soignez-vous : les petits résultats révèlent de grandes techniques." },
      de: { title: "Würfel des Jianghu", description: "Vier Würfel, sechs Duelle. Angreifen, blocken und heilen: Kleine Würfe entfesseln starke Techniken." },
      es: { title: "Dados del Jianghu", description: "Cuatro dados, seis duelos. Ataca, bloquea y cura; convierte las tiradas pequeñas en poderosas técnicas." },
      'pt-BR': { title: "Dados do Jianghu", description: "Quatro dados, seis duelos. Ataque, defenda e cure; transforme números pequenos em técnicas poderosas." }
    }
  },
  {
    title: "昨天的我",
    description: "录下几秒钟前的自己，让分身踩住开关、搬箱和托住桥台。和过去的你，一起走到出口。",
    path: "./games/yesterday-me/index.html",
    category: "解谜",
    color: "#e5e8d8",
    cover: "./games/yesterday-me/cover.svg",
    locales: {
      en: { title: "Yesterday, Me", description: "Record your past self. Let echoes hold switches, carry boxes and support bridges as you find the way out together." },
      ja: { title: "昨日のぼく", description: "数秒前の自分を記録。分身とスイッチを押し、箱を運び、橋を支えて、一緒に出口へ向かおう。" },
      ko: { title: "어제의 나", description: "몇 초 전의 나를 기록해요. 분신과 스위치를 누르고 상자를 옮기며 다리를 받쳐 함께 출구로 가요." },
      fr: { title: "Moi, hier", description: "Enregistrez votre ancien vous. Avec vos échos, pressez les boutons, portez les caisses et soutenez les ponts jusqu’à la sortie." },
      de: { title: "Mein gestriges Ich", description: "Zeichne dein früheres Ich auf. Haltet Schalter, tragt Kisten und stützt Brücken, um gemeinsam den Ausgang zu erreichen." },
      es: { title: "Mi yo de ayer", description: "Graba a tu yo anterior. Colabora con tus ecos para pulsar interruptores, llevar cajas y sostener puentes hasta la salida." },
      'pt-BR': { title: "Meu eu de ontem", description: "Grave seu eu anterior. Seus ecos seguram botões, carregam caixas e sustentam pontes para chegarem juntos à saída." }
    }
  },
  {
    title: "桌面漂移",
    description: "绕过课桌上的文具，漂移过弯，追上自己的最佳圈幽灵。就差零点几秒，再来一圈。",
    path: "./games/desk-drift/index.html",
    category: "动作",
    color: "#e6e9da",
    cover: "./games/desk-drift/cover.svg",
    locales: {
      en: { title: "Desk Drift", description: "Drift around desk stationery and chase your best-lap ghost. Just a fraction away. One more lap." },
      ja: { title: "机上ドリフト", description: "机の文具を回り、ドリフトで自己ベストのゴーストを追おう。あとほんの少し、もう一周。" },
      ko: { title: "책상 드리프트", description: "책상 위 문구를 돌아 드리프트하며 최고 기록의 고스트를 쫓아요. 아주 조금만 더, 한 바퀴 더." },
      fr: { title: "Drift de bureau", description: "Dérapez autour des fournitures et poursuivez le fantôme de votre record. À quelques dixièmes. Encore un tour." },
      de: { title: "Schreibtisch-Drift", description: "Drifte um Schreibwaren und jage den Geist deiner Bestzeit. Nur ein paar Zehntel. Noch eine Runde." },
      es: { title: "Derrape de escritorio", description: "Derrapa entre útiles de escritorio y persigue el fantasma de tu mejor vuelta. A unas décimas. Otra vuelta." },
      'pt-BR': { title: "Drift na mesa", description: "Derrape entre materiais de papelaria e persiga o fantasma da sua melhor volta. Por alguns décimos. Mais uma volta." }
    }
  },
  {
    title: "猫咪潜行",
    description: "观察巡逻和视野，躲进纸箱、扔出纸团，引开守卫，带着小鱼干悄悄回家。",
    path: "./games/cat-stealth/index.html",
    category: "策略",
    color: "#e6e7d7",
    cover: "./games/cat-stealth/cover.svg",
    locales: {
      en: { title: "Sneaky Little Cat", description: "Watch patrols, hide in boxes and toss paper to distract guards. Bring every little fish safely home." },
      ja: { title: "こっそりねこ", description: "巡回と視界を観察し、箱に隠れて紙玉で番人を誘おう。干し魚を持ってそっと帰ろう。" },
      ko: { title: "살금살금 고양이", description: "순찰과 시야를 살피고 상자에 숨어 종이공으로 경비를 유인해요. 생선을 챙겨 조용히 집으로!" },
      fr: { title: "Chat en douce", description: "Observez les patrouilles, cachez-vous dans les cartons et lancez du papier pour rapporter les poissons." },
      de: { title: "Leise Katzenpfoten", description: "Beobachte Patrouillen, verstecke dich in Kartons und lenke Wachen mit Papier ab. Bring alle Fische heim." },
      es: { title: "Gato sigiloso", description: "Observa patrullas, escóndete en cajas y distrae a los guardias con papel. Lleva los peces a casa." },
      'pt-BR': { title: "Gatinho furtivo", description: "Observe patrulhas, esconda-se em caixas e distraia os guardas com papel. Leve todos os peixes para casa." }
    }
  },
  {
    title: "六角小田园",
    description: "拼接森林、河流与村庄，完成相邻组合的小心愿，让一块块地长成喜欢的风景。",
    path: "./games/hex-meadow/index.html",
    category: "策略",
    color: "#dce5c9",
    cover: "./games/hex-meadow/cover.svg",
    locales: {
      en: { title: "Hex Meadow", description: "Join forests, rivers and villages. Fulfill little wishes as each tile grows into a peaceful landscape." },
      ja: { title: "六角の小さな田園", description: "森、川、村をつなぎ、小さな願いを叶えながら、好きな風景を少しずつ育てよう。" },
      ko: { title: "육각 작은 전원", description: "숲, 강, 마을을 이어 작은 소원을 이루고 한 조각씩 나만의 풍경을 키워요." },
      fr: { title: "Petit pré hexagonal", description: "Reliez forêts, rivières et villages. Réalisez de petits souhaits et faites grandir un paysage paisible." },
      de: { title: "Kleine Sechseckwiese", description: "Verbinde Wälder, Flüsse und Dörfer. Erfülle kleine Wünsche und lass eine friedliche Landschaft wachsen." },
      es: { title: "Pequeño prado hexagonal", description: "Une bosques, ríos y pueblos. Cumple pequeños deseos y crea un paisaje tranquilo, pieza a pieza." },
      'pt-BR': { title: "Pequeno campo hexagonal", description: "Una florestas, rios e vilas. Realize pequenos desejos e cultive uma paisagem tranquila, peça por peça." }
    }
  },
  {
    title: "金拉米",
    description: "十张纸牌，一位牌友。收集顺子与同点数组，巧妙敲牌，向 100 分慢慢靠近。",
    path: "./games/gin-rummy/index.html",
    category: "棋牌",
    color: "#e5e9dc",
    cover: "./games/gin-rummy/cover.svg",
    locales: {
      en: { title: "Gin Rummy", description: "Ten cards and a computer friend. Collect runs and sets, choose when to knock, and race to 100 points." },
      ja: { title: "ジンラミー", description: "10枚の札とコンピューターの友だち。連番と同じ数字を集め、ノックの時機を選んで100点を目指そう。" },
      ko: { title: "진 러미", description: "열 장의 카드와 컴퓨터 친구. 연속 카드와 같은 숫자를 모아 노크하고 먼저 100점에 도전해요." },
      fr: { title: "Gin Rami", description: "Dix cartes et un ami virtuel. Formez suites et brelans, frappez au bon moment et atteignez 100 points." },
      de: { title: "Gin Rommé", description: "Zehn Karten und ein Computerfreund. Sammle Folgen und Sätze, klopfe im richtigen Moment und erreiche 100 Punkte." },
      es: { title: "Gin Rummy", description: "Diez cartas y un amigo virtual. Forma grupos y escaleras, elige cuándo cerrar y llega a 100 puntos." },
      'pt-BR': { title: "Gin Rummy", description: "Dez cartas e um amigo virtual. Forme trincas e sequências, escolha quando bater e chegue a 100 pontos." }
    }
  },
  {
    title: "街角咖啡店",
    description: "接一张小票，亲手做一杯咖啡。照看排队的客人，打烊算账，让街角小店慢慢长大。",
    path: "./games/corner-coffee/index.html",
    category: "休闲",
    color: "#eae5d5",
    cover: "./games/corner-coffee/cover.svg",
    locales: {
      en: { title: "Corner Coffee", description: "Take orders and craft each cup. Serve your waiting guests, settle the day and grow a little corner café." },
      ja: { title: "街角の喫茶店", description: "注文を受け、一杯ずつ手作り。待つお客さんをもてなし、閉店後に帳簿をつけて小さなお店を育てよう。" },
      ko: { title: "모퉁이 커피숍", description: "주문을 받고 한 잔씩 직접 만들어요. 기다리는 손님을 대접하고 마감 후 정산하며 작은 가게를 키워요." },
      fr: { title: "Café du coin", description: "Prenez les commandes et préparez chaque tasse. Servez vos clients, faites les comptes et développez votre petit café." },
      de: { title: "Eckcafé", description: "Nimm Bestellungen an und bereite jede Tasse selbst zu. Bediene deine Gäste, rechne ab und lass dein kleines Café wachsen." },
      es: { title: "Café de la esquina", description: "Toma pedidos y prepara cada taza. Atiende a tus clientes, cierra las cuentas y haz crecer tu pequeño café." },
      'pt-BR': { title: "Café da esquina", description: "Aceite pedidos e prepare cada xícara. Atenda os clientes, feche as contas e faça seu pequeno café crescer." }
    }
  },
  {
    title: "纸间升级 · 拖拉机",
    description: "与电脑队友搭档，亮主、扣底、连对争分。双副牌的一桌默契，从 2 打到 A。",
    path: "./games/tractor/index.html",
    category: "棋牌",
    color: "#e4e9dc",
    cover: "./games/tractor/cover.svg",
    locales: {
      en: { title: "Paper Tractor · Shengji", description: "Team up with a computer, declare trumps and capture points with pairs and tractors. Two decks, from 2 to ace." },
      ja: { title: "紙のトラクター · 升級", description: "コンピューターの相棒と切り札を宣言し、連続ペアで得点を集めよう。2組のカードで2からAへ。" },
      ko: { title: "종이 트랙터 · 승급", description: "컴퓨터 팀원과 으뜸패를 정하고 연속 쌍으로 점수를 모아요. 두 벌의 카드로 2에서 A까지." },
      fr: { title: "Tractor de papier · Shengji", description: "Faites équipe avec un ordinateur, annoncez l’atout et marquez avec des paires. Deux jeux, du 2 à l’as." },
      de: { title: "Papier-Tractor · Shengji", description: "Mit einem Computerpartner Trumpf ansagen und Punkte mit Paarfolgen sammeln. Zwei Decks, von 2 bis Ass." },
      es: { title: "Tractor de papel · Shengji", description: "Forma equipo con la computadora, anuncia triunfos y suma puntos con parejas. Dos barajas, del 2 al as." },
      'pt-BR': { title: "Tractor de papel · Shengji", description: "Junte-se a um parceiro virtual, declare trunfos e marque pontos com pares. Dois baralhos, do 2 ao ás." }
    }
  },
  {
    title: "斗地主",
    description: "一副纸牌，两位牌友。叫分、出牌、巧配飞机，慢慢打完这一手。",
    path: "./games/doudizhu/index.html",
    category: "棋牌",
    color: "#e4e9da",
    cover: "./games/doudizhu/cover.svg",
    locales: {
      en: { title: "Dou Dizhu", description: "A deck of cards and two computer friends. Bid, play clever combinations, and enjoy a quiet round." },
      ja: { title: "闘地主", description: "一組のカードと二人の友だち。宣言して、札を組み合わせて、ゆっくり一局。" },
      ko: { title: "더우디주", description: "카드 한 벌과 컴퓨터 친구 둘. 입찰하고 조합을 골라 천천히 한 판 즐겨요." },
      fr: { title: "Dou Dizhu", description: "Un jeu de cartes et deux amis virtuels. Enchérissez, combinez les cartes et prenez votre temps." },
      de: { title: "Dou Dizhu", description: "Ein Kartenspiel und zwei Computerfreunde. Biete, kombiniere geschickt und genieße eine ruhige Runde." },
      es: { title: "Dou Dizhu", description: "Una baraja y dos amigos virtuales. Puja, combina tus cartas y disfruta una partida con calma." },
      'pt-BR': { title: "Dou Dizhu", description: "Um baralho e dois amigos virtuais. Dê lances, combine as cartas e aproveite sem pressa." }
    }
  },
  {
    title: "红心大战",
    description: "一桌纸牌，三个牌友。避开红心与黑桃 Q，让分数轻一点。",
    path: "./games/hearts/index.html",
    category: "棋牌",
    color: "#e9e8dc",
    cover: "./games/hearts/cover.svg",
    locales: {
      en: { title: "Hearts", description: "One paper table, three friends. Dodge hearts and the queen of spades, and keep your score light." },
      ja: { title: "ハーツ", description: "紙のテーブルで三人の仲間と。ハートとスペードのQを避けて、点数を軽く。" },
      ko: { title: "하트", description: "종이 테이블에서 세 친구와 함께. 하트와 스페이드 Q를 피하고 점수를 가볍게 해요." },
      fr: { title: "Dame de pique", description: "Une table de papier et trois amis. Évitez les cœurs et la dame de pique pour garder un score léger." },
      de: { title: "Hearts", description: "Ein Papiertisch, drei Freunde. Meide Herzen und die Pik-Dame und halte deinen Punktestand niedrig." },
      es: { title: "Corazones", description: "Una mesa de papel y tres amigos. Evita los corazones y la reina de picas para mantener pocos puntos." },
      'pt-BR': { title: "Copas", description: "Uma mesa de papel e três amigos. Desvie das copas e da dama de espadas e mantenha poucos pontos." }
    }
  },
  {
    title: "南通长牌",
    description: "一盏茶，一副长牌。与两位电脑牌友玩双将，碰杠听胡，慢慢过招。",
    path: "./games/nantong-changpai/index.html",
    category: "棋牌",
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
  {
    title: "争上游",
    description: "和两位纸上牌友轻松过招，组合手牌，抢先出完。",
    path: "./games/climb-up/index.html",
    category: "棋牌",
    color: "#e6eadc",
    cover: "./games/climb-up/cover.svg",
    locales: {
      en: { title: "Climb Up", description: "A friendly card game for three. Make combinations and empty your hand first." },
      ja: { title: "争上游", description: "紙の友だち2人とカード遊び。手札を組み合わせ、先に出し切ろう。" },
      ko: { title: "정상으로", description: "종이 친구 둘과 카드 한 판. 조합을 만들어 손패를 먼저 비워요." },
      fr: { title: "Vers le sommet", description: "Une partie amicale à trois. Formez des combinaisons et videz votre main en premier." },
      de: { title: "Ganz nach oben", description: "Eine freundliche Kartenrunde zu dritt. Bilde Kombinationen und lege zuerst alle Karten ab." },
      es: { title: "A la cima", description: "Una partida amistosa para tres. Forma combinaciones y vacía tu mano primero." },
      'pt-BR': { title: "Rumo ao topo", description: "Uma partida entre três amigos. Faça combinações e esvazie sua mão primeiro." }
    }
  },
  {
    title: "纸间节拍",
    description: "左手敲桌，右手拍手。接住音符、按住长音、左右交替，让连击把日常敲成小小音乐会。",
    path: "./games/paper-beat/index.html",
    category: "休闲",
    color: "#e6eadc",
    cover: "./games/paper-beat/cover.svg",
    locales: {
      en: { title: "Paper Beat", description: "Tap, clap and catch the rhythm. Hold long notes and alternate hands through three little desk concerts." },
      ja: { title: "紙のビート", description: "左でトン、右でパン。長い音を伸ばし、左右交互にリズムを刻む、机の上の小さな音楽会。" },
      ko: { title: "종이 비트", description: "왼쪽은 톡톡, 오른쪽은 짝짝. 긴 음을 누르고 좌우로 번갈아 세 곡의 작은 음악회를 즐겨요." },
      fr: { title: "Rythme de papier", description: "Tapez, applaudissez et suivez le rythme. Tenez les notes longues et alternez les mains dans trois petits concerts." },
      de: { title: "Papiertakt", description: "Klopfen, klatschen und den Takt treffen. Halte lange Noten und wechsle die Hände in drei kleinen Tischkonzerten." },
      es: { title: "Ritmo de papel", description: "Toca, aplaude y atrapa el ritmo. Mantén notas largas y alterna las manos en tres pequeños conciertos." },
      'pt-BR': { title: "Batida de papel", description: "Toque, bata palmas e pegue o ritmo. Segure notas longas e alterne as mãos em três pequenos concertos." }
    }
  },
  {
    title: "毛线解结",
    description: "捏住线头，挪动圆点，让交叉的毛线慢慢分开。解开最后一个结，看整团线轻轻舒展。",
    path: "./games/yarn-untangle/index.html",
    category: "解谜",
    color: "#e8ebdd",
    cover: "./games/yarn-untangle/cover.svg",
    locales: {
      en: { title: "Yarn Untangle", description: "Gently move yarn ends and dots to untangle twelve little puzzles. Undo the last crossing and watch the threads unfold." },
      ja: { title: "毛糸ほどき", description: "糸の端や丸い点をそっと動かして、12玉の毛糸をほどこう。最後の交差が消えると、糸がのびのび広がります。" },
      ko: { title: "실타래 풀기", description: "실 끝과 동그란 점을 옮겨 열두 실타래를 풀어요. 마지막 교차가 사라지면 실이 부드럽게 펼쳐져요." },
      fr: { title: "Fils emmêlés", description: "Déplacez doucement les points pour démêler douze pelotes. Défaites le dernier croisement et regardez les fils se déployer." },
      de: { title: "Wolle entwirren", description: "Bewege Fadenenden und Punkte, um zwölf kleine Knäuel zu entwirren. Löse die letzte Kreuzung und sieh zu, wie sich alles entfaltet." },
      es: { title: "Desenredar lana", description: "Mueve las puntas y los puntos para desenredar doce ovillos. Deshaz el último cruce y mira cómo los hilos se despliegan." },
      'pt-BR': { title: "Desenrolar lã", description: "Mova as pontas e os pontos para soltar doze novelos. Desfaça o último cruzamento e veja os fios se abrirem suavemente." }
    }
  },
  {
    title: "纸上地铁",
    description: "画线连接车站，调配小列车。随城市与客流一起成长，把快堵住的网络重新理顺。",
    path: "./games/paper-metro/index.html",
    category: "策略",
    color: "#e6eadc",
    cover: "./games/paper-metro/cover.svg",
    locales: {
      en: { title: "Paper Metro", description: "Draw lines, connect stations and dispatch little trains. Keep a growing city's passengers moving." },
      ja: { title: "紙の地下鉄", description: "駅を線でつなぎ、小さな列車を配車。育つ街の路線を整えて、増える乗客を目的地へ。" },
      ko: { title: "종이 지하철", description: "역을 잇고 작은 열차를 배치해요. 자라는 도시의 노선을 다듬어 늘어나는 승객을 목적지로 보내요." },
      fr: { title: "Métro de papier", description: "Tracez des lignes, reliez les stations et répartissez les trains pour accompagner une ville qui grandit." },
      de: { title: "Papiermetro", description: "Zeichne Linien, verbinde Stationen und verteile kleine Züge. Halte die Fahrgäste einer wachsenden Stadt in Bewegung." },
      es: { title: "Metro de papel", description: "Dibuja líneas, une estaciones y asigna pequeños trenes. Mantén en marcha una ciudad que no deja de crecer." },
      'pt-BR': { title: "Metrô de papel", description: "Desenhe linhas, conecte estações e distribua pequenos trens. Mantenha os passageiros de uma cidade crescente em movimento." }
    }
  },
  {
    title: "折页寻猫",
    description: "沿折痕合上纸页，让断开的路接起来。等小猫走过去，再展开下一段回家的路。",
    path: "./games/fold-cat/index.html",
    category: "解谜",
    color: "#e5e7d6",
    cover: "./games/fold-cat/cover.svg",
    locales: {
      en: { title: "Fold & Find the Cat", description: "Fold the page to join two broken paths. Let the cat cross, then unfold the next stretch of its way home." },
      ja: { title: "折り紙の猫さがし", description: "折り目に沿って紙を折り、途切れた道をつなごう。猫が渡ったら、紙を開いて帰り道の続きを探そう。" },
      ko: { title: "종이를 접어 고양이 찾기", description: "종이를 접어 끊어진 길을 이어요. 고양이가 건너면 종이를 펼쳐 집으로 가는 다음 길을 찾아요." },
      fr: { title: "Plis et petit chat", description: "Pliez la feuille pour raccorder deux bouts de chemin. Laissez passer le chat, puis dépliez la suite de son trajet." },
      de: { title: "Faltpfade für die Katze", description: "Falte das Blatt, bis zwei Wege aneinanderliegen. Lass die Katze hinüberlaufen und falte ihren Heimweg Stück für Stück auf." },
      es: { title: "Pliega y encuentra al gato", description: "Dobla la hoja para unir dos caminos. Deja que el gato cruce y despliega el siguiente tramo de vuelta a casa." },
      'pt-BR': { title: "Dobre e encontre o gato", description: "Dobre a folha para unir dois caminhos. Deixe o gato atravessar e desdobre o próximo trecho até chegar em casa." }
    }
  },
  {
    title: "课桌冰壶",
    description: "两人轮流弹瓶盖，每人三枚。轻轻滑向靶心，或撞开对方的瓶盖，看谁最后离圆心最近。",
    path: "./games/desk-curling/index.html",
    category: "休闲",
    color: "#e8dfce",
    cover: "./games/desk-curling/cover.svg",
    locales: {
      en: { title: "Desk Curling", description: "Take turns flicking three bottle caps each. Nudge your rival aside and leave your cap closest to the center." },
      ja: { title: "机の上のカーリング", description: "一人三つのボトルキャップを交互にはじこう。相手を押しのけ、最後に中心に一番近いキャップを残せるかな。" },
      ko: { title: "책상 컬링", description: "병뚜껑을 세 개씩 나눠 번갈아 튕겨요. 상대 뚜껑을 밀어내고 내 뚜껑을 중심에 가장 가깝게 놓아 보세요." },
      fr: { title: "Curling de bureau", description: "À tour de rôle, lancez vos trois capsules. Écartez celles de votre adversaire pour finir au plus près du centre." },
      de: { title: "Tischcurling", description: "Schnippt abwechselnd je drei Kronkorken über den Tisch. Wer nach dem letzten Stoß am nächsten an der Mitte liegt, gewinnt." },
      es: { title: "Curling de escritorio", description: "Cada jugador tiene tres chapas. Jugad por turnos: gana quien deje su chapa más cerca del centro al final de la ronda." },
      'pt-BR': { title: "Curling de mesa", description: "Cada pessoa tem três tampinhas. Joguem por turnos e afastem as tampinhas rivais. Ganha quem terminar mais perto do centro." }
    }
  },
  {
    order: 65,
    title: "纸上弹珠台",
    description: "拨动铅笔挡板，让弹珠敲响三枚星铃，点亮 LUNA，追逐十五秒双倍分。",
    path: "./games/paper-pinball/index.html",
    category: "动作",
    color: "#e4ddc5",
    cover: "./games/paper-pinball/cover.svg",
    locales: {
      "zh-CN": { title: "纸上弹珠台", description: "拨动铅笔挡板，让弹珠敲响三枚星铃，点亮 LUNA，追逐十五秒双倍分。" },
      "en": { title: "Paper Pinball", description: "Flip a marble into three star bells and light up LUNA for fifteen seconds of double scoring." },
      "ja": { title: "紙のピンボール", description: "鉛筆描きのフリッパーで3つの星のベルを鳴らそう。LUNAをそろえると15秒間スコアが2倍に。" },
      "ko": { title: "종이 핀볼", description: "연필로 그린 플리퍼로 별 종 세 개를 울려 보세요. LUNA를 모두 밝히면 15초 동안 점수가 두 배가 됩니다." },
      "fr": { title: "Flipper de papier", description: "Faites sonner les trois cloches étoilées et allumez LUNA pour doubler vos points pendant quinze secondes." },
      "de": { title: "Papierflipper", description: "Triff die drei Sternenglocken und lass LUNA aufleuchten. Dann zählen deine Punkte 15 Sekunden lang doppelt." },
      "es": { title: "Pinball de papel", description: "Haz sonar las tres campanas estelares y enciende LUNA para duplicar tus puntos durante quince segundos." },
      "pt-BR": { title: "Pinball de papel", description: "Acerte os três sinos estelares e acenda LUNA para marcar o dobro de pontos por quinze segundos." }
    }
  },
  {
    order: 66,
    title: "再翻一张",
    description: "再翻一张，还是见好就收？五轮寻宝里，留意余牌，在同类陷阱再现前把宝物装进口袋。",
    path: "./games/one-more-card/index.html",
    category: "策略",
    color: "#e8e3ca",
    cover: "./games/one-more-card/cover.svg",
    locales: {
      "zh-CN": { title: "再翻一张", description: "再翻一张，还是见好就收？五轮寻宝里，留意余牌，在同类陷阱再现前把宝物装进口袋。" },
      "en": { title: "One More Card", description: "Draw again or pocket your finds? Read the remaining deck and bank your treasure before a trap repeats across five rounds." },
      "ja": { title: "もう一枚", description: "もう一枚めくる？ それとも引き上げる？ 山札の残りを読み、同じ罠が再び出る前に宝を持ち帰ろう。全5ラウンド。" },
      "ko": { title: "한 장만 더", description: "한 장 더 뒤집을까, 여기서 멈출까? 다섯 라운드 동안 남은 카드를 살피며 같은 함정이 다시 나오기 전에 보물을 챙기세요." },
      "fr": { title: "Encore une carte", description: "Piocher ou empocher le butin ? Pendant cinq manches, surveillez les cartes restantes et encaissez avant de retomber dans le même piège." },
      "de": { title: "Noch eine Karte", description: "Weiterziehen oder den Schatz sichern? Behalte in fünf Runden die übrigen Karten im Blick, bevor dieselbe Falle erneut zuschnappt." },
      "es": { title: "Una carta más", description: "¿Robas otra carta o te plantas? Durante cinco rondas, vigila el mazo y guarda tu tesoro antes de que se repita una trampa." },
      "pt-BR": { title: "Só mais uma carta", description: "Virar outra carta ou guardar o tesouro? Em cinco rodadas, acompanhe as cartas restantes e guarde seus pontos antes que uma armadilha se repita." }
    }
  },
  {
    order: 67,
    title: "姑苏寻物记",
    description: "拖开平江河街的画卷，摇铃唤船、拨柳寻簪，把八件水乡小事收入手记。",
    path: "./games/gusu-hidden-objects/index.html",
    category: "解谜",
    color: "#d9dfcc",
    cover: "./games/gusu-hidden-objects/cover.svg",
    locales: {
      "zh-CN": { title: "姑苏寻物记", description: "拖开平江河街的画卷，摇铃唤船、拨柳寻簪，把八件水乡小事收入手记。" },
      "en": { title: "Hidden in Gusu", description: "Explore a painted canal in Suzhou. Ring for a boat, part the willow branches and find eight treasures." },
      "ja": { title: "姑蘇の探しもの", description: "蘇州の水路を描いた絵巻を歩こう。鈴で舟を呼び、柳の枝を分けて八つの探しものを手帳に集めよう。" },
      "ko": { title: "고소의 숨은 물건", description: "쑤저우 물길을 그린 두루마리를 펼쳐 보세요. 방울로 배를 부르고 버들가지를 젖혀 여덟 물건을 찾아요." },
      "fr": { title: "Les secrets de Gusu", description: "Parcourez un canal peint de Suzhou. Appelez la barque, écartez les branches du saule et découvrez huit trésors." },
      "de": { title: "Verborgen in Gusu", description: "Erkunde einen gemalten Kanal in Suzhou. Läute nach dem Boot, teile die Weidenzweige und entdecke acht kleine Schätze." },
      "es": { title: "Los secretos de Gusu", description: "Recorre un canal pintado de Suzhou. Llama a la barca, aparta las ramas del sauce y descubre ocho tesoros." },
      "pt-BR": { title: "Os segredos de Gusu", description: "Percorra um canal pintado de Suzhou. Chame o barco, afaste os galhos do salgueiro e encontre oito tesouros." }
    }
  },
  {
    order: 68,
    title: "皮影戏班",
    description: "拨动影偶、灯距与关节，在一方小戏台上拼出六幕皮影短戏。",
    path: "./games/shadow-theatre/index.html",
    category: "解谜",
    color: "#e8d7b7",
    cover: "./games/shadow-theatre/cover.svg",
    locales: {
      "zh-CN": { title: "皮影戏班", description: "拨动影偶、灯距与关节，在一方小戏台上拼出六幕皮影短戏。" },
      "en": { title: "Shadow Theatre", description: "Move, layer and light paper puppets to bring six shadow plays to life." },
      "ja": { title: "影絵一座", description: "人形を重ね、灯りとの距離や関節を調節して、六幕の影絵を上演しよう。" },
      "ko": { title: "그림자 극단", description: "인형을 겹치고 등불 거리와 관절을 조절해 여섯 막의 그림자극을 완성하세요." },
      "fr": { title: "Théâtre d’ombres", description: "Déplacez et articulez les figurines à la lumière d’une lampe pour jouer six scènes d’ombres." },
      "de": { title: "Schattentheater", description: "Bewege und drehe die Figuren im Lampenlicht und spiele sechs kleine Schattenstücke." },
      "es": { title: "Teatro de sombras", description: "Mueve y articula figuras a la luz de una lámpara para representar seis pequeñas obras de sombras." },
      "pt-BR": { title: "Teatro de sombras", description: "Mova e articule os bonecos à luz de uma lâmpada para encenar seis peças de teatro de sombras." }
    }
  },
  {
    order: 69,
    title: "三招定胜负",
    description: "五格短桥上，看破对手起手，将进、退、刺、挡排成三招，逐拍过招。",
    path: "./games/three-move-duel/index.html",
    category: "策略",
    color: "#dbe0cf",
    cover: "./games/three-move-duel/cover.svg",
    locales: {
      "zh-CN": { title: "三招定胜负", description: "五格短桥上，看破对手起手，将进、退、刺、挡排成三招，逐拍过招。" },
      "en": { title: "Three-Move Duel", description: "On a five-space bridge, read your rival’s opening and line up three moves. Advance, retreat, thrust or guard as each beat unfolds." },
      "ja": { title: "三手で決着", description: "五マスの橋で相手の初手を読み、前進・後退・突き・防御から三手を組んで一手ずつ勝負。" },
      "ko": { title: "세 수의 결투", description: "다섯 칸 다리에서 상대의 첫 수를 읽고 전진, 후퇴, 찌르기, 막기로 세 수를 짜서 겨뤄 보세요." },
      "fr": { title: "Duel en trois coups", description: "Sur un pont de cinq cases, lisez le premier geste du rival. Composez trois coups pour avancer, reculer, piquer ou parer." },
      "de": { title: "Duell in drei Zügen", description: "Lies den ersten Zug des Gegners auf einer Brücke mit fünf Feldern. Plane drei Züge aus Vorstoß, Rückzug, Stich und Deckung." },
      "es": { title: "Duelo en tres pasos", description: "En un puente de cinco casillas, lee el primer gesto del rival. Encadena tres golpes para avanzar, retirarte, estocar o cubrirte." },
      "pt-BR": { title: "Duelo em três golpes", description: "Em uma ponte de cinco casas, leia o primeiro gesto do rival. Combine três golpes para avançar, recuar, estocar ou aparar." }
    }
  },
  {
    order: 70,
    title: "铅笔数独",
    description: "从两分钟的四宫格起笔，记下可能的数字，再挑战三档难度的九宫格。",
    path: "./games/pencil-sudoku/index.html",
    category: "益智",
    color: "#dce1d2",
    cover: "./games/pencil-sudoku/cover.svg",
    locales: {
      "zh-CN": { title: "铅笔数独", description: "从两分钟的四宫格起笔，记下可能的数字，再挑战三档难度的九宫格。" },
      en: { title: "Pencil Sudoku", description: "Start with a two-minute 4×4, pencil in candidates, then solve 9×9 grids across three difficulty levels." },
      ja: { title: "えんぴつ数独", description: "2分で遊べる4×4からスタート。数字をメモしながら、3段階の9×9に挑戦。" },
      ko: { title: "연필 스도쿠", description: "2분짜리 4×4로 시작해 후보를 메모하고 세 단계 난이도의 9×9에 도전하세요." },
      fr: { title: "Sudoku au crayon", description: "Commencez par une grille 4×4 de deux minutes, notez les candidats et passez aux 9×9 de trois niveaux." },
      de: { title: "Bleistift-Sudoku", description: "Starte mit einem 4×4 für zwei Minuten, notiere Kandidaten und löse 9×9-Rätsel in drei Stufen." },
      es: { title: "Sudoku a lápiz", description: "Empieza con un 4×4 de dos minutos, anota candidatos y resuelve sudokus de 9×9 en tres niveles." },
      "pt-BR": { title: "Sudoku a lápis", description: "Comece com um 4×4 de dois minutos, anote candidatos e resolva grades 9×9 em três níveis." }
    }
  },
  {
    order: 71,
    title: "七巧山河",
    description: "把七块纸板拼成八幅山水剪影。",
    path: "./games/tangram-landscapes/index.html",
    category: "益智",
    color: "#dbe0ce",
    cover: "./games/tangram-landscapes/cover.svg",
    locales: {
      "zh-CN": { title: "七巧山河", description: "把七块纸板拼成八幅山水剪影。" },
      "en": { title: "Tangram Landscapes", description: "Arrange seven paper shapes into eight landscapes." },
      "ja": { title: "七巧山水", description: "七枚の紙片で八つの山水の影を組み立てよう。" },
      "ko": { title: "칠교 산수", description: "종잇조각 일곱 개로 여덟 가지 산수 실루엣을 맞춰 보세요." },
      "fr": { title: "Paysages en tangram", description: "Assemblez sept pièces de papier pour composer huit paysages." },
      "de": { title: "Tangram-Landschaften", description: "Lege acht Landschaften aus sieben Papiertans." },
      "es": { title: "Paisajes de tangram", description: "Combina siete piezas de papel para formar ocho paisajes." },
      "pt-BR": { title: "Paisagens em tangram", description: "Monte oito paisagens com sete peças de papel." }
    }
  },
  {
    order: 72,
    title: "猜色密码",
    description: "用六枚彩色印章推理四位密码。读懂每次留下的线索，在八次内打开信封。",
    path: "./games/color-code/index.html",
    category: "益智",
    color: "#e4d9c3",
    cover: "./games/color-code/cover.svg",
    locales: {
      "zh-CN": { title: "猜色密码", description: "用六枚彩色印章推理四位密码。读懂每次留下的线索，在八次内打开信封。" },
      "en": { title: "Color Code", description: "Use six ink stamps to crack a four-place code. Read each clue and open the envelope in eight guesses." },
      "ja": { title: "色の暗号", description: "6色のスタンプで4つの暗号を推理。手がかりを読み、8回以内に封筒を開けよう。" },
      "ko": { title: "색 암호", description: "여섯 색 도장으로 네 자리 암호를 추리하세요. 단서를 모아 여덟 번 안에 봉투를 여세요." },
      "fr": { title: "Code couleur", description: "Déchiffrez un code de quatre tampons en huit essais grâce aux indices de chaque rangée." },
      "de": { title: "Farbcode", description: "Knacke mit sechs Farbstempeln einen vierstelligen Code. Acht Versuche und die Hinweise auf dem Bogen helfen dir." },
      "es": { title: "Código de colores", description: "Descifra un código de cuatro sellos. Lee las pistas y abre el sobre en ocho intentos." },
      "pt-BR": { title: "Código de cores", description: "Decifre um código de quatro carimbos. Leia as pistas e abra o envelope em oito tentativas." }
    }
  },
  {
    order: 73,
    title: "相册翻翻",
    description: "翻开草鞋、茶壶和渡船的速写，用尽量少的翻牌次数集齐一本水乡相册。",
    path: "./games/memory-album/index.html",
    category: "益智",
    color: "#dfdfcd",
    cover: "./games/memory-album/cover.svg",
    locales: {
      "zh-CN": { title: "相册翻翻", description: "翻开草鞋、茶壶和渡船的速写，用尽量少的翻牌次数集齐一本水乡相册。" },
      "en": { title: "Memory Album", description: "Match sketches of sandals, teapots and ferries to fill a water-town travel album in as few flips as possible." },
      "ja": { title: "旅の絵合わせ", description: "わらじや急須、渡し舟の絵を合わせよう。なるべく少ない枚数で水郷の旅のアルバムを完成させよう。" },
      "ko": { title: "여행 짝맞추기", description: "짚신, 찻주전자, 나룻배 그림의 짝을 찾아보세요. 되도록 적게 뒤집어 물의 고장 여행 앨범을 완성하세요." },
      "fr": { title: "Album de voyage", description: "Retrouvez les paires de sandales, de théières et de barques pour remplir votre album du Jiangnan en retournant le moins de photos possible." },
      "de": { title: "Reisealbum", description: "Finde Paare mit Sandalen, Teekannen und Fähren. Fülle dein Reisealbum mit möglichst wenigen aufgedeckten Fotos." },
      "es": { title: "Álbum de viaje", description: "Empareja dibujos de sandalias, teteras y barcas para llenar tu álbum de viaje con el menor número de giros." },
      "pt-BR": { title: "Álbum de viagem", description: "Encontre pares de sandálias, bules e barcas para completar seu álbum de viagem com o menor número de viradas." }
    }
  },
  {
    order: 74,
    title: "熄灯之后",
    description: "街角只剩一块招牌亮着。轻点星灯，让最后一盏也变成弯月。",
    path: "./games/lights-out/index.html",
    category: "益智",
    color: "#c9d2ca",
    cover: "./games/lights-out/cover.svg",
    locales: {
      'zh-CN': { title: "熄灯之后", description: "街角只剩一块招牌亮着。轻点星灯，让最后一盏也变成弯月。" },
      en: { title: "After Lights Out", description: "One sign still glows above the rooftops. Tap its starry lamps until every star becomes a crescent." },
      ja: { title: "灯りが消えたあと", description: "街角にひとつだけ光る看板。星のランプを押して、最後のひとつまで三日月に変えましょう。" },
      ko: { title: "불이 꺼진 뒤", description: "골목 끝에 간판 하나만 빛납니다. 별 모양 등을 눌러 마지막 별까지 초승달로 바꿔 보세요." },
      fr: { title: "Tous feux éteints", description: "Une seule enseigne brille encore au coin de la rue. Touchez ses étoiles pour les changer toutes en croissants de lune." },
      de: { title: "Lichter aus", description: "An der Straßenecke leuchtet noch ein Schild. Tippe auf die Sternlichter, bis nur noch Mondsicheln zu sehen sind." },
      es: { title: "Luces apagadas", description: "Solo queda un letrero encendido en la esquina. Toca sus estrellas hasta que todas se conviertan en lunas crecientes." },
      'pt-BR': { title: "Luzes apagadas", description: "Na esquina, só um letreiro continua aceso. Toque nas estrelas até que a última vire uma lua crescente." }
    }
  },
  {
    order: 75,
    title: "一笔围栏",
    description: "在六张手绘田图上按数字落笔，把田埂连成一圈围栏。",
    path: "./games/pencil-fences/index.html",
    category: "益智",
    color: "#e3e6cf",
    cover: "./games/pencil-fences/cover.svg",
    locales: {
      'zh-CN': { title: "一笔围栏", description: "在六张手绘田图上按数字落笔，把田埂连成一圈围栏。" },
      en: { title: "Pencil Fences", description: "Follow the clues across six hand-drawn fields and pencil in one unbroken fence." },
      ja: { title: "ひと筆の柵", description: "手描きの畑を六つ巡り、数字を頼りに一本の輪になる柵を描こう。" },
      ko: { title: "한 줄 울타리", description: "손으로 그린 여섯 밭에서 숫자를 따라 울타리를 하나의 고리로 이으세요." },
      fr: { title: "Clôtures au crayon", description: "Suivez les indices de six champs dessinés à la main pour tracer une clôture en boucle." },
      de: { title: "Bleistiftzäune", description: "Zeichne auf sechs handgemalten Feldkarten einen geschlossenen Zaun nach den Zahlenhinweisen." },
      es: { title: "Cercas a lápiz", description: "Sigue las pistas de seis campos dibujados a mano y traza una cerca de un solo lazo." },
      'pt-BR': { title: "Cercas a lápis", description: "Siga as pistas em seis campos desenhados à mão e trace uma cerca que forme um único circuito." }
    }
  },
  {
    order: 76,
    title: "山道速降",
    description: "在三条手绘雪道上左右压刃，依次穿过旗门，挑战自己的最快用时。",
    path: "./games/slalom-sketch/index.html",
    category: "动作",
    color: "#dce5dc",
    cover: "./games/slalom-sketch/cover.svg",
    locales: {
      "zh-CN": { title: "山道速降", description: "在三条手绘雪道上左右压刃，依次穿过旗门，挑战自己的最快用时。" },
      "en": { title: "Slalom Sketch", description: "Carve through three hand-drawn ski courses, thread the gates in order and race your personal best." },
      "ja": { title: "山道スラローム", description: "手描きの雪道をエッジで滑り、三つのコースで旗門を順に抜けて自己ベストを狙おう。" },
      "ko": { title: "산길 슬라럼", description: "손으로 그린 세 설원을 누비며 기문을 차례로 통과하고 개인 최고 기록을 경신하세요." },
      "fr": { title: "Slalom alpin", description: "Enchaînez les virages sur trois pistes dessinées à la main, passez les portes dans l’ordre et battez votre record." },
      "de": { title: "Bergslalom", description: "Ziehe deine Spuren durch drei gezeichnete Pisten, durchfahre die Tore der Reihe nach und schlage deine Bestzeit." },
      "es": { title: "Eslalon de montaña", description: "Traza curvas en tres pistas dibujadas a mano, pasa las puertas en orden y supera tu mejor tiempo." },
      "pt-BR": { title: "Slalom na serra", description: "Faça curvas em três pistas desenhadas à mão, passe pelos portões em ordem e supere seu melhor tempo." }
    }
  },
  {
    order: 77,
    title: "放学守门员",
    description: "放学后的十次点球。看支撑脚猜方向，看摆腿猜高低，踩准时机扑救。",
    path: "./games/school-goalkeeper/index.html",
    category: "动作",
    color: "#d9e3ce",
    cover: "./games/school-goalkeeper/cover.svg",
    locales: {
      "zh-CN": { title: "放学守门员", description: "放学后的十次点球。看支撑脚猜方向，看摆腿猜高低，踩准时机扑救。" },
      "en": { title: "After-School Keeper", description: "Face ten after-school penalties. Read the planted foot and backswing, then time your dive." },
      "ja": { title: "放課後のキーパー", description: "放課後のPK10本勝負。軸足で方向、蹴り足で高さを読み、タイミングよく飛ぼう。" },
      "ko": { title: "방과 후 골키퍼", description: "방과 후 페널티킥 열 개에 도전하세요. 디딤발과 다리의 높이를 읽고 제때 뛰어 막으세요." },
      "fr": { title: "Gardien après la classe", description: "Dix penalties après la classe. Lisez le pied d’appui et le mouvement de la jambe pour plonger au bon moment." },
      "de": { title: "Torwart nach Schulschluss", description: "Halte zehn Elfmeter nach Schulschluss. Lies Standfuß und Beinschwung und spring im richtigen Moment." },
      "es": { title: "Portero después de clase", description: "Defiende diez penaltis después de clase. Lee el pie de apoyo y la altura de la pierna para lanzarte a tiempo." },
      "pt-BR": { title: "Goleiro depois da aula", description: "Defenda dez pênaltis depois da aula. Leia o pé de apoio e a altura da perna para saltar na hora certa." }
    }
  },
  {
    order: 78,
    title: "追风纸鸢",
    description: "收放风筝线，借阵风带燕子纸鸢穿过三道高低不同的风标。",
    path: "./games/kite-on-the-wind/index.html",
    category: "动作",
    color: "#dbe5da",
    cover: "./games/kite-on-the-wind/cover.svg",
    locales: {
      "zh-CN": { title: "追风纸鸢", description: "收放风筝线，借阵风带燕子纸鸢穿过三道高低不同的风标。" },
      "en": { title: "Kite on the Wind", description: "Fly a swallow kite through three wind gates. Reel in for lift and ease the line as gusts build." },
      "ja": { title: "風追い凧", description: "糸を引いたり緩めたりしながら、ツバメ凧を風に乗せて高さの異なる三つの風門をくぐろう。" },
      "ko": { title: "바람을 타는 연", description: "실을 감고 풀어 제비연을 띄우고, 돌풍을 타고 높이가 다른 세 관문을 통과하세요." },
      "fr": { title: "Au fil du vent", description: "Jouez avec la tension du fil et les rafales pour guider un cerf-volant hirondelle entre trois paires de fanions." },
      "de": { title: "Drachen im Wind", description: "Führe einen Schwalbendrachen mit geschicktem Leinenzug durch drei verschieden hohe Windtore." },
      "es": { title: "Cometa al viento", description: "Regula el hilo y aprovecha las ráfagas para guiar tu cometa golondrina por tres puertas a distinta altura." },
      "pt-BR": { title: "Pipa ao vento", description: "Controle a linha e aproveite as rajadas para levar uma pipa de andorinha por três portais em alturas diferentes." }
    }
  },
  {
    order: 79,
    title: "纸偶杂耍",
    description: "在纸戏台上交替抛接三只花球，接得越连贯，每球得分越高。",
    path: "./games/paper-juggler/index.html",
    category: "动作",
    color: "#eadbbf",
    cover: "./games/paper-juggler/cover.svg",
    locales: {
      "zh-CN": { title: "纸偶杂耍", description: "在纸戏台上交替抛接三只花球，接得越连贯，每球得分越高。" },
      "en": { title: "Paper Juggler", description: "Toss three patterned balls between a paper puppet’s hands. Each catch in a streak is worth one more point." },
      "ja": { title: "紙人形の玉芸", description: "紙人形の両手で三つの模様玉を投げ渡そう。連続で受けるほど一球の得点が上がる。" },
      "ko": { title: "종이 인형의 저글링", description: "종이 인형의 양손으로 무늬 공 세 개를 주고받으세요. 연속으로 받을수록 공 하나의 점수가 올라갑니다." },
      "fr": { title: "Jongleur de papier", description: "Faites passer trois balles à motifs d’une main à l’autre. Chaque prise en série rapporte un point de plus." },
      "de": { title: "Papierjongleur", description: "Wirf drei gemusterte Bälle von Hand zu Hand. Jeder Fang in einer Serie bringt einen Punkt mehr." },
      "es": { title: "Malabarista de papel", description: "Lanza tres pelotas estampadas de mano en mano. Cada acierto en una racha vale un punto más." },
      "pt-BR": { title: "Malabarista de papel", description: "Passe três bolas estampadas de uma mão à outra. Cada acerto em sequência vale um ponto a mais." }
    }
  },
  {
    order: 80,
    title: "一根钢丝",
    description: "撑一把纸伞，读懂屋顶的风旗，稳稳走过三段楼间钢丝。",
    path: "./games/tightrope-walk/index.html",
    category: "动作",
    color: "#dce5d8",
    cover: "./games/tightrope-walk/cover.svg",
    locales: {
      "zh-CN": { title: "一根钢丝", description: "撑一把纸伞，读懂屋顶的风旗，稳稳走过三段楼间钢丝。" },
      "en": { title: "A Single Wire", description: "Read the rooftop flags and steady your paper parasol across three high wires." },
      "ja": { title: "一本の綱", description: "屋上の旗で風を読み、番傘でバランスを取りながら三つの綱を渡ろう。" },
      "ko": { title: "한 가닥 줄 위에서", description: "지붕 위 깃발로 바람을 읽고 종이 양산으로 균형을 잡아 세 구간을 건너세요." },
      "fr": { title: "Sur un fil", description: "Lisez le vent dans les fanions et gardez l’équilibre avec votre ombrelle sur trois fils entre les toits." },
      "de": { title: "Auf einem Seil", description: "Lies den Wind an den Dachfahnen und balanciere mit einem Papierschirm über drei Hochseile." },
      "es": { title: "Sobre un alambre", description: "Lee el viento en los banderines y equilibra tu sombrilla de papel para cruzar tres alambres entre tejados." },
      "pt-BR": { title: "Por um fio", description: "Observe as bandeiras nos telhados e equilibre a sombrinha de papel para cruzar três fios nas alturas." }
    }
  },
  {
    order: 81,
    title: "林间快门",
    description: "循着枝叶和足迹移动取景框，用六张底片拍下六种林鸟的招牌动作。",
    path: "./games/woodland-shutter/index.html",
    category: "休闲",
    color: "#d6decb",
    cover: "./games/woodland-shutter/cover.svg",
    locales: {
      "zh-CN": { title: "林间快门", description: "循着枝叶和足迹移动取景框，用六张底片拍下六种林鸟的招牌动作。" },
      "en": { title: "Woodland Shutter", description: "Follow rustling leaves and tiny tracks. Use six frames of film to catch six woodland birds in action." },
      "ja": { title: "森のシャッター", description: "枝の揺れや足跡を頼りに、6枚のフィルムで森の小鳥6種のしぐさを撮ろう。" },
      "ko": { title: "숲속 셔터", description: "흔들리는 잎과 작은 발자국을 따라가며 필름 여섯 장에 숲새 여섯 종의 몸짓을 담아 보세요." },
      "fr": { title: "À l’affût", description: "Suivez les feuilles et les traces. Six vues pour saisir les gestes de six oiseaux des bois." },
      "de": { title: "Wald im Sucher", description: "Folge raschelnden Zweigen und kleinen Spuren. Halte mit sechs Aufnahmen sechs Waldvögel in Aktion fest." },
      "es": { title: "Aves en el visor", description: "Sigue las hojas y las huellas. Usa seis fotos para captar los gestos de seis aves del bosque." },
      "pt-BR": { title: "Aves em foco", description: "Siga as folhas e as pegadas. Use seis poses do filme para registrar os gestos de seis aves da mata." }
    }
  },
  {
    order: 82,
    title: "镜面灯塔",
    description: "转动海岛上的斜镜，绕过礁石，让一束光分头点亮两座灯塔。",
    path: "./games/mirror-lighthouse/index.html",
    category: "解谜",
    color: "#ceddd8",
    cover: "./games/mirror-lighthouse/cover.svg",
    locales: {
      "zh-CN": { title: "镜面灯塔", description: "转动海岛上的斜镜，绕过礁石，让一束光分头点亮两座灯塔。" },
      "en": { title: "Mirror Lighthouse", description: "Turn the island mirrors, steer past reefs and split a single beam to light two lighthouses." },
      "ja": { title: "鏡の灯台", description: "島の鏡を回して岩礁をかわし、一筋の光を二手に分けて二つの灯台をともそう。" },
      "ko": { title: "거울 등대", description: "섬의 거울을 돌려 암초를 피하고 한 줄기 빛을 둘로 나누어 두 등대를 밝혀 보세요." },
      "fr": { title: "Le phare aux miroirs", description: "Orientez les miroirs des îles, évitez les récifs et divisez un rayon pour allumer deux phares." },
      "de": { title: "Der Spiegelleuchtturm", description: "Drehe die Inselspiegel, lenke das Licht an Riffen vorbei und teile den Strahl, um zwei Leuchttürme zu entzünden." },
      "es": { title: "El faro de los espejos", description: "Gira los espejos de las islas, esquiva los arrecifes y divide un rayo para encender dos faros." },
      "pt-BR": { title: "O farol dos espelhos", description: "Gire os espelhos das ilhas, desvie dos recifes e divida um feixe para acender dois faróis." }
    }
  },
  {
    "order": 83,
    "title": "电梯值班员",
    "description": "在五层老楼里编排电梯停靠，用四个座位应对三班客流，赶在乘客失去耐心前把他们送到。",
    "category": "策略",
    "path": "./games/elevator-dispatch/index.html",
    "cover": "./games/elevator-dispatch/cover.svg",
    "color": "#d9decb",
    "locales": {
      "zh-CN": {
        "title": "电梯值班员",
        "description": "在五层老楼里编排电梯停靠，用四个座位应对三班客流，赶在乘客失去耐心前把他们送到。"
      },
      "en": {
        "title": "Elevator Operator",
        "description": "Run a four-seat lift in a five-floor building. Plan your stops through three shifts and deliver passengers before their patience runs out."
      },
      "ja": {
        "title": "エレベーター係",
        "description": "5階建ての古いビルで定員4人のエレベーターを運転。3回の勤務で停車順を決め、お客を待たせずに送り届けよう。"
      },
      "ko": {
        "title": "엘리베이터 안내원",
        "description": "5층짜리 오래된 건물에서 네 명 정원의 승강기를 맡으세요. 세 번의 근무 동안 정차 순서를 짜서 손님들을 늦지 않게 데려다주세요."
      },
      "fr": {
        "title": "Le liftier",
        "description": "Aux commandes d’un vieil ascenseur de quatre places, organisez vos arrêts sur cinq niveaux et gardez vos voyageurs de bonne humeur pendant trois services."
      },
      "de": {
        "title": "Der Aufzugwärter",
        "description": "Bediene den alten Vierpersonenaufzug über fünf Etagen. Plane in drei Schichten die Halte, bevor deine Fahrgäste die Geduld verlieren."
      },
      "es": {
        "title": "El ascensorista",
        "description": "Conduce un viejo ascensor de cuatro plazas entre cinco plantas. Organiza las paradas durante tres turnos antes de que se agote la paciencia de tus pasajeros."
      },
      "pt-BR": {
        "title": "O ascensorista",
        "description": "Opere um elevador antigo de quatro lugares em um prédio de cinco andares. Planeje as paradas por três turnos antes que os passageiros percam a paciência."
      }
    }
  },
  {
    "order": 84,
    "title": "最后一班渡船",
    "description": "暮色里还剩一条小船。安排谁掌舵、谁留岸，把六处渡口的旅客和行李送过河。",
    "category": "解谜",
    "path": "./games/last-ferry/index.html",
    "cover": "./games/last-ferry/cover.svg",
    "color": "#cbd8cd",
    "locales": {
      "zh-CN": {
        "title": "最后一班渡船",
        "description": "暮色里还剩一条小船。安排谁掌舵、谁留岸，把六处渡口的旅客和行李送过河。"
      },
      "en": {
        "title": "The Last Ferry",
        "description": "One boat is left at dusk. Choose who rows and who waits to ferry passengers and luggage across six crossings."
      },
      "ja": {
        "title": "最後の渡し舟",
        "description": "夕暮れの渡し場に舟が一艘。漕ぐ人と岸で待つ人を決め、六つの渡し場で旅人と荷物を対岸へ届けよう。"
      },
      "ko": {
        "title": "마지막 나룻배",
        "description": "해 질 무렵 남은 배는 한 척. 노를 저을 사람과 기다릴 사람을 정해 여섯 나루의 손님과 짐을 건네주세요."
      },
      "fr": {
        "title": "Le dernier bac",
        "description": "Au crépuscule, il reste une barque. À chacune des six escales, décidez qui rame et qui attend pour faire passer voyageurs et bagages."
      },
      "de": {
        "title": "Die letzte Fähre",
        "description": "In der Abenddämmerung bleibt ein Boot. Entscheide an sechs Fährstellen, wer rudert und wer wartet, und bring alle mit ihrem Gepäck ans andere Ufer."
      },
      "es": {
        "title": "La última barca",
        "description": "Al anochecer queda una barca. Decide quién rema y quién espera para llevar a viajeros y equipaje a la otra orilla en seis embarcaderos."
      },
      "pt-BR": {
        "title": "A última balsa",
        "description": "Ao anoitecer, resta um barco. Escolha quem rema e quem espera para levar viajantes e bagagens à outra margem em seis travessias."
      }
    }
  },
  {
    order: 85,
    title: "机械钟表铺",
    description: "挑选齿轮，接起指针，让六只老钟按顾客指定的方向和速度走动。",
    path: "./games/clockmakers-bench/index.html",
    category: "解谜",
    color: "#dce1d2",
    cover: "./games/clockmakers-bench/cover.svg",
    locales: {
      "zh-CN": { title: "机械钟表铺", description: "挑选齿轮，接起指针，让六只老钟按顾客指定的方向和速度走动。" },
      "en": { title: "Clockmaker’s Bench", description: "Fit gears to six old clocks and make each hand turn at the speed and in the direction its owner requests." },
      "ja": { title: "からくり時計店", description: "歯車を選んで六つの古時計を修理し、針を注文どおりの速さと向きで動かそう。" },
      "ko": { title: "태엽 시계 공방", description: "톱니바퀴를 골라 오래된 시계 여섯 개를 고치고, 주문한 방향과 속도에 시곗바늘을 맞춰 보세요." },
      "fr": { title: "L’atelier d’horlogerie", description: "Réparez six vieilles horloges en choisissant les roues qui donneront à chaque aiguille le sens et la vitesse demandés." },
      "de": { title: "Die Uhrmacherwerkstatt", description: "Setze Zahnräder in sechs alte Uhren ein, bis ihre Zeiger so schnell und in die Richtung laufen, wie es der Auftrag verlangt." },
      "es": { title: "El taller de relojería", description: "Repara seis relojes antiguos con engranajes que muevan las agujas en el sentido y a la velocidad del encargo." },
      "pt-BR": { title: "Oficina de relojoaria", description: "Conserte seis relógios antigos com engrenagens que façam os ponteiros girar no sentido e na velocidade de cada encomenda." }
    }
  },
  {
    order: 86,
    title: "回声迷宫",
    description: "带小蝙蝠穿过六座暗色纸迷宫。借三次回声照亮岩壁，循罗盘找到出口。",
    path: "./games/echo-maze/index.html",
    category: "解谜",
    color: "#d8c9a9",
    cover: "./games/echo-maze/cover.svg",
    locales: {
      "zh-CN": { title: "回声迷宫", description: "带小蝙蝠穿过六座暗色纸迷宫。借三次回声照亮岩壁，循罗盘找到出口。" },
      "en": { title: "Echo Maze", description: "Guide a little bat through six dark paper mazes. Sound three echoes in each cave to reveal its walls and find the way out." },
      "ja": { title: "こだまの迷路", description: "小さなコウモリと六つの暗い紙の迷路へ。各洞窟で3回使えるこだまで岩壁を照らし、出口を探そう。" },
      "ko": { title: "메아리 미로", description: "작은 박쥐와 함께 어두운 종이 미로 여섯 곳을 탐험하세요. 동굴마다 세 번의 메아리로 암벽을 밝히고 출구를 찾으세요." },
      "fr": { title: "Le labyrinthe des échos", description: "Guidez une chauve-souris à travers six labyrinthes de papier plongés dans le noir. Trois échos par grotte révèlent les parois." },
      "de": { title: "Echolabyrinth", description: "Hilf einer Fledermaus durch sechs dunkle Papierlabyrinthe. Drei Echos pro Höhle machen die Felswände sichtbar." },
      "es": { title: "El laberinto de los ecos", description: "Guía a un murciélago por seis laberintos de papel a oscuras. Usa tres ecos por cueva para ver las paredes y hallar la salida." },
      "pt-BR": { title: "Labirinto dos Ecos", description: "Guie um morcego por seis labirintos de papel no escuro. Use três ecos por caverna para iluminar as paredes e encontrar a saída." }
    }
  },
  {
    "order": 87,
    "title": "木版套色",
    "description": "选版、调墨，对准十字逐层落印，让荷花、飞鸟和江南窗景在纸上显现。",
    "category": "益智",
    "path": "./games/woodblock-print/index.html",
    "cover": "./games/woodblock-print/cover.svg",
    "color": "#d9e2d5",
    "locales": {
      "zh-CN": {
        "title": "木版套色",
        "description": "选版、调墨，对准十字逐层落印，让荷花、飞鸟和江南窗景在纸上显现。"
      },
      "en": {
        "title": "Woodblock Studio",
        "description": "Choose a block and ink, line up the crosses, and print lotus blossoms, birds and riverside windows one layer at a time."
      },
      "ja": {
        "title": "木版の重ね刷り",
        "description": "版木とインクを選び、十字の見当を合わせて、蓮や小鳥、江南の窓辺を一色ずつ刷り上げよう。"
      },
      "ko": {
        "title": "목판 색맞춤",
        "description": "목판과 먹빛을 고르고 십자 표식을 맞춰 연꽃과 새, 강남의 창가 풍경을 한 겹씩 찍어 보세요."
      },
      "fr": {
        "title": "L’atelier d’estampes",
        "description": "Choisissez vos bois et vos encres, alignez les repères et imprimez des lotus, des oiseaux et des fenêtres au bord de l’eau."
      },
      "de": {
        "title": "Die Holzschnittwerkstatt",
        "description": "Wähle Druckstöcke und Farben, richte die Passkreuze aus und drucke Lotusblüten, Vögel und Fenster am Fluss Schicht für Schicht."
      },
      "es": {
        "title": "Taller de xilografía",
        "description": "Elige un bloque y una tinta, alinea las cruces e imprime lotos, aves y ventanas junto al río, capa a capa."
      },
      "pt-BR": {
        "title": "Ateliê de xilogravura",
        "description": "Escolha matrizes e tintas, alinhe as cruzes e imprima flores de lótus, pássaros e janelas à beira do rio, camada por camada."
      }
    }
  },
  {
    order: 88,
    title: "方格舰队",
    description: "在方格海图上藏好三艘舰船，循着命中的坐标，抢先找出并击沉对方舰队。",
    path: "./games/grid-fleet/index.html",
    category: "策略",
    color: "#d6e4df",
    cover: "./games/grid-fleet/cover.svg",
    locales: {
      "zh-CN": { title: "方格舰队", description: "在方格海图上藏好三艘舰船，循着命中的坐标，抢先找出并击沉对方舰队。" },
      "en": { title: "Grid Fleet", description: "Hide three ships on your chart. Follow the trail of hits and sink the opposing fleet before it finds yours." },
      "ja": { title: "方眼艦隊", description: "海図に3隻の艦を隠そう。命中したマスを手がかりに、相手より先に敵艦隊を沈めよう。" },
      "ko": { title: "격자 함대", description: "해도에 함선 세 척을 숨기세요. 명중한 좌표를 단서로 상대 함대를 먼저 찾아 격침하세요." },
      "fr": { title: "Bataille sur quadrillage", description: "Cachez trois navires sur la carte. Suivez la piste de vos tirs au but et coulez la flotte adverse avant qu’elle ne trouve la vôtre." },
      "de": { title: "Flotte im Raster", description: "Verstecke drei Schiffe auf deiner Seekarte. Folge den Treffern und versenke die gegnerische Flotte, bevor sie deine findet." },
      "es": { title: "Flota en cuadrícula", description: "Esconde tres barcos en la carta náutica. Sigue el rastro de tus aciertos y hunde la flota rival antes de que encuentre la tuya." },
      "pt-BR": { title: "Frota na grade", description: "Esconda três navios na carta náutica. Siga as pistas de cada acerto e afunde a frota adversária antes que ela encontre a sua." }
    }
  },
  {
    "order": 89,
    "title": "纸间黑白棋",
    "description": "在铅笔点上落下黑子，翻转两枚黑子之间的白子。选好难度，和电脑争一争棋盘四角。",
    "category": "棋牌",
    "path": "./games/paper-reversi/index.html",
    "cover": "./games/paper-reversi/cover.svg",
    "color": "#ced8bd",
    "locales": {
      "zh-CN": { "title": "纸间黑白棋", "description": "在铅笔点上落下黑子，翻转两枚黑子之间的白子。选好难度，和电脑争一争棋盘四角。" },
      "en": { "title": "Paper Reversi", "description": "Play black on a pencilled grid. Outflank white discs and fight for the corners against two levels of computer play." },
      "ja": { "title": "紙のリバーシ", "description": "鉛筆の点に石を置き、白石をはさんで返そう。2段階の強さのコンピューターと四つの角を取り合うリバーシ。" },
      "ko": { "title": "종이 리버시", "description": "연필로 찍은 점에 흑돌을 놓아 백돌을 뒤집으세요. 두 단계의 컴퓨터 상대와 네 귀퉁이를 다퉈 보세요." },
      "fr": { "title": "Reversi sur papier", "description": "Posez un pion noir sur un point de crayon pour retourner les blancs. Disputez les coins à un adversaire de deux niveaux." },
      "de": { "title": "Reversi auf Papier", "description": "Setze Schwarz auf die Bleistiftpunkte und drehe weiße Steine um. Kämpfe in zwei Spielstärken gegen den Computer um die Ecken." },
      "es": { "title": "Reversi de papel", "description": "Coloca fichas negras en los puntos a lápiz y voltea las blancas. Disputa las esquinas al ordenador en dos niveles de dificultad." },
      "pt-BR": { "title": "Reversi de papel", "description": "Jogue com as pretas nos pontos a lápis e vire as peças brancas. Dispute os cantos com o computador em dois níveis de dificuldade." }
    }
  },
  {
    order: 90,
    title: "五骰记分簿",
    description: "摇动五枚骰子，留下喜欢的点数。八轮里，每个组合只有一次落笔的机会。",
    category: "棋牌",
    path: "./games/five-dice-scorebook/index.html",
    cover: "./games/five-dice-scorebook/cover.svg",
    color: "#c7d3c3",
    locales: {
      "zh-CN": { title: "五骰记分簿", description: "摇动五枚骰子，留下喜欢的点数。八轮里，每个组合只有一次落笔的机会。" },
      "en": { title: "Five Dice Scorebook", description: "Roll five dice and hold your favorites. Over eight rounds, each line in your scorebook can be filled just once." },
      "ja": { title: "五つのサイコロ手帳", description: "五つのサイコロを振り、好きな目を残そう。全8回、同じマスに得点を入れられるのは一度だけ。" },
      "ko": { title: "다섯 주사위 점수첩", description: "주사위 다섯 개를 굴리고 마음에 드는 눈을 남겨 보세요. 여덟 라운드 동안 각 칸에는 한 번만 점수를 쓸 수 있어요." },
      "fr": { title: "Le carnet des cinq dés", description: "Lancez cinq dés et gardez ceux qui vous plaisent. En huit manches, chaque ligne du carnet ne peut servir qu’une fois." },
      "de": { title: "Fünf Würfel im Heft", description: "Wirf fünf Würfel und behalte, was dir gefällt. In acht Runden darfst du jede Zeile deines Hefts nur einmal füllen." },
      "es": { title: "El cuaderno de cinco dados", description: "Lanza cinco dados y conserva los que quieras. A lo largo de ocho rondas, cada casilla del cuaderno se rellena una sola vez." },
      "pt-BR": { title: "Caderno dos cinco dados", description: "Role cinco dados e guarde os que quiser. Ao longo de oito rodadas, cada linha do caderno só pode ser preenchida uma vez." }
    }
  },
  {
    order: 91,
    title: "点格成方",
    description: "和电脑轮流在点间画线。封上最后一条边，收下一格，再走一笔。",
    category: "棋牌",
    path: "./games/dots-and-boxes/index.html",
    cover: "./games/dots-and-boxes/cover.svg",
    color: "#dce4d8",
    locales: {
      "zh-CN": { title: "点格成方", description: "和电脑轮流在点间画线。封上最后一条边，收下一格，再走一笔。" },
      en: { title: "Dots and Boxes", description: "Take turns drawing lines with the computer. Close the fourth side to claim a box and draw again." },
      ja: { title: "点と四角", description: "コンピューターと交互に点をつなごう。四本目の辺を引くと、そのマスをもらえてもう一手。" },
      ko: { title: "점과 상자", description: "컴퓨터와 번갈아 점을 이으세요. 네 번째 변을 그으면 한 칸을 차지하고 한 번 더 둘 수 있어요." },
      fr: { title: "La Pipopipette", description: "Reliez deux points à tour de rôle avec l’ordinateur. Tracez le quatrième côté pour gagner la case et rejouer." },
      de: { title: "Käsekästchen", description: "Verbinde abwechselnd mit dem Computer zwei Punkte. Wer die vierte Seite zeichnet, bekommt das Kästchen und ist noch einmal dran." },
      es: { title: "Timbiriche", description: "Tú y la computadora se turnan para unir puntos. Cierra el cuarto lado para ganar una casilla y volver a jugar." },
      "pt-BR": { title: "Pontos e quadrados", description: "Ligue os pontos em turnos com o computador. Feche o quarto lado para ganhar o quadrado e jogar de novo." }
    }
  },
  {
    "order": 92,
    "title": "孤子跳棋",
    "description": "在铅笔画的棋盘上，让青豆一颗跳过一颗。从四道小残局到经典十字盘，试着留下最后一颗。",
    "category": "益智",
    "path": "./games/peg-solitaire/index.html",
    "cover": "./games/peg-solitaire/cover.svg",
    "color": "#dce4d0",
    "locales": {
      "zh-CN": { "title": "孤子跳棋", "description": "在铅笔画的棋盘上，让青豆一颗跳过一颗。从四道小残局到经典十字盘，试着留下最后一颗。" },
      "en": { "title": "Peg Solitaire", "description": "Hop one garden pea over another on a pencil-drawn board. Leave a single pea in four little endgames and the classic cross." },
      "ja": { "title": "ペグ・ソリティア", "description": "鉛筆描きの盤で豆をひとつずつ飛び越えよう。四つの小さな詰め問題と定番の十字盤で、最後の一粒を残せるかな。" },
      "ko": { "title": "페그 솔리테어", "description": "연필로 그린 판 위에서 완두콩을 뛰어넘어 보세요. 짧은 끝내기 네 판과 고전 십자판에서 콩을 한 알만 남기면 성공이에요." },
      "fr": { "title": "Solitaire à billes", "description": "Sur un plateau dessiné au crayon, sautez un petit pois par-dessus un autre. N’en gardez qu’un dans quatre fins de partie et sur la croix classique." },
      "de": { "title": "Stecksolitär", "description": "Auf dem gezeichneten Brett springen Erbsen übereinander. Löse vier kurze Endspiele und das klassische Kreuz, bis nur noch eine Erbse übrig ist." },
      "es": { "title": "Solitario de clavijas", "description": "Salta un guisante sobre otro en un tablero dibujado a lápiz. Deja solo uno en cuatro finales breves y en la cruz clásica." },
      "pt-BR": { "title": "Resta Um", "description": "Salte uma ervilha sobre a outra num tabuleiro desenhado a lápis. Deixe apenas uma em quatro finais curtos e no clássico tabuleiro em cruz." }
    }
  },
  {
    order: 93,
    title: "荒岛七日",
    description: "每天三枚骰子，取水、觅食、拾木、修船。看准天气，在第七天日落前乘筏离岛。",
    category: "策略",
    path: "./games/seven-day-island/index.html",
    cover: "./games/seven-day-island/cover.svg",
    color: "#c9dcd5",
    locales: {
      "zh-CN": { title: "荒岛七日", description: "每天三枚骰子，取水、觅食、拾木、修船。看准天气，在第七天日落前乘筏离岛。" },
      "en": { title: "Seven Days Ashore", description: "Three dice a day to find water, gather food and timber, and build a raft. Catch the tide by the seventh sunset." },
      "ja": { title: "孤島の七日間", description: "一日三つのサイコロを水くみ、食料探し、木拾い、いかだ作りに振り分けよう。七日目の日暮れが脱出の期限。" },
      "ko": { title: "무인도에서의 7일", description: "매일 주사위 세 개로 물과 식량을 구하고 나무를 모아 뗏목을 만드세요. 일곱째 날 해 질 무렵이 마지막 기회예요." },
      "fr": { title: "Sept jours sur l’île", description: "Trois dés par jour pour trouver de l’eau, des vivres et du bois. Achevez votre radeau avant le septième coucher de soleil." },
      "de": { title: "Sieben Tage auf der Insel", description: "Drei Würfel pro Tag für Wasser, Proviant, Holz und Floßbau. Lege spätestens am siebten Abend ab." },
      "es": { title: "Siete días en la isla", description: "Reparte tres dados al día entre agua, comida, madera y construcción. Zarpa en tu balsa antes del séptimo anochecer." },
      "pt-BR": { title: "Sete dias na ilha", description: "Distribua três dados por dia entre água, comida, madeira e construção. Parta na jangada até o sétimo pôr do sol." }
    }
  },
  {
    order: 94,
    title: "晴雨花铺",
    description: "经营街角花铺的七天。看晴雨备花，按订单扎束，赶在花谢前把生意做好。",
    category: "策略",
    path: "./games/weather-florist/index.html",
    cover: "./games/weather-florist/cover.svg",
    color: "#eae2cf",
    locales: {
      "zh-CN": { title: "晴雨花铺", description: "经营街角花铺的七天。看晴雨备花，按订单扎束，赶在花谢前把生意做好。" },
      "en": { title: "Rain or Shine Florist", description: "Run a corner flower shop for seven days. Read the weather, stock fresh stems and fill orders before the flowers wilt." },
      "ja": { title: "晴雨の花屋", description: "街角の花屋を営む7日間。空模様を読み、花を仕入れ、しおれる前に注文の花束を届けよう。" },
      "ko": { title: "맑음비 꽃집", description: "일주일 동안 골목 꽃집을 운영하세요. 날씨에 맞춰 꽃을 들이고 시들기 전에 주문받은 꽃다발을 만드세요." },
      "fr": { title: "Fleurs de saison", description: "Tenez une boutique de fleurs pendant sept jours. Suivez la météo et composez vos bouquets avant que les fleurs ne fanent." },
      "de": { title: "Blumen bei jedem Wetter", description: "Führe sieben Tage lang einen Blumenladen. Plane deinen Einkauf nach dem Wetter und binde die Sträuße, bevor die Blumen verwelken." },
      "es": { title: "Flores entre sol y lluvia", description: "Lleva una floristería de barrio durante siete días. Compra según el tiempo y prepara los ramos antes de que se marchiten." },
      "pt-BR": { title: "Floricultura Sol e Chuva", description: "Cuide de uma floricultura de bairro por sete dias. Compre conforme o clima e monte os buquês antes que as flores murchem." }
    }
  },
  {
    order: 95,
    title: "赶海日记",
    description: "循着沙孔、气泡和水纹探访三片滩涂，赶在涨潮前把六种海边生物记进图鉴。",
    category: "休闲",
    path: "./games/tidepool-journal/index.html",
    cover: "./games/tidepool-journal/cover.svg",
    color: "#c6dcd6",
    locales: {
      "zh-CN": { title: "赶海日记", description: "循着沙孔、气泡和水纹探访三片滩涂，赶在涨潮前把六种海边生物记进图鉴。" },
      "en": { title: "Tidepool Journal", description: "Read the sand, bubbles and ripples across three tidal flats. Bring six shore creatures back to your journal before high tide." },
      "ja": { title: "潮干狩り日記", description: "砂穴や泡、水の波紋をたよりに三つの干潟を歩こう。満潮までに岸へ戻り、六種類の生き物を図鑑に記そう。" },
      "ko": { title: "갯벌 일기", description: "모래 구멍과 기포, 물결을 따라 세 갯벌을 탐사하세요. 밀물이 차기 전에 돌아와 여섯 생물을 도감에 기록하세요." },
      "fr": { title: "Carnet de l’estran", description: "Explorez trois estrans en suivant les trous, les bulles et les rides de l’eau. Rentrez avant la marée haute pour consigner six espèces." },
      "de": { title: "Watt-Tagebuch", description: "Folge Sandlöchern, Blasen und Wellen durch drei Wattgebiete. Bring deine Funde vor der Flut heim und halte sechs Arten im Tagebuch fest." },
      "es": { title: "Diario de la bajamar", description: "Sigue agujeros, burbujas y ondas por tres playas de marea. Vuelve antes de la pleamar para anotar seis especies en tu diario." },
      "pt-BR": { title: "Diário da maré", description: "Siga furos na areia, bolhas e ondulações por três praias de maré. Volte antes da maré alta para registrar seis espécies no diário." }
    }
  },
  {
    order: 96,
    title: "旧物拍卖会",
    description: "翻看旧相机的落款与补痕，查一查同款成交价。在六场竞拍中，决定何时举牌、何时收手。",
    category: "策略",
    path: "./games/attic-auction/index.html",
    cover: "./games/attic-auction/cover.svg",
    color: "#cdd6c1",
    locales: {
      "zh-CN": { title: "旧物拍卖会", description: "翻看旧相机的落款与补痕，查一查同款成交价。在六场竞拍中，决定何时举牌、何时收手。" },
      "en": { title: "Attic Auction", description: "Inspect maker’s marks and old repairs, then check past sales. Choose when to raise your paddle across six lots." },
      "ja": { title: "屋根裏の競売会", description: "古いカメラの銘や修理跡を確かめ、過去の落札例を手がかりに、六つの品に値を付けよう。" },
      "ko": { title: "다락방 경매", description: "오래된 카메라의 각인과 수리 흔적을 살피고 낙찰 기록을 비교하세요. 여섯 번의 경매에서 언제 팻말을 들지 정해 보세요." },
      "fr": { title: "Les enchères du grenier", description: "Examinez les signatures et les réparations, puis comparez les ventes passées. À vous de choisir quand enchérir sur les six lots." },
      "de": { title: "Die Dachbodenauktion", description: "Prüfe Signaturen und alte Reparaturen, vergleiche frühere Verkaufspreise und entscheide bei sechs Losen, wann du mitbietest." },
      "es": { title: "Subasta en el desván", description: "Examina las firmas y los arreglos, y compara ventas anteriores. Decide cuándo levantar la paleta en seis subastas." },
      "pt-BR": { title: "Leilão no sótão", description: "Examine marcas e reparos, compare vendas anteriores e decida quando levantar a placa ao longo de seis lotes." }
    }
  },
  {
    order: 97,
    title: "山间小旅馆",
    description: "翻开三天的预订，为六间山中客房安排日出、清静与结伴而来的旅人。",
    category: "策略",
    path: "./games/hillside-inn/index.html",
    cover: "./games/hillside-inn/cover.svg",
    color: "#c7d0ba",
    locales: {
      "zh-CN": { title: "山间小旅馆", description: "翻开三天的预订，为六间山中客房安排日出、清静与结伴而来的旅人。" },
      "en": { title: "Hillside Inn", description: "Run a six-room mountain inn for three nights. Find a sunrise view, a quiet corner or two rooms side by side." },
      "ja": { title: "山あいの小宿", description: "山あいの六室の宿を三日間切り盛り。朝日、静けさ、連れの隣室を望む旅人に部屋を割り当てよう。" },
      "ko": { title: "산속 작은 여관", description: "산속 여관의 여섯 객실을 사흘간 운영하세요. 일출과 고요함, 일행의 옆방을 바라는 손님을 맞이하세요." },
      "fr": { title: "L’Auberge des cimes", description: "Tenez une auberge de six chambres pendant trois nuits. Offrez le soleil levant, le calme ou deux chambres voisines aux voyageurs." },
      "de": { title: "Bergherberge", description: "Führe drei Nächte lang eine Bergherberge mit sechs Zimmern. Finde Morgensonne, Ruhe und Nachbarzimmer für deine Gäste." },
      "es": { title: "Posada de montaña", description: "Gestiona seis habitaciones de montaña durante tres noches. Busca amaneceres, silencio y cuartos contiguos para tus huéspedes." },
      "pt-BR": { title: "Pousada da Serra", description: "Cuide de seis quartos na serra por três noites. Encontre sol da manhã, silêncio e quartos vizinhos para seus hóspedes." }
    }
  },
  {
    order: 98,
    title: "手摇八音盒",
    description: "对照参考谱，在纸带上打孔，摇出四段小曲，也可以谱一首自己的旋律。",
    category: "益智",
    path: "./games/music-box-roll/index.html",
    cover: "./games/music-box-roll/cover.svg",
    color: "#e9e6d8",
    locales: {
      "zh-CN": { title: "手摇八音盒", description: "对照参考谱，在纸带上打孔，摇出四段小曲，也可以谱一首自己的旋律。" },
      "en": { title: "Hand-Crank Music Box", description: "Punch a paper roll to restore four little tunes, then turn the crank on a melody of your own." },
      "ja": { title: "手回しオルゴール", description: "見本を見ながら紙の帯に穴を開け、四つの小曲を仕上げよう。自由に作曲してハンドルを回すこともできます。" },
      "ko": { title: "손잡이 오르골", description: "견본 악보를 보고 종이 띠에 구멍을 뚫어 네 곡을 완성하세요. 나만의 곡을 쓰고 손잡이를 돌려 들어 보세요." },
      "fr": { title: "Boîte à musique à manivelle", description: "Perforez une bande de papier pour retrouver quatre airs, puis tournez la manivelle pour jouer votre propre mélodie." },
      "de": { title: "Die Kurbelspieluhr", description: "Stanze Löcher in einen Papierstreifen, ergänze vier kleine Melodien und spiele mit der Kurbel dein eigenes Lied." },
      "es": { title: "Caja de música de manivela", description: "Perfora una tira de papel para completar cuatro melodías y gira la manivela para escuchar tu propia composición." },
      "pt-BR": { title: "Caixinha de música de manivela", description: "Perfure uma tira de papel para completar quatro melodias e gire a manivela para tocar uma composição sua." }
    }
  },
  {
    order: 99,
    title: "九十九号邮局",
    description: "读六封来自小镇的信，用方向和地标邮戳排出邮路，集齐六枚纪念戳。",
    category: "解谜",
    path: "./games/post-office-99/index.html",
    cover: "./games/post-office-99/cover.svg",
    color: "#e3e6d6",
    locales: {
      "zh-CN": { title: "九十九号邮局", description: "读六封来自小镇的信，用方向和地标邮戳排出邮路，集齐六枚纪念戳。" },
      "en": { title: "Post Office No. 99", description: "Read six letters from town, chart each delivery with direction and landmark stamps, and fill your stamp album." },
      "ja": { title: "九十九番郵便局", description: "町から届いた六通の手紙を読み、方角と目印のはんこで配達ルートを組み、記念切手を集めよう。" },
      "ko": { title: "99번 우체국", description: "마을에서 온 편지 여섯 통을 읽고 방향과 명소 도장으로 배달길을 짜서 기념 우표를 모으세요." },
      "fr": { title: "Bureau de poste n° 99", description: "Lisez six lettres du village, tracez les tournées avec des tampons de direction et de lieu, puis complétez votre album." },
      "de": { title: "Postamt Nr. 99", description: "Lies sechs Briefe aus dem Städtchen, stemple mit Pfeilen und Ortsmotiven deine Postwege und fülle dein Markenalbum." },
      "es": { title: "Oficina de Correos n.º 99", description: "Lee seis cartas del pueblo, traza las rutas con sellos de dirección y de lugares, y completa tu álbum." },
      "pt-BR": { title: "Agência Postal Nº 99", description: "Leia seis cartas da vila, marque os caminhos com carimbos de direção e de lugares e complete seu álbum." }
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
