export type ScreenId = 'word-entry' | 'game-setup' | 'gameplay' | 'scoreboard'

export interface ScreenNavItem {
  id: ScreenId
  label: string
}
