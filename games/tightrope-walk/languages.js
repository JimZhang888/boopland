(() => {
  'use strict';
  const messages = {
    'zh-CN': {
      title:'一根钢丝', help:'玩法', pause:'暂停', resume:'继续行走', route:'三段钢丝', scene:'纸伞行者、楼间钢丝与预报阵风的屋顶旗', 
      stage0:'钟楼巷', stage1:'河湾屋脊', stage2:'双塔之间', left:'向左调重心', right:'向右调重心', start:'踏上钢丝', balance:'倾角',
      ready:'看旗辨风，轻点反向扶正纸伞。', safe:'起步区有遮风墙，试着左右调重心。', steady:'伞面平稳，继续向前。', leaning:'身体倾斜，向反方向轻点。', danger:'临界倾角！向{dir}扶正。', 
      sheltered:'背风处', calm:'风平', forecast:'阵风将至 {arrow}', gust:'阵风 {arrow}', dirLeft:'左', dirRight:'右',
      rules:'行者会自动前进。点按或按住两侧按钮，也可用 ← → 或 A / D 调整重心。松手后仍有惯性，伞将回正时就要收力。\n屋顶旗会提前两秒指向风吹去的方向。倾角越大，步子越慢；达到 46° 就会跌落。每段最高 1,000 分，稳定度占七成，用时占三成。',
      close:'知道了', paused:'歇一会儿', pauseCopy:'行者停在原处，风与计时都已暂停。', fell:'脚下踏空了', fallCopy:'走了 {distance}。再试一次，纸伞回正前就松手。', retry:'重走本段',
      crossed:'抵达对面屋顶', crossedCopy:'已走过{place}，下一段长 {length}。', next:'走下一段', finish:'三段钢丝，全部走完', total:'三段合计 {score} 分', replay:'从头再走', stability:'稳定度', time:'用时', score:'本段得分', distance:'已走距离', stopped:'已暂停', lost:'本段失足', arrived:'已抵达'
    },
    en: {
      title:'A Single Wire', help:'How to play', pause:'Pause', resume:'Keep walking', route:'Three crossings', scene:'A walker with a paper parasol on a rooftop wire, with a flag forecasting gusts',
      stage0:'Clocktower Lane', stage1:'Riverbend Roofs', stage2:'The Twin Towers', left:'Lean left', right:'Lean right', start:'Step onto the wire', balance:'Tilt',
      ready:'Read the flag. Tap against the lean to steady the parasol.', safe:'Sheltered steps. Try shifting your weight.', steady:'Parasol steady. Keep your footing.', leaning:'Leaning. Tap the opposite side.', danger:'Near the limit! Lean {dir}.',
      sheltered:'In shelter', calm:'Still air', forecast:'Gust ahead {arrow}', gust:'Gust {arrow}', dirLeft:'left', dirRight:'right',
      rules:'The walker moves forward on their own. Tap or hold either side, or use ← → or A / D to shift your weight. Release just before you reach the centre. Momentum carries you through.\nThe rooftop flag points downwind two seconds before a gust. Tilting slows your steps. At 46° you fall. Each crossing earns up to 1,000 points, 70% for stability and 30% for time.',
      close:'Got it', paused:'Taking a breather', pauseCopy:'The walker, wind and timer are paused.', fell:'A missed step', fallCopy:'You walked {distance}. Try releasing a little before the parasol levels out.', retry:'Retry this wire',
      crossed:'Across the wire', crossedCopy:'You crossed {place}. The next wire is {length} long.', next:'Next crossing', finish:'All three wires crossed', total:'Total across three wires · {score} points', replay:'Walk again', stability:'Stability', time:'Time', score:'Wire score', distance:'Distance walked', stopped:'Paused', lost:'Lost footing', arrived:'Crossing complete'
    },
    ja: {
      title:'一本の綱', help:'遊び方', pause:'一時停止', resume:'歩き続ける', route:'三つの綱', scene:'ビルの間の綱を番傘で渡る人と、突風を知らせる屋上の旗',
      stage0:'時計塔の小路', stage1:'川沿いの屋根', stage2:'双塔の間', left:'左に傾ける', right:'右に傾ける', start:'綱に乗る', balance:'傾き',
      ready:'旗で風を読み、傾きと逆側を軽く押そう。', safe:'風のない区間で重心を動かしてみよう。', steady:'傘は安定。その調子で進もう。', leaning:'傾いてきた。反対側を軽く押そう。', danger:'落下寸前！ {dir}へ重心を。', 
      sheltered:'風よけ', calm:'凪', forecast:'突風の予兆 {arrow}', gust:'突風 {arrow}', dirLeft:'左', dirRight:'右',
      rules:'歩みは自動です。左右のボタンをタップまたは長押しするか、← → または A / D で重心を調整します。慣性があるので、傘が水平に戻る少し前に指を離しましょう。\n屋上の旗は突風の2秒前に風下を向きます。傾くほど足が遅くなり、46°で落下します。各区間は最高1,000点。安定度が7割、タイムが3割です。',
      close:'わかった', paused:'ひと休み', pauseCopy:'歩行、風、時計を止めています。', fell:'足を踏み外した', fallCopy:'{distance} 歩きました。次は傘が戻る少し前に指を離しましょう。', retry:'この綱をやり直す',
      crossed:'向こうの屋根に到着', crossedCopy:'{place}を渡りました。次の綱は {length} です。', next:'次の綱へ', finish:'三つの綱を踏破', total:'三区間の合計 {score} 点', replay:'最初から歩く', stability:'安定度', time:'タイム', score:'区間得点', distance:'歩いた距離', stopped:'一時停止中', lost:'落下', arrived:'到着'
    },
    ko: {
      title:'한 가닥 줄 위에서', help:'게임 방법', pause:'일시 정지', resume:'계속 걷기', route:'세 구간', scene:'종이 양산을 들고 지붕 사이 줄을 걷는 사람과 돌풍을 알리는 깃발',
      stage0:'시계탑 골목', stage1:'강굽이 지붕', stage2:'쌍둥이 탑 사이', left:'왼쪽으로', right:'오른쪽으로', start:'줄에 오르기', balance:'기울기',
      ready:'깃발을 보고 기울어진 쪽의 반대편을 살짝 누르세요.', safe:'바람을 막아 주는 구간에서 중심을 옮겨 보세요.', steady:'양산이 안정됐어요. 계속 걸어가세요.', leaning:'몸이 기울어요. 반대편을 살짝 누르세요.', danger:'위험! {dir}으로 중심을 옮기세요.',
      sheltered:'바람막이', calm:'고요함', forecast:'돌풍 예고 {arrow}', gust:'돌풍 {arrow}', dirLeft:'왼쪽', dirRight:'오른쪽',
      rules:'걷기는 자동입니다. 양쪽 버튼을 짧게 또는 길게 누르거나 ← → 또는 A / D 키로 중심을 옮기세요. 손을 떼도 관성으로 움직이니 양산이 바로 서기 조금 전에 놓으세요.\n지붕의 깃발이 돌풍이 불기 2초 전에 바람이 향하는 쪽을 가리킵니다. 기울수록 느려지고 46°에서 떨어집니다. 구간마다 최고 1,000점이며 안정도가 70%, 시간이 30%입니다.',
      close:'확인', paused:'잠시 쉬어 가기', pauseCopy:'걸음과 바람, 시간이 멈췄습니다.', fell:'발을 헛디뎠어요', fallCopy:'{distance} 걸었습니다. 이번에는 양산이 수평이 되기 조금 전에 손을 떼 보세요.', retry:'이 구간 다시 걷기',
      crossed:'건너편 지붕에 도착', crossedCopy:'{place} 구간을 건넜습니다. 다음 줄은 {length}입니다.', next:'다음 구간', finish:'세 구간 모두 완주', total:'세 구간 합계 {score}점', replay:'처음부터 걷기', stability:'안정도', time:'소요 시간', score:'구간 점수', distance:'걸은 거리', stopped:'일시 정지', lost:'추락', arrived:'도착'
    },
    fr: {
      title:'Sur un fil', help:'Règles', pause:'Pause', resume:'Reprendre', route:'Trois traversées', scene:'Un funambule à ombrelle entre les toits et un fanion qui annonce les rafales',
      stage0:'La ruelle du beffroi', stage1:'Les toits du méandre', stage2:'Les tours jumelles', left:'Pencher à gauche', right:'Pencher à droite', start:'Monter sur le fil', balance:'Inclinaison',
      ready:'Observez le fanion. Appuyez du côté opposé à la chute.', safe:'À l’abri du vent, essayez de déplacer votre poids.', steady:'Ombrelle stable. Gardez le cap.', leaning:'Vous penchez. Appuyez du côté opposé.', danger:'À la limite ! Penchez à {dir}.',
      sheltered:'À l’abri', calm:'Vent calme', forecast:'Rafale en vue {arrow}', gust:'Rafale {arrow}', dirLeft:'gauche', dirRight:'droite',
      rules:'La marche est automatique. Touchez ou maintenez un bouton, ou utilisez ← → ou A / D pour déplacer votre poids. L’inertie vous entraîne encore après le relâchement. Relâchez juste avant de retrouver la verticale.\nLe fanion indique où souffle le vent deux secondes avant la rafale. Pencher ralentit la marche. À 46°, vous tombez. Chaque traversée rapporte jusqu’à 1 000 points, dont 70 % pour la stabilité et 30 % pour le temps.',
      close:'Compris', paused:'Une petite pause', pauseCopy:'La marche, le vent et le chrono sont en pause.', fell:'Un faux pas', fallCopy:'Vous avez parcouru {distance}. Relâchez un peu avant que l’ombrelle se redresse.', retry:'Reprendre ce fil',
      crossed:'Sur l’autre toit', crossedCopy:'Vous avez franchi le fil « {place} ». Le suivant mesure {length}.', next:'Traversée suivante', finish:'Les trois fils sont franchis', total:'Total des trois traversées · {score} points', replay:'Repartir du début', stability:'Stabilité', time:'Temps', score:'Points du fil', distance:'Distance parcourue', stopped:'En pause', lost:'Chute', arrived:'Traversée réussie'
    },
    de: {
      title:'Auf einem Seil', help:'Spielhilfe', pause:'Pause', resume:'Weitergehen', route:'Drei Seilstrecken', scene:'Seiltanz mit Papierschirm zwischen den Dächern und eine Fahne, die Böen ankündigt',
      stage0:'Am Uhrturm', stage1:'Am Flussbogen', stage2:'Die Zwillingstürme', left:'Nach links', right:'Nach rechts', start:'Seil betreten', balance:'Neigung',
      ready:'Beobachte die Fahne. Tippe gegen die Neigung.', safe:'Hier ist es windstill. Verlagere dein Gewicht.', steady:'Der Schirm ist ruhig. Weiter so.', leaning:'Du kippst. Tippe auf die Gegenseite.', danger:'Kippgrenze! Lehne dich nach {dir}.',
      sheltered:'Im Windschutz', calm:'Windstille', forecast:'Böe in Sicht {arrow}', gust:'Windböe {arrow}', dirLeft:'links', dirRight:'rechts',
      rules:'Du gehst automatisch. Tippe auf eine Seite oder halte sie gedrückt. Auch ← → oder A / D verlagern dein Gewicht. Der Schwung wirkt nach. Lass kurz vor der Mitte los.\nDie Dachfahne zeigt zwei Sekunden vor einer Böe in deren Richtung. Je schräger du stehst, desto langsamer gehst du. Bei 46° fällst du. Pro Seil gibt es bis zu 1.000 Punkte, zu 70 % für Stabilität und zu 30 % für die Zeit.',
      close:'Verstanden', paused:'Eine kurze Pause', pauseCopy:'Schritte, Wind und Uhr stehen still.', fell:'Danebengetreten', fallCopy:'Du bist {distance} weit gekommen. Lass etwas früher los, bevor der Schirm wieder gerade steht.', retry:'Seil erneut versuchen',
      crossed:'Das Dach ist erreicht', crossedCopy:'„{place}“ ist geschafft. Das nächste Seil ist {length} lang.', next:'Zum nächsten Seil', finish:'Alle drei Seile geschafft', total:'Gesamt über drei Seile · {score} Punkte', replay:'Von vorn beginnen', stability:'Stabilität', time:'Zeit', score:'Seilpunkte', distance:'Gegangene Strecke', stopped:'Pausiert', lost:'Abgestürzt', arrived:'Ziel erreicht'
    },
    es: {
      title:'Sobre un alambre', help:'Cómo jugar', pause:'Pausa', resume:'Seguir andando', route:'Tres tramos', scene:'Una persona con sombrilla sobre un alambre entre tejados y un banderín que anuncia las ráfagas',
      stage0:'Calle del Reloj', stage1:'Techos del recodo', stage2:'Las torres gemelas', left:'A la izquierda', right:'A la derecha', start:'Subir al alambre', balance:'Inclinación',
      ready:'Mira el banderín. Toca el lado contrario a la inclinación.', safe:'Aquí no llega el viento. Prueba a cambiar el peso.', steady:'Sombrilla estable. Sigue así.', leaning:'Te inclinas. Toca el lado contrario.', danger:'¡Al límite! Inclínate a la {dir}.',
      sheltered:'A resguardo', calm:'Calma', forecast:'Se acerca una ráfaga {arrow}', gust:'Ráfaga {arrow}', dirLeft:'izquierda', dirRight:'derecha',
      rules:'Avanzas automáticamente. Toca o mantén pulsado uno de los lados, o usa ← → o A / D para desplazar el peso. La inercia continúa al soltar. Suelta un poco antes de volver al centro.\nEl banderín apunta hacia donde soplará el viento dos segundos antes de la ráfaga. Inclinarse frena el paso. A 46° caes. Cada tramo vale hasta 1.000 puntos, un 70 % por estabilidad y un 30 % por tiempo.',
      close:'Entendido', paused:'Un respiro', pauseCopy:'Los pasos, el viento y el reloj están en pausa.', fell:'Un paso en falso', fallCopy:'Has recorrido {distance}. Prueba a soltar justo antes de que se enderece la sombrilla.', retry:'Reintentar este tramo',
      crossed:'En el otro tejado', crossedCopy:'Has cruzado «{place}». El siguiente tramo mide {length}.', next:'Siguiente tramo', finish:'Tres alambres cruzados', total:'Total de los tres tramos · {score} puntos', replay:'Volver a empezar', stability:'Estabilidad', time:'Tiempo', score:'Puntos del tramo', distance:'Distancia recorrida', stopped:'En pausa', lost:'Caída', arrived:'Tramo superado'
    },
    'pt-BR': {
      title:'Por um fio', help:'Como jogar', pause:'Pausar', resume:'Continuar', route:'Três travessias', scene:'Uma pessoa com sombrinha na corda entre telhados e uma bandeira que anuncia rajadas',
      stage0:'Viela do Relógio', stage1:'Telhados do rio', stage2:'As torres gêmeas', left:'Para a esquerda', right:'Para a direita', start:'Subir no fio', balance:'Inclinação',
      ready:'Observe a bandeira. Toque no lado oposto ao da inclinação.', safe:'Este trecho é abrigado. Experimente deslocar o peso.', steady:'Sombrinha firme. Continue assim.', leaning:'Você está inclinando. Toque no lado oposto.', danger:'Quase caindo! Incline-se para a {dir}.',
      sheltered:'Ao abrigo', calm:'Vento calmo', forecast:'Vem uma rajada {arrow}', gust:'Rajada {arrow}', dirLeft:'esquerda', dirRight:'direita',
      rules:'A caminhada é automática. Toque ou segure um dos lados, ou use ← → ou A / D para deslocar o peso. A inércia continua depois que você solta. Solte um pouco antes de voltar ao centro.\nA bandeira aponta para onde o vento vai soprar dois segundos antes da rajada. Quanto maior a inclinação, mais lento o passo. A 46°, você cai. Cada travessia vale até 1.000 pontos, 70% pela estabilidade e 30% pelo tempo.',
      close:'Entendi', paused:'Uma pausa', pauseCopy:'Os passos, o vento e o cronômetro estão parados.', fell:'Um passo em falso', fallCopy:'Você andou {distance}. Tente soltar um pouco antes de a sombrinha voltar ao centro.', retry:'Tentar o trecho de novo',
      crossed:'No outro telhado', crossedCopy:'Você atravessou «{place}». O próximo fio mede {length}.', next:'Próxima travessia', finish:'Três travessias completas', total:'Total das três travessias · {score} pontos', replay:'Recomeçar', stability:'Estabilidade', time:'Tempo', score:'Pontos do trecho', distance:'Distância percorrida', stopped:'Em pausa', lost:'Queda', arrived:'Travessia completa'
    }
  };
  BooplandI18n.register('tightrope',messages);
})();
