import { redirect } from 'next/navigation'

/** Previous instant-report entry now lands on the diagnosis page. */
export default function DiagnosePage() { redirect('/diagnosis') }
