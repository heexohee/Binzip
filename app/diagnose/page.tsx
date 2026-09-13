import { redirect } from 'next/navigation'

/** Previous instant-report entry now starts at address confirmation on the home page. */
export default function DiagnosePage() { redirect('/#address-search') }
