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
    id: "trollmors-vaggsang",
    title: "Trollmors vaggsång (snapsvisa)",
    melody: "Trollmors vaggsång",
    tags: ["klassiker"],
    lyrics: `Nu ska vi sjunga en visa,
om hur man en snaps ska ta.
Snifsa och snafsa och kvifsa,
och dricka upp hela raden.
Och halva och hela och kvarta,
och snurra och svurra och svurra,
och vrida och vänta och vänta,
och nu dricker vi upp den igen!`,
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
];
