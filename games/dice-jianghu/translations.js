/* Each row has the same keys and interpolation parameters in all eight languages. */
(() => {
  const keys = ['title','subtitle','hero','help','close','duel','dice','manual','manualCaption','intent','commit','restart','autosave','chapter','round','place0','place1','place2','place3','place4','place5','foe0','foe1','foe2','foe3','foe4','foe5','intentStrike','intentGuard','intentHeavy','attack','guard','heal','attackRule','guardRule','healRule','inch','redirect','return','harmony','inchHint','redirectHint','returnHint','harmonyHint','roll','reroll','rerollUsed','pickDie','pickLane','allAssigned','dieLabel','returnDie','emptyDie','damage','incoming','healing','allocate','readyNote','planNote','lastNote','best','help1','help2','help3','help4','keyboard','continue','restartTitle','restartDesc','cancel','rewardTitle','rewardDesc','blade','guardUpgrade','heart','bladeDesc','guardDesc','heartDesc','won','lost','wonDesc','lostDesc','score','result','newGame','equipped','active','next','lethal'];
  const rows = {
    'zh-CN': [
      '骰隐江湖','一掷有数，进退由心。','无名少侠','玩法与招式','关闭','江湖比武','掌中四骰','以骰入招','江湖手记 · 招式篇','对手下一招','见招拆招','重新闯荡','随手落骰，随时续局','第 {n} / 6 关','回合 {n}',
      '竹林初会','溪桥问剑','古寺听风','雪岭试锋','云台论武','青山掌门','竹林剑客','渡桥刀客','行脚武僧','雪岭游侠','云台剑师','青山掌门',
      '平刺 · 攻 {attack}','守势 · 攻 {attack} / 挡 {guard}','蓄力重击 · 攻 {attack}',
      '出招','格挡','调息','点数之和 → 伤害','点数之和 → 护盾','点数之和 → 回血','寸劲','借力','归元','三才',
      '寸劲：两枚 1–2 点，伤害 +7','借力：1 + 2，盾 +6；全挡反击 4','归元：一对相同小点（≤3），回血 +5','三才：用出 1、2、3 → 攻 +3 / 盾 +3 / 血 +2',
      '掷出四骰','重掷此骰 · 1','重掷已用','先选一枚骰子','再点一项招式','四骰就位','第 {n} 枚骰子，{value} 点','取回第 {n} 枚骰子，{value} 点','第 {n} 枚骰子待掷','造成','承受','恢复','再分配 {n} 枚','先掷骰，看清来招，再做打算。','点已放入招式的骰子，可取回重分配。','上回合：伤敌 {damage} · 受伤 {counter} · 回血 {healing} · 反击 {riposte}','最佳 {n}',
      '每回合掷 4 枚骰子。点击一枚，再点击出招、格挡或调息。点招式内的骰子可取回；全部分配后出手。每回合可重掷一枚未分配的骰子一次。',
      '出招造成点数之和的伤害；格挡抵消本回合来袭，下一回合清空；调息先回血。你先出招，击败对手就不会受到反击。敌人守势会抵消你的伤害。',
      '小点数也有用：出招放两枚 1–2 点，伤害 +7；格挡放 1 和 2，盾 +6，完全挡住时反击 4；调息放一对相同的 1、2 或 3，回血 +5。用出的骰子含 1、2、3 时，额外攻 +3、盾 +3、血 +2。每种连招每回合触发一次。',
      '连闯六关。每胜一场可选一部心法并恢复体力。对手每过 4 回合攻击 +2，久守并非上策。游戏自动保存，刷新可续局；没有计时压力。',
      '键盘：1–4 选骰或取回，A / D / H 分配，R 掷骰或重掷，空格出手，Esc 关闭说明。',
      '继续闯荡','重走江湖？','这会结束当前旅程，最佳成绩仍会保留。','继续本局','此战告捷','选一部心法，整理行囊再出发。','磨剑','铁衣','养气','出招时伤害 +2；恢复 9 体力','格挡时护盾 +2；恢复 9 体力','生命上限 +6；调息 +1；恢复 14 体力','一骰入江湖，六战成名','胜败寻常，再走一程','青山作证，这一程的进退皆由你。','把这次的招式记下，下回再来。','江湖声望 {n}','过关 {cleared}/6 · 连招 {combos} · 出手 {turns}','再闯江湖','剑 {blade} · 衣 {guard} · 气 {heart}','已触发','前往下一关','此招有险'
    ],
    en: [
      'Dice & Jianghu','Let the dice fall. Choose your path.','Young wanderer','How to play','Close','Martial duel','Four dice','Shape your moves','A WANDERER’S NOTEBOOK','Foe’s next move','Make your move','New journey','Your journey saves itself','Duel {n} / 6','Turn {n}',
      'Bamboo grove','River bridge','Quiet temple','Snowy ridge','Cloud terrace','Green mountain','Bamboo swordsman','Bridge duelist','Wandering monk','Snow ranger','Cloud swordmaster','Mountain master',
      'Strike · ATK {attack}','Guard · ATK {attack} / Block {guard}','Heavy strike · ATK {attack}',
      'Strike','Guard','Recover','Dice total → damage','Dice total → block','Dice total → health','Short strike','Redirect','Inner peace','Three harmonies',
      'Short strike: two dice of 1–2 → +7 damage','Redirect: 1 + 2 → +6 block; full block counters for 4','Inner peace: matching pair ≤3 → +5 healing','Use 1, 2, 3 → +3 attack / +3 block / +2 health',
      'Roll four dice','Reroll · 1 left','Reroll used','Choose a die','Choose a move','All dice placed','Die {n}, value {value}','Return die {n}, value {value}','Die {n}, not rolled','Deal','Take','Heal','Place {n} more','Roll, read the next move, then choose your response.','Click a placed die to take it back.','Last: dealt {damage} · took {counter} · healed {healing} · countered {riposte}','Best {n}',
      'Roll four dice each turn. Choose a die, then Strike, Guard or Recover. Click a placed die to take it back. Place all four before acting. Once per turn, reroll one unplaced die.',
      'Strike deals the dice total. Guard blocks damage this turn only. Recover heals before combat. You strike first: defeating a foe prevents their attack. A guarding foe reduces your damage.',
      'Small dice unlock skills: two dice of 1–2 in Strike add 7 damage. A 1 and 2 in Guard add 6 block and counter for 4 on a full block. A matching pair of 1, 2 or 3 in Recover adds 5 healing. Using 1, 2 and 3 anywhere adds 3 attack, 3 block and 2 healing. Each skill triggers once per turn.',
      'Win six duels. Between duels, choose a permanent skill and restore health. Foes gain 2 attack every four turns, so do not wait forever. Progress saves automatically. There is no timer.',
      'Keys: 1–4 select or return dice; A / D / H assign; R roll or reroll; Space act; Esc close help.',
      'Continue','Start again?','Your current journey will end. Your best score stays.','Keep playing','A duel well fought','Choose a skill and prepare for the road ahead.','Hone blade','Iron robe','Cultivate qi','+2 damage when striking; heal 9','+2 block when guarding; heal 9','+6 max health; +1 when recovering; heal 14','Six duels. A name to remember.','Another journey awaits','The mountain remembers every choice you made.','Keep what you learned. Return with a new plan.','Renown {n}','Duels {cleared}/6 · Skills {combos} · Turns {turns}','Travel again','Blade {blade} · Robe {guard} · Qi {heart}','Active','Next duel','Danger'
    ],
    ja: [
      '骰子の江湖','骰子を振り、進退を選ぶ。','名もなき侠客','遊び方と技','閉じる','武術の決闘','手の中の四骰','骰子で技を紡ぐ','旅人の手帖 · 技の巻','相手の次の技','技を放つ','旅をやり直す','旅の途中は自動保存','第 {n} / 6 戦','手番 {n}',
      '竹林の出会い','川橋の剣','静寂の寺','雪の峠','雲の高台','青山の掌門','竹林の剣客','橋の刀客','旅の僧','雪山の侠客','雲台の剣師','青山の掌門',
      '突き · 攻 {attack}','守勢 · 攻 {attack} / 盾 {guard}','渾身の一撃 · 攻 {attack}',
      '攻撃','防御','調息','目の合計 → ダメージ','目の合計 → 防御','目の合計 → 回復','寸勁','借力','帰元','三才',
      '寸勁：1〜2を2個 → ダメージ +7','借力：1 + 2 → 盾 +6、完全防御で反撃4','帰元：同じ小さな目の組（≤3）→ 回復 +5','1・2・3を使用 → 攻 +3 / 盾 +3 / 回復 +2',
      '四骰を振る','振り直す · 残り1','振り直し済み','骰子を選ぶ','技を選ぶ','配置完了','骰子 {n}、{value} の目','骰子 {n}、{value} の目を戻す','骰子 {n}、未使用','与える','受ける','回復','あと {n} 個配置','骰子を振り、相手の技を見て進退を決めよう。','配置した骰子を押すと手元に戻せます。','前回：与 {damage} · 被 {counter} · 回復 {healing} · 反撃 {riposte}','最高 {n}',
      '毎手番4個振ります。骰子を選んで攻撃・防御・調息に配置。置いた骰子は押すと戻せます。4個すべて配置してから技を放ちます。未配置の1個を毎手番1回だけ振り直せます。',
      '攻撃は目の合計のダメージ、防御はこの手番だけ被害を軽減、調息は戦闘前に回復します。あなたが先手で、相手を倒せば攻撃されません。相手の守勢は与えるダメージを減らします。',
      '攻撃に1〜2を2個でダメージ+7。防御に1と2で盾+6、完全防御なら反撃4。調息に同じ1・2・3の組で回復+5。どの技でも1・2・3を使えば攻+3、盾+3、回復+2。各技は毎手番1回発動します。',
      '全6戦。勝利ごとに心法を選び、体力を回復。相手は4手番ごとに攻撃が2増えるので長期戦に注意。進行は自動保存。時間制限はありません。',
      'キー：1〜4で選択・回収、A / D / Hで配置、Rで振る・振り直す、空白で実行、Escで説明を閉じる。',
      '旅を続ける','最初から旅をする？','今の旅は終了します。最高記録は残ります。','この旅を続ける','見事な勝利','心法を一つ選んで、次の旅路へ。','研剣','鉄衣','養気','攻撃時ダメージ +2、体力9回復','防御時盾 +2、体力9回復','最大体力 +6、調息 +1、体力14回復','六戦を越え、名を刻む','また一歩、江湖へ','青山はあなたの選択を覚えています。','学んだ技を胸に、もう一度。','名声 {n}','勝利 {cleared}/6 · 技 {combos} · 手番 {turns}','再び旅立つ','剣 {blade} · 衣 {guard} · 気 {heart}','発動','次の決闘へ','危険'
    ],
    ko: [
      '주사위 강호','주사위를 던지고 길을 고르세요.','무명의 협객','놀이와 무공','닫기','강호 대결','손안의 네 주사위','주사위 무공','강호 수첩 · 무공편','상대의 다음 수','무공 펼치기','새로운 여정','여정은 자동 저장됩니다','대결 {n} / 6','턴 {n}',
      '대나무 숲','강 위의 다리','고요한 절','눈 덮인 고개','구름 누각','청산 장문','죽림 검객','다리의 도객','떠돌이 승려','설산 협객','운대 검술사','청산 장문',
      '찌르기 · 공격 {attack}','방어 · 공격 {attack} / 방패 {guard}','강타 · 공격 {attack}',
      '공격','방어','회복','눈의 합 → 피해','눈의 합 → 방패','눈의 합 → 체력','촌경','차력','귀원','삼재',
      '촌경: 1~2 주사위 두 개 → 피해 +7','차력: 1 + 2 → 방패 +6, 완전 방어 시 반격 4','귀원: 같은 작은 눈 한 쌍(≤3) → 회복 +5','1, 2, 3 사용 → 공격 +3 / 방패 +3 / 체력 +2',
      '네 개 던지기','다시 던지기 · 1','다시 던지기 소진','주사위 선택','무공 선택','배치 완료','주사위 {n}, 눈 {value}','주사위 {n}, 눈 {value} 회수','주사위 {n}, 던지기 전','가한 피해','받는 피해','회복','{n}개 더 배치','주사위를 던지고 상대의 수를 읽으세요.','배치한 주사위를 누르면 되돌릴 수 있어요.','지난 턴: 공격 {damage} · 피해 {counter} · 회복 {healing} · 반격 {riposte}','최고 {n}',
      '매 턴 주사위 네 개를 던집니다. 하나를 선택한 뒤 공격, 방어, 회복에 배치하세요. 놓인 주사위를 누르면 회수됩니다. 네 개를 모두 배치해야 행동합니다. 매 턴 미배치 주사위 하나를 한 번 다시 던질 수 있습니다.',
      '공격은 눈의 합만큼 피해를 줍니다. 방어는 이번 턴만 적용되고 회복은 전투 전에 이루어집니다. 먼저 공격하므로 상대를 쓰러뜨리면 반격을 받지 않습니다. 상대의 방어는 피해를 줄입니다.',
      '공격에 1~2 두 개로 피해 +7. 방어에 1과 2로 방패 +6, 완전 방어 시 반격 4. 회복에 같은 1, 2, 3 한 쌍으로 회복 +5. 어디든 1, 2, 3을 쓰면 공격 +3, 방패 +3, 체력 +2. 무공은 턴당 한 번 발동합니다.',
      '여섯 대결에서 승리하세요. 승리하면 영구 무공을 고르고 체력을 회복합니다. 상대 공격은 네 턴마다 2 증가합니다. 진행은 자동 저장되며 시간제한은 없습니다.',
      '키: 1~4 선택·회수, A / D / H 배치, R 던지기·다시 던지기, 스페이스 실행, Esc 설명 닫기.',
      '계속하기','처음부터 시작할까요?','현재 여정은 끝나지만 최고 점수는 유지됩니다.','현재 여정 계속','멋진 승리','무공을 고르고 다음 길을 준비하세요.','검 연마','철의','양기','공격할 때 피해 +2, 체력 9 회복','방어할 때 방패 +2, 체력 9 회복','최대 체력 +6, 회복 +1, 체력 14 회복','여섯 대결, 강호에 이름을 남기다','다음 여정이 기다립니다','청산은 당신의 선택을 기억합니다.','배운 무공을 기억하고 다시 도전하세요.','명성 {n}','승리 {cleared}/6 · 무공 {combos} · 턴 {turns}','다시 떠나기','검 {blade} · 의 {guard} · 기 {heart}','발동','다음 대결','위험'
    ],
    fr: [
      'Dés du Jianghu','Lancez les dés. Tracez votre voie.','Jeune vagabond','Règles et techniques','Fermer','Duel martial','Quatre dés','Dessinez vos gestes','CARNET DE VOYAGE','Prochain geste adverse','Jouer le tour','Nouveau voyage','Votre voyage est sauvegardé','Duel {n} / 6','Tour {n}',
      'Bambouseraie','Pont de rivière','Temple paisible','Crête enneigée','Terrasse des nuages','Montagne verte','Épéiste des bambous','Duelliste du pont','Moine errant','Rôdeur des neiges','Maître des nuages','Maître de la montagne',
      'Frappe · ATQ {attack}','Garde · ATQ {attack} / Bloc {guard}','Frappe lourde · ATQ {attack}',
      'Frapper','Parer','Soigner','Somme → dégâts','Somme → parade','Somme → vie','Coup bref','Déviation','Paix intérieure','Trois harmonies',
      'Coup bref : deux dés de 1–2 → +7 dégâts','Déviation : 1 + 2 → +6 parade ; parade totale : riposte 4','Paix : paire identique ≤3 → +5 soins','Jouer 1, 2, 3 → +3 attaque / +3 parade / +2 vie',
      'Lancer les dés','Relancer · 1','Relance utilisée','Choisissez un dé','Choisissez un geste','Dés placés','Dé {n}, valeur {value}','Reprendre le dé {n}, valeur {value}','Dé {n}, non lancé','Infligés','Subis','Soins','Encore {n} dés','Lancez, observez le prochain geste, puis répondez.','Cliquez sur un dé placé pour le reprendre.','Avant : infligés {damage} · subis {counter} · soins {healing} · riposte {riposte}','Record {n}',
      'Lancez quatre dés par tour. Choisissez un dé puis Frapper, Parer ou Soigner. Cliquez sur un dé placé pour le reprendre. Placez les quatre avant de jouer. Une fois par tour, relancez un dé non placé.',
      'Frapper inflige la somme des dés. Parer bloque ce tour seulement. Soigner rend de la vie avant le combat. Vous frappez en premier : un ennemi vaincu ne riposte pas. Sa garde réduit vos dégâts.',
      'Deux dés de 1–2 en attaque ajoutent 7 dégâts. Un 1 et un 2 en parade ajoutent 6 de blocage et une riposte de 4 si tout est bloqué. Une paire de 1, 2 ou 3 en soin ajoute 5 soins. Jouer 1, 2 et 3 partout ajoute 3 attaque, 3 parade et 2 soins. Chaque technique se déclenche une fois par tour.',
      'Gagnez six duels. Entre les combats, choisissez une technique permanente et récupérez de la vie. Les ennemis gagnent 2 attaque tous les quatre tours. Sauvegarde automatique, sans chronomètre.',
      'Touches : 1–4 choisir ou reprendre ; A / D / H placer ; R lancer ou relancer ; Espace jouer ; Échap fermer les règles.',
      'Continuer','Recommencer ?','Le voyage actuel prendra fin. Votre record reste.','Poursuivre','Belle victoire','Choisissez une technique avant de reprendre la route.','Aiguiser','Robe de fer','Cultiver le qi','+2 dégâts en attaquant ; soigne 9','+2 parade en défendant ; soigne 9','+6 vie max ; +1 en soin ; soigne 14','Six duels, un nom inoubliable','Un autre voyage vous attend','La montagne se souvient de chacun de vos choix.','Gardez vos leçons et revenez avec un nouveau plan.','Renommée {n}','Duels {cleared}/6 · Techniques {combos} · Tours {turns}','Repartir','Lame {blade} · Robe {guard} · Qi {heart}','Actif','Duel suivant','Danger'
    ],
    de: [
      'Würfel des Jianghu','Die Würfel fallen. Du wählst den Weg.','Junger Wanderer','Regeln und Techniken','Schließen','Kampfkunstduell','Vier Würfel','Forme deine Züge','REISENOTIZEN','Nächster Gegnerzug','Zug ausführen','Neue Reise','Deine Reise wird gespeichert','Duell {n} / 6','Runde {n}',
      'Bambushain','Flussbrücke','Stiller Tempel','Schneegrat','Wolkenterrasse','Grüner Berg','Bambusschwertkämpfer','Brückenduellant','Wandermönch','Schneeläufer','Wolkenschwertmeister','Bergmeister',
      'Hieb · ANG {attack}','Deckung · ANG {attack} / Block {guard}','Schwerer Hieb · ANG {attack}',
      'Angriff','Block','Heilung','Augensumme → Schaden','Augensumme → Block','Augensumme → Leben','Kurzer Hieb','Umlenken','Innere Ruhe','Drei Harmonien',
      'Kurzer Hieb: zwei Würfel mit 1–2 → +7 Schaden','Umlenken: 1 + 2 → +6 Block; voller Block: Konter 4','Ruhe: gleiches Paar ≤3 → +5 Heilung','1, 2, 3 nutzen → +3 Angriff / +3 Block / +2 Leben',
      'Würfeln','Neu würfeln · 1','Neuwurf genutzt','Würfel wählen','Zug wählen','Alle platziert','Würfel {n}, Wert {value}','Würfel {n}, Wert {value} zurücknehmen','Würfel {n}, noch nicht geworfen','Schaden','Erhalten','Heilung','Noch {n} platzieren','Würfle, lies den Gegnerzug und wähle deine Antwort.','Klicke auf einen platzierten Würfel, um ihn zurückzunehmen.','Zuletzt: Schaden {damage} · erhalten {counter} · Heilung {healing} · Konter {riposte}','Rekord {n}',
      'Wirf vier Würfel pro Runde. Wähle einen Würfel, dann Angriff, Block oder Heilung. Platzierte Würfel kannst du zurücknehmen. Lege alle vier ab, bevor du handelst. Einmal pro Runde darfst du einen unplatzierten Würfel neu werfen.',
      'Angriff verursacht die Augensumme als Schaden. Block gilt nur diese Runde. Heilung erfolgt vor dem Kampf. Du greifst zuerst an: Ein besiegter Gegner schlägt nicht zurück. Seine Deckung reduziert deinen Schaden.',
      'Zwei Würfel mit 1–2 im Angriff geben +7 Schaden. Eine 1 und 2 im Block geben +6 Block und bei voller Abwehr 4 Konterschaden. Ein gleiches Paar aus 1, 2 oder 3 heilt zusätzlich 5. Verwendete 1, 2 und 3 geben +3 Angriff, +3 Block, +2 Heilung. Jede Technik wirkt einmal pro Runde.',
      'Gewinne sechs Duelle. Nach jedem Sieg wählst du eine dauerhafte Technik und heilst. Gegner erhalten alle vier Runden +2 Angriff. Automatische Speicherung, kein Zeitlimit.',
      'Tasten: 1–4 wählen oder zurücknehmen; A / D / H zuweisen; R würfeln; Leertaste handeln; Esc Hilfe schließen.',
      'Weiter','Neu beginnen?','Die aktuelle Reise endet. Dein Rekord bleibt.','Weiterspielen','Gut gekämpft','Wähle eine Technik für den nächsten Wegabschnitt.','Klinge schärfen','Eisenrobe','Qi pflegen','+2 Schaden beim Angriff; 9 Heilung','+2 Block beim Verteidigen; 9 Heilung','+6 max. Leben; +1 beim Heilen; 14 Heilung','Sechs Duelle, ein großer Name','Eine neue Reise wartet','Der Berg erinnert sich an jede deiner Entscheidungen.','Bewahre deine Erfahrung und versuche es erneut.','Ruhm {n}','Duelle {cleared}/6 · Techniken {combos} · Runden {turns}','Erneut reisen','Klinge {blade} · Robe {guard} · Qi {heart}','Aktiv','Nächstes Duell','Gefahr'
    ],
    es: [
      'Dados del Jianghu','Lanza los dados. Elige tu camino.','Joven viajero','Reglas y técnicas','Cerrar','Duelo marcial','Cuatro dados','Traza tus movimientos','CUADERNO DE VIAJE','Siguiente movimiento rival','Jugar el turno','Nuevo viaje','Tu viaje se guarda solo','Duelo {n} / 6','Turno {n}',
      'Bosque de bambú','Puente del río','Templo tranquilo','Cresta nevada','Terraza de nubes','Montaña verde','Espadachín del bambú','Duelista del puente','Monje errante','Guerrero de la nieve','Maestro de las nubes','Maestro de la montaña',
      'Golpe · ATQ {attack}','Guardia · ATQ {attack} / Bloqueo {guard}','Golpe fuerte · ATQ {attack}',
      'Atacar','Bloquear','Curar','Suma → daño','Suma → bloqueo','Suma → vida','Golpe corto','Desvío','Paz interior','Tres armonías',
      'Golpe corto: dos dados de 1–2 → +7 daño','Desvío: 1 + 2 → +6 bloqueo; bloqueo total: contraataque 4','Paz: pareja igual ≤3 → +5 curación','Usa 1, 2, 3 → +3 ataque / +3 bloqueo / +2 vida',
      'Lanzar dados','Repetir · 1','Repetición usada','Elige un dado','Elige un movimiento','Dados colocados','Dado {n}, valor {value}','Recoger dado {n}, valor {value}','Dado {n}, sin lanzar','Causas','Recibes','Curas','Coloca {n} más','Lanza, observa al rival y elige tu respuesta.','Pulsa un dado colocado para recuperarlo.','Antes: daño {damage} · recibido {counter} · curación {healing} · contraataque {riposte}','Récord {n}',
      'Lanza cuatro dados por turno. Elige un dado y después Atacar, Bloquear o Curar. Pulsa un dado colocado para recuperarlo. Coloca los cuatro antes de actuar. Una vez por turno puedes repetir un dado sin colocar.',
      'Atacar causa la suma de los dados. Bloquear solo protege este turno. Curar restaura vida antes del combate. Atacas primero: un rival derrotado no responde. Su guardia reduce tu daño.',
      'Dos dados de 1–2 en ataque añaden 7 de daño. Un 1 y un 2 en bloqueo añaden 6 de defensa y contraatacan por 4 si bloqueas todo. Una pareja igual de 1, 2 o 3 en curación añade 5. Usar 1, 2 y 3 en cualquier lugar añade 3 ataque, 3 bloqueo y 2 curación. Cada técnica se activa una vez por turno.',
      'Gana seis duelos. Tras cada victoria, elige una técnica permanente y recupera vida. El rival gana 2 de ataque cada cuatro turnos. Guardado automático y sin límite de tiempo.',
      'Teclas: 1–4 elegir o recoger; A / D / H colocar; R lanzar o repetir; Espacio actuar; Esc cerrar ayuda.',
      'Continuar','¿Empezar de nuevo?','Terminará el viaje actual. Tu récord se conserva.','Seguir jugando','Una buena victoria','Elige una técnica y prepara el siguiente camino.','Afilar espada','Túnica de hierro','Cultivar qi','+2 daño al atacar; cura 9','+2 bloqueo al defender; cura 9','+6 vida máxima; +1 al curar; cura 14','Seis duelos para hacer historia','Otro viaje te espera','La montaña recuerda cada una de tus decisiones.','Guarda lo aprendido y vuelve con un nuevo plan.','Renombre {n}','Duelos {cleared}/6 · Técnicas {combos} · Turnos {turns}','Volver a viajar','Espada {blade} · Túnica {guard} · Qi {heart}','Activo','Siguiente duelo','Peligro'
    ],
    'pt-BR': [
      'Dados do Jianghu','Lance os dados. Escolha seu caminho.','Jovem viajante','Regras e técnicas','Fechar','Duelo marcial','Quatro dados','Trace seus movimentos','CADERNO DE VIAGEM','Próximo golpe rival','Jogar o turno','Nova jornada','Sua jornada é salva sozinha','Duelo {n} / 6','Turno {n}',
      'Bosque de bambu','Ponte do rio','Templo tranquilo','Pico nevado','Terraço das nuvens','Montanha verde','Espadachim do bambu','Duelista da ponte','Monge errante','Guerreiro da neve','Mestre das nuvens','Mestre da montanha',
      'Golpe · ATQ {attack}','Guarda · ATQ {attack} / Bloqueio {guard}','Golpe forte · ATQ {attack}',
      'Atacar','Defender','Curar','Soma → dano','Soma → bloqueio','Soma → vida','Golpe curto','Desvio','Paz interior','Três harmonias',
      'Golpe curto: dois dados de 1–2 → +7 dano','Desvio: 1 + 2 → +6 bloqueio; bloqueio total: contra-ataque 4','Paz: par igual ≤3 → +5 cura','Use 1, 2, 3 → +3 ataque / +3 bloqueio / +2 vida',
      'Lançar dados','Rolar de novo · 1','Nova rolagem usada','Escolha um dado','Escolha um golpe','Dados colocados','Dado {n}, valor {value}','Retirar dado {n}, valor {value}','Dado {n}, não lançado','Causa','Recebe','Cura','Coloque mais {n}','Lance, observe o rival e escolha sua resposta.','Clique em um dado colocado para retirá-lo.','Antes: dano {damage} · recebido {counter} · cura {healing} · contra-ataque {riposte}','Recorde {n}',
      'Lance quatro dados por turno. Escolha um dado e depois Atacar, Defender ou Curar. Clique em um dado colocado para retirá-lo. Coloque todos antes de agir. Uma vez por turno, role novamente um dado ainda não colocado.',
      'Atacar causa a soma dos dados. Defender bloqueia só neste turno. Curar restaura vida antes do combate. Você ataca primeiro: um rival derrotado não revida. A guarda dele reduz seu dano.',
      'Dois dados de 1–2 no ataque dão +7 dano. Um 1 e um 2 na defesa dão +6 bloqueio e contra-atacam por 4 se tudo for bloqueado. Um par igual de 1, 2 ou 3 na cura dá +5. Usar 1, 2 e 3 em qualquer lugar dá +3 ataque, +3 bloqueio e +2 cura. Cada técnica ativa uma vez por turno.',
      'Vença seis duelos. Após vencer, escolha uma técnica permanente e recupere vida. Rivais ganham 2 de ataque a cada quatro turnos. O progresso é salvo automaticamente. Não há cronômetro.',
      'Teclas: 1–4 selecionar ou retirar; A / D / H colocar; R lançar ou repetir; Espaço agir; Esc fechar ajuda.',
      'Continuar','Começar de novo?','A jornada atual terminará. Seu recorde permanece.','Continuar jogando','Uma bela vitória','Escolha uma técnica e prepare o próximo caminho.','Afiar lâmina','Manto de ferro','Cultivar qi','+2 dano ao atacar; cura 9','+2 bloqueio ao defender; cura 9','+6 vida máxima; +1 ao curar; cura 14','Seis duelos, um nome lembrado','Outra jornada espera','A montanha lembra cada escolha que você fez.','Guarde o aprendizado e volte com um novo plano.','Renome {n}','Duelos {cleared}/6 · Técnicas {combos} · Turnos {turns}','Viajar de novo','Lâmina {blade} · Manto {guard} · Qi {heart}','Ativo','Próximo duelo','Perigo'
    ]
  };
  const dictionaries = Object.fromEntries(Object.entries(rows).map(([language, row]) => {
    if (row.length !== keys.length) throw new Error('Translation count: ' + language + ' ' + row.length + '/' + keys.length);
    return [language, Object.fromEntries(keys.map((key, i) => [key, row[i]]))];
  }));
  BooplandI18n.register('jianghu', dictionaries);
})();
