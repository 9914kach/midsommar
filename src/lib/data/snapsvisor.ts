export type Snapsvisa = {
  id: string;
  title: string;
  lyrics: string;
  melody?: string;
  tags?: string[];
};

export const snapsvisor: Snapsvisa[] = [
  {
    id: "helan-gar",
    title: "Helan går",
    melody: "Helan går",
    tags: ["klassiker", "enkel"],
    lyrics: `Helan går,
sjung hopp faderallan lallan lej!
Helan går,
sjung hopp faderallan lej!
Och den som inte helan tar,
han heller inte halvans får.
Helan går!
Sjung hopp faderallan lej!`,
  },
  {
    id: "gubben-noak",
    title: "Gubben Noak",
    melody: "Gubben Noak",
    tags: ["klassiker"],
    lyrics: `Gubben Noak, gubben Noak var en hedersman,
han planterade vingårdar, drack sig full ibland.
Full ibland, full ibland — det är ingen skam,
den som inte fuller blir, han dricker rent skvatt,
han dricker rent skvatt, han dricker rent skvatt!`,
  },
  {
    id: "sma-grodorna",
    title: "Små grodorna",
    melody: "Små grodorna",
    tags: ["midsommar", "dans", "enkel"],
    lyrics: `Små grodorna, små grodorna är lustiga att se.
Små grodorna, små grodorna är lustiga att se.
Ej öron, ej öron, ej svansar hava de.
Ej öron, ej öron, ej svansar hava de.

Ko-ack-ack-ack, ko-ack-ack-ack,
ko-ack-ack-ack-ack-ack.
Ko-ack-ack-ack, ko-ack-ack-ack,
ko-ack-ack-ack-ack-ack.`,
  },
  {
    id: "snapsvisan",
    title: "Nu ska vi ha det trevligt",
    tags: ["enkel", "rolig"],
    lyrics: `Nu ska vi ha det trevligt,
nu ska vi vara glad!
Vi dricker ur våra glas,
och sjunger hela dan!
Skål!`,
  },
  {
    id: "djingis-khan",
    title: "Djingis Khan (snapsversion)",
    melody: "Djingis Khan",
    tags: ["rolig", "energi"],
    lyrics: `Djingis Khan! Hey!
Vi dricker som han! Hey!
Snaps upp ur hand! Hey!
Nu kör vi igen! Hey!
Djingis! Djingis! — skål!`,
  },
  {
    id: "snapsen-smakar",
    title: "Snapsen smakar",
    tags: ["kort", "enkel"],
    lyrics: `Snapsen smakar, snapsen smakar,
underbart i dag!
Den som dricker, den som dricker,
mår precis som jag!
Skål allihopa, skål!`,
  },
  {
    id: "helan-och-halvan",
    title: "Helan och halvan",
    tags: ["klassiker", "lång"],
    lyrics: `Helan går, sjung hopp faderallan lej!
Halvans går, sjung hopp faderallan lej!
Och den som tar en hel och en halv ändå,
han får sjunga visan om det faller sig så.
Skål för er! Skål för er! Skål för oss allihop!`,
  },
  {
    id: "mors-lilla-olle",
    title: "Mors lilla Olle (snapsversion)",
    melody: "Mors lilla Olle",
    tags: ["rolig", "midsommar"],
    lyrics: `Mors lilla Olle dricker en snaps,
springer i skogen med humla och geting!
Humlan sticker honom, getingen pickar,
men Olle bryr sig inte ett dugg.
För Olle är full och glad och nöjd!
Skål!`,
  },
  {
    id: "ole-dole-doff",
    title: "Ole dole doff",
    tags: ["kort", "rolig"],
    lyrics: `Ole dole doff,
nu dricker vi ett koff!
Kinke lane boff,
nu dricker vi ett koff!
Skål!`,
  },
  // --- Visor från Roy Hallgard (Snapsvisor MIDSOMMAR) ---
  {
    id: "sommar-och-snaps",
    title: "Sommar och snaps",
    melody: "När gäddorna leker",
    tags: ["midsommar"],
    lyrics: `När majstången står där med blommor o blad
och Sjöblom han tar sig ett nakenbad,
ja, då är sommarns här.
(snapsen tas)
Och snapstid det är!`,
  },
  {
    id: "midsommar-sjosala",
    title: "Midsommar",
    melody: "Sjösala vals",
    tags: ["midsommar"],
    lyrics: `Samla er go'vänner nu är midsommar'n här
Kul ni kunde komma och nu ska vi skåla.
Sommaren vi firar, den ju är oss så kär.
Höj nu era armar, släpp in ert begär!

Vi äter nypotatis och sillen är ju med.
Ja, låt oss alla festa tills mörkret fallit ned!
Och se så många flaskor vi redan korkat upp på bordet:
Skåne och Aalborg och OP - det är ju sed!`,
  },
  {
    id: "midsommarmaten",
    title: "Midsommarmaten",
    melody: "Ljuvlig är sommarnatten",
    tags: ["midsommar", "mat"],
    lyrics: `Ljuvlig är sommarmaten
Sill o' potatis på faten
OP och Skåne och Akvavit
Hallands och Gammel och hemgjord sprit
Flaskorna tagna ur kylen
Har nu förlorat kapsylen
Och till dessert blir det jordgubbar bums
Vilken ljuvlig lunch!`,
  },
  {
    id: "hundliv",
    title: "Hundliv",
    melody: "Mors lilla Olle",
    tags: ["rolig"],
    lyrics: `Fars lille schnauzer midsommardag
mötte en mopsflicka lustig och glad.
Vad blev det av denna avlingskollaps?
En söt liten mauzer, en schnops och en schnaps.`,
  },
  {
    id: "meningsfullt",
    title: "Meningsfullt",
    melody: "Säg mig du lilla fågel",
    tags: ["midsommar", "rolig"],
    lyrics: `Nu klär vi sommarstången som står där helt på sne'
Sen ska vi hoppa groda en meningslös idé
Men snapsar har vi mången till våran festbuffé
Nu stämmer vi upp sången, det är det mening me'`,
  },
  {
    id: "midsommartid-skanska",
    title: "Midsommartid",
    melody: "Skånska slott och herresäten",
    tags: ["midsommar", "enkel"],
    lyrics: `Så har vi då kommit till midsommartiden.
Då passar det bra att vi ta't oss en liden.
Och nu när det vankas potatis och sill,
ja då är det läge att ta sig en till.`,
  },
  {
    id: "olika-begavning",
    title: "Olika begåvning",
    melody: "She'll be Coming Round the Mountain",
    tags: ["rolig"],
    lyrics: `Att resa majstång det är inte mitt projekt.
Slår jag upp ett tält, det skiter sej direkt.
Jag har inte ens begåvning
att slå upp en trist förlovning.
Men slå upp en sup, det gör jag helt perfekt!`,
  },
  {
    id: "helt-fel",
    title: "Helt fel",
    melody: "I knew Susie (Al Capone)",
    tags: ["rolig"],
    lyrics: `Midsommarafton, är snaps i glaset
All-, all- alldeles fel!
Och snaps i flaskan, ja snaps i flaskan
Nej, nej, det är galet på kalaset.
Men ett sätt att få allting rätt,
är just detta:
Höj på armen, töm nu glaset!
Snaps i kroppen, ja snaps i knoppen.
Det, det gör dig glad!`,
  },
  {
    id: "juninatter",
    title: "Juninätter",
    melody: "Glada änkan",
    tags: ["midsommar", "sommar"],
    lyrics: `Juninätter, juninätter, midnattssol.
Alla softar, luften doftar kaprifol.
Nu är alla vakna, hela natten lång.
Vi kan bada nakna fram till soluppgång.`,
  },
  {
    id: "varmeBolja",
    title: "Värmebölja",
    melody: "Blåsippan ute i backarna står",
    tags: ["rolig", "sommar"],
    lyrics: `Midsommarnäs hetta är olidligt hård
Kvicksilvret stiger mot nya rekord
Men jag har upptäckt nåt helt genialt
Svälj en kall nubbe
(dryckespaus)
Och sen har du svalt!`,
  },
  {
    id: "midsommarsed",
    title: "Midsommarsed",
    melody: "Blåsippan ute i backarna står",
    tags: ["midsommar", "rolig"],
    lyrics: `Sju sorters brännvin inunder din väst
då kan du drömma om kyrka och präst
Sen när du somnar en sen juninatt
Sover du gott i din grannes rabatt`,
  },
  {
    id: "hej-o-hopp-midsommar",
    title: "Hej o' hopp midsommar",
    melody: "Vintern rasat",
    tags: ["midsommar", "energi"],
    lyrics: `Skål i solen, hej och hopp midsommar
Glas och klonk, det språket vi förstår.
Grodor, hick och lite kvillivipsan
sill o potatis ju på bordet står.
Majstång oss i hejsan, hoppsan och tjosan
smutt och tjo och tjim och klang och gutår.
Alla här för sommaren nu tar nubben
Sol och fiol på dej, när skålen går!`,
  },
  {
    id: "trolldrycken",
    title: "Trolldrycken",
    melody: "Trollmors vaggsång",
    tags: ["klassiker"],
    lyrics: `När nubben är upphälld och glittrar som pärlor
i midsommarfyllda glasen.
Då sjunger vi glada för alla som lyssnar
de vackraste ord vi känner:
Oj, oj, vad den går gott, den nubben som vi fått
Ja visst är det en trolldryck, vi bättre aldrig mött!`,
  },
  {
    id: "forsok-till-snapsvisa",
    title: "Försök till snapsvisa",
    melody: "Skånska slott",
    tags: ["rolig", "kort"],
    lyrics: `Om midsommarns ville jag skriva en visa.
Men det var rätt svårt, ja det skulle sig visa.
Att hitta ett rim som var lätt att förstå.
Vi skiter i det och tar snapsen ändå!`,
  },
  {
    id: "midsommarlandet",
    title: "Midsommarlandet",
    melody: "Vi går över daggstänkta berg",
    tags: ["midsommar"],
    lyrics: `Här uppe i midsommarns land, fallera,
ej druvan rodnar uti solens brand, fallera.
För uppe här i Norden,
mognar druvan under jorden,
av dess ljuva safter njuta vi ibland, fallera.
Som en ljungeld genom strupen,
håller vi midsommarsupen,
i en skål för vårt midsommarland, fallera.`,
  },
  {
    id: "mardrommen",
    title: "Mardrömmen",
    melody: "Hej Tomtegubbar",
    tags: ["rolig", "midsommar"],
    lyrics: `Tänk om det inte fanns nån sup till
midsommarsillen vi äter.
Tänk om i flaskan allt var slut
när det vankas sill och potäter.
Om nån gjort kupp.
Och rensat upp.
Ja, allt blitt torrlagt av nykter grupp.
Tur att vi faktiskt får en sup till
midsommarsillen vi äter!`,
  },
  {
    id: "sos",
    title: "S.O.S",
    melody: "Skånska slott",
    tags: ["rolig"],
    lyrics: `När bordet står dukat med Smör Ost och Sillen
då sitter som smäcken perfekt med en lillén
Vi äter och dricker och foten blir rund.
Sen tar farfar båten och seglar på grund!`,
  },
  {
    id: "en-liten-snaps",
    title: "En liten snaps",
    melody: "Den blomstertid nu kommer",
    tags: ["enkel", "midsommar"],
    lyrics: `En liten snaps till sillen,
vår törst den är så stor.
Nu nalkas den där nubben,
som uti flaskan bor.
I midsommarens värma,
den stilla rinner ner.
och vi vill mycket gärna,
ha många, många fler.`,
  },
  {
    id: "ljuvaste-av-drycker",
    title: "Ljuvaste av drycker",
    melody: "Sjösala vals",
    tags: ["midsommar"],
    lyrics: `Dags det är att skåla, nu är midsommarn här.
Fatta i kristallglaset, höj det mot skyarna.
Ljuvaste av drycker, till potatis och sill
dränker oss i välust, sån tur den finns till.

Livet går i vågor snart kan vi hoppa bock.
Det där med "dagen efter" betraktar vi som skrock.
I morgon ska vi vakna i skor och rock och hatt och dilla
om gullviva, mandelblom, kattfot och blå viol.`,
  },
  {
    id: "sommarsnapsen",
    title: "Sommarsnapsen",
    melody: "I Apladalen i Värnamo",
    tags: ["sommar", "enkel"],
    lyrics: `När nu sommaren återvänder.
Då blommar blommorna en i sänder.
Och sommarsnapsen känns ren och klar,
så smaka på nu för törsten drar!`,
  },
  {
    id: "midsommarsup",
    title: "Midsommarsup",
    melody: "When Johnny comes marching home",
    tags: ["midsommar", "energi"],
    lyrics: `Midsommarsupen den är rätt
HURRA, HURRA
Den sätter på humöret spätt
HURRA, HURRA
Till potatis, dill o' en sillabit
vi höjer glasen i denna rit,
Ja, nu så tar vi en liten aquavit.

Ja, sommarn hälsar vi så här
HURRA, HURRA
för lätta kläder nu vi bär
HURRA, HURRA
Och vi är glada och sjunger en bit
för varma sommarn som kommit hit.
Ja, nu så tar vi vår lilla aquavit`,
  },
  {
    id: "starka-snapsar",
    title: "Starka snapsar",
    melody: "Blommig falukorv",
    tags: ["rolig"],
    lyrics: `Vi vill ha starka snapsar till vår sill mamma.
Nåt annat vill vi inte ha.
Vi älskar Svart Vinbärs och Skåne och en Herrg ård.
och vodkan den med lingonsmak.
Bäsk gör oss så sälla.
Pors gör oss så snälla.
Reymersholms är härligt läbbigt.
Vi vill ha starka snapsar till vår sill mamma.
Nåt annat vill vi inte ha!
  Badabidibabba.
Nåt annat vill vi inte ha.
  Badabidibabba.
Nåt annat vill vi i-inte haaaaaaa!!!`,
  },
  {
    id: "sommarsang",
    title: "Sommarsång",
    melody: "Den blomstertid nu kommer",
    tags: ["sommar", "rolig"],
    lyrics: `Nu ropar göken åter och väntar på sin lön
Att än en gång få famna en gök av motsatt kön
Själv sitter jag och tänker att allt är gott som sker
För det är fan så viktigt att gökarna blir fler`,
  },
  {
    id: "sommarens-natter",
    title: "Sommarens nätter",
    melody: "I sommarens soliga dagar",
    tags: ["sommar"],
    lyrics: `I sommarens roliga nätter
den värliga lusten fortsätter
som försmak vi nu i oss sätter
en sup och fyller på, hallå, hallå.
Från jobb o' kök, o'damm o'rök
vi njuter sommarens första gök.
Om vi därtill får öl och sill
så slår vår gök en extra drill.
I sommarens roliga nätter
vi sitter kan ej stå, hallå, hallå.`,
  },
  {
    id: "opp-med-alla-glas",
    title: "Opp med alla glas!",
    melody: "Schottis på Valhall",
    tags: ["energi", "midsommar"],
    lyrics: `Opp med alla glas, nu ska nubben tas,
kul vi har denna midsommarkväll!
Ingen maska vill, när vi tar en till,
på vår fest här vi har öppna spjäll!
Om du tar din sprit, får du fin aptit,
och vid bordet det blir ju så glatt.
Alla tar botten opp och humöret blir topp,
det är så vi ska ha det i natt!`,
  },
  {
    id: "midsommarsangen",
    title: "Midsommarsången",
    melody: "Petter Jönsson",
    tags: ["midsommar", "kort"],
    lyrics: `När man har dansat ett varv runt midsommarstången
och klarat av alla gamla midsommartv ången
då är det dags att man sjunger midsommarsången
och det ska banne mig inte vara en lång en!`,
  },
  {
    id: "annu-en",
    title: "Ännu en",
    melody: "Amanda Lundbom",
    tags: ["rolig"],
    lyrics: `Några nubbar hunnit sjunka
Hej skuttiplutt tjodelittan dunka.
Ännu en vi nu ska klunka.
Hej pulleplitt falleripsan tafs.
Kan du sjunga häst, kusk, sits
Lång midsommarstång tjodelittan vits
HUGG I!! Då kan du nubben ta med snits
Hej pytteplutt fyllerupsan slips.`,
  },
  {
    id: "skansk-midsommarvisa",
    title: "Skånsk midsommarvisa",
    melody: "Den blomstertid nu kommer",
    tags: ["midsommar", "skåne"],
    lyrics: `Ja, nu ska nubbar tagas
till sång och matjessill.
För visst så vill vi sjunga
och inte tiga still.
Nu häves våra röster,
och alla tar sig ton,
så att det hörs till landet
på andra sidan bron.`,
  },
  {
    id: "goa-skanska-knudor",
    title: "Goa skånska knudor",
    melody: "Skinn o' ben",
    tags: ["skåne", "rolig"],
    lyrics: `Sill o' snaps o' goa nya knudor
Misommar, misommar.
Sill o' snaps o' goa nya knudor
Misommar, misommar.
Skåla, o' låt oss vråla:
Kom gärna hit, här har vi...
Sill o' snaps o' goa nya knudor...osv`,
  },
  {
    id: "sag-det-med-ett-leende",
    title: "Säg det med ett leende",
    tags: ["enkel", "midsommar"],
    lyrics: `Säg det med ett leende
och höj nu nubben i ditt glas.
Ett härligt, glatt beteende
här på vårt midsommarkalas.
Till nypotatis och god sill
det smakar bra med nubbe till.
Ja, säg det med ett leende
och ta sen nubben i ditt glas:
SKÅL!`,
  },
  {
    id: "humlorna",
    title: "Humlorna",
    melody: "Karl-Alfred Boy",
    tags: ["rolig", "kort"],
    lyrics: `Vi äro små humlor vi - bzz, bzz.
Vi äro små humlor vi - bzz, bzz.
Vi äro små humlor, som tar oss en geting.
Vi äro små humlor vi - bzz, bzz.`,
  },
  {
    id: "bors-och-snaps",
    title: "Börs och snaps",
    melody: "Bö, bö, vita lamm",
    tags: ["kort", "enkel"],
    lyrics: `Börs, börs och en snaps
och så lite sill.
Ja, ja var nu glad
och drick sommar'n till.
SKÅL!`,
  },
  {
    id: "den-javeln",
    title: "Den jäveln!",
    melody: "Där som sädesfälten böja sig för vinden",
    tags: ["rolig", "kort"],
    lyrics: `När som sommarsnapsen hälles upp ur flaskan
- står nån jävel där och häller den tillbaks.
Ner med den FORT!`,
  },
  {
    id: "den-nubbetid-nu-kommer",
    title: "Den nubbetid nu kommer",
    melody: "Den blomstertid nu kommer",
    tags: ["klassiker", "enkel"],
    lyrics: `Den nubbetid nu kommer
med många snapsar små.
Vi njuter dem om sommar'n
och dricker så vår skål!`,
  },
  {
    id: "midsommartid-kamomilla",
    title: "Midsommartid (Kamomilla)",
    melody: "Råvarna i Kamomilla stad",
    tags: ["midsommar", "rolig"],
    lyrics: `Midsommartid vi nu har här
för det vi nu ska skåla
och ni som inte sjunga kan
- ja, ni får gärna skråla.
På detta vårat sillkalas
vi alla vet hur nubben tas.
Ja, drick nu så mycket som ni bara vill
– och i morgon drick vatten med Treo till!

Ja, höj nu alla glasen här
för nu så ska vi skåla,
för sommarn vänd det botten upp,
säg varför ska ni snåla
För nubben gör en go'o' gla'
o' det är ju som vi vill va'
Ja, drick nu så mycket som ni bara vill
och i morgon drick vatten med Treo till!`,
  },
  {
    id: "midsommarvisan",
    title: "Midsommarvisan",
    melody: "Nå se det snöar",
    tags: ["midsommar", "rolig"],
    lyrics: `Nå se det snöar, nå se det snöar,
nå nu skoja' allt jag
Det är midsommar, det är midsommar,
och det är skitkallt idag.
Då tar vi nubbarna fram, och tröjorna på,
så får vi dricka oss varma låt nubbarna gå!`,
  },
  {
    id: "sillfest",
    title: "Sillfest",
    melody: "Vi e alla glada bagarbarn",
    tags: ["midsommar", "energi"],
    lyrics: `Höj nu glasen all gäster här,
sillfest, sillfest hela da'n.
midsommar det har vi nu igen,
sillfest, sillfest hela da'n.
Goda nubbar blir det här idag,
sillfest, sillfest hela da'n.
De går som smort, det har det alltid gjort,
Ja, midsommar är allt en härlig dag.
SKÅL!!!!!!!!`,
  },
  {
    id: "midsommarns-friska",
    title: "Midsommarns friska",
    melody: "Vårvindar friska",
    tags: ["midsommar"],
    lyrics: `Midsommarns friska, leka och viska:
tag dig en sup i kvällssolens glans!
Strömkarlen spelar, sorgen fördelar
brännvinet med en viss elegans!
Andas blott djupt, ty helan nu går,
och efter helan halvan du får.
Skål mina vänner, sommar'n vi känner,
låtom oss tappa måtta och sans!`,
  },
  {
    id: "till-midsommarsillen",
    title: "Till midsommarsillen",
    melody: "Och jungfrun hon går i ringen",
    tags: ["midsommar", "mat"],
    lyrics: `Till midsommarsillens smaker vi tar oss en hutt
På gummor och alla gubbar den sätter sånt sprutt
Ja nubbe så god i halsen vår rinn
För sommaren kommer då i vårt sinn!`,
  },
  {
    id: "midsommarnatten",
    title: "Midsommarnatten",
    melody: "Elektricitetsvisan",
    tags: ["midsommar"],
    lyrics: `Midsommarnatten är inte lång,
då ska vi dansa och festa.
Men dagen efter känns hatten trång.
Då kan man ångra det mesta.`,
  },
  {
    id: "hutten-till-midsommar",
    title: "Hutten till midsommar",
    melody: "Vårvindar friska",
    tags: ["midsommar"],
    lyrics: `Hutten den lilla, smakar ej illa
när vi midsommar firar idag.
Känslor så ömma, inom oss strömma
sorger vi glömma, kling!
Vänligt de blicka, bordets små bloss
trevlig midsommar de önska oss.
Flickor och svenner livsglädje känner,
skål kära vänner,
skål!`,
  },
  {
    id: "den-badstrandstid-nu-kommer",
    title: "Den badstrandstid nu kommer",
    melody: "Den blomstertid nu kommer",
    tags: ["rolig", "sommar"],
    lyrics: `Den badstrandstid nu kommer,
när magen är för stor.
Då hela kroppen sväller,
och celluliter gror.
Och alla våra valkar,
lyfts fram i solens ljus.
Nej stranden verkar boring,
vi stannar inomhus.

De krav som sommarn ställer,
förstör vår ledighet.
Vi sitter där och gnäller,
fy fan vad jag e' fet.
Fast vem vill motionera,
när man kan sitta still.
Nej låt oss revoltera,
vi tar en nubbe till!!`,
  },
  {
    id: "fira-med-nubbe",
    title: "Fira med nubbe",
    melody: "Morsgrisar är vi allihopa",
    tags: ["enkel", "midsommar"],
    lyrics: `Midsommar firar vi med nubbe,
liten nubbe, liten nubbe
Midsommar firar vi med nubbe,
liten nubbe, liten nubbe.
Ja' me' och du me',
ja' me' och du me'!`,
  },
  {
    id: "det-var-langesen",
    title: "Det var längesen",
    melody: "Det var längesen jag plocka några blommor",
    tags: ["midsommar"],
    lyrics: `Det var längesen vi fira sommar'n senast
det var längesen man fick en riktig sup
det var längesen vi sjöng om lilla nubben
som försvinner uti magens dunkla djup,
det var längesen vi dansa uppå banan
det var längesen vi åt vår goda sill
det var längesen vi tog en liten tuting
så vi lyfter våra glas och gör det NU!`,
  },
  {
    id: "abba-sill",
    title: "ABBA-sill",
    melody: "Thank You for the Music",
    tags: ["rolig"],
    lyrics: `Thank you very matje
du kom med sommar'n
som vi kallar the silly season
Thank you very matje
med färsk potatis därtill
smaksatt med dill
och med en snapshot visa jag vill
Jag säger: "Thank you very matje,
I gräddfe el very well!"`,
  },
  {
    id: "nu-midsommarnubben",
    title: "Nu midsommarnubben",
    melody: "Prästens lilla kråka",
    tags: ["midsommar", "rolig"],
    lyrics: `Nu midsommarnubben ska du allt på stubben, ner i våra halsar rinna.
Nu midsommarnubben ska du allt på stubben, ner i våra halsar rinna.
Än slank den hit, och än slank den dit, men den hittar inte strupen.
Än slank den hit, och än slank den dit, och nu slank den ner i strupen.`,
  },
  {
    id: "nu-ropar-goken",
    title: "Nu ropar göken",
    melody: "Den blomstertid nu kommer",
    tags: ["sommar", "rolig"],
    lyrics: `Nu ropar göken åter och väntar på sin lön
Att än en gång få famna en gök av motsatt kön
Själv sitter jag och tänker att allt är bäst som sker
Ty det är fan så viktigt att gökarna blir fler`,
  },
  {
    id: "skal-pa-dig-berlusconi",
    title: "Skål på dig, Berlusconi",
    melody: "Blinka lilla stjärna där",
    tags: ["rolig"],
    lyrics: `Berlusconi, per favor'
behåll din skinka, vi har vår!
Med grappa, pasta, pestosås,
får andra smörja sina krås.
Vi vill ha midsommar-sill
och förstås en sup därtill!`,
  },
  {
    id: "lilla-gloMskan",
    title: "Lilla glömskan",
    melody: "Imbelupet glaset står",
    tags: ["rolig", "klassiker"],
    lyrics: `Sill, potatis, raj di daj di dukat bord,
iskall snaps ta daj da glömt visst alla ord
Hm ta Helan
raj ta Halvan
midsommar, tralallala,
måste sjunga först för att få snapsen ta.`,
  },
  {
    id: "det-ar-dags-nu",
    title: "Det är dags nu",
    melody: "Det var dans bort i viägen",
    tags: ["enkel"],
    lyrics: `Det är dags nu att ta sig en liten till maten
innan sillen den fina försvunnit från faten
vi nu fattar om glasen de små.
Och supen den goa behöver ej trugas
till höger och vänster det skålas och bugas
sen så tömmer vi glasen de små
Och så tömde vi glasen de små`,
  },
  {
    id: "dubbelnubbe",
    title: "Dubbelnubbe",
    melody: "Linas Emilvisa",
    tags: ["rolig"],
    lyrics: `Hujedamej, så god den är,
ej bättre tänkas kan.
Och nubbe är det namn den bär
(Nubben tages)

den ner för strupen rann.

Singdudeldej, singdudeldej
singdudeldudeldej
Singdudeldej, singdudeldej ...
(Nubben tages ånyo)

Midsommarsuptjohej!`,
  },
  {
    id: "ur-en-unken-bunke",
    title: "Ur en unken bunke",
    melody: "Kors på Idas grav",
    tags: ["rolig", "klassiker"],
    lyrics: `Ur en unken bunke sjunken klunken som
gluntar glunkat dunkelt runt midsommarstång.
Helan hälsas, helst den halsas
helande varenda hals.
Skälvande vi själva stjälpa i vår hals.`,
  },
  {
    id: "gammaltestamentligt",
    title: "Gammaltestamentligt",
    melody: "Skånska slott och herresäten",
    tags: ["rolig"],
    lyrics: `En sup och en sillbit är bättre än manna,
om Moses fått det hade han kunnat stanna
i öknen åtminstone fyrtio år till
- ja, tänk vad det gör med en sup och en sill!`,
  },
  {
    id: "fira-med-nubbe-2",
    title: "Fira med nubbe 2",
    melody: "Morsgrisar är vi allihopa",
    tags: ["midsommar"],
    lyrics: `Midsommar firar vi med nubbe,
mycket sill och nypotatis
Midsommar firar vi med nubbe,
mera nubbe. och mera nubbe.
Ja' me' och du me',
ja' me' och du me'!`,
  },
  {
    id: "kors-vad-det-sneglas",
    title: "Kors vad det sneglas",
    melody: "Dans på Brännö brygga",
    tags: ["rolig", "kort"],
    lyrics: `Kors vad det sneglas på snapsar i dag!
Är det snapssnegling?
Nä, dom ska drickas!
Skål!`,
  },
  {
    id: "nar-nubben-kom-pa-borden",
    title: "När nubben kom på borden",
    melody: "När Lillan kom till jorden",
    tags: ["midsommar"],
    lyrics: `När nubben kom på borden
då blev det vår och göken gol
och ögonen de lyste
av vårgrönt och av sol.

När nubben kom i magen
bröt sommarn ut i fuller blom.
Och det blev bara värre
tills flaskan den var tom.`,
  },
  {
    id: "jag-ska-ha-roligt",
    title: "Jag ska ha roligt",
    melody: "Johan på Snippen",
    tags: ["rolig", "lång"],
    lyrics: `Jag ska ha roligt tills morgonen gryr.
Äta och dricka och om jag blir yr,
gör ingenting, jag har lovat i dag,
att inte ramla och det håller jag.

refr.
Jag ska ta en bit utav den lökinlagda sillen.
men jag biter inte av den sup som jag tar till den.
Jag häller ner den hel och ren i min kropp.
utan att falla ska jag dricka den opp.
Akvavit, Genever, Pors och OP vill jag dricka.
Finns det någon människa som skulle kunna skicka
flaskorna till mej, jag har sånt besvär,
för att jag ligger under bordet här.`,
  },
  {
    id: "styrkedroppar",
    title: "Styrkedroppar",
    melody: "Idas somarvisa / Svarte Rudolf",
    tags: ["rolig"],
    lyrics: `Du ska inte tro det är Renat
och OP i denna karaff!
Nej, dropparna kommer ur någonting
vars innehav innebär straff!

Och peppar det kör jag i brygden,
det döljer att finkeln är rå,
och andra små roliga smaker
som passar till sill och Pripps blå.

Och magen har roliga ställen
där spriten kan fara omkring
tills alla är fulla och gla-a-da
och bena förmår ingenting!`,
  },
  {
    id: "styrkedroppar-2",
    title: "Styrkedroppar (II)",
    melody: "Svarte Rudolf",
    tags: ["rolig"],
    lyrics: `Midsommarn ska kryddas
med brännvin,
det har O.P. Anderson sagt.
Och vi kräva ingen förändring,
på det kan vi skriva kontrakt.
Ty den sätter sprätt uti kroppen,
det killar i armar och ben.
Och tänk vad det klarnar i knoppen
och aldrig man känner sig klen.`,
  },
  {
    id: "nar-man-kockar",
    title: "När man kockar",
    melody: "Imbelupet",
    tags: ["rolig", "mat"],
    lyrics: `När man kockar får det inte brännas vid
undantag från regeln finns emellertid
ska man bjuda nåt till sillen, lite dryckjom med procent
ska det helst nog vara något som är bränt!`,
  },
  {
    id: "biskop-henrik",
    title: "Biskop Henrik",
    melody: "Kors på Idas grav",
    tags: ["rolig", "klassiker"],
    lyrics: `Biskop Henrik sa en gång till en novis:
Jag har drabbats av en dualistisk kris
ty jag tjänar troget Herren
men var jag gång jag äter sill
frestas jag att ta en liten jävel till!`,
  },
  {
    id: "upp-och-ner",
    title: "Upp och ner",
    melody: "Upp och ner",
    tags: ["enkel", "kort"],
    lyrics: `Upp och ner, snapsen far,
sången ljuder hög och klar.
Ta en till, med lite sill
och potatis om du vill.
Snapsen rinner, strupen brinner.
Åh, vad det är skönt!`,
  },
  {
    id: "nu-leker-laxen",
    title: "Nu leker laxen",
    melody: "Apladalen i Värnamo",
    tags: ["rolig", "kort"],
    lyrics: `Nu leker laxen,
nu blommar häggen,
nu lyfter taxen
sitt ben mot väggen.

Sssssssssssssssskål!

Ett litet avbrott har visan fått
och under tiden, har taxen gått!`,
  },
  {
    id: "skansk-misommar",
    title: "Skånsk mi'sommar",
    melody: "Bamsevisan",
    tags: ["skåne", "midsommar"],
    lyrics: `Skåne, Skåne alla älskar Skåne,
eda päror, sill och ta en snaps.
De e' livet när de e'mi'sommar,
höj nu armen o' ta den i ett nafs.

Skåne, Skåne, Skåne, Skåne,
Skåne, Skåne, Skåne, Skåne,
Skåne, Skåne, Skåne, Skåne,
Skåne, Skåne, Skål!`,
  },
  {
    id: "ett-litet-glas-till-maten",
    title: "Ett litet glas till maten",
    melody: "Den blomstertid nu kommer",
    tags: ["enkel", "midsommar"],
    lyrics: `Ett litet glas till maten,
vår törst den är så stor.
Nu nalkas det en nubbe,
som uti flaskan bor.
I midsommarens värma
den stilla rinner ner.
Och vi vill väldigt gärna,
ha många, många fler.`,
  },
  {
    id: "midsommarnubben",
    title: "Midsommarnubben",
    melody: "Vårvindar friska",
    tags: ["midsommar"],
    lyrics: `Alla här sitta,
fånigt och titta.
Nubbarna glittra kalla som is.
Ja, varför dröja? Nej, låt oss höja
glasen med klang på fädernas vis.
Nubben den gör att alla bra mår.
Sillen den manar: Skål och gutår!
Solen den lyser, nubben den fryser.
Värm den i magen, bra du då mår.`,
  },
  {
    id: "lite-mera",
    title: "Lite mera",
    melody: "Nu är glada julen slut",
    tags: ["rolig"],
    lyrics: `Nu vi höjer våran snaps, snaps, snaps.
Den är nog ej gjord av raps, raps, raps.
Nej potatis har måst till
för att få den smak vi vill
fukta våra strupar.

Nu vi ätit från vårt fat, fat, fat.
Som ju fyllts med mycket mat, mat, mat.
Vi vill ha en nubbe till
inte bara plugg och sill.
Skål och tack för ordet.`,
  },
  {
    id: "aquavit-i-glasen",
    title: "Aquavit i glasen",
    melody: "Midnatt råder",
    tags: ["energi"],
    lyrics: `Aquavit det häller vi i glasen, vi i glasen.
Glada blir vi utav bara fasen, bara fasen.
Kul det är när alla är i gasen, är i gasen
Det är bra på midsommarkalasen, på kalasen
Skvätt, Skvätt Skvätt Skvätt Skvättevätteskvättskvätt
Skvätt Skvätt Skvätt`,
  },
  {
    id: "snaps-med-mig",
    title: "Snaps med mig",
    melody: "All of me",
    tags: ["rolig"],
    lyrics: `Snaps med mig, kom och drick snaps med mig
Skål på dig, vi snaps ej förgäter.
Till god sill, dill och potäter.
Till allt gott, som vi här äter!
Snaps med mig, kom och drick snaps med mig
Skål på dig, höj nu på armen.
God och glad du blir, av detta elixir.
När du tar en snaps med mig!`,
  },
  {
    id: "i-sommarsolen",
    title: "I sommarsolen",
    melody: "I sommarens soliga dagar",
    tags: ["sommar"],
    lyrics: `I sommarens värmande strålar
vi sitter och äter och skålar.
Det kostar oss rätt mycket stålar
vi sjunger så ändå: Hallå, hallå!
Du som är smal du som är skral
du som om skallen din är kal.
Du som är le', du som är sne'
ja, allihopa sjunger me'.
I sommarens värmande strålar
så glada sjunga vi: Slå i, slå i!`,
  },
  {
    id: "supen-pa-kalaset",
    title: "Supen på kalaset",
    melody: "Svarta Rudolf",
    tags: ["midsommar"],
    lyrics: `Se supen väntar i glaset,
den väntar så kall och så klar.
vad vore midsommarkalaset
ifall inte supen vi har.
Den tas både arla och särla
och den smakar jämt lika bra,
och därför så tar vi vår pärla
och skålar med varann hipp hurra!`,
  },
  {
    id: "forsvarad-ankring",
    title: "Försvårad ankring",
    melody: "Med käckhet kan man komma långt",
    tags: ["rolig"],
    lyrics: `Med åror kan man komma långt
med segel kan man komma längre
men med en flaska brännvin,
smör ost och sill,
kommer man så långt man vill,
men det blir svårt att lägga till.`,
  },
  {
    id: "punkathrost",
    title: "Punkatröst",
    melody: "Bjällerklang",
    tags: ["rolig", "kort"],
    lyrics: `Midsommar, midsommar,
cykla bak och fram
ett, två, tre så sa det pang!
Jäkla cykelslang!
SKÅL!`,
  },
];
