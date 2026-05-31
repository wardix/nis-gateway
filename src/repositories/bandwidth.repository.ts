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
        batches.map((batch) => {
          const strings: string[] = []
          const values: string[] = []

          for (let i = 0; i < batch.length; i++) {
            const ip = batch[i]
            if (i === 0) {
              strings.push(`
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
                  AND (
                    (cst.Network = `)
            } else {
              strings.push(`) OR (cst.Network = `)
            }

            strings.push(` OR cst.Network = CONCAT(`)
            strings.push(
              `, '/32') OR (INSTR(cst.Network, '/') > 0 AND INET_ATON(`,
            )

            values.push(ip, ip, ip)
          }

          strings.push(
            `) BETWEEN INET_ATON(SUBSTRING_INDEX(cst.Network, '/', 1)) AND (INET_ATON(SUBSTRING_INDEX(cst.Network, '/', 1)) + POWER(2, 32 - CAST(SUBSTRING_INDEX(cst.Network, '/', -1) AS UNSIGNED)) - 1)))`,
          )

          const stringsArray = strings as unknown as TemplateStringsArray
          stringsArray.raw = stringsArray

          return sql(stringsArray, ...values)
        }),
      )

      // Flatten the results from all batches
      return queryResults.flat() as unknown as BandwidthInfo[]
    } catch (error) {
      console.error('Database error in findByIps:', error)
      throw error
    }
  }
}
