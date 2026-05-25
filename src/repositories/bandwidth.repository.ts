import { sql } from '../config/db'

export interface BandwidthInfo {
  ip: string
  download_rate: number
  upload_rate: number
  unit: string
  subscription_package: string
}

export class BandwidthRepository {
  async findByIps(ips: string[]): Promise<BandwidthInfo[]> {
    if (ips.length === 0) return []

    // Batching logic (500 per batch) for performance and stability
    const BATCH_SIZE = 500
    const batches: string[][] = []
    for (let i = 0; i < ips.length; i += BATCH_SIZE) {
      batches.push(ips.slice(i, i + BATCH_SIZE))
    }

    try {
      const queryResults = await Promise.all(
        batches.map(
          (batch) => sql`
            SELECT
              cst.Network AS ip,
              (ss.NormalDownCeil * 1000) AS download_rate,
              (ss.NormalUpCeil * 1000) AS upload_rate,
              'bps' AS unit,
              cs.ServiceId AS subscription_package
            FROM
              CustomerServiceTechnical AS cst
            LEFT JOIN
              CustomerServices AS cs ON cs.CustServId = cst.CustServId
            LEFT JOIN
              Services AS s ON cs.ServiceId = s.ServiceId
            LEFT JOIN
              ServiceShaping AS ss ON cs.ServiceId = ss.ServiceId
            WHERE
              NOT (s.ServiceGroup IN ('SLBP', 'MT', 'IP'))
              AND cst.Network IN ${batch}
          `,
        ),
      )

      // Flatten the results from all batches
      return queryResults.flat() as unknown as BandwidthInfo[]
    } catch (error) {
      console.error('Database error in findByIps:', error)
      throw error
    }
  }
}
