import { sql } from '../config/db'

export interface BandwidthInfo {
  ip: string
  download_rate: number
  upload_rate: number
  unit: string
  subscription_package: string
}

export interface HeavyUserInput {
  startDate: string
  endDate: string
  branches: string[]
  maxPricePerGb: number
  limit: number
}

export interface HeavyUserResult {
  subscriber_id: string
  subscriber_name: string
  service_id: string
  status: string
  branch: string
  service_charge: number
  total_gb: number
  price_each_gb: number
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
          const networks = batch.map((ip) =>
            ip.endsWith('/32') ? ip : `${ip}/32`,
          )

          const placeholders = networks.map(() => '?').join(', ')
          const query = `
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
              AND cst.Network IN (${placeholders})
          `

          return sql.unsafe(query, networks)
        }),
      )

      // Flatten the results from all batches
      return queryResults.flat() as unknown as BandwidthInfo[]
    } catch (error) {
      console.error('Database error in findByIps:', error)
      throw error
    }
  }

  async findHeavyUsers(input: HeavyUserInput): Promise<HeavyUserResult[]> {
    const { startDate, endDate, branches, maxPricePerGb, limit } = input
    const branchList =
      branches.length > 0 ? branches : ['020', '062', '025', '027', '029']

    const branchPlaceholders = branchList.map(() => '?').join(', ')
    const params = [startDate, endDate, ...branchList, maxPricePerGb, limit]

    const query = `
      SELECT
          CAST(cs.CustServId AS CHAR) AS subscriber_id,
          cs.CustAccName AS subscriber_name,
          cs.ServiceId AS service_id,
          cs.CustStatus AS status,
          IFNULL(c.DisplayBranchId, c.BranchId) AS branch,
          s.ServiceCharge AS service_charge,
          ROUND(td.total_bytes / 1024 / 1024 / 1024, 2) AS total_gb,
          ROUND(s.ServiceCharge / (td.total_bytes / 1024 / 1024 / 1024), 2) AS price_each_gb
      FROM CustomerServices cs
          LEFT JOIN Customer c ON c.CustId = cs.CustId
          LEFT JOIN Services s ON cs.ServiceId = s.ServiceId
          LEFT JOIN ServiceGroup sg ON sg.ServiceGroup = s.ServiceGroup
          LEFT JOIN (
              SELECT
                  csid,
                  SUM(total) AS total_bytes
              FROM traff_data
              WHERE date BETWEEN ? AND ?
              GROUP BY csid
          ) AS td ON td.csid = cs.CustServId
      WHERE
          IFNULL(c.DisplayBranchId, c.BranchId) IN (${branchPlaceholders})
          AND sg.ServiceGroupTypeId = 1
          AND td.total_bytes IS NOT NULL
          AND cs.CustStatus NOT IN ('BL', 'FR', 'NA')
          AND s.ServiceCharge > 0
      HAVING price_each_gb < ?
      ORDER BY price_each_gb ASC
      LIMIT ?
    `

    try {
      const results = await sql.unsafe(query, params)
      return results as unknown as HeavyUserResult[]
    } catch (error) {
      console.error('Database error in findHeavyUsers:', error)
      throw error
    }
  }
}
