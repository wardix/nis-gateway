import { HTTPException } from 'hono/http-exception'
import type {
  EmployeeRepository,
  EmployeeResult,
} from '../repositories/employee.repository'

export class EmployeeService {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async getEmployeeByEmail(email: string): Promise<EmployeeResult> {
    const employee = await this.employeeRepository.findByEmail(email)

    if (!employee) {
      throw new HTTPException(404, { message: 'Employee not found' })
    }

    return employee
  }
}
