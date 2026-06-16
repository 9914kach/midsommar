type MatchInsert = {
  tournament_id: string;
  team_a_id: string | null;
  team_b_id: string | null;
  round: number;
  bracket_position?: number;
  status: "pending";
};

export type TournamentFormat = "bracket" | "round_robin" | "free" | "multi_event";

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function nextPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
}

export function bracketRounds(teamCount: number): number {
  return Math.log2(nextPowerOf2(teamCount));
}

export function recommendFormat(teamCount: number): TournamentFormat {
  if (teamCount <= 4) return "round_robin";
  return "bracket";
}

export type FormatPreview = {
  format: TournamentFormat;
  rounds: number;
  totalMatches: number;
  byes: number;
  description: string;
};

export function previewFormat(teamCount: number, format: TournamentFormat): FormatPreview {
  if (format === "round_robin" || format === "free") {
    const totalMatches = (teamCount * (teamCount - 1)) / 2;
    return {
      format,
      rounds: 1,
      totalMatches,
      byes: 0,
      description: `Alla möter alla — ${totalMatches} matcher`,
    };
  }

  const size = nextPowerOf2(teamCount);
  const rounds = Math.log2(size);
  const byes = size - teamCount;
  const totalMatches = size - 1;
  return {
    format: "bracket",
    rounds,
    totalMatches,
    byes,
    description: byes > 0
      ? `${rounds} rundor, ${totalMatches} matcher (${byes} bye${byes > 1 ? "s" : ""})`
      : `${rounds} rundor, ${totalMatches} matcher`,
  };
}

export function generateRoundRobinMatches(
  teamIds: string[],
  tournamentId: string
): MatchInsert[] {
  const matches: MatchInsert[] = [];
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matches.push({
        tournament_id: tournamentId,
        team_a_id: teamIds[i],
        team_b_id: teamIds[j],
        round: 1,
        status: "pending",
      });
    }
  }
  return matches;
}

export function generateBracketMatches(
  teamIds: string[],
  tournamentId: string
): MatchInsert[] {
  const seeded = shuffle(teamIds);
  const size = nextPowerOf2(seeded.length);
  const totalRounds = Math.log2(size);

  const padded: (string | null)[] = [...seeded];
  while (padded.length < size) padded.push(null);

  const matches: MatchInsert[] = [];

  // Round 1 — real teams + null byes
  let pos = 1;
  for (let i = 0; i < padded.length; i += 2) {
    matches.push({
      tournament_id: tournamentId,
      team_a_id: padded[i],
      team_b_id: padded[i + 1],
      round: 1,
      bracket_position: pos++,
      status: "pending",
    });
  }

  // Future rounds — empty TBD slots (filled as teams advance)
  let matchesInPrevRound = size / 2;
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = matchesInPrevRound / 2;
    for (let p = 1; p <= matchesInRound; p++) {
      matches.push({
        tournament_id: tournamentId,
        team_a_id: null,
        team_b_id: null,
        round,
        bracket_position: p,
        status: "pending",
      });
    }
    matchesInPrevRound = matchesInRound;
  }

  return matches;
}

// Returns indices of round-1 bye matches (team vs null) so the route can auto-complete them
export function getByeMatchIndices(matches: MatchInsert[]): number[] {
  return matches
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.round === 1 && ((m.team_a_id !== null) !== (m.team_b_id !== null)))
    .map(({ i }) => i);
}
