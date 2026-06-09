import { sql } from '../config/db'

export interface IforteTicketResult {
  ticket_id: string
  insert_time: string
  ticket_status: string | null
  customer_id: string | null
  subscriber_id: string | null
  subscription_status: string | null
  subscriber_name: string | null
  ticket_subject: string | null
}

export class TicketRepository {
  async findActiveIforteTickets(): Promise<IforteTicketResult[]> {
    try {
      const results = await sql`
        SELECT
          fvt.ticket_id AS ticket_id,
          fvt.insert_time AS insert_time,
          fvt.vendor_ticket_status AS ticket_status,
          cs.CustId AS customer_id,
          cs.CustServId AS subscriber_id,
          cs.CustStatus AS subscription_status,
          cs.CustAccName AS subscriber_name,
          REGEXP_REPLACE(
            SUBSTRING_INDEX(REPLACE(t.Problem, '\\r', ''), '\\n', 1),
            '^Eskalasi ?: ?',
            ''
          ) AS ticket_subject
        FROM
          FiberVendorTickets fvt
        LEFT JOIN
          Tts t ON t.TtsId = fvt.ticket_id
        LEFT JOIN
          CustomerServices cs ON cs.CustServId = t.CustServId
        WHERE
          fvt.fiber_vendor_id = 22
          AND t.Status NOT IN ('Call', 'Pending', 'Cancel', 'Closed')
        ORDER BY
          cs.CustStatus,
          fvt.insert_time
      `
      return results as unknown as IforteTicketResult[]
    } catch (error) {
      console.error('Database error in findActiveIforteTickets:', error)
      throw error
    }
  }
}
