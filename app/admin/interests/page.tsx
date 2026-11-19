import { redirect } from 'next/navigation'

/** The management list moved to /admin; keep old bookmarks working. */
export default function Page() {
  redirect('/admin')
}
