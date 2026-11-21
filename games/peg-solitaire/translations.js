BooplandI18n.register('peg', {
  'zh-CN': {
    title: '孤子跳棋', goal: '横竖跳吃，最后只留一颗。', help: '玩法', levels: '选择棋局', board: '跳棋棋盘', pegs: '余子', jumps: '跳数',
    l0: '第一跳', l1: '转个弯', l2: '两翼相接', l3: '向心而行', l4: '经典十字', length: '{n} 跳', done: '已通关',
    hint: '一步提示', next: '下一棋局', undo: '撤销一步', restart: '重新摆盘', close: '回到棋盘',
    ready: '选一颗青豆，再点它能跳到的空孔。', selected: '已选 {at}，点虚线圈里的空孔。', still: '{at} 暂时跳不动，试试另一颗。', invalid: '只能横竖跳过相邻的一颗棋，落到紧接着的空孔。', occupied: '落点已有棋子。现已选中 {at}。',
    moved: '{a} → {b}。再选一颗继续跳。', suggested: '让 {a} 跳过 {m}，落到 {b}。', searching: '正在寻找通向最后一颗的走法…', backtrack: '撤销 {n} 步，可回到已验证的解法。', restored: '已撤销一步，可以换条路走。',
    won: '只剩一颗！用 {n} 跳完成了这盘棋。', stuck: '无棋可跳，还剩 {n} 颗。可以撤销再试。',
    seed: '{at}，棋子', empty: '{at}，空孔', target: '{at}，可落子',
    rules: '点选一枚棋子，横向或纵向跳过相邻的一枚，落到紧接着的空孔。被跳过的棋子会移走，任意孔只剩一颗即通关。',
    keys: '键盘可用方向键选择孔位，按回车或空格确认。'
  },
  en: {
    title: 'Peg Solitaire', goal: 'Jump in straight lines. Leave just one pea.', help: 'How to play', levels: 'Choose a board', board: 'Peg board', pegs: 'Pegs left', jumps: 'Jumps',
    l0: 'First hop', l1: 'Around the bend', l2: 'Wing to wing', l3: 'Inward bound', l4: 'Classic cross', length: '{n} jumps', done: 'Solved',
    hint: 'Show a hint', next: 'Next board', undo: 'Undo', restart: 'Reset board', close: 'Back to the board',
    ready: 'Choose a pea, then tap a hole it can jump to.', selected: '{at} selected. Choose a hole with a dashed ring.', still: '{at} has no jump. Try another pea.', invalid: 'Jump straight over one adjacent pea into the empty hole beyond.', occupied: 'That hole is occupied. Now selecting {at}.',
    moved: '{a} → {b}. Choose a pea for the next jump.', suggested: 'Jump from {a} over {m} into {b}.', searching: 'Looking for a route to one pea…', backtrack: 'Undo {n} to return to a known solution.', restored: 'Jump undone. Try a different move.',
    won: 'Just one left! Board solved in {n} jumps.', stuck: 'No jumps left. Remaining pegs: {n}. Try Undo.',
    seed: '{at}, pea', empty: '{at}, empty hole', target: '{at}, available landing',
    rules: 'Choose a pea and jump straight over one adjacent pea, horizontally or vertically, into the empty hole just beyond it. Remove the pea you jumped. Finish with one pea in any hole.',
    keys: 'On a keyboard, use the arrow keys to choose a hole and Enter or Space to select it.'
  },
  ja: {
    title: 'ペグ・ソリティア', goal: '縦か横に飛び越えて、最後の一粒を残そう。', help: '遊び方', levels: '盤を選ぶ', board: 'ソリティアの盤', pegs: '残り', jumps: '手数',
    l0: '最初のひと跳び', l1: '角を曲がって', l2: '両翼をつなぐ', l3: '中央を目指して', l4: '定番の十字盤', length: '{n} 手', done: 'クリア',
    hint: '一手ヒント', next: '次の盤へ', undo: '一手戻す', restart: '初期配置', close: '盤に戻る',
    ready: '豆を選び、跳べる先の穴をタップ。', selected: '{at} を選択中。点線の穴を選ぼう。', still: '{at} は今は跳べません。別の豆を選ぼう。', invalid: '縦か横に隣の豆を一つ飛び越え、すぐ先の空き穴へ。', occupied: 'その穴には豆があります。{at} を選びました。',
    moved: '{a} → {b}。次に跳ぶ豆を選ぼう。', suggested: '{a} から {m} を飛び越えて {b} へ。', searching: '最後の一粒への道を探索中…', backtrack: '{n} 手戻すと、解ける局面に戻れます。', restored: '一手戻しました。別の手も試せます。',
    won: '残り一粒！ {n} 手でクリア。', stuck: 'もう跳べません。残りは {n} 粒。一手戻せます。',
    seed: '{at}、豆', empty: '{at}、空き穴', target: '{at}、跳べる穴',
    rules: '豆を選び、縦か横に隣の豆を一つ飛び越え、そのすぐ先の空き穴へ移します。飛び越えられた豆は取り除きます。どの穴でも最後に一粒だけ残せば成功です。',
    keys: 'キーボードでは矢印キーで穴を選び、Enter またはスペースで決定します。'
  },
  ko: {
    title: '페그 솔리테어', goal: '가로세로로 뛰어서 콩 한 알만 남겨 보세요.', help: '게임 방법', levels: '판 고르기', board: '솔리테어 판', pegs: '남은 콩', jumps: '점프',
    l0: '첫 도약', l1: '모퉁이를 돌아', l2: '두 날개 잇기', l3: '중심을 향해', l4: '고전 십자판', length: '{n}회', done: '완료',
    hint: '한 수 힌트', next: '다음 판', undo: '한 수 취소', restart: '다시 놓기', close: '판으로 돌아가기',
    ready: '콩을 고른 뒤 뛰어갈 수 있는 구멍을 누르세요.', selected: '{at} 선택됨. 점선이 있는 구멍을 누르세요.', still: '{at}에서는 뛸 수 없어요. 다른 콩을 고르세요.', invalid: '가로 또는 세로로 이웃한 콩 하나를 넘어 바로 다음 빈 구멍으로 뛰세요.', occupied: '이미 콩이 있는 구멍이에요. 이제 {at}을 선택했어요.',
    moved: '{a} → {b}. 다음에 뛸 콩을 고르세요.', suggested: '{a}에서 {m}을 넘어 {b}로 뛰세요.', searching: '콩 한 알을 남기는 길을 찾는 중…', backtrack: '{n}수 되돌리면 해법이 있는 위치로 돌아가요.', restored: '한 수 되돌렸어요. 다른 길로 뛰어 보세요.',
    won: '한 알만 남았어요! {n}번 뛰어 성공했어요.', stuck: '더 뛸 수 없어요. 남은 콩은 {n}알이에요. 한 수 되돌려 보세요.',
    seed: '{at}, 콩', empty: '{at}, 빈 구멍', target: '{at}, 착지 가능',
    rules: '콩을 골라 가로 또는 세로로 이웃한 콩 한 알을 뛰어넘어 바로 다음 빈 구멍에 놓으세요. 뛰어넘은 콩은 사라져요. 어느 구멍이든 콩 한 알만 남기면 성공이에요.',
    keys: '키보드에서는 방향키로 구멍을 고르고 Enter 또는 스페이스로 선택하세요.'
  },
  fr: {
    title: 'Solitaire à billes', goal: 'Sautez en ligne droite pour ne garder qu’un petit pois.', help: 'Règles du jeu', levels: 'Choisir un plateau', board: 'Plateau de solitaire', pegs: 'Pois restants', jumps: 'Sauts',
    l0: 'Premier saut', l1: 'Le virage', l2: 'D’une aile à l’autre', l3: 'Vers le centre', l4: 'Croix classique', length: '{n} sauts', done: 'Résolu',
    hint: 'Un indice', next: 'Plateau suivant', undo: 'Annuler', restart: 'Replacer', close: 'Revenir au plateau',
    ready: 'Choisissez un pois, puis une case où il peut sauter.', selected: '{at} choisi. Touchez un cercle en pointillés.', still: 'Aucun saut depuis {at}. Choisissez un autre pois.', invalid: 'Sautez par-dessus un seul voisin, en ligne droite, dans le trou vide juste après.', occupied: 'Ce trou est occupé. Le pois en {at} est sélectionné.',
    moved: '{a} → {b}. Choisissez le prochain pois.', suggested: 'Partez de {a}, sautez par-dessus {m} et atterrissez en {b}.', searching: 'Recherche d’un chemin vers le dernier pois…', backtrack: 'Annulez {n} coup(s) pour retrouver une solution connue.', restored: 'Saut annulé. Essayez un autre coup.',
    won: 'Un seul pois ! Plateau résolu en {n} sauts.', stuck: 'Plus de saut possible. Il reste {n} pois. Vous pouvez annuler.',
    seed: '{at}, petit pois', empty: '{at}, trou vide', target: '{at}, arrivée possible',
    rules: 'Choisissez un pois. Sautez horizontalement ou verticalement par-dessus un pois voisin et atterrissez dans le trou vide juste après. Retirez le pois franchi. Gardez un seul pois, dans le trou de votre choix.',
    keys: 'Au clavier, déplacez-vous avec les flèches et validez avec Entrée ou Espace.'
  },
  de: {
    title: 'Stecksolitär', goal: 'Springe waagerecht oder senkrecht, bis eine Erbse bleibt.', help: 'Spielregeln', levels: 'Brett wählen', board: 'Solitärbrett', pegs: 'Erbsen', jumps: 'Sprünge',
    l0: 'Erster Sprung', l1: 'Um die Ecke', l2: 'Von Flügel zu Flügel', l3: 'Zur Mitte', l4: 'Klassisches Kreuz', length: '{n} Sprünge', done: 'Gelöst',
    hint: 'Ein Hinweis', next: 'Nächstes Brett', undo: 'Zurück', restart: 'Neu aufstellen', close: 'Zurück zum Brett',
    ready: 'Wähle eine Erbse und dann ein erreichbares Loch.', selected: '{at} gewählt. Tippe auf einen gestrichelten Kreis.', still: 'Von {at} ist kein Sprung möglich. Wähle eine andere Erbse.', invalid: 'Springe gerade über eine benachbarte Erbse in das freie Loch direkt dahinter.', occupied: 'Dieses Loch ist besetzt. Jetzt ist {at} gewählt.',
    moved: '{a} → {b}. Wähle die nächste Erbse.', suggested: 'Springe von {a} über {m} nach {b}.', searching: 'Suche einen Weg zur letzten Erbse…', backtrack: 'Gehe {n} Schritt(e) zurück zu einem bekannten Lösungsweg.', restored: 'Sprung zurückgenommen. Probiere einen anderen Zug.',
    won: 'Nur eine übrig! In {n} Sprüngen gelöst.', stuck: 'Kein Sprung mehr möglich. Übrig sind {n} Erbsen. Du kannst zurückgehen.',
    seed: '{at}, Erbse', empty: '{at}, leeres Loch', target: '{at}, mögliches Ziel',
    rules: 'Wähle eine Erbse. Springe waagerecht oder senkrecht über genau eine benachbarte Erbse ins freie Loch direkt dahinter. Die übersprungene Erbse wird entfernt. Am Ende soll eine Erbse an beliebiger Stelle übrig bleiben.',
    keys: 'Mit den Pfeiltasten wählst du ein Loch. Mit Eingabe oder Leertaste bestätigst du.'
  },
  es: {
    title: 'Solitario de clavijas', goal: 'Salta en línea recta hasta dejar un solo guisante.', help: 'Cómo jugar', levels: 'Elige un tablero', board: 'Tablero de solitario', pegs: 'Quedan', jumps: 'Saltos',
    l0: 'Primer salto', l1: 'En la curva', l2: 'De ala a ala', l3: 'Hacia el centro', l4: 'Cruz clásica', length: '{n} saltos', done: 'Resuelto',
    hint: 'Una pista', next: 'Siguiente tablero', undo: 'Deshacer', restart: 'Reiniciar', close: 'Volver al tablero',
    ready: 'Elige un guisante y toca un hueco al que pueda saltar.', selected: 'Has elegido {at}. Toca un círculo discontinuo.', still: 'No puedes saltar desde {at}. Elige otro guisante.', invalid: 'Salta en línea recta sobre un vecino al hueco vacío justo detrás.', occupied: 'Ese hueco está ocupado. Has seleccionado {at}.',
    moved: '{a} → {b}. Elige el siguiente guisante.', suggested: 'Salta desde {a} sobre {m} hasta {b}.', searching: 'Buscando cómo dejar un solo guisante…', backtrack: 'Retrocede {n} paso(s) para volver a una solución conocida.', restored: 'Salto deshecho. Prueba otra jugada.',
    won: '¡Solo queda uno! Lo has logrado en {n} saltos.', stuck: 'Ya no hay saltos. Quedan {n} guisantes. Puedes deshacer.',
    seed: '{at}, guisante', empty: '{at}, hueco vacío', target: '{at}, destino posible',
    rules: 'Elige un guisante y salta sobre otro contiguo en horizontal o vertical. Aterriza en el hueco vacío inmediatamente posterior y retira el guisante que has saltado. Ganas cuando queda uno solo en cualquier hueco.',
    keys: 'Con el teclado, usa las flechas para moverte e Intro o Espacio para elegir un hueco.'
  },
  'pt-BR': {
    title: 'Resta Um', goal: 'Pule em linha reta até sobrar uma única ervilha.', help: 'Como jogar', levels: 'Escolha um tabuleiro', board: 'Tabuleiro de resta um', pegs: 'Restam', jumps: 'Saltos',
    l0: 'Primeiro salto', l1: 'Fazendo a curva', l2: 'De asa a asa', l3: 'Rumo ao centro', l4: 'Cruz clássica', length: '{n} saltos', done: 'Resolvido',
    hint: 'Uma dica', next: 'Próximo tabuleiro', undo: 'Desfazer', restart: 'Reiniciar', close: 'Voltar ao tabuleiro',
    ready: 'Escolha uma ervilha e toque num buraco que ela alcance.', selected: 'Você escolheu {at}. Toque em um círculo tracejado.', still: 'Não dá para pular de {at}. Escolha outra ervilha.', invalid: 'Pule em linha reta sobre uma vizinha até o buraco vazio logo depois.', occupied: 'Esse buraco está ocupado. Agora {at} está selecionado.',
    moved: '{a} → {b}. Escolha a próxima ervilha.', suggested: 'Saia de {a}, pule sobre {m} e caia em {b}.', searching: 'Procurando como deixar uma só ervilha…', backtrack: 'Volte {n} jogada(s) para retomar uma solução conhecida.', restored: 'Salto desfeito. Experimente outra jogada.',
    won: 'Restou uma! Tabuleiro resolvido em {n} saltos.', stuck: 'Não há mais saltos. Restam {n} ervilhas. Você pode desfazer.',
    seed: '{at}, ervilha', empty: '{at}, buraco vazio', target: '{at}, destino possível',
    rules: 'Escolha uma ervilha e pule na horizontal ou na vertical sobre uma ervilha vizinha. Caia no buraco vazio logo depois dela e retire a ervilha que você pulou. Deixe apenas uma em qualquer buraco para vencer.',
    keys: 'No teclado, use as setas para escolher um buraco e Enter ou Espaço para confirmar.'
  }
});
