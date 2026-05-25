import { sql } from '../config/db'

export interface SubscriberLookupResult {
  subscriber_id: string
  subscriber_name: string
}

export interface SyncGraphItem {
  subscriber_id: string
  graph_id: string
}

export interface FttxCircuitResult {
  subscriber_id: string
  subscriber_name: string
  circuit_id: string
}

export class SubscriberRepository {
  async findByPhone(phone: string): Promise<SubscriberLookupResult[]> {
    try {
      const results = await sql`
        SELECT
          cs.CustServId AS subscriber_id,
          cs.CustAccName AS subscriber_name
        FROM
          sms_phonebook AS sp
        LEFT JOIN
          CustomerServices cs
        ON sp.CustId = cs.CustId
        WHERE
          CONCAT('+', sp.phone) LIKE CONCAT('%+', ${phone})
          AND NOT (cs.CustStatus IN ('NA'))
      `
      return results as unknown as SubscriberLookupResult[]
    } catch (error) {
      console.error('Database error in findByPhone:', error)
      throw error
    }
  }

  async syncGraphs(
    data: SyncGraphItem[],
    updatedBy: string,
  ): Promise<number | null> {
    if (data.length === 0) return 0

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

    const subscriberGraphData = data.map((item) => ({
      CustServId: item.subscriber_id,
      GraphId: item.graph_id,
      OrderNo: 1,
      UpdatedTime: now,
      updatedBy: updatedBy,
    }))

    try {
      const result = await sql`
        INSERT IGNORE INTO CustomerServicesZabbixGraph
        ${sql(subscriberGraphData)}
      `
      return result.count
    } catch (error) {
      console.error('Database error in syncGraphs:', error)
      throw error
    }
  }

  async getFttxCircuitsPaginated(
    page: number,
    pageSize: number,
    operatorId?: string,
  ) {
    const offset = (page - 1) * pageSize

    // Use a function or a shared partial to mimic the baseQuery behavior
    const baseQuery = (isCount: boolean) => {
      const selectClause = isCount
        ? sql`SELECT COUNT(*) as total`
        : sql`SELECT
            cstl.CustServId AS subscriber_id,
            cs.CustAccName AS subscriber_name,
            cstc.value AS circuit_id`

      return sql`
        ${selectClause}
        FROM CustomerServiceTechnicalCustom cstc
        LEFT JOIN CustomerServiceTechnicalLink cstl ON cstl.id = cstc.technicalTypeId
        LEFT JOIN CustomerServices cs ON cs.CustServId = cstl.CustServId
        LEFT JOIN Customer c ON c.CustId = cs.CustId
        LEFT JOIN noc_fiber nf ON nf.id = cstl.foVendorId
        LEFT JOIN fiber_vendor fv ON nf.vendorId = fv.id
        WHERE
            cstc.technicalType = 'link'
            AND cstc.attribute = 'Vendor CID'
            AND cstl.CustServId IS NOT NULL
            AND cs.CustStatus NOT IN ('NA')
            ${operatorId ? sql`AND fv.id = ${operatorId}` : sql``}
            AND cstc.value <> ''
      `
    }

    try {
      const [results, totalCount] = await Promise.all([
        sql`${baseQuery(false)} LIMIT ${pageSize} OFFSET ${offset}`,
        sql`${baseQuery(true)}`,
      ])

      return {
        results: results as unknown as FttxCircuitResult[],
        total: (totalCount[0] as { total: number }).total,
      }
    } catch (error) {
      console.error('Database error in getFttxCircuitsPaginated:', error)
      throw error
    }
  }
}
