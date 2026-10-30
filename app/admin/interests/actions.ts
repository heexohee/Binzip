'use server'
import { requireAdmin } from '../../../src/admin-auth'
import { sbUpdate } from '../../../src/supabase'
import { revalidatePath } from 'next/cache'
export async function updateInterest(data: FormData) {
 await requireAdmin()
 const id = String(data.get('id')), status = String(data.get('status'))
 if (!/^[0-9a-f-]{36}$/i.test(id) || !['new','contacted','closed'].includes(status)) throw new Error('INVALID_INPUT')
 const saved = await sbUpdate('care_interests', 'id=eq.' + id, {status})
 if (!saved) throw new Error('NOT_SAVED')
 revalidatePath('/admin/interests')
}
