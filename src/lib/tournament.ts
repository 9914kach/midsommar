type MatchInsert = {
  tournament_id: string;
  team_a_id: string | null;
  team_b_id: string | null;
  round: number;
  bracket_position?: number;
  status: "pending";
};

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
  const matches: MatchInsert[] = [];
  let position = 1;
  for (let i = 0; i < seeded.length; i += 2) {
    matches.push({
      tournament_id: tournamentId,
      team_a_id: seeded[i] ?? null,
      team_b_id: seeded[i + 1] ?? null,
      round: 1,
      bracket_position: position,
      status: "pending",
    });
    position++;
  }
  return matches;
}
