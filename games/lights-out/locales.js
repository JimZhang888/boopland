(() => {
  const messages = {
    'zh-CN': {
      title: '熄灯之后', intro: '轻点一盏灯，让它和上下左右的邻灯一起翻转。试着熄灭整块招牌。',
      goal: '熄灭整块招牌。', difficulty: '难度', easy: '入门', medium: '进阶', hard: '挑战', lit: '亮灯数', moves: '步数',
      on: '亮灯', off: '灭灯', hint: '提示一步', undo: '撤一步', reset: '重开原题', new: '换一题',
      help: '玩法', close: '关闭', boardName: '灯牌', cell: '第 {row} 行，第 {col} 列，{state}',
      hintAt: '下一步，点第 {row} 行、第 {col} 列带虚线框的灯。', marked: '提示位置',
      helpHint: '星芒表示亮灯，弯月表示灭灯。提示会用虚线圈出下一盏要点的灯。重开可以从原题再试一次。',
      keys: '键盘操作时，用 Tab 进入灯牌，方向键选灯，回车或空格翻灯。',
      win: '招牌熄灭了', winDetail: '用了 {moves} 步，街角归于宁静。', next: '下一块招牌',
      started: '新灯牌，{size} × {size}。', restarted: '已还原原题。', undone: '已撤回上一步。',
      progress: '亮灯 {lit} 盏，已走 {moves} 步。'
    },
    en: {
      title: 'After Lights Out', intro: 'Tap a lamp to flip it and its neighbours above, below, left and right. Turn off every light on the sign.',
      goal: 'Turn off every lamp on the sign.', difficulty: 'Difficulty', easy: 'Starter', medium: 'Advanced', hard: 'Challenge', lit: 'Lamps lit', moves: 'Moves',
      on: 'On', off: 'Off', hint: 'Get a hint', undo: 'Undo', reset: 'Restart', new: 'New puzzle',
      help: 'How to play', close: 'Close', boardName: 'Light-up sign', cell: 'Row {row}, column {col}, {state}',
      hintAt: 'Next, tap the outlined lamp in row {row}, column {col}.', marked: 'Hint',
      helpHint: 'Stars are on and crescents are off. A hint marks one lamp with a dashed outline. Restart to try the same puzzle again.',
      keys: 'Tab to the sign, choose a lamp with the arrow keys, then press Enter or Space to switch it.',
      win: 'Lights out', winDetail: 'The street is quiet after {moves} moves.', next: 'Next sign',
      started: 'New {size} × {size} sign.', restarted: 'Original puzzle restored.', undone: 'Last move undone.',
      progress: '{lit} lamps lit. Moves so far: {moves}.'
    },
    ja: {
      title: '灯りが消えたあと', intro: 'ランプを押すと、そのランプと上下左右のランプが切り替わります。看板の灯りをすべて消しましょう。',
      goal: '看板の灯りをすべて消しましょう。', difficulty: '難易度', easy: '入門', medium: '応用', hard: '挑戦', lit: '点灯数', moves: '手数',
      on: '点灯', off: '消灯', hint: '次の一手', undo: '一手戻す', reset: 'やり直す', new: '別の問題',
      help: '遊び方', close: '閉じる', boardName: '電飾看板', cell: '{row} 行 {col} 列、{state}',
      hintAt: '次は {row} 行 {col} 列の点線で囲まれたランプを押しましょう。', marked: 'ヒント',
      helpHint: '星は点灯、三日月は消灯を表します。ヒントを使うと次に押すランプが点線で囲まれます。「やり直す」で同じ問題に再挑戦できます。',
      keys: 'Tab で看板に移動し、矢印キーでランプを選び、Enter またはスペースで切り替えます。',
      win: 'すべて消えました', winDetail: '{moves} 手で街角が静かになりました。', next: '次の看板へ',
      started: '{size} × {size} の新しい看板です。', restarted: '元の問題に戻しました。', undone: '一手戻しました。',
      progress: '点灯中は {lit} 個、現在 {moves} 手です。'
    },
    ko: {
      title: '불이 꺼진 뒤', intro: '등 하나를 누르면 그 등과 상하좌우의 등이 함께 바뀝니다. 간판의 불을 모두 꺼 보세요.',
      goal: '간판의 불을 모두 끄세요.', difficulty: '난이도', easy: '입문', medium: '심화', hard: '도전', lit: '켜진 등', moves: '누른 횟수',
      on: '켜짐', off: '꺼짐', hint: '다음 수 힌트', undo: '한 수 취소', reset: '다시 시작', new: '새 문제',
      help: '게임 방법', close: '닫기', boardName: '전등 간판', cell: '{row}행 {col}열, {state}',
      hintAt: '다음은 {row}행 {col}열에서 점선으로 표시한 등을 누르세요.', marked: '힌트',
      helpHint: '별은 켜진 등, 초승달은 꺼진 등입니다. 힌트를 누르면 다음에 누를 등 하나에 점선이 생깁니다. 다시 시작하면 같은 문제를 풀 수 있습니다.',
      keys: 'Tab으로 간판에 들어가 방향키로 등을 고르고 Enter나 스페이스바로 전환하세요.',
      win: '모두 꺼졌어요', winDetail: '{moves}번 만에 거리가 고요해졌어요.', next: '다음 간판',
      started: '새 {size} × {size} 간판입니다.', restarted: '처음 문제로 돌아갔습니다.', undone: '마지막 수를 취소했습니다.',
      progress: '켜진 등 {lit}개, 누른 횟수 {moves}회.'
    },
    fr: {
      title: 'Tous feux éteints', intro: 'Touchez une lampe pour inverser son état et celui de ses voisines en croix. Éteignez toute l’enseigne.',
      goal: 'Éteignez toute l’enseigne.', difficulty: 'Difficulté', easy: 'Initiation', medium: 'Avancé', hard: 'Défi', lit: 'Allumées', moves: 'Coups',
      on: 'Allumée', off: 'Éteinte', hint: 'Un indice', undo: 'Annuler', reset: 'Rejouer', new: 'Autre grille',
      help: 'Règles du jeu', close: 'Fermer', boardName: 'Enseigne lumineuse', cell: 'Ligne {row}, colonne {col}, {state}',
      hintAt: 'Touchez la lampe en pointillé, ligne {row}, colonne {col}.', marked: 'Indice',
      helpHint: 'Une étoile brille, un croissant est éteint. L’indice entoure en pointillé la prochaine lampe à toucher. « Rejouer » rétablit la grille de départ.',
      keys: 'Accédez à l’enseigne avec Tab, choisissez une lampe avec les flèches et actionnez-la avec Entrée ou Espace.',
      win: 'Tout est éteint', winDetail: 'La rue retrouve son calme en {moves} coups.', next: 'Enseigne suivante',
      started: 'Nouvelle enseigne de {size} × {size}.', restarted: 'Grille de départ rétablie.', undone: 'Dernier coup annulé.',
      progress: 'Lampes allumées : {lit}. Coups joués : {moves}.'
    },
    de: {
      title: 'Lichter aus', intro: 'Tippe auf eine Lampe. Sie und ihre direkten Nachbarn oben, unten, links und rechts schalten um. Lösche alle Lichter.',
      goal: 'Lösche alle Lichter auf dem Schild.', difficulty: 'Stufe', easy: 'Einstieg', medium: 'Aufbau', hard: 'Profi', lit: 'Lichter an', moves: 'Züge',
      on: 'An', off: 'Aus', hint: 'Ein Tipp', undo: 'Zurück', reset: 'Neustart', new: 'Neues Rätsel',
      help: 'Spielregeln', close: 'Schließen', boardName: 'Leuchtschild', cell: 'Zeile {row}, Spalte {col}, {state}',
      hintAt: 'Tippe auf die gestrichelt umrandete Lampe in Zeile {row}, Spalte {col}.', marked: 'Tipp',
      helpHint: 'Ein Stern leuchtet, eine Mondsichel ist aus. Ein Tipp markiert die nächste Lampe mit einer gestrichelten Linie. Mit „Neustart“ setzt du dasselbe Rätsel zurück.',
      keys: 'Mit Tab zum Schild wechseln, mit den Pfeiltasten eine Lampe wählen und mit Eingabe oder Leertaste schalten.',
      win: 'Alle Lichter aus', winDetail: 'Nach {moves} Zügen kehrt Ruhe ein.', next: 'Nächstes Schild',
      started: 'Neues Schild mit {size} × {size} Lampen.', restarted: 'Ausgangsrätsel wiederhergestellt.', undone: 'Letzter Zug zurückgenommen.',
      progress: '{lit} Lampen leuchten. Bisherige Züge: {moves}.'
    },
    es: {
      title: 'Luces apagadas', intro: 'Toca una luz para cambiar su estado y el de sus vecinas en cruz. Apaga todas las luces del letrero.',
      goal: 'Apaga todas las luces del letrero.', difficulty: 'Dificultad', easy: 'Inicial', medium: 'Avanzado', hard: 'Reto', lit: 'Encendidas', moves: 'Jugadas',
      on: 'Encendida', off: 'Apagada', hint: 'Una pista', undo: 'Deshacer', reset: 'Reiniciar', new: 'Otro puzle',
      help: 'Cómo jugar', close: 'Cerrar', boardName: 'Letrero luminoso', cell: 'Fila {row}, columna {col}, {state}',
      hintAt: 'Toca la luz marcada en la fila {row}, columna {col}.', marked: 'Pista',
      helpHint: 'Las estrellas están encendidas y las lunas apagadas. La pista marca con una línea discontinua la siguiente luz. «Reiniciar» recupera el puzle original.',
      keys: 'Usa Tab para ir al letrero, las flechas para elegir una luz e Intro o Espacio para cambiarla.',
      win: 'Todo apagado', winDetail: 'La calle queda en calma en {moves} jugadas.', next: 'Siguiente letrero',
      started: 'Nuevo letrero de {size} × {size}.', restarted: 'Se ha restaurado el puzle original.', undone: 'Última jugada deshecha.',
      progress: 'Luces encendidas: {lit}. Jugadas: {moves}.'
    },
    'pt-BR': {
      title: 'Luzes apagadas', intro: 'Toque em uma luz para inverter seu estado e o das vizinhas acima, abaixo e dos lados. Apague todo o letreiro.',
      goal: 'Apague todas as luzes do letreiro.', difficulty: 'Nível', easy: 'Inicial', medium: 'Avançado', hard: 'Desafio', lit: 'Luzes acesas', moves: 'Jogadas',
      on: 'Acesa', off: 'Apagada', hint: 'Uma dica', undo: 'Desfazer', reset: 'Reiniciar', new: 'Novo jogo',
      help: 'Como jogar', close: 'Fechar', boardName: 'Letreiro luminoso', cell: 'Linha {row}, coluna {col}, {state}',
      hintAt: 'Toque na luz com contorno tracejado na linha {row}, coluna {col}.', marked: 'Dica',
      helpHint: 'As estrelas estão acesas e as luas estão apagadas. A dica marca a próxima luz com um contorno tracejado. Use “Reiniciar” para voltar ao início do mesmo jogo.',
      keys: 'Use Tab para chegar ao letreiro, as setas para escolher a luz e Enter ou Espaço para alternar.',
      win: 'Tudo apagado', winDetail: 'A rua ficou tranquila em {moves} jogadas.', next: 'Próximo letreiro',
      started: 'Novo letreiro de {size} × {size}.', restarted: 'O jogo original foi restaurado.', undone: 'A última jogada foi desfeita.',
      progress: 'Luzes acesas: {lit}. Jogadas: {moves}.'
    }
  };
  for (const entry of Object.values(messages)) entry.pageTitle = entry.title + ' · BOOPLAND';
  BooplandI18n.register('lightsOut', messages);
})();
