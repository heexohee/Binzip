import { redirect } from 'next/navigation'

/** Participation guide merged into /diagnosis; old links land on its apply section. */
export default function ParticipatePage() { redirect('/diagnosis#apply') }
