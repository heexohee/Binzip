export type IntakeGoal = 'sell' | 'demolish' | 'repair' | 'all'

export function toggleGoal(current: IntakeGoal[], goal: IntakeGoal): IntakeGoal[] {
  if (current.includes(goal)) return current.filter(item => item !== goal)
  if (goal === 'all') return ['all']
  return [...current.filter(item => item !== 'all'), goal]
}

export function intakeScreens(goals: IntakeGoal[]): string[] {
  const includes = (goal: IntakeGoal) => goals.includes('all') || goals.includes(goal)
  return ['house', 'goals',
    ...(includes('demolish') ? ['demolition'] : []),
    ...(includes('repair') ? ['repair'] : []),
    'ownership', 'contact']
}
