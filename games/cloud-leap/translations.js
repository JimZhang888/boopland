(() => {
  'use strict';
  const keys = 'pageTitle|name|settings|help|pause|restart|gameName|score|points|best|canvas|scene|firstHint|note|controls|inputHint|bonusHint|power|shortJump|longJump|ready|charging|soundOn|soundOff|chapter0|chapter1|chapter2|chapter3|perfect|combo|land0|land1|land2|land3|tryMore|helpEyebrow|helpTitle|help1Title|help1|help2Title|help2|help3Title|help3|helpAction|keys|pauseEyebrow|pauseTitle|pauseBody|resume|restEyebrow|recordEyebrow|overTitle|result|bestResult|overBody|again|overFoot'.split('|');
  const rows = {
    'zh-CN': [
      '云间来信 · 跳一跳 · Boopland','云间来信','游戏设置','玩法说明','暂停','重新开始','云间来信跳跃游戏','本次旅程','分','最远足迹',
      '跳一跳游戏区：按住空格或触摸蓄力，松开跳跃。','雾隐之森','第一步，从轻轻一跃开始','每一个小小的勇敢，都有风接住。','起跳操作','鼠标 / 触屏 / 空格','落在花心，收获额外分数','蓄力','轻轻一跳','用力一点',
      '按住蓄力 · 松开起跳','松开，乘风起跳','开启音效','关闭音效','第一章 · 风起的地方','第二章 · 路过一场花开','第三章 · 追着晚风走','第四章 · 云那边的家','正中花心 +{points}','花心连跳 ×{combo} +{points}',
      '轻轻落下，刚刚好','又靠近云一点','风记得你的脚步','下一座岛，见','再多蓄一点力，就能出发','写给第一次出发的你','跟着风，跳一跳','01 按住蓄力','按住画面、按钮或空格。时间越长，跳得越远。','02 松开起跳',
      '自动朝有光的小岛跳跃。蓄力条的浅绿区域是落点参考。','03 寻找花心','落岛 +1 分，花心 +2 分；连续命中花心，最多每跳 +5 分。','知道了，出发','R 重开 · P 暂停 · Esc 关闭或暂停','让风也歇一会儿','在云边，休息一下','旅途已暂停，回来时接着跳。','继续旅程','慢一点，也没关系',
      '新的足迹，已经被风收藏','风会带你再出发','旅程得分 · 跨过 {steps} 座小岛','最远足迹 {best} 分','休息一下，再去看看云那边吧。','再走一段','旅途的意义，藏在每一次出发里。'
    ],
    en: [
      'Cloud Letters · Jump · Boopland','Cloud Letters','Game settings','How to play','Pause','Restart','Cloud Letters jumping game','Journey','pts','Best',
      'Jumping game: hold Space or touch to charge, release to jump.','Misty woods','Every journey starts with a little leap','Let the breeze carry your little courage.','Jump controls','Mouse / touch / Space','Land on the flower for bonus points','Jump power','A little hop','A longer leap',
      'Hold to charge · release to jump','Release and catch the breeze','Enable sound','Mute sound','Chapter 1 · A gentle breeze','Chapter 2 · Flowers along the way','Chapter 3 · Chasing the sunset','Chapter 4 · A home in the clouds','Flower landing +{points}','Flower streak ×{combo} +{points}',
      'A lovely soft landing','A little closer to the clouds','The wind remembers your steps','See you on the next island','Hold a little longer to reach the next island','For your first little adventure','Follow the breeze','01 Hold to charge','Hold the scene, button, or Space. Hold longer to jump farther.','02 Release to jump',
      'You jump toward the glowing island. The pale green meter zone is your guide.','03 Aim for the flower','A landing earns 1 point, a flower 2. Consecutive flowers earn up to 5 per jump.','Let’s go','R restart · P pause · Esc close or pause','Let the breeze rest too','A moment in the clouds','Your journey is paused. Continue when you are ready.','Continue journey','Taking your time is fine',
      'The wind has kept your new record','The breeze will bring you back','Journey score · {steps} islands crossed','Best journey: {best} points','Take a breath, then explore beyond the clouds.','One more journey','Every new beginning is part of the adventure.'
    ],
    ja: [
      '雲からの手紙 · ジャンプ · Boopland','雲からの手紙','ゲーム設定','遊び方','一時停止','やり直す','雲からの手紙 ジャンプゲーム','今回の旅','点','最高記録',
      'スペースキーか画面を長押しして力をため、離してジャンプ。','霧の森','小さなジャンプから、旅が始まる','小さな勇気を、風が受け止める。','ジャンプ操作','マウス / タッチ / スペース','花の中心で追加得点','ジャンプの力','軽く跳ぶ','遠くへ跳ぶ',
      '長押しでためる · 離して跳ぶ','離して、風に乗ろう','音をオン','音をオフ','第1章 · 風の生まれる場所','第2章 · 花咲く道','第3章 · 夕風を追って','第4章 · 雲の向こうの家','花の中心 +{points}','花の連続着地 ×{combo} +{points}',
      'ふわり、ぴったり着地','雲へもう少し','風は足跡を覚えている','次の島で会おう','もう少し長く押してみよう','初めて旅立つあなたへ','風に乗って跳ぼう','01 長押しでためる','画面、ボタン、スペースキーを長押し。長いほど遠くへ跳べます。','02 離してジャンプ',
      '光る島へ自動で跳びます。ゲージの薄緑の部分を目安にしましょう。','03 花の中心を狙う','着地で1点、花の中心で2点。連続成功なら1回につき最大5点。','さあ、出発','R やり直し · P 停止 · Esc 閉じる/停止','風もちょっとひと休み','雲のそばで、ひと休み','旅を一時停止しました。準備ができたら続きを。','旅を続ける','ゆっくりでも大丈夫',
      '新しい記録を風が覚えてくれた','風はまた背中を押してくれる','旅の得点 · {steps}個の島を越えた','最高記録 {best}点','ひと息ついたら、雲の向こうを見に行こう。','もう一度、旅へ','旅は、何度始めてもいい。'
    ],
    ko: [
      '구름 편지 · 점프 · Boopland','구름 편지','게임 설정','게임 방법','일시 정지','다시 시작','구름 편지 점프 게임','이번 여정','점','최고 기록',
      '스페이스 키나 화면을 길게 눌러 힘을 모으고 놓아서 점프하세요.','안개 숲','작은 점프에서 시작하는 여행','작은 용기를 바람이 받아 줄 거예요.','점프 조작','마우스 / 터치 / 스페이스','꽃의 중심에 착지하면 보너스','점프 힘','가볍게 점프','더 멀리 점프',
      '눌러 힘 모으기 · 놓아 점프','놓아서 바람을 타요','소리 켜기','소리 끄기','1장 · 바람이 시작되는 곳','2장 · 꽃이 피는 길','3장 · 저녁 바람을 따라','4장 · 구름 너머의 집','꽃 중심 착지 +{points}','연속 꽃 착지 ×{combo} +{points}',
      '사뿐하게, 딱 맞게','구름에 한 걸음 더','바람이 발걸음을 기억해요','다음 섬에서 만나요','조금 더 길게 눌러 보세요','처음 떠나는 당신에게','바람을 따라 점프','01 길게 눌러 힘 모으기','화면, 버튼 또는 스페이스를 누르세요. 오래 누를수록 멀리 뛰어요.','02 놓아서 점프',
      '빛나는 섬을 향해 자동으로 뛰어요. 게이지의 연두색 구간을 참고하세요.','03 꽃 중심을 노리기','착지는 1점, 꽃 중심은 2점. 연속 성공하면 한 번에 최대 5점이에요.','이제 출발','R 다시 시작 · P 정지 · Esc 닫기/정지','바람도 쉬어 가요','구름 곁에서 잠깐 쉬어요','여행을 멈췄어요. 준비가 되면 계속하세요.','여행 계속하기','천천히 가도 괜찮아요',
      '바람이 새 기록을 간직했어요','바람이 다시 데려다줄 거예요','여정 점수 · 섬 {steps}개 통과','최고 기록 {best}점','숨을 고르고 구름 너머를 다시 둘러봐요.','한 번 더 여행','새로운 출발도 여행의 일부예요.'
    ],
    fr: [
      'Lettres des nuages · Sauts · Boopland','Lettres des nuages','Réglages','Comment jouer','Pause','Recommencer','Jeu de sauts dans les nuages','Voyage','pts','Record',
      'Maintenez Espace ou le doigt pour charger, puis relâchez pour sauter.','Bois brumeux','Chaque voyage commence par un petit saut','Laissez la brise porter votre courage.','Commandes de saut','Souris / tactile / Espace','Visez la fleur pour des points bonus','Puissance','Petit saut','Grand saut',
      'Maintenez · relâchez pour sauter','Relâchez et suivez la brise','Activer le son','Couper le son','Chapitre 1 · Une douce brise','Chapitre 2 · Le chemin fleuri','Chapitre 3 · Au vent du soir','Chapitre 4 · Un toit dans les nuages','Sur la fleur +{points}','Série de fleurs ×{combo} +{points}',
      'Tout en douceur','Plus près des nuages','Le vent se souvient de vos pas','À la prochaine île','Maintenez un peu plus longtemps','Pour votre premier voyage','Suivez la brise','01 Maintenez pour charger','Maintenez la scène, le bouton ou Espace. Plus longtemps, plus loin.','02 Relâchez pour sauter',
      'Le saut vise l’île lumineuse. La zone vert clair de la jauge vous guide.','03 Visez la fleur','Une île vaut 1 point, une fleur 2. Les fleurs consécutives rapportent jusqu’à 5 points.','C’est parti','R recommencer · P pause · Esc fermer/pause','La brise aussi se repose','Une pause dans les nuages','Le voyage est en pause. Reprenez quand vous voulez.','Reprendre le voyage','Prenez votre temps',
      'Le vent a gardé votre nouveau record','La brise vous ramènera','Score du voyage · {steps} îles franchies','Meilleur voyage : {best} points','Un peu de repos, puis repartez au-delà des nuages.','Encore un voyage','Chaque départ fait partie de l’aventure.'
    ],
    de: [
      'Wolkenpost · Hüpfspiel · Boopland','Wolkenpost','Einstellungen','Spielanleitung','Pause','Neustart','Wolkenpost Hüpfspiel','Reise','Pkt.','Rekord',
      'Leertaste oder Bildschirm gedrückt halten, zum Springen loslassen.','Nebelwald','Jede Reise beginnt mit einem kleinen Sprung','Lass die Brise deinen Mut tragen.','Sprungsteuerung','Maus / Touch / Leertaste','Blumenmitte treffen für Extrapunkte','Sprungkraft','Kleiner Hüpfer','Weiter Sprung',
      'Halten · zum Springen loslassen','Loslassen und dem Wind folgen','Ton einschalten','Ton ausschalten','Kapitel 1 · Eine sanfte Brise','Kapitel 2 · Der Blumenweg','Kapitel 3 · Mit dem Abendwind','Kapitel 4 · Zuhause in den Wolken','Blume getroffen +{points}','Blumenserie ×{combo} +{points}',
      'Ganz sanft gelandet','Den Wolken etwas näher','Der Wind kennt deine Schritte','Bis zur nächsten Insel','Halte etwas länger gedrückt','Für deine erste kleine Reise','Folge der Brise','01 Gedrückt halten','Halte die Szene, die Taste oder die Leertaste gedrückt. Länger heißt weiter.','02 Zum Springen loslassen',
      'Du springst zur leuchtenden Insel. Der hellgrüne Bereich der Leiste hilft beim Zielen.','03 Die Blume treffen','Eine Landung gibt 1 Punkt, eine Blume 2. Blumenserien geben bis zu 5 Punkte pro Sprung.','Los geht’s','R Neustart · P Pause · Esc schließen/Pause','Auch der Wind macht Pause','Eine Pause in den Wolken','Die Reise wartet auf dich. Spiele weiter, wenn du bereit bist.','Reise fortsetzen','Lass dir ruhig Zeit',
      'Der Wind bewahrt deinen neuen Rekord','Die Brise bringt dich zurück','Reisepunkte · {steps} Inseln geschafft','Beste Reise: {best} Punkte','Atme durch und erkunde dann die Welt hinter den Wolken.','Noch eine Reise','Jeder neue Anfang gehört zum Abenteuer.'
    ],
    es: [
      'Cartas de las nubes · Saltos · Boopland','Cartas de las nubes','Ajustes','Cómo jugar','Pausa','Reiniciar','Juego de saltos entre nubes','Viaje','pts','Récord',
      'Mantén Espacio o toca para cargar; suelta para saltar.','Bosque de niebla','Cada viaje empieza con un pequeño salto','Deja que la brisa lleve tu valor.','Controles de salto','Ratón / toque / Espacio','Cae en la flor para ganar más puntos','Potencia','Salto corto','Salto largo',
      'Mantén · suelta para saltar','Suelta y sigue la brisa','Activar sonido','Silenciar','Capítulo 1 · Una suave brisa','Capítulo 2 · Camino de flores','Capítulo 3 · Tras el viento','Capítulo 4 · Un hogar en las nubes','En la flor +{points}','Racha de flores ×{combo} +{points}',
      'Un aterrizaje suave','Un poco más cerca de las nubes','El viento recuerda tus pasos','Nos vemos en la próxima isla','Mantén un poco más para llegar','Para tu primera aventura','Sigue la brisa','01 Mantén para cargar','Mantén la escena, el botón o Espacio. Cuanto más tiempo, más lejos.','02 Suelta para saltar',
      'Saltarás hacia la isla iluminada. La zona verde clara de la barra sirve de guía.','03 Apunta a la flor','Aterrizar da 1 punto; la flor, 2. Las flores seguidas dan hasta 5 puntos por salto.','Vamos allá','R reiniciar · P pausa · Esc cerrar/pausa','La brisa también descansa','Una pausa entre nubes','El viaje está en pausa. Sigue cuando estés listo.','Continuar viaje','Puedes tomarte tu tiempo',
      'El viento guarda tu nuevo récord','La brisa te traerá de vuelta','Puntos del viaje · {steps} islas cruzadas','Mejor viaje: {best} puntos','Respira y vuelve a explorar más allá de las nubes.','Otro viaje','Cada nuevo comienzo forma parte de la aventura.'
    ],
    'pt-BR': [
      'Cartas das nuvens · Saltos · Boopland','Cartas das nuvens','Configurações','Como jogar','Pausar','Recomeçar','Jogo de saltos nas nuvens','Viagem','pts','Recorde',
      'Segure Espaço ou toque para carregar; solte para pular.','Bosque de névoa','Toda viagem começa com um pequeno salto','Deixe a brisa carregar sua coragem.','Controles de salto','Mouse / toque / Espaço','Pouse na flor para ganhar pontos extras','Força','Salto curto','Salto longo',
      'Segure · solte para pular','Solte e siga a brisa','Ativar som','Silenciar','Capítulo 1 · Uma brisa suave','Capítulo 2 · Caminho de flores','Capítulo 3 · Seguindo o vento','Capítulo 4 · Um lar nas nuvens','Na flor +{points}','Sequência de flores ×{combo} +{points}',
      'Um pouso bem suave','Um pouco mais perto das nuvens','O vento lembra seus passos','Até a próxima ilha','Segure um pouco mais para chegar','Para sua primeira aventura','Siga a brisa','01 Segure para carregar','Segure a cena, o botão ou Espaço. Quanto mais tempo, mais longe.','02 Solte para pular',
      'Você pula rumo à ilha iluminada. A faixa verde-clara da barra serve de guia.','03 Mire na flor','Pousar vale 1 ponto; a flor, 2. Flores seguidas rendem até 5 pontos por salto.','Vamos lá','R recomeçar · P pausar · Esc fechar/pausar','A brisa também descansa','Uma pausa nas nuvens','A viagem está pausada. Continue quando quiser.','Continuar viagem','Tudo bem ir devagar',
      'O vento guardou seu novo recorde','A brisa vai trazer você de volta','Pontos da viagem · {steps} ilhas cruzadas','Melhor viagem: {best} pontos','Respire e volte a explorar além das nuvens.','Mais uma viagem','Cada novo começo faz parte da aventura.'
    ]
  };
  const messages = {};
  for (const [language, values] of Object.entries(rows)) {
    if (values.length !== keys.length) throw new Error(`Cloud Leap translation mismatch: ${language}`);
    messages[language] = Object.fromEntries(keys.map((key, index) => [key, values[index]]));
  }
  window.BooplandI18n.register('cloudLeap', messages);
})();
