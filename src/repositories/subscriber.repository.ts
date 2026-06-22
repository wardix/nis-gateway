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

export interface FttxHomepassResult {
  subscriber_id: string
  subscriber_name: string
  circuit_id: string | null
  homepass_id: string | null
  subscription_status: string
}

export interface SubscriberNetworkResult {
  subscriber_id: string
  network: string
}

export class SubscriberRepository {
  async findByPhone(phone: string): Promise<SubscriberLookupResult[]> {
    try {
      // Escape special LIKE wildcard characters (% and _) to prevent injection
      const escapedPhone = phone.replace(/[%_]/g, '\\$&')

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
          CONCAT('+', sp.phone) LIKE CONCAT('%+', ${escapedPhone})
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
    operatorId: string,
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
      LEFT JOIN noc_fiber nf ON nf.id = cstl.foVendorId
      LEFT JOIN fiber_vendor fv ON nf.vendorId = fv.id
      WHERE
          cstc.technicalType = 'link'
          AND cstc.attribute = 'Vendor CID'
          AND cstl.CustServId IS NOT NULL
          AND cs.CustStatus NOT IN ('NA')
          AND fv.id = ${operatorId}
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

  async getHomepassesPaginated(
    page: number,
    pageSize: number,
    operatorId: string,
  ) {
    const offset = (page - 1) * pageSize

    const baseQuery = (isCount: boolean) => {
      const selectClause = isCount
        ? sql`SELECT COUNT(*) as total`
        : sql`SELECT
            cs.CustServId AS subscriber_id,
            cs.CustAccName AS subscriber_name,
            cstc1.value AS circuit_id,
            cstc2.value AS homepass_id,
            cs.CustStatus AS subscription_status`

      return sql`
      ${selectClause}
      FROM CustomerServiceTechnicalLink cstl
      LEFT JOIN CustomerServices cs ON cs.CustServId = cstl.custServId
      LEFT JOIN noc_fiber nf ON nf.id = cstl.foVendorId
      LEFT JOIN fiber_vendor fv ON fv.id = nf.vendorId
      LEFT JOIN CustomerServiceTechnicalCustom cstc1
        ON  cstc1.technicalType = 'link'
        AND cstc1.technicalTypeId = cstl.id
        AND cstc1.attribute = 'Vendor CID'
      LEFT JOIN CustomerServiceTechnicalCustom cstc2
        ON  cstc2.technicalType = 'link'
        AND cstc2.technicalTypeId = cstl.id
        AND cstc2.attribute = 'Home Id'
      WHERE
        fv.id = ${operatorId}
        AND cs.CustStatus IN ('AC', 'FR')
      `
    }

    try {
      const [results, totalCount] = await Promise.all([
        sql`${baseQuery(false)} LIMIT ${pageSize} OFFSET ${offset}`,
        sql`${baseQuery(true)}`,
      ])

      return {
        results: results as unknown as FttxHomepassResult[],
        total: (totalCount[0] as { total: number }).total,
      }
    } catch (error) {
      console.error('Database error in getHomepassesPaginated:', error)
      throw error
    }
  }

  async findNetworksBySubscriberIds(
    subscriberIds: string[],
  ): Promise<SubscriberNetworkResult[]> {
    if (subscriberIds.length === 0) return []

    const BATCH_SIZE = 500
    const batches: string[][] = []
    for (let i = 0; i < subscriberIds.length; i += BATCH_SIZE) {
      batches.push(subscriberIds.slice(i, i + BATCH_SIZE))
    }

    try {
      const queryResults = await Promise.all(
        batches.map((batch) => {
          const strings = [
            `
            SELECT
              CustServId AS subscriber_id,
              Network AS network
            FROM
              CustomerServiceTechnical
            WHERE
              CustServId IN (`,
            ...Array(batch.length - 1).fill(', '),
            ')',
          ] as unknown as TemplateStringsArray
          strings.raw = strings

          return sql(strings, ...batch)
        }),
      )

      return queryResults.flat() as unknown as SubscriberNetworkResult[]
    } catch (error) {
      console.error('Database error in findNetworksBySubscriberIds:', error)
      throw error
    }
  }
}
