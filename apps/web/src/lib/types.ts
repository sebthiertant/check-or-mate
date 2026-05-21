export type Result = "1-0" | "0-1" | "1/2-1/2"
export type TimeClass = "bullet" | "blitz" | "rapid" | "classical"

export interface Scores {
  sacrifice: number
  eval_swing: number
  brilliancy: number
  time_pressure: number
  endgame_quality: number
  rating_upset: number
  opening_rarity: number
  overall: number
}

export interface Game {
  id: string
  white: string
  black: string
  white_rating: number
  black_rating: number
  result: Result
  eco: string
  opening_name: string
  time_class: TimeClass
  date: string
  scores: Scores
}

export type ScoreDimension = keyof Omit<Scores, "overall">

export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  sacrifice: "Sacrifice",
  eval_swing: "Drama",
  brilliancy: "Brilliancy",
  time_pressure: "Clock pressure",
  endgame_quality: "Endgame",
  rating_upset: "Upset",
  opening_rarity: "Rarity",
}
