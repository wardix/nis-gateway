import type { CustomerRepository } from '../repositories/customer.repository'

export class CustomerService {
  constructor(private customerRepository: CustomerRepository) {}

  async getCustomerIdsByEmail(email: string): Promise<string[]> {
    return await this.customerRepository.findIdsByEmail(email)
  }
}
