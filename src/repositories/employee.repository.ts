import { sql } from '../config/db'

export interface EmployeeResult {
  employee_id: string
  name: string
  email: string | null
}

export class EmployeeRepository {
  async findByEmail(email: string): Promise<EmployeeResult | null> {
    try {
      const results = await sql`
        SELECT 
          EmpId AS employee_id,
          TRIM(CONCAT(IFNULL(EmpFName, ''), ' ', IFNULL(EmpLname, ''))) AS name,
          EmpEmail AS email
        FROM Employee
        WHERE EmpEmail = ${email}
        LIMIT 1
      `
      return (results as unknown as EmployeeResult[])[0] || null
    } catch (error) {
      console.error('Database error in findByEmail:', error)
      throw error
    }
  }
}
