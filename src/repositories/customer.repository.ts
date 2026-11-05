import { sql } from '../config/db'

export interface PhonebookContactResult {
  name: string
  salutation: string | null
  customer_id: string
}

export interface CustomerCompanyResult {
  customer_id: string
  company: string
  branch: string
}

export interface CustomerSubscriberResult {
  customer_id: string
  subscriber_id: string
  service: string | null
  account: string
  address: string
}

export class CustomerRepository {
  async findIdsByEmail(email: string): Promise<string[]> {
    try {
      const results = await sql`
        SELECT
          CustId as customer_id
        FROM
          Customer
        WHERE
          (FIND_IN_SET(${email}, REPLACE(CustEmail, ' ', '')) > 0) OR
          (FIND_IN_SET(${email}, REPLACE(CustTechCPEmail, ' ', '')) > 0) OR
          (FIND_IN_SET(${email}, REPLACE(CustBillCPEmail, ' ', '')) > 0)
      `

      // Map results to return an array of IDs
      return results.map((row) => (row as { customer_id: string }).customer_id)
    } catch (error) {
      console.error('Database error in findIdsByEmail:', error)
      throw error
    }
  }

  async findContactsByPhone(phone: string): Promise<PhonebookContactResult[]> {
    const digits = phone.replace(/\D/g, '')
    if (!digits) return []

    // Build phone patterns to tolerate 08..., 628..., etc.
    const patterns: string[] = [digits]
    if (digits.startsWith('0')) {
      patterns.push(`62${digits.slice(1)}`)
    } else if (digits.startsWith('62')) {
      patterns.push(`0${digits.slice(2)}`)
    }

    const uniquePatterns = [...new Set(patterns)]
    const whereClause = uniquePatterns.map(() => 'sp.phone LIKE ?').join(' OR ')
    const params = uniquePatterns.map((p) => `%${p}`)

    try {
      const query = `
        SELECT
          sp.name,
          tcs.salutation,
          sp.custId AS customer_id
        FROM sms_phonebook sp
        LEFT JOIN tapi_call_salutation tcs ON sp.salutationId = tcs.id
        WHERE (${whereClause})
          AND sp.custId IS NOT NULL
        ORDER BY sp.insertTime DESC
      `
      const results = await sql.unsafe(query, params)
      return results as unknown as PhonebookContactResult[]
    } catch (error) {
      console.error('Database error in findContactsByPhone:', error)
      throw error
    }
  }

  async findCustomersByIds(
    customerIds: string[],
  ): Promise<CustomerCompanyResult[]> {
    if (customerIds.length === 0) return []

    const BATCH_SIZE = 500
    const batches: string[][] = []
    for (let i = 0; i < customerIds.length; i += BATCH_SIZE) {
      batches.push(customerIds.slice(i, i + BATCH_SIZE))
    }

    try {
      const queryResults = await Promise.all(
        batches.map((batch) => {
          const placeholders = batch.map(() => '?').join(', ')
          const query = `
            SELECT
              CustId AS customer_id,
              CustCompany AS company,
              IFNULL(DisplayBranchId, BranchId) AS branch
            FROM Customer
            WHERE CustId IN (${placeholders})
          `
          return sql.unsafe(query, batch)
        }),
      )
      return queryResults.flat() as unknown as CustomerCompanyResult[]
    } catch (error) {
      console.error('Database error in findCustomersByIds:', error)
      throw error
    }
  }

  async findSubscribersByCustomerIds(
    customerIds: string[],
  ): Promise<CustomerSubscriberResult[]> {
    if (customerIds.length === 0) return []

    const BATCH_SIZE = 500
    const batches: string[][] = []
    for (let i = 0; i < customerIds.length; i += BATCH_SIZE) {
      batches.push(customerIds.slice(i, i + BATCH_SIZE))
    }

    try {
      const queryResults = await Promise.all(
        batches.map((batch) => {
          const placeholders = batch.map(() => '?').join(', ')
          const query = `
            SELECT
              cs.CustId AS customer_id,
              CAST(cs.CustServId AS CHAR) AS subscriber_id,
              s.ServiceType AS service,
              cs.CustAccName AS account,
              IFNULL(cs.installation_address, '') AS address
            FROM CustomerServices cs
            LEFT JOIN Services s ON cs.ServiceId = s.ServiceId
            WHERE cs.CustId IN (${placeholders})
              AND cs.CustStatus != 'NA'
          `
          return sql.unsafe(query, batch)
        }),
      )
      return queryResults.flat() as unknown as CustomerSubscriberResult[]
    } catch (error) {
      console.error('Database error in findSubscribersByCustomerIds:', error)
      throw error
    }
  }
}
