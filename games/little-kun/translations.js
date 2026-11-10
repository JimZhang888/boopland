(() => {
  'use strict';
  const keys = 'name|subtitle|tools|soundOn|soundOff|help|pause|resume|oceanLabel|canvasLabel|sea0|sea1|sea2|seaNote|kicker|readyTitle|intro|start|startHint|controls|touchControls|journal|current|growth|score|eaten|journey|food|danger|pearl|dash|dashHint|energy|best|footer|saved|memoryOnly|close|helpTitle|rule1|rule2|rule3|rule4|rule5|understood|stage0|stage1|stage2|stage3|stage4|stage5|complete|next|health|combo|here|legendary|evolved|hurt|healed|paused|pausedDesc|over|overDesc|again|won|wonDesc|continue|result|restart|surge|surgeHint'.split('|');
  const rows = {
    'zh-CN': [
      '小鱼化鲲','一场游向辽阔的旅行','游戏工具','开启音效','关闭音效','游玩指南','暂停','继续游动','手绘海洋','控制小鱼在海洋中成长，避开带叹号的大鱼。','浅湾 · 万物初生','远海 · 自在生长','北冥 · 鲲之所向','小小一尾，也能游成传说。','北冥手记 / 01',
      '从一尾小鱼，到北冥之鲲。','吃掉小鱼，绕开大鱼。慢慢长大，把整片海游成自己的天地。','游进大海','鼠标跟随 / WASD · 手机按住海面拖动','鼠标 / WASD 游动 · 空格冲刺','按住海面拖动 · 右下按钮冲刺','我的海洋手记','此刻的你','成长进度','本次得分','吃掉小鱼','长大，有迹可循','小鱼可吃','大鱼避让','珍珠回血','轻快冲刺','短暂无敌 · 空格','冲刺能量','海洋里的最好记录','不必生来庞大，尽管向远处游。','最佳记录自动保存','记录仅保留在本次访问','关闭','小鱼的远行指南',
      '移动鼠标，小鱼会柔顺地跟随；也可用 WASD / 方向键。手机在海面任意位置按住并拖动摇杆，松手停下。',
      '比你小的鱼可以吃，带「!」的大鱼要避开，体型相近的鱼互不伤害。连续 3.8 秒内进食可连吃，得分倍率最高 ×3。',
      '按空格或冲刺按钮，消耗 30 能量获得 0.3 秒加速与无敌；能量会自动恢复。四格生命，受伤后保护 2.4 秒，成长不会倒退。',
      '珍珠和每次进化都会恢复一格生命。六次形态从豆丁鱼一路成长为北冥鲲；没有倒计时，不用着急。',
      '化鲲后可以继续遨游，无惧大鱼。空格「吞潮」消耗 50 能量吸入附近鱼群。P / Esc 暂停，离开窗口自动暂停。这里只保存最佳分和最高形态，刷新会重新开始。',
      '知道啦','豆丁鱼','青鳞鱼','飞翅鱼','巨齿鲨','深海鲸','北冥鲲','北冥之大，自在遨游','下一站 · {name}','生命：{value} / 4','连吃 ×{count}','现在','传说','长大啦 · {name}','擦伤了，先游远一点。','珍珠补给 · 生命 +1','海水也歇一会儿','准备好了，就继续向远处游。','这次的远行，先到这里。','每一次长大都算数。下一次，试试用冲刺绕开大鱼。','再游一次','北冥有鱼，其名为鲲。','你从一尾小鱼，游成了海里的传说。现在可以吞潮引鱼，自由遨游。','化鲲遨游','{name} · {count} 条小鱼 · {score} 分','重新出发','北冥吞潮','吸入鱼群 · 空格'
    ],
    en: [
      'Little Fish, Great Kun','A journey into the open sea','Game controls','Turn sound on','Turn sound off','How to play','Pause','Keep swimming','Hand-drawn ocean','Guide a growing fish. Avoid larger fish marked with an exclamation point.','The shallows · Beginnings','Open waters · Growing free','Northern sea · Becoming Kun','Even a little fish can become a legend.','OCEAN JOURNAL / 01',
      'A little fish. A legendary journey.','Eat smaller fish, slip past bigger ones, and grow into Kun, a mythical giant of the sea.','Into the sea','Follow the mouse / WASD · Touch and drag on mobile','Mouse / WASD to swim · Space to dash','Drag on the sea to swim · Tap the dash button','My ocean journal','Your form','Growth','Score','Fish eaten','A little bigger, a little further','Small fish: food','Big fish: avoid','Pearls: heal','Quick dash','Brief shield · Space','Energy','Personal best','You needn’t start big. Just keep swimming.','Best record saved automatically','Records last for this visit only','Close','A little guide to the big sea',
      'Follow the mouse or use WASD / arrow keys. On a phone, touch anywhere on the sea and drag the joystick. Release to stop.',
      'Eat smaller fish. Avoid larger fish marked !; similar-sized fish are harmless. Eat again within 3.8 seconds to build a streak, up to ×3 points.',
      'Space or the dash button spends 30 energy for a 0.3-second burst and shield. Energy recovers automatically. You have four hearts and 2.4 seconds of protection after a hit. Growth never goes backwards.',
      'Pearls and each evolution restore one heart. Grow through six forms from a tiny fish to Kun. There is no time limit.',
      'As Kun, keep swimming without fear. Space spends 50 energy to draw in nearby fish. P / Esc pauses; leaving the window pauses automatically. Only your best score and highest form are saved; refreshing starts a new journey.',
      'Got it','Little minnow','Jade fish','Flying fish','Great shark','Deep-sea whale','Mythical Kun','The whole sea is yours','Next · {name}','Health: {value} / 4','Streak ×{count}','YOU','LEGEND','You evolved · {name}','A little scrape. Swim clear!','Pearl found · +1 heart','Even the sea takes a breath.','Whenever you’re ready, keep swimming.','A good place to rest.','Every journey helps you grow. Next time, dash past the bigger fish.','Swim again','In the northern sea lives Kun.','From a little fish to a legend. Draw in the shoals and roam the sea as Kun.','Roam as Kun','{name} · {count} fish · {score} points','Start fresh','Ocean breath','Draw in fish · Space'
    ],
    ja: [
      '小魚から鯤へ','広い海へ、小さな旅','ゲーム操作','音をオン','音をオフ','遊び方','一時停止','泳ぎを続ける','手描きの海','小魚を育てよう。感嘆符の付いた大きな魚を避けてください。','浅瀬 · はじまり','沖合 · のびのび育つ','北冥 · 鯤への道','小さな一尾も、いつか伝説に。','海の手帳 / 01',
      '小さな魚から、伝説の鯤へ。','小魚を食べ、大きな魚をかわそう。少しずつ育って、海の伝説になろう。','海へ出発','マウス / WASD · スマホは海を押してドラッグ','マウス / WASD で泳ぐ · 空白でダッシュ','海をドラッグして移動 · ボタンでダッシュ','わたしの海の手帳','今のすがた','成長','得点','食べた魚','少しずつ、大きく','小魚はごはん','大魚は避ける','真珠で回復','すいっとダッシュ','短い無敵 · 空白','エネルギー','最高記録','小さくても、遠くへ泳いでいこう。','最高記録を自動保存','記録は今回のアクセス中のみ','閉じる','小魚の旅のしおり',
      'マウスを追って泳ぎます。WASD / 矢印キーでも操作できます。スマホは海を押してドラッグ、離すと止まります。',
      '小さい魚を食べ、「!」の大きな魚を避けます。同じくらいの魚は無害。3.8秒以内に続けて食べると最大3倍の連続得点。',
      '空白キーかボタンでエネルギー30を使い、0.3秒加速・無敵。自動で充電します。体力は4、被弾後は2.4秒保護され、成長は失われません。',
      '真珠と進化で体力が1回復。小魚から鯤まで6つの姿に成長します。時間制限はありません。',
      '鯤になると無敵で自由に泳げます。空白キーで50エネルギーを使い魚を引き寄せます。P / Esc、または別の画面へ移ると一時停止。最高得点と到達した姿だけ保存し、再読み込みで最初からです。',
      'わかった','豆つぶ魚','青うろこ魚','トビウオ','大ザメ','深海クジラ','北冥の鯤','広い海を自由に','次は · {name}','体力：{value} / 4','連続 ×{count}','いま','伝説','成長したよ · {name}','かすり傷。少し離れよう。','真珠を発見 · 体力 +1','海もちょっとひと休み。','準備ができたら、また泳ごう。','今回の旅は、ここまで。','旅のたびに上手になれる。次はダッシュで大魚をかわそう。','もう一度','北冥に魚あり、その名を鯤という。','小さな魚が海の伝説になりました。魚群を引き寄せ、自由に泳ごう。','鯤で泳ぐ','{name} · {count} 匹 · {score} 点','最初から','北冥の息吹','魚群を引き寄せる · 空白'
    ],
    ko: [
      '작은 물고기, 전설의 곤','넓은 바다로 떠나는 여행','게임 도구','소리 켜기','소리 끄기','게임 방법','일시 정지','계속 헤엄치기','손으로 그린 바다','작은 물고기를 키우세요. 느낌표가 있는 큰 물고기는 피하세요.','얕은 바다 · 시작','먼바다 · 성장','북쪽 바다 · 곤의 꿈','작은 물고기도 전설이 될 수 있어요.','바다 일지 / 01',
      '작은 물고기에서 전설의 곤으로.','작은 물고기를 먹고 큰 물고기를 피해요. 조금씩 자라 바다의 전설이 되어 보세요.','바다로 출발','마우스 / WASD · 모바일은 바다를 누르고 드래그','마우스 / WASD 이동 · 스페이스 돌진','바다를 드래그해 이동 · 버튼으로 돌진','나의 바다 일지','현재 모습','성장','점수','먹은 물고기','조금씩 더 크게','작은 물고기 먹기','큰 물고기 피하기','진주로 회복','빠른 돌진','잠시 무적 · 스페이스','에너지','최고 기록','처음부터 클 필요 없어요. 계속 헤엄쳐요.','최고 기록 자동 저장','이번 방문 동안만 기록 유지','닫기','작은 물고기의 여행 안내',
      '마우스를 따라 헤엄치거나 WASD / 방향키를 사용하세요. 휴대폰에서는 바다를 누르고 조이스틱을 드래그하세요. 놓으면 멈춰요.',
      '작은 물고기는 먹고 ! 표시가 있는 큰 물고기는 피하세요. 비슷한 크기는 안전해요. 3.8초 안에 연속으로 먹으면 최대 3배 점수예요.',
      '스페이스나 돌진 버튼으로 에너지 30을 사용해 0.3초간 가속하고 무적이 돼요. 에너지는 자동 회복돼요. 생명은 4개이며 피격 후 2.4초 보호돼요. 성장은 줄지 않아요.',
      '진주와 진화는 생명 하나를 회복해요. 여섯 모습을 거쳐 전설의 곤이 되세요. 시간제한은 없어요.',
      '곤이 되면 무적 상태로 헤엄쳐요. 스페이스는 에너지 50을 사용해 주변 물고기를 끌어당겨요. P / Esc 또는 다른 창으로 이동하면 정지해요. 최고 점수와 모습만 저장되며 새로고침하면 다시 시작해요.',
      '알겠어요','꼬마 물고기','비취 물고기','날치','거대 상어','심해 고래','북명곤','온 바다가 당신의 것','다음 · {name}','생명: {value} / 4','연속 ×{count}','현재','전설','진화했어요 · {name}','살짝 다쳤어요. 멀리 헤엄쳐요.','진주 발견 · 생명 +1','바다도 잠시 쉬어요.','준비되면 다시 헤엄쳐요.','이번 여행은 여기까지.','여행할 때마다 성장해요. 다음에는 돌진으로 큰 물고기를 피해 보세요.','다시 헤엄치기','북쪽 바다의 전설, 곤.','작은 물고기가 전설이 되었어요. 물고기 떼를 끌어당기고 바다를 누비세요.','곤으로 헤엄치기','{name} · {count}마리 · {score}점','새로 시작','바다의 숨결','물고기 끌어당기기 · 스페이스'
    ],
    fr: [
      'Petit poisson, grand Kun','Un voyage vers le large','Commandes','Activer le son','Couper le son','Comment jouer','Pause','Continuer','Océan dessiné à la main','Faites grandir le poisson. Évitez les grands poissons marqués !.','La baie · Les débuts','Le large · Grandir','Mer du Nord · Devenir Kun','Même un petit poisson peut devenir une légende.','CARNET MARIN / 01',
      'Un petit poisson. Une grande légende.','Mangez les petits poissons, évitez les grands et devenez Kun, le géant mythique des mers.','Prendre le large','Souris / WASD · Sur mobile, touchez et glissez','Souris / WASD : nager · Espace : accélérer','Glissez sur la mer · Bouton pour accélérer','Mon carnet marin','Votre forme','Croissance','Score','Poissons mangés','Grandir, petit à petit','Petits : à manger','Grands : à éviter','Perles : soin','Accélération','Protection brève · Espace','Énergie','Meilleur score','Pas besoin de naître grand. Continuez à nager.','Record enregistré automatiquement','Records limités à cette visite','Fermer','Le petit guide du grand océan',
      'Suivez la souris ou utilisez WASD / les flèches. Sur téléphone, touchez la mer et glissez le joystick. Relâchez pour vous arrêter.',
      'Mangez les petits poissons. Évitez les grands marqués ! ; ceux de même taille sont inoffensifs. Mangez à nouveau dans les 3,8 secondes pour une série, jusqu’à ×3 points.',
      'Espace ou le bouton dépense 30 points d’énergie pour 0,3 seconde de vitesse et de protection. L’énergie se recharge. Vous avez quatre cœurs et 2,4 secondes de protection après un choc. La croissance est conservée.',
      'Les perles et chaque évolution rendent un cœur. Passez par six formes jusqu’à Kun. Aucun chronomètre.',
      'En Kun, nagez sans danger. Espace dépense 50 points d’énergie pour attirer les poissons. P / Échap met en pause, comme quitter la fenêtre. Seuls le record et la meilleure forme sont sauvegardés ; actualiser recommence la partie.',
      'Compris','Petit vairon','Poisson de jade','Poisson volant','Grand requin','Baleine des abysses','Kun mythique','La mer vous appartient','Ensuite · {name}','Vie : {value} / 4','Série ×{count}','VOUS','LÉGENDE','Évolution · {name}','Une égratignure. Éloignez-vous !','Perle trouvée · +1 cœur','La mer reprend son souffle.','Repartez quand vous serez prêt.','Le voyage s’arrête ici.','Chaque voyage vous fait progresser. La prochaine fois, accélérez pour éviter les grands poissons.','Rejouer','Dans la mer du Nord vit Kun.','De petit poisson à légende. Attirez les bancs de poissons et explorez la mer.','Nager en Kun','{name} · {count} poissons · {score} points','Recommencer','Souffle marin','Attirer les poissons · Espace'
    ],
    de: [
      'Kleiner Fisch, großer Kun','Eine Reise ins weite Meer','Spielsteuerung','Ton einschalten','Ton ausschalten','Spielanleitung','Pause','Weiterschwimmen','Handgezeichnetes Meer','Lass den Fisch wachsen. Meide größere Fische mit Ausrufezeichen.','Die Bucht · Der Anfang','Offenes Meer · Wachsen','Nordmeer · Zum Kun werden','Auch ein kleiner Fisch kann zur Legende werden.','MEERESTAGEBUCH / 01',
      'Ein kleiner Fisch. Eine große Reise.','Friss kleine Fische, weiche großen aus und werde zum sagenhaften Meeresriesen Kun.','Ab ins Meer','Maus / WASD · Mobil: berühren und ziehen','Maus / WASD: schwimmen · Leertaste: Sprint','Im Meer ziehen · Taste zum Sprinten','Mein Meerestagebuch','Deine Gestalt','Wachstum','Punkte','Gefressene Fische','Stück für Stück wachsen','Kleine fressen','Großen ausweichen','Perlen heilen','Kurzer Sprint','Kurz geschützt · Leertaste','Energie','Bester Punktestand','Du musst nicht groß anfangen. Schwimm einfach weiter.','Bestleistung wird gespeichert','Rekorde gelten nur für diesen Besuch','Schließen','Ein kleiner Ratgeber fürs Meer',
      'Folge der Maus oder nutze WASD / Pfeiltasten. Auf dem Handy berührst du das Meer und ziehst den Joystick. Loslassen hält dich an.',
      'Friss kleinere Fische. Meide große mit !; ähnlich große sind harmlos. Friss innerhalb von 3,8 Sekunden erneut für eine Serie mit bis zu dreifachen Punkten.',
      'Leertaste oder Sprint verbraucht 30 Energie für 0,3 Sekunden Tempo und Schutz. Energie lädt sich auf. Du hast vier Herzen und nach einem Treffer 2,4 Sekunden Schutz. Dein Wachstum bleibt erhalten.',
      'Perlen und jede Entwicklung heilen ein Herz. Wachse durch sechs Gestalten bis zum Kun. Es gibt kein Zeitlimit.',
      'Als Kun bist du unverwundbar. Leertaste verbraucht 50 Energie und zieht Fische an. P / Esc oder ein Fensterwechsel pausiert. Nur Bestpunkte und höchste Gestalt werden gespeichert; Neuladen startet neu.',
      'Verstanden','Winziger Fisch','Jadefisch','Fliegender Fisch','Riesenhai','Tiefseewal','Sagenhafter Kun','Das Meer gehört dir','Als Nächstes · {name}','Leben: {value} / 4','Serie ×{count}','DU','LEGENDE','Gewachsen · {name}','Ein Kratzer. Schwimm weg!','Perle gefunden · +1 Herz','Auch das Meer macht Pause.','Schwimm weiter, wenn du bereit bist.','Hier endet diese Reise.','Mit jeder Reise wirst du besser. Sprinte nächstes Mal an den großen Fischen vorbei.','Noch einmal','Im Nordmeer lebt der Kun.','Vom kleinen Fisch zur Legende. Ziehe Fischschwärme an und erkunde das Meer.','Als Kun schwimmen','{name} · {count} Fische · {score} Punkte','Neu beginnen','Meeresatem','Fische anziehen · Leertaste'
    ],
    es: [
      'Pequeño pez, gran Kun','Un viaje hacia el mar abierto','Controles','Activar sonido','Silenciar','Cómo jugar','Pausa','Seguir nadando','Océano dibujado a mano','Haz crecer al pez. Evita los peces grandes marcados con !.','La bahía · Comienzos','Alta mar · Crecer','Mar del Norte · Ser Kun','Hasta un pececito puede ser una leyenda.','DIARIO MARINO / 01',
      'Un pececito. Una gran leyenda.','Come peces pequeños, esquiva los grandes y conviértete en Kun, el gigante mítico del mar.','Al mar','Ratón / WASD · En móvil, toca y arrastra','Ratón / WASD: nadar · Espacio: impulso','Arrastra en el mar · Botón de impulso','Mi diario marino','Tu forma','Crecimiento','Puntos','Peces comidos','Crecer poco a poco','Pequeños: comida','Grandes: evitar','Perlas: curación','Impulso rápido','Escudo breve · Espacio','Energía','Mejor puntuación','No hace falta nacer grande. Sigue nadando.','Récord guardado automáticamente','Récords solo durante esta visita','Cerrar','Una pequeña guía del gran mar',
      'Sigue el ratón o usa WASD / las flechas. En móvil, toca el mar y arrastra el joystick. Suelta para parar.',
      'Come peces pequeños y evita los grandes con !. Los de tamaño parecido son inofensivos. Come de nuevo en 3,8 segundos para encadenar puntos, hasta ×3.',
      'Espacio o el botón gasta 30 de energía para acelerar y protegerte durante 0,3 segundos. La energía se recarga. Tienes cuatro corazones y 2,4 segundos de protección tras un golpe. No pierdes crecimiento.',
      'Las perlas y cada evolución curan un corazón. Pasa por seis formas hasta ser Kun. No hay límite de tiempo.',
      'Como Kun eres invulnerable. Espacio gasta 50 de energía para atraer peces. P / Esc o salir de la ventana pausa el juego. Solo se guardan el récord y la mayor forma; recargar empieza otra partida.',
      'Entendido','Pececito','Pez de jade','Pez volador','Gran tiburón','Ballena abisal','Kun legendario','Todo el mar es tuyo','Siguiente · {name}','Vida: {value} / 4','Racha ×{count}','TÚ','LEYENDA','Has evolucionado · {name}','Un rasguño. ¡Aléjate!','Perla encontrada · +1 corazón','El mar también descansa.','Sigue nadando cuando quieras.','Este viaje termina aquí.','Cada viaje te ayuda a crecer. La próxima vez, usa el impulso para esquivar a los grandes.','Otra vez','En el mar del Norte vive Kun.','De pececito a leyenda. Atrae bancos de peces y recorre el mar como Kun.','Nadar como Kun','{name} · {count} peces · {score} puntos','Empezar de nuevo','Aliento marino','Atraer peces · Espacio'
    ],
    'pt-BR': [
      'Pequeno peixe, grande Kun','Uma viagem rumo ao mar aberto','Controles','Ligar som','Desligar som','Como jogar','Pausar','Continuar nadando','Oceano desenhado à mão','Faça o peixe crescer. Evite peixes grandes marcados com !.','A baía · Começos','Mar aberto · Crescer','Mar do Norte · Virar Kun','Até um peixinho pode virar lenda.','DIÁRIO DO MAR / 01',
      'Um peixinho. Uma grande lenda.','Coma peixes menores, desvie dos maiores e vire Kun, o gigante mítico do mar.','Entrar no mar','Mouse / WASD · No celular, toque e arraste','Mouse / WASD: nadar · Espaço: impulso','Arraste no mar · Botão para impulso','Meu diário do mar','Sua forma','Crescimento','Pontos','Peixes comidos','Crescer aos pouquinhos','Pequenos: comida','Grandes: desvie','Pérolas: cura','Impulso rápido','Escudo breve · Espaço','Energia','Melhor pontuação','Não precisa nascer grande. Continue nadando.','Recorde salvo automaticamente','Recordes apenas nesta visita','Fechar','Um pequeno guia do grande mar',
      'Siga o mouse ou use WASD / as setas. No celular, toque no mar e arraste o joystick. Solte para parar.',
      'Coma peixes menores e desvie dos grandes com !. Os de tamanho parecido são inofensivos. Coma novamente em 3,8 segundos para uma sequência de até ×3 pontos.',
      'Espaço ou o botão gasta 30 de energia para acelerar e ficar protegido por 0,3 segundo. A energia recarrega. São quatro corações e 2,4 segundos de proteção após um golpe. O crescimento não diminui.',
      'Pérolas e cada evolução recuperam um coração. Passe por seis formas até virar Kun. Não há limite de tempo.',
      'Como Kun, você é invulnerável. Espaço gasta 50 de energia para atrair peixes. P / Esc ou sair da janela pausa o jogo. Só o recorde e a maior forma ficam salvos; atualizar começa outra partida.',
      'Entendi','Peixinho','Peixe de jade','Peixe voador','Grande tubarão','Baleia abissal','Kun lendário','O mar inteiro é seu','Próximo · {name}','Vida: {value} / 4','Sequência ×{count}','VOCÊ','LENDA','Você evoluiu · {name}','Um arranhão. Nade para longe!','Pérola encontrada · +1 coração','O mar também descansa.','Quando quiser, continue nadando.','Esta viagem termina aqui.','Cada viagem ajuda a crescer. Na próxima, use o impulso para desviar dos peixes grandes.','Jogar de novo','No mar do Norte vive Kun.','De peixinho a lenda. Atraia cardumes e explore o mar como Kun.','Nadar como Kun','{name} · {count} peixes · {score} pontos','Recomeçar','Sopro do mar','Atrair peixes · Espaço'
    ]
  };
  const messages = {};
  for (const [locale, values] of Object.entries(rows)) {
    if (values.length !== keys.length) throw new Error('Incomplete Little Kun translation: ' + locale);
    messages[locale] = Object.fromEntries(keys.map((key, i) => [key, values[i]]));
    messages[locale].pageTitle = values[0] + ' · Boopland';
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = messages;
  else window.BooplandI18n.register('littleKun', messages);
})();
