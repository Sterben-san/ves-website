export function shouldSeedInitialTeam(existingTeamCount: number, initialTeamSeeded: boolean) {
  return existingTeamCount === 0 && !initialTeamSeeded;
}
