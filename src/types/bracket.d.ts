declare module "@g-loot/react-tournament-brackets" {
  import { ComponentType, ReactNode } from "react";

  export interface ParticipantType {
    id: string;
    name?: string;
    resultText?: string | null;
    isWinner?: boolean;
    status?: string | null;
  }

  export interface MatchType {
    id: string;
    nextMatchId?: string | null;
    tournamentRoundText?: string;
    startTime?: string;
    state: string;
    participants: ParticipantType[];
  }

  export interface MatchComponentProps {
    match: MatchType;
    topParty: ParticipantType;
    bottomParty: ParticipantType;
    topWon: boolean;
    bottomWon: boolean;
    [key: string]: unknown;
  }

  export interface SvgViewerProps {
    bracketWidth?: number;
    bracketHeight?: number;
    children?: ReactNode;
    [key: string]: unknown;
  }

  export interface SingleElimLeaderboardProps {
    matches: MatchType[];
    matchComponent?: ComponentType<MatchComponentProps>;
    svgWrapper?: ComponentType<SvgViewerProps>;
    [key: string]: unknown;
  }

  export const SingleEliminationBracket: ComponentType<SingleElimLeaderboardProps>;
  export const DoubleEliminationBracket: ComponentType<Record<string, unknown>>;
  export const SVGViewer: ComponentType<SvgViewerProps>;
  export const Match: ComponentType<MatchComponentProps>;
  export const MATCH_STATES: Record<string, string>;
  export function createTheme(theme: Record<string, unknown>): Record<string, unknown>;
}
