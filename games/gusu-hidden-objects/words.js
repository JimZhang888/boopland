(() => {
  const ids=['cat','fan','pin','cup','spool','swallow','lotus','letter'];
  // All dynamic copies are registered with the same site dictionary as the static UI.
  const keys=['title','street','map','journal','found','help','gesture','west','east','position','out','in','clue','hint','first','second','detail','close','return','opened','collected','done','ending','again','view','how','how2','curtain','take','againTitle','againBody'];
  const books={
    'zh-CN':{
      ui:['姑苏寻物记','平江河街','可拖动的姑苏河街画卷','寻物手记','已寻获','玩法','拖动画卷，轻点寻物','向西看','向东看','画卷位置','缩小','放大','线索 {n} / 08','查看提示','一 · 寻个方向','二 · 细看机关','看机关位置','合上','回到画卷','画中有了动静，再仔细看看。','寻获 · {name}','八物齐了','最后一笔落定，河街的八件小事都收进了手记。','重游河街','赏画','拖动画卷逛河街，轻点可疑的物件。船帘、竹罩和柳枝都可以拨动。','八条线索可以任意探索。点手记选一条，再翻开提示。第二页会圈出下一步该碰的地方。','轻点放大图所示乌篷船上的布帘。','机关已经打开。回到画卷，轻点红圈中的「{name}」。','再走一遍？','重游会清空这一次手记中的八个印记。'],
      items:[
        ['没淋湿的猫','两岸都落过雨，只有这团毛还是干的。','桥洞里泊着一叶乌篷，有人来唤，它才肯靠岸。','轻点石桥东头木架上的铜铃，等船划出来。'],
        ['一柄折扇','伞替它挡雨，它替人送风。','桥西的岸上，一把赭红色纸伞遮住了长凳。','轻点石桥西边的赭红纸伞，让它斜向一旁。'],
        ['柳色玉簪','一抹青玉，藏在几乎同色的枝条间。','到桥西的近岸，找一棵垂到水边的老柳。','轻点近岸大柳树垂下的那束柳条。'],
        ['青花茶盏','客人散了，一点山青还留在茶里。','过桥向东，茶摊还留着一张临水的小桌。','轻点茶桌中央的竹编罩。'],
        ['朱砂线轴','一抹朱红从蓝布下头露了出来。','沿着远岸往东走，染坊的布还挂在晾衣绳上。','轻点木杆之间的蓝染布，把它推到旁边。'],
        ['纸燕子','它有一双翅膀，却一直在等人开窗。','染坊再往东，有一扇朝河的木格窗。','轻点东街临水矮墙上的方格窗。'],
        ['莲花灯','绿色的圆盘之间，有一瓣不用入泥的花。','看看石桥以东、近岸水面上的那一丛荷叶。','轻点荷叶丛中央最大的一片圆叶。'],
        ['鱼形家书','这条鱼肚子里，装的是想说的话。','沿河走到东头，近岸有只留在石阶旁的竹篓。','轻点河街最东边、近岸竹篓上的椭圆盖子。']]
    },
    en:{
      ui:['Hidden in Gusu','Pingjiang Canal','Draggable painting of the Gusu canal','Field notes','Found','How to play','Drag to explore · tap to search','Look west','Look east','Scroll position','Zoom out','Zoom in','Clue {n} / 08','Get a hint','I · A little nudge','II · A closer look','Show the detail','Close','Back to the scroll','Something stirred. Look a little closer.','Found · {name}','All eight found','The canal is quiet again. Eight little stories fill your notebook.','Play again','View the scroll','Drag the painting to explore. Tap things that catch your eye. Curtains, covers and branches can all move.','Follow the clues in any order. Choose one in your notes and open a hint. The second page circles the next spot to touch.','Tap the cloth curtain on the boat shown in the detail.','It is uncovered. Return to the scroll and tap the circled object: {name}.','Walk the canal again?','A new walk clears the eight marks in these notes.'],
      items:[
        ['The dry cat','Both banks caught the rain. One little coat stayed dry.','A covered boat waits in the bridge arch. It needs a call from the bank.','Ring the brass bell on the wooden post at the east end of the bridge.'],
        ['Folding fan','One keeps off the rain. The other stirs the air.','West of the bridge, a russet parasol shelters a bench.','Tap the russet paper parasol on the far bank, west of the bridge.'],
        ['Jade hairpin','A sliver of jade hides among leaves of the same green.','Look for the old willow by the water on the near bank, west of the bridge.','Part the hanging tuft on the big willow on the near bank.'],
        ['Painted teacup','The guest has gone. A blue hill still floats in the tea.','East of the bridge, the tea stall has a little table by the water.','Lift the woven dome in the middle of the tea table.'],
        ['Vermilion spool','A scarlet thread peeks from under the blue.','Farther east on the far bank, the dyer has hung out the cloth.','Slide the blue cloth hanging between the two wooden poles.'],
        ['Paper swallow','Its wings are ready. The window is still shut.','Beyond the drying line, a lattice window faces the canal.','Open the square lattice shutter in the low wall on the eastern bank street.'],
        ['Lotus lantern','Among green saucers floats a flower that needs no roots.','Look at the lotus patch in the water near the near bank, east of the bridge.','Part the large round leaf in the middle of the lotus patch.'],
        ['Carp-shaped letter','This fish is full of words for someone far away.','At the eastern end, a wicker creel rests by the near-bank steps.','Lift the oval lid on the wicker creel at the far eastern end of the near bank.']]
    },
    ja:{
      ui:['姑蘇の探しもの','平江の水路','ドラッグできる姑蘇の絵巻','探しもの手帳','発見','遊び方','絵巻を動かしてタップ','西を見る','東を見る','絵巻の位置','縮小','拡大','手がかり {n} / 08','ヒントを見る','一 · 手がかり','二 · 仕掛けの場所','仕掛けを見る','閉じる','絵巻に戻る','絵の中で何かが動いた。もう一度よく見よう。','発見 · {name}','八つとも発見','川辺の小さな物語が八つ、手帳にそろいました。','もう一度遊ぶ','絵巻を眺める','絵巻をドラッグし、気になる物をタップ。舟の幕や竹の覆い、柳の枝も動かせます。','順番は自由です。手帳の項目を選んでヒントを開くと、二枚目で次に触れる場所が分かります。','拡大図にある舟の日よけの幕をタップ。','仕掛けが開きました。絵巻に戻り、丸で囲んだ「{name}」をタップ。','もう一度歩きますか？','手帳の印をすべて消して、最初から遊びます。'],
      items:[
        ['濡れていない猫','雨上がりの川辺で、この毛並みだけは乾いたまま。','橋の下の屋根舟は、岸から呼ばれるのを待っています。','石橋の東側にある木の支柱の鈴を鳴らそう。'],
        ['扇子','雨をしのぐものの下に、涼を呼ぶものが眠る。','橋の西、向こう岸の赤茶色の傘が長椅子を覆っています。','橋の西にある赤茶色の唐傘を傾けよう。'],
        ['翡翠のかんざし','葉とよく似た色の、小さな翡翠。','橋の西、手前の岸に枝の垂れた古い柳があります。','手前の大柳から垂れる枝の束を払おう。'],
        ['染付の茶碗','客が去っても、青い山の絵が残りました。','橋の東、茶店の水辺に小さな卓があります。','茶卓の真ん中にある竹の覆いを上げよう。'],
        ['朱色の糸巻き','藍色の布の下から、赤い糸がのぞきます。','向こう岸を東へ進むと、染物屋の物干しがあります。','二本の支柱の間に干した藍色の布をずらそう。'],
        ['紙のつばめ','翼はあるのに、窓が開くのを待っています。','物干しよりも東、川に面した格子窓を探しましょう。','東の通りの低い塀にある格子戸を開こう。'],
        ['蓮の灯籠','丸い緑の皿の間に、根のない花が浮かぶ。','橋の東、手前の岸に近い水面の蓮を見て。','蓮の群れの真ん中にある丸い大きな葉を動かそう。'],
        ['鯉の形の手紙','魚のお腹には、大切な言葉がいっぱい。','川の東の端、手前の岸の石段に魚籠があります。','東の端にある魚籠の楕円のふたを上げよう。']]
    },
    ko:{
      ui:['고소의 숨은 물건','핑장 물길','드래그할 수 있는 고소의 강마을 그림','탐색 수첩','발견','놀이 방법','그림을 끌고 물건을 누르세요','서쪽 보기','동쪽 보기','그림 위치','축소','확대','단서 {n} / 08','힌트 보기','하나 · 실마리','둘 · 자세히 보기','위치 보기','닫기','그림으로','무언가 움직였어요. 조금 더 살펴보세요.','발견 · {name}','여덟 개 모두 발견','강가의 작은 이야기 여덟 편이 수첩에 담겼어요.','다시 걷기','그림 감상','그림을 끌어 둘러보고 눈길이 가는 곳을 누르세요. 배의 휘장과 대나무 덮개, 버드나무 가지도 움직여요.','찾는 순서는 자유예요. 수첩에서 단서를 고르고 힌트를 펼치세요. 두 번째 쪽의 동그라미가 다음에 누를 곳이에요.','확대 그림 속 배에 드리운 천 휘장을 누르세요.','이제 드러났어요. 그림으로 돌아가 동그라미 속 물건을 누르세요. {name}','처음부터 다시 걸을까요?','다시 시작하면 수첩의 발견 표시가 지워져요.'],
      items:[
        ['비를 피한 고양이','양쪽 물가가 젖었는데 이 털만 보송해요.','다리 아래의 지붕 배는 물가에서 부르는 소리를 기다려요.','돌다리 동쪽 끝 나무 기둥에 달린 방울을 울리세요.'],
        ['접부채','비를 막는 물건 아래에 바람을 일으키는 물건이 있어요.','다리 서쪽 건너편에 적갈색 양산이 긴 의자를 가리고 있어요.','다리 서쪽의 적갈색 종이 양산을 기울이세요.'],
        ['옥비녀','나뭇잎과 꼭 닮은 초록빛 옥이에요.','다리 서쪽, 가까운 물가로 가지를 드리운 늙은 버드나무를 찾으세요.','가까운 물가 큰 버드나무의 늘어진 가지 다발을 젖히세요.'],
        ['청화 찻잔','손님은 떠나도 푸른 산 하나가 찻물에 남았어요.','다리 동쪽 찻집 앞 물가에 작은 탁자가 놓여 있어요.','찻상 가운데 놓인 대나무 덮개를 드세요.'],
        ['주홍 실타래','파란 천 밑에서 붉은 실이 고개를 내밀어요.','건너편 물가를 따라 동쪽으로 가면 염색집 빨랫줄이 보여요.','두 나무 기둥 사이에 걸린 파란 천을 옆으로 미세요.'],
        ['종이 제비','날개를 펴고 창문이 열리기를 기다려요.','빨랫줄에서 더 동쪽으로 가면 강을 보는 격자창이 있어요.','동쪽 길의 낮은 벽에 난 네모난 격자창을 여세요.'],
        ['연꽃등','초록 접시들 사이에 뿌리 없는 꽃이 떠 있어요.','다리 동쪽, 가까운 물가에 모인 연잎을 살펴보세요.','연잎 무리 한가운데의 크고 둥근 잎을 젖히세요.'],
        ['잉어 편지','이 물고기 배에는 전하고 싶은 말이 가득해요.','동쪽 끝, 가까운 물가 돌계단 옆에 대바구니가 있어요.','동쪽 끝 가까운 물가의 대바구니에서 타원형 뚜껑을 드세요.']]
    },
    fr:{
      ui:['Les secrets de Gusu','Canal de Pingjiang','Vue du canal de Gusu à déplacer','Carnet de recherche','Trouvés','Règles','Faites glisser et touchez','Voir à l’ouest','Voir à l’est','Position dans le rouleau','Réduire','Agrandir','Indice {n} / 08','Un indice','I · Sur la piste','II · À la loupe','Voir le détail','Fermer','Revenir au canal','Quelque chose a bougé. Regardez de plus près.','Trouvé · {name}','Les huit sont là','Huit petites histoires du canal ont rejoint votre carnet.','Rejouer','Contempler','Faites glisser le paysage et touchez les objets. Rideaux, couvercles et branches peuvent bouger.','Suivez les pistes dans l’ordre de votre choix. Choisissez un indice dans le carnet. Sa seconde page entoure le prochain endroit à toucher.','Touchez le rideau en toile sur la barque indiquée.','La cachette est ouverte. Revenez au canal et touchez l’objet entouré : {name}.','Repartir en balade ?','Une nouvelle partie efface les marques du carnet.'],
      items:[
        ['Le chat au sec','Les deux rives sont trempées, mais un pelage est resté sec.','Une barque couverte attend sous le pont qu’on l’appelle depuis la berge.','Sonnez la cloche en laiton du poteau à l’est du pont.'],
        ['L’éventail','L’un abrite de la pluie, l’autre donne de l’air.','À l’ouest du pont, une ombrelle rousse abrite un banc sur la rive opposée.','Inclinez l’ombrelle rousse à l’ouest du pont.'],
        ['L’épingle de jade','Un éclat de jade se fond parmi les feuilles vertes.','À l’ouest du pont, cherchez le vieux saule sur la rive la plus proche.','Écartez la touffe de branches pendantes du grand saule au premier plan.'],
        ['La tasse peinte','Le client est parti. Une colline bleue flotte encore dans le thé.','À l’est du pont, une petite table du marchand de thé donne sur l’eau.','Soulevez la cloche en bambou tressé au milieu de la table.'],
        ['La bobine vermillon','Un fil rouge dépasse sous le tissu bleu.','Plus à l’est, le teinturier a étendu son linge sur la rive opposée.','Faites glisser le tissu bleu entre les deux poteaux.'],
        ['L’hirondelle en papier','Ses ailes sont prêtes. La fenêtre est encore fermée.','Après le linge, une fenêtre à croisillons donne sur le canal.','Ouvrez le volet carré à croisillons dans le muret de la rue à l’est.'],
        ['Le lampion lotus','Parmi les soucoupes vertes flotte une fleur sans racines.','À l’est du pont, regardez les lotus dans l’eau près de la rive au premier plan.','Écartez la grande feuille ronde au milieu des lotus.'],
        ['La lettre-carpe','Ce poisson a le ventre plein de mots tendres.','Tout à l’est, un panier de pêche attend près des marches de la rive au premier plan.','Soulevez le couvercle ovale du panier de pêche à la pointe est.']]
    },
    de:{
      ui:['Verborgen in Gusu','Pingjiang-Kanal','Verschiebbares Bild des Kanals von Gusu','Fundbuch','Gefunden','Spielanleitung','Bild ziehen · Dinge antippen','Nach Westen','Nach Osten','Position im Bild','Verkleinern','Vergrößern','Spur {n} / 08','Hinweis','I · Eine erste Spur','II · Unter der Lupe','Detail ansehen','Schließen','Zurück zum Bild','Da hat sich etwas bewegt. Schau genauer hin.','Gefunden · {name}','Alle acht gefunden','Acht kleine Geschichten vom Kanal stehen jetzt in deinem Fundbuch.','Erneut spielen','Bild ansehen','Ziehe das Bild und tippe verdächtige Dinge an. Vorhänge, Hauben und Zweige lassen sich bewegen.','Wähle eine beliebige Spur im Fundbuch. Auf der zweiten Hinweisseite ist eingekreist, wo du als Nächstes tippen kannst.','Tippe auf den Stoffvorhang am Boot im Bildausschnitt.','Das Versteck ist offen. Tippe im Bild auf den eingekreisten Fund: {name}.','Noch einmal von vorn?','Bei einem neuen Rundgang werden alle Fundmarken gelöscht.'],
      items:[
        ['Die trockene Katze','Beide Ufer sind nass. Nur ein kleines Fell blieb trocken.','Ein überdachtes Boot unter der Brücke wartet auf einen Ruf vom Ufer.','Läute die Messingglocke am Holzpfosten am östlichen Brückenende.'],
        ['Der Faltfächer','Das eine hält Regen ab, das andere fächelt Luft.','Westlich der Brücke beschattet ein rostroter Schirm eine Bank am anderen Ufer.','Kippe den rostroten Papierschirm westlich der Brücke.'],
        ['Die Jadehaarnadel','Ein Stück Jade trägt das Grün der Blätter.','Suche am nahen Ufer westlich der Brücke nach der alten Weide.','Schiebe das herabhängende Zweigbüschel an der großen Weide zur Seite.'],
        ['Die Teeschale','Der Gast ist fort. Ein blauer Hügel schwimmt noch im Tee.','Östlich der Brücke steht ein kleiner Teetisch am Wasser.','Hebe die geflochtene Bambushaube in der Mitte des Teetischs an.'],
        ['Die rote Garnrolle','Ein roter Faden lugt unter blauem Stoff hervor.','Weiter östlich hängt die Wäsche des Färbers am anderen Ufer.','Schiebe das blaue Tuch zwischen den beiden Holzpfosten zur Seite.'],
        ['Die Papierschwalbe','Ihre Flügel sind bereit. Das Fenster ist noch zu.','Hinter der Wäscheleine blickt ein Gitterfenster zum Kanal.','Öffne den quadratischen Gitterladen in der niedrigen Mauer an der östlichen Uferstraße.'],
        ['Die Lotuslaterne','Zwischen grünen Tellern schwimmt eine Blüte ohne Wurzeln.','Östlich der Brücke wachsen Lotusblätter im Wasser nahe dem vorderen Ufer.','Bewege das große runde Blatt in der Mitte der Lotusgruppe.'],
        ['Der Karpfenbrief','Dieser Fisch trägt Worte für einen lieben Menschen im Bauch.','Ganz im Osten steht bei den Stufen am nahen Ufer ein Fischkorb.','Hebe den ovalen Deckel des Fischkorbs ganz im Osten am nahen Ufer an.']]
    },
    es:{
      ui:['Los secretos de Gusu','Canal de Pingjiang','Ilustración desplazable del canal de Gusu','Cuaderno de pistas','Hallados','Cómo jugar','Arrastra y toca para buscar','Mirar al oeste','Mirar al este','Posición del rollo','Alejar','Acercar','Pista {n} / 08','Ver pista','I · Una orientación','II · De cerca','Ver el detalle','Cerrar','Volver al canal','Algo se ha movido. Mira de cerca.','Hallazgo · {name}','Los ocho hallazgos','Tu cuaderno guarda ya ocho pequeñas historias del canal.','Volver a jugar','Contemplar','Arrastra el paisaje y toca lo que te llame la atención. Puedes mover cortinas, tapas y ramas.','Sigue las pistas en cualquier orden. Elige una en el cuaderno. La segunda página señala el próximo punto que debes tocar.','Toca la cortina de tela de la barca que se ve en el detalle.','Ya está al descubierto. Vuelve al canal y toca el objeto marcado: {name}.','¿Recorrer el canal otra vez?','Al empezar de nuevo se borrarán las marcas del cuaderno.'],
      items:[
        ['El gato seco','Llovió en las dos orillas, pero este pelaje no se mojó.','Una barca cubierta espera bajo el puente a que la llamen desde la orilla.','Toca la campana de latón del poste en el extremo este del puente.'],
        ['El abanico','Uno da sombra y el otro da aire.','Al oeste del puente, una sombrilla rojiza cubre un banco en la orilla de enfrente.','Inclina la sombrilla de papel rojiza al oeste del puente.'],
        ['La horquilla de jade','Un destello de jade se esconde entre hojas del mismo verde.','Busca el viejo sauce junto al agua, en la orilla cercana, al oeste del puente.','Aparta el manojo de ramas colgantes del gran sauce de la orilla cercana.'],
        ['La taza pintada','El invitado se fue. Una colina azul sigue flotando en el té.','Al este del puente hay una mesita junto al agua en el puesto de té.','Levanta la cubierta de bambú trenzado en el centro de la mesa.'],
        ['El carrete bermellón','Un hilo rojo asoma bajo el paño azul.','Más al este, el tintorero ha tendido las telas en la orilla de enfrente.','Desliza la tela azul tendida entre los dos postes de madera.'],
        ['La golondrina de papel','Tiene las alas listas. Solo espera que abran la ventana.','Más allá del tendedero verás una ventana de celosía que da al canal.','Abre la contraventana cuadrada de celosía en el muro bajo de la calle oriental.'],
        ['El farol de loto','Entre platos verdes flota una flor sin raíces.','Al este del puente verás un grupo de hojas de loto junto a la orilla cercana.','Aparta la hoja redonda grande del centro del grupo.'],
        ['La carta carpa','Este pez lleva palabras para alguien que está lejos.','En el extremo este, una cesta de pesca espera junto a los escalones de la orilla cercana.','Levanta la tapa ovalada de la cesta en el extremo este de la orilla cercana.']]
    },
    'pt-BR':{
      ui:['Os segredos de Gusu','Canal de Pingjiang','Pintura do canal de Gusu que pode ser arrastada','Caderno de pistas','Achados','Como jogar','Arraste e toque para procurar','Olhar a oeste','Olhar a leste','Posição no pergaminho','Afastar','Aproximar','Pista {n} / 08','Ver dica','I · Um empurrãozinho','II · Mais de perto','Ver o detalhe','Fechar','Voltar ao canal','Algo se mexeu. Olhe mais de perto.','Achado · {name}','Os oito achados','Seu caderno agora guarda oito pequenas histórias do canal.','Jogar de novo','Ver a pintura','Arraste a paisagem e toque no que chamar sua atenção. Cortinas, tampas e galhos podem se mover.','Siga as pistas na ordem que quiser. Escolha uma no caderno. A segunda página marca o próximo ponto a tocar.','Toque na cortina de pano do barco mostrado no detalhe.','O esconderijo está aberto. Volte ao canal e toque no objeto marcado: {name}.','Passear de novo?','Um novo passeio apaga as marcas deste caderno.'],
      items:[
        ['O gato sequinho','Choveu nas duas margens, mas esse pelo ficou seco.','Um barco coberto espera sob a ponte até alguém chamar da margem.','Toque o sino de latão no poste de madeira na ponta leste da ponte.'],
        ['O leque','Um protege da chuva. O outro faz o ar circular.','A oeste da ponte, uma sombrinha avermelhada cobre um banco na outra margem.','Incline a sombrinha de papel avermelhada a oeste da ponte.'],
        ['O grampo de jade','Um pedacinho de jade se esconde entre folhas do mesmo verde.','Procure o velho salgueiro na beira da água, na margem mais próxima, a oeste da ponte.','Afaste o tufo de galhos pendentes do grande salgueiro na margem próxima.'],
        ['A xícara pintada','A visita se foi. Uma colina azul ainda flutua no chá.','A leste da ponte, há uma mesinha à beira do canal na barraca de chá.','Levante a cúpula de bambu trançado no meio da mesa.'],
        ['O carretel vermelho','Uma linha vermelha aparece por baixo do pano azul.','Mais a leste, o tintureiro estendeu seus tecidos na outra margem.','Deslize o pano azul pendurado entre os dois postes.'],
        ['A andorinha de papel','As asas estão prontas. Só falta abrir a janela.','Depois do varal, uma janela de treliça dá para o canal.','Abra a janela quadrada de treliça no muro baixo da rua a leste.'],
        ['A lanterna de lótus','Entre pratos verdes flutua uma flor sem raízes.','A leste da ponte, procure as folhas de lótus na água, junto à margem próxima.','Afaste a folha redonda grande no centro do grupo de lótus.'],
        ['A carta em forma de carpa','Esse peixe guarda na barriga palavras para quem está longe.','Na ponta leste, um cesto de pesca está junto à escada da margem próxima.','Levante a tampa oval do cesto no extremo leste da margem próxima.']]
    }
  };
  const messages={};
  for(const [lang,{ui,items}] of Object.entries(books)){
    const book=Object.fromEntries(keys.map((k,i)=>[k,ui[i]]));
    items.forEach((row,i)=>['name','verse','nudge','precise'].forEach((field,j)=>book[ids[i]+'.'+field]=row[j]));
    book.locate={'zh-CN':'移到此处',en:'Go to this spot',ja:'この場所へ',ko:'이곳으로 이동',fr:'Voir cet endroit',de:'Zur Fundstelle',es:'Ir a este punto','pt-BR':'Ir até aqui'}[lang];
    messages[lang]=book;
  }
  BooplandI18n.register('gusu',messages);
})();
