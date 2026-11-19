'use server'
import { requireAdmin } from '../../../src/admin-auth'
import { sbDelete, sbUpdate } from '../../../src/supabase'
import { revalidatePath } from 'next/cache'
import { INTEREST_STATUS_IDS } from '../../../src/admin-interests'
export async function updateInterest(data: FormData) {
 await requireAdmin()
 const id = String(data.get('id')), status = String(data.get('status'))
 if (!/^[0-9a-f-]{36}$/i.test(id) || !(INTEREST_STATUS_IDS as readonly string[]).includes(status)) throw new Error('INVALID_INPUT')
 const saved = await sbUpdate('care_interests', 'id=eq.' + id, {status})
 if (!saved) throw new Error('NOT_SAVED')
 revalidatePath('/admin')
}
/** 설문 응답을 영구 삭제한다. 확인 체크를 서버에서도 다시 본다. */
export async function deleteInterest(data: FormData) {
 await requireAdmin()
 const id = String(data.get('id'))
 if (!/^[0-9a-f-]{36}$/i.test(id) || data.get('confirmDelete') !== 'on') throw new Error('INVALID_INPUT')
 if (!await sbDelete('care_interests', 'id=eq.' + id)) throw new Error('NOT_DELETED')
 revalidatePath('/admin')
 revalidatePath('/admin/metrics')
}
