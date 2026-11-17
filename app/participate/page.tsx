import { redirect } from 'next/navigation'

/** Participation guide now lands on the management apply tab. */
export default function ParticipatePage() { redirect('/management#apply') }
