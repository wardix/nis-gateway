import { sql } from '../config/db'

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
}
