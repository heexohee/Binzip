import type { ApplicationRow, ReportRow } from '../admin/types'
import { buildReportOverview } from '../../src/report-overview-model'
import { ReportOverview } from './report-overview'

/** Customer report and authenticated admin preview share this presentation. */
export function ReportDoc({ rep, app }: { rep: ReportRow; app: ApplicationRow }) {
  return <ReportOverview {...buildReportOverview(rep, app)} />
}
