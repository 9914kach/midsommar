export type SchemaItem = {
  id: string;
  time: string;
  title: string;
  description?: string;
  emoji: string;
  type: "mat" | "aktivitet" | "dricka" | "vila" | "natt";
};

export const schema: SchemaItem[] = [
  {
    id: "1",
    time: "11:00",
    title: "Välkommen & ankomst",
    description: "Alla samlas, ta på sig blommig klänning eller skjorta",
    emoji: "🌸",
    type: "aktivitet",
  },
  {
    id: "2",
    time: "12:00",
    title: "Midsommarlunch",
    description: "Sill, potatis, gräddfil, räkor — det fullständiga paketet",
    emoji: "🍣",
    type: "mat",
  },
  {
    id: "3",
    time: "13:00",
    title: "Snapsrunda 1",
    description: "Första omgången snapsvisor vid bordet",
    emoji: "🥃",
    type: "dricka",
  },
  {
    id: "4",
    time: "13:30",
    title: "Midsommardans",
    description: "Dans runt midsommarstången — små grodorna är obligatorisk",
    emoji: "💃",
    type: "aktivitet",
  },
  {
    id: "5",
    time: "14:30",
    title: "Dryckerlekar",
    description: "Beer pong, flunky ball och annat ute",
    emoji: "⚽",
    type: "dricka",
  },
  {
    id: "6",
    time: "16:00",
    title: "Fika & vila",
    description: "Jordgubbstårta är ett måste",
    emoji: "🍓",
    type: "vila",
  },
  {
    id: "7",
    time: "17:30",
    title: "Mer utelekar",
    description: "Kubb, bocce, eller bara häng i solen",
    emoji: "🌞",
    type: "aktivitet",
  },
  {
    id: "8",
    time: "19:00",
    title: "Middag",
    description: "Grillat, salat och mer potatis",
    emoji: "🍖",
    type: "mat",
  },
  {
    id: "9",
    time: "20:00",
    title: "Snapsrunda 2 + snapsvisor",
    description: "Nu kör vi de svårare visorna",
    emoji: "🎵",
    type: "dricka",
  },
  {
    id: "10",
    time: "21:00",
    title: "Kvällslekar",
    description: "Kings, Mex, Aldrig har jag inomhus",
    emoji: "🃏",
    type: "dricka",
  },
  {
    id: "11",
    time: "23:00",
    title: "Sen kväll",
    description: "Musik, dans och vad som händer händer",
    emoji: "🌙",
    type: "natt",
  },
];
