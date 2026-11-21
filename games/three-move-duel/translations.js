(() => {
  'use strict';
  // Each row is a related set of labels in the order defined here.
  const groups = [
    'title arena rules opponents close hero you rival pine rain swallow',
    'advance retreat thrust guard techniques addHint sequence preview stopPreview undo confirm next rematch',
    'opening tellAdvance tellRetreat tellThrust tellGuard',
    'round hp boardLabel slotEmpty slotQueued rehearsing rehearsalHint beat beatLog exchanges outcomeColumns',
    'miss parried hit block ready clash step edge pending skipped riposte interrupted initiative',
    'win loss draw ko limit review reviewHint wait',
    'choose chooseHint pineBio rainBio swallowBio',
    'howTitle howText combatTitle combatText finishTitle finishText aiTitle aiText keysTitle keysText'
  ].map(row => row.split(' '));
  const rows = {
    'zh-CN': [
      '三招定胜负|五步桥|对决规则|切换对手|关闭|青衫客|你|对手|赤松客|听雨客|归燕客',
      '进|退|刺|挡|选择招式|点选招式，依次入谱|我的三招|试演|结束试演|撤回|确认三招|下一轮|再战一局',
      '对手起手|重心前移，首招为「进」。|脚跟后收，首招为「退」。|剑尖微抬，首招为「刺」。|横剑身前，首招为「挡」。',
      '第 {n} / {max} 轮|{name}，气血 {hp} / 3|{name}在第 {p} 格，{foe}在第 {e} 格，共五格。|第 {n} 拍，空位|第 {n} 拍，{move}|招式试演|第 {n} 拍 · 对手暂居原位。|第 {n} 拍|逐拍记录|交锋中|左为你 · 右为对手',
      '落空|被挡|命中|化解|架守|受阻|移步|桥端|待出|未出|反刺命中|被抢先|下拍可反刺',
      '你赢了|惜败|平局|气血耗尽，对决结束。|六轮已尽，按剩余气血判定。|本轮结束|看清落点，再排下一轮。|逐拍交锋中',
      '选择对手|选定一位侠客，从第一轮重新交手。|善于逼近，贴身便刺。|先守后攻，等你自己上前。|爱以退为进，诱你追上来。',
      '排三招|先看对手亮出的第一招，再依次选择三招。可重复选招，试演时对手保持原位。撤回会移除最后一招。|每拍怎样交手|进、退各走一格。双方同时移动，抵达同一格或交换位置时都留在原处；桥端不能再退。移动后相邻才可刺中，每次扣一血。挡可化解刺，退开可使刺落空。|胜负与平局|双方各三血。成功挡住一刺，紧接的下一拍出刺就能抢先，即使跨轮也有效。此时对方若也出刺，只有反刺命中。对方仍可挡或退开。平时相邻对刺，各扣一血，同时归零为平局。任何一方归零即停。六轮后余血多者胜，相等则和。|对手怎样出招|每轮开始时，对手仅据其风格、公开局面及你上轮的出招锁定三招，亮出的首招一定兑现。|桌面快捷键|1 进、2 退、3 刺、4 挡。Backspace 撤回，P 试演，Enter 确认或继续。'
    ],
    en: [
      'Three-Move Duel|Five-Step Bridge|Duel rules|Change rival|Close|Blue Robe|You|Rival|Red Pine|Rain Listener|Swallow',
      'Advance|Retreat|Thrust|Guard|Choose a move|Pick moves in order|Your sequence|Rehearse|End preview|Undo|Lock in moves|Next round|Duel again',
      'Opening tell|Weight shifts forward. First move: advance.|A heel slides back. First move: retreat.|The tip rises. First move: thrust.|Blade held across the chest. First move: guard.',
      'Round {n} / {max}|{name}, health {hp} / 3|{name} on space {p}, {foe} on space {e}, on a five-space bridge.|Beat {n}, empty|Beat {n}, {move}|Rehearsal|Beat {n} · Your rival stays still.|Beat {n}|Beat record|Exchanging moves|You on the left · rival on the right',
      'miss|parried|hit|blocked|on guard|stopped|stepped|edge|waiting|unused|riposte hit|interrupted|Riposte ready',
      'You win|You lose|Draw|Health ran out. The duel ends.|Six rounds complete. Remaining health decides.|Round complete|Review the exchange before your next round.|Playing moves',
      'Choose a rival|Choosing a fighter starts a fresh duel.|Closes the gap and strikes at close range.|Guards first, then strikes as you approach.|Gives ground to tempt you into pursuit.',
      'Plan three moves|Read the revealed opening and choose three moves in order. Repeats are allowed. Rehearsal holds the rival still. Undo removes the last move.|Resolve each beat|Advance or retreat one space. Both move together. If they claim the same space or swap places, both stay put. The ends stop movement. A thrust hits for one health only if adjacent after movement. Guard parries it, and stepping away can make it miss.|Win or draw|Both start with three health. After parrying a thrust, strike on the very next beat to interrupt an opposing thrust. This carries across rounds. A guard or a step out of reach still stops the riposte. Normally, adjacent thrusts hit both fighters. A knockout ends the duel immediately. Two knockouts together are a draw. After six rounds, higher health wins. Equal health draws.|How rivals plan|Before you choose, the rival locks in all three moves from its style, the public board and your previous round. The first move shown is guaranteed.|Keyboard|1 advance, 2 retreat, 3 thrust, 4 guard. Backspace undoes, P rehearses and Enter confirms or continues.'
    ],
    ja: [
      '三手で決着|五歩橋|対決の決まり|相手を変更|閉じる|青衣の剣士|自分|相手|赤松|雨聴き|帰燕',
      '前進|後退|突き|防御|技を選ぶ|順に選んで三手を組む|自分の三手|予行|予行終了|一手戻す|三手を確定|次の回へ|再戦する',
      '相手の初手|重心が前へ。初手は前進。|かかとを引いた。初手は後退。|切っ先が上がる。初手は突き。|剣を横に構えた。初手は防御。',
      '第 {n} / {max} 回|{name}、体力 {hp} / 3|五マスの橋。{name}は {p} マス目、{foe}は {e} マス目。|{n} 手目、空き|{n} 手目、{move}|予行演習|{n} 手目・相手はその場に待機。|{n} 手目|各手の記録|交戦中|左が自分・右が相手',
      '空振り|防がれた|命中|受け流し|構え|足止め|移動|橋の端|待機|未使用|返し突き命中|先を取られた|返し突き可',
      '勝利|敗北|引き分け|体力が尽き、決着。|六回が終了。残り体力で判定。|この回は終了|記録を確かめて次の回へ。|交戦中',
      '相手を選ぶ|選ぶと一回目から新しい対決が始まります。|間合いを詰め、近くから突く。|守りを固めてから接近を狙う。|退いて追撃を誘う。',
      '三手を組む|相手の初手を見て技を三つ選びます。同じ技も使えます。予行中は相手が静止し、「一手戻す」で最後の技を外せます。|各手の処理|前進・後退は一マス。同時に移動し、同じマスを狙ったり入れ替わったりすると双方が元の位置に残ります。端からは出られません。移動後に隣り合っていれば突きで体力を一つ削れます。防御で防ぎ、後退でかわせます。|勝敗|双方の体力は三つ。突きを防いだ直後の一手は、回をまたいでも返し突きの機会です。互いに突けば返し突きだけが当たります。防御や間合いの外への後退で防げます。通常は隣で突き合うと互いに体力を一つ失います。どちらかがゼロで即終了、同時なら引き分け。六回終了時は残り体力が多い方の勝ち、同じなら引き分けです。|相手の思考|相手はあなたが選ぶ前に、自分の流派、公開された盤面、前の回のあなたの手だけで三手を決めます。公開された初手は必ず使います。|キー操作|1 前進、2 後退、3 突き、4 防御。Backspace で一手戻し、P で予行、Enter で確定・続行。'
    ],
    ko: [
      '세 수의 결투|다섯 칸 다리|결투 규칙|상대 변경|닫기|청의객|나|상대|적송객|청우객|귀연객',
      '전진|후퇴|찌르기|막기|기술 선택|순서대로 기술을 고르세요|나의 세 수|예행|예행 종료|무르기|세 수 확정|다음 라운드|다시 겨루기',
      '상대의 첫 수|몸이 앞으로 기운다. 첫 수는 전진.|뒤꿈치를 뺀다. 첫 수는 후퇴.|칼끝이 올라간다. 첫 수는 찌르기.|칼을 가로로 든다. 첫 수는 막기.',
      '{n} / {max} 라운드|{name}, 체력 {hp} / 3|다섯 칸 다리에서 {name}의 위치는 {p}, {foe}의 위치는 {e}입니다.|{n}번째 수, 비어 있음|{n}번째 수, {move}|예행연습|{n}번째 수 · 상대는 제자리에 있습니다.|{n}번째 수|공방 기록|공방 중|왼쪽은 나 · 오른쪽은 상대',
      '빗나감|막힘|명중|방어 성공|대기|가로막힘|이동|다리 끝|준비|미사용|반격 적중|공격 끊김|반격 가능',
      '승리|패배|무승부|체력이 다해 결투가 끝났습니다.|여섯 라운드 종료. 남은 체력으로 판정합니다.|라운드 종료|공방을 확인하고 다음 수를 고르세요.|공방 진행 중',
      '상대 선택|상대를 고르면 첫 라운드부터 새로 시작합니다.|거리를 좁혀 바짝 붙어 찌릅니다.|먼저 막고 다가오는 순간을 노립니다.|물러나며 추격을 유도합니다.',
      '세 수 짜기|공개된 첫 수를 보고 세 기술을 순서대로 고릅니다. 같은 기술을 반복해도 됩니다. 예행에서는 상대가 정지합니다. 무르기는 마지막 수를 지웁니다.|한 수의 판정|전진과 후퇴는 한 칸입니다. 동시에 움직이며 같은 칸을 노리거나 자리를 바꾸려 하면 둘 다 제자리에 남습니다. 다리 끝을 넘을 수 없습니다. 이동 후 이웃한 칸에서 찌르면 체력이 하나 줄고, 막기로 받아내거나 물러나 피할 수 있습니다.|승패와 무승부|양쪽 모두 체력 셋으로 시작합니다. 찌르기를 막은 바로 다음 수에는 라운드가 바뀌어도 반격할 수 있습니다. 이때 서로 찌르면 반격만 적중합니다. 막거나 사거리 밖으로 물러나면 반격을 피할 수 있습니다. 보통은 이웃한 칸에서 서로 찌르면 둘 다 체력 하나를 잃습니다. 한쪽이 0이면 즉시 끝나고 동시에 0이면 무승부입니다. 여섯 라운드 뒤 남은 체력이 많으면 승리, 같으면 무승부입니다.|상대의 선택|상대는 내가 입력하기 전에 자신의 성향과 공개된 판, 내가 지난 라운드에 쓴 기술만으로 세 수를 확정합니다. 공개된 첫 수는 반드시 실행됩니다.|키보드|1 전진, 2 후퇴, 3 찌르기, 4 막기. Backspace로 무르기, P로 예행, Enter로 확정하거나 계속합니다.'
    ],
    fr: [
      'Duel en trois coups|Pont des cinq pas|Règles|Changer de rival|Fermer|Cape bleue|Vous|Rival|Pin rouge|Écoute-pluie|Hirondelle',
      'Avancer|Reculer|Piquer|Parer|Techniques|Choisissez les coups dans l’ordre|Vos trois coups|Essai|Fin de l’essai|Annuler|Valider les coups|Manche suivante|Rejouer',
      'Premier geste|Le poids passe en avant. Le rival avance.|Le talon glisse en arrière. Le rival recule.|La pointe se lève. Le rival pique.|La lame barre le torse. Le rival pare.',
      'Manche {n} / {max}|{name}, vie {hp} / 3|Sur cinq cases, {name} occupe la case {p}, {foe} la case {e}.|Temps {n}, vide|Temps {n}, {move}|Essai|Temps {n} · Le rival reste en place.|Temps {n}|Carnet des coups|Échange en cours|Vous à gauche · rival à droite',
      'manqué|paré|touché|parade|en garde|bloqué|un pas|bord|en attente|inutilisé|riposte réussie|interrompu|Riposte prête',
      'Victoire|Défaite|Égalité|La vie est épuisée. Le duel prend fin.|Six manches jouées. La vie restante décide.|Manche terminée|Relisez les coups avant la prochaine manche.|Échange en cours',
      'Choisir le rival|Choisir un adversaire lance un nouveau duel.|Se rapproche pour frapper de près.|Se protège, puis frappe à votre approche.|Recule pour vous inciter à le suivre.',
      'Préparer trois coups|Lisez le premier geste annoncé, puis choisissez trois coups, avec répétition possible. À l’essai, le rival reste immobile. Annuler retire le dernier coup.|À chaque temps|Avancer ou reculer déplace d’une case. Les deux bougent ensemble. S’ils visent la même case ou échangent leurs places, ils restent en place. Le bord arrête le pas. Après le mouvement, une pique adjacente retire une vie. Parer la neutralise, reculer peut l’éviter.|Issue du duel|Chacun a trois vies. Après avoir paré une pique, vous pouvez riposter dès le temps suivant, même en début de manche. Si les deux piquent, seule la riposte touche. On peut encore la parer ou reculer hors de portée. Normalement, deux piques simultanées au contact touchent toutes les deux. À zéro vie, le duel cesse aussitôt. Un double K.-O. donne une égalité. Après six manches, le plus de vies l’emporte. À vies égales, match nul.|Le choix du rival|Avant votre choix, le rival fixe ses trois coups selon son style, les positions publiques et vos coups de la manche précédente. Son premier geste annoncé est certain.|Clavier|1 avancer, 2 reculer, 3 piquer, 4 parer. Retour arrière annule, P lance l’essai, Entrée valide ou continue.'
    ],
    de: [
      'Duell in drei Zügen|Fünf-Schritt-Brücke|Spielregeln|Gegner wechseln|Schließen|Blaurock|Du|Gegner|Rotkiefer|Regenhorcher|Schwalbe',
      'Vorstoß|Rückzug|Stich|Deckung|Züge wählen|Wähle die Züge der Reihe nach|Deine Zugfolge|Proben|Probe beenden|Zurück|Züge bestätigen|Nächste Runde|Erneut spielen',
      'Erster Zug|Das Gewicht kippt nach vorn. Der Gegner rückt vor.|Die Ferse gleitet zurück. Der Gegner weicht zurück.|Die Spitze hebt sich. Der Gegner sticht zu.|Die Klinge liegt quer. Der Gegner geht in Deckung.',
      'Runde {n} / {max}|{name}, Leben {hp} / 3|Auf fünf Feldern steht {name} auf Feld {p} und {foe} auf Feld {e}.|Takt {n}, leer|Takt {n}, {move}|Probe|Takt {n} · Der Gegner bleibt stehen.|Takt {n}|Zugprotokoll|Schlagabtausch|Du links · Gegner rechts',
      'verfehlt|pariert|Treffer|abgewehrt|gedeckt|gestoppt|Schritt|am Rand|wartet|unbenutzt|Konter trifft|unterbrochen|Konter bereit',
      'Gewonnen|Verloren|Unentschieden|Die Lebenspunkte sind aufgebraucht.|Sechs Runden vorbei. Restleben entscheiden.|Runde beendet|Sieh dir die Züge vor der nächsten Runde an.|Züge laufen',
      'Gegner wählen|Mit der Wahl beginnt ein neues Duell.|Rückt näher und sticht aus kurzer Distanz zu.|Deckt sich zuerst und kontert beim Näherkommen.|Weicht zurück und lockt dich hinterher.',
      'Drei Züge planen|Lies den ersten Zug des Gegners und wähle drei Züge. Wiederholungen sind erlaubt. Bei der Probe bleibt der Gegner stehen. Zurück entfernt den letzten Zug.|Ein Takt|Vorstoß und Rückzug bewegen um ein Feld. Beide ziehen gleichzeitig. Beim selben Zielfeld oder einem Platztausch bleiben beide stehen. Am Rand endet der Weg. Ein Stich kostet ein Leben, wenn die Figuren nach dem Schritt benachbart sind. Deckung pariert, ein Rückzug kann ausweichen.|Sieg und Gleichstand|Beide starten mit drei Leben. Nach einem parierten Stich kannst du im nächsten Takt kontern, auch über das Rundenende hinweg. Stechen dann beide zu, trifft nur der Konter. Deckung oder ein Schritt außer Reichweite schützt davor. Sonst treffen bei gleichzeitigen Stichen auf Nachbarfeldern beide. Bei null Leben endet das Duell sofort, ein Doppel-K.-o. ist unentschieden. Nach sechs Runden gewinnt, wer mehr Leben hat. Gleich viele Leben ergeben ein Unentschieden.|Plan des Gegners|Der Gegner legt alle drei Züge vor deiner Eingabe fest. Er nutzt seinen Stil, die öffentliche Lage und deine Züge der letzten Runde. Sein angekündigter erster Zug steht fest.|Tastatur|1 Vorstoß, 2 Rückzug, 3 Stich, 4 Deckung. Rücktaste nimmt zurück, P probt, Eingabe bestätigt oder fährt fort.'
    ],
    es: [
      'Duelo en tres pasos|Puente de cinco pasos|Reglas|Cambiar rival|Cerrar|Capa Azul|Tú|Rival|Pino Rojo|Oyelluvia|Golondrina',
      'Avanzar|Retirar|Estocar|Cubrir|Elige técnicas|Elige los golpes en orden|Tus tres golpes|Ensayar|Fin del ensayo|Deshacer|Confirmar golpes|Otra ronda|Nuevo duelo',
      'Primer gesto|El peso cae adelante. El rival avanza.|El talón retrocede. El rival se retira.|Sube la punta. El rival da una estocada.|Cruza la hoja. El rival se cubre.',
      'Ronda {n} / {max}|{name}, salud {hp} / 3|En cinco casillas, {name} ocupa la {p} y {foe} la {e}.|Tiempo {n}, vacío|Tiempo {n}, {move}|Ensayo|Tiempo {n} · El rival sigue inmóvil.|Tiempo {n}|Registro|Intercambio|Tú a la izquierda · rival a la derecha',
      'fallo|parada|acierto|bloqueo|en guardia|frenado|paso|borde|en espera|sin usar|contragolpe|interrumpido|Contraataque listo',
      'Victoria|Derrota|Empate|La salud se agotó. Termina el duelo.|Seis rondas. Decide la salud restante.|Fin de ronda|Revisa los golpes antes de la ronda siguiente.|En combate',
      'Elige un rival|Al elegir un rival comienza un duelo nuevo.|Se acerca y ataca a corta distancia.|Se cubre y espera a que te acerques.|Retrocede para tentarte a seguirlo.',
      'Prepara tres golpes|Mira el primer gesto revelado y elige tres técnicas en orden. Puedes repetirlas. En el ensayo el rival se queda quieto. Deshacer quita el último golpe.|Cada tiempo|Avanzar o retirarse mueve una casilla. Ambos se mueven a la vez. Si ocupan el mismo destino o se cruzan, ambos se quedan donde estaban. El borde detiene el paso. Tras moverse, una estocada contigua quita una vida. Cubrirse la para y alejarse puede esquivarla.|Victoria o empate|Cada luchador tiene tres vidas. Tras parar una estocada puedes contraatacar en el tiempo siguiente, incluso si cambia la ronda. Si ambos atacan, solo acierta el contraataque. Puedes pararlo o salir de su alcance. En condiciones normales, dos estocadas simultáneas en casillas contiguas hieren a ambos. Si alguien llega a cero se acaba el duelo. Un doble derribo es empate. Tras seis rondas gana quien tenga más vidas. Si tienen las mismas, empatan.|Cómo elige el rival|Antes de que elijas, el rival fija sus tres golpes según su estilo, la posición pública y tus golpes de la ronda anterior. El primer gesto anunciado es seguro.|Teclado|1 avanzar, 2 retirarse, 3 estocar, 4 cubrirse. Retroceso deshace, P ensaya e Intro confirma o continúa.'
    ],
    'pt-BR': [
      'Duelo em três golpes|Ponte dos cinco passos|Regras|Trocar rival|Fechar|Manto Azul|Você|Rival|Pinho Rubro|Ouve-Chuva|Andorinha',
      'Avançar|Recuar|Estocar|Aparar|Escolha os golpes|Escolha os golpes em ordem|Seus três golpes|Ensaiar|Fim do ensaio|Desfazer|Confirmar golpes|Próxima rodada|Novo duelo',
      'Primeiro gesto|O peso vai para a frente. O rival avança.|O calcanhar desliza para trás. O rival recua.|A ponta sobe. O rival dá uma estocada.|A lâmina cruza o peito. O rival se protege.',
      'Rodada {n} / {max}|{name}, vida {hp} / 3|Nas cinco casas, {name} ocupa a casa {p} e {foe} a casa {e}.|Tempo {n}, vazio|Tempo {n}, {move}|Ensaio|Tempo {n} · O rival fica parado.|Tempo {n}|Registro de golpes|Troca de golpes|Você à esquerda · rival à direita',
      'errou|aparado|acertou|aparou|em guarda|travado|passo|borda|aguarda|sem uso|contra-ataque certeiro|interrompido|Contra-ataque pronto',
      'Vitória|Derrota|Empate|A vida acabou. O duelo termina.|Seis rodadas. A vida restante decide.|Fim da rodada|Confira os golpes antes da próxima rodada.|Em combate',
      'Escolha o rival|Escolher um rival inicia um novo duelo.|Encurta a distância e ataca de perto.|Fica em guarda e ataca quando você se aproxima.|Recua para atrair você para perto.',
      'Planeje três golpes|Observe o primeiro gesto revelado e escolha três golpes em ordem. Pode repetir. No ensaio, o rival fica parado. Desfazer retira o último golpe.|A cada tempo|Avançar ou recuar move uma casa. Ambos se movem juntos. Se miram a mesma casa ou trocam de lugar, ficam na posição original. A borda impede o passo. Após o movimento, estocar em casas vizinhas tira uma vida. Aparar bloqueia o ataque e recuar pode evitá-lo.|Vitória ou empate|Cada duelista começa com três vidas. Ao aparar uma estocada, você pode contra-atacar no tempo seguinte, mesmo na virada da rodada. Se ambos estocarem, só o contra-ataque acerta. É possível apará-lo ou recuar para fora de alcance. Normalmente, estocadas simultâneas em casas vizinhas atingem os dois. Ao zerar a vida, o duelo acaba. Nocaute duplo dá empate. Após seis rodadas vence quem tiver mais vida. Vidas iguais dão empate.|Como o rival escolhe|Antes da sua escolha, o rival fixa os três golpes usando seu estilo, o tabuleiro público e seus golpes da rodada anterior. O primeiro gesto anunciado é garantido.|Teclado|1 avançar, 2 recuar, 3 estocar, 4 aparar. Backspace desfaz, P ensaia e Enter confirma ou continua.'
    ]
  };
  const catalog = {};
  for (const [lang, data] of Object.entries(rows)) {
    const messages = {};
    groups.forEach((keys, index) => {
      const values = data[index].split('|');
      if (values.length !== keys.length) throw new Error('Incomplete translation: '+lang+' / '+keys[0]);
      keys.forEach((key,i) => { messages[key] = values[i]; });
    });
    catalog[lang] = messages;
  }
  window.BooplandI18n.register('bridgeDuel', catalog);
})();

