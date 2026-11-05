import type { CustomerRepository } from '../repositories/customer.repository'

export interface CallerIdSubscriber {
  subscriber_id: string
  service: string | null
  account: string
  address: string
}

export interface CallerIdCustomer {
  customer_id: string
  company: string
  branch: string
  subscribers: CallerIdSubscriber[]
}

export interface CallerIdResult {
  contact: {
    name: string
    salutation: string | null
    phone: string
  }
  customers: CallerIdCustomer[]
}

export class CustomerService {
  constructor(private customerRepository: CustomerRepository) {}

  async getCustomerIdsByEmail(email: string): Promise<string[]> {
    return await this.customerRepository.findIdsByEmail(email)
  }

  async getCallerId(phone: string): Promise<CallerIdResult | null> {
    const contacts = await this.customerRepository.findContactsByPhone(phone)
    if (contacts.length === 0) {
      return null
    }

    // Pick contact name and salutation (favoring non-null salutation if available)
    const primaryContact =
      contacts.find((c) => c.salutation !== null) ?? contacts[0]

    // Extract unique customer IDs
    const customerIds = [
      ...new Set(contacts.map((c) => c.customer_id).filter(Boolean)),
    ]

    const [customers, subscribers] = await Promise.all([
      this.customerRepository.findCustomersByIds(customerIds),
      this.customerRepository.findSubscribersByCustomerIds(customerIds),
    ])

    // Group subscribers by customer_id
    const subscribersByCustomerId = new Map<string, CallerIdSubscriber[]>()
    for (const sub of subscribers) {
      const list = subscribersByCustomerId.get(sub.customer_id) ?? []
      list.push({
        subscriber_id: sub.subscriber_id,
        service: sub.service,
        account: sub.account,
        address: sub.address,
      })
      subscribersByCustomerId.set(sub.customer_id, list)
    }

    // Build hierarchical customer list
    const customerList: CallerIdCustomer[] = customers.map((c) => ({
      customer_id: c.customer_id,
      company: c.company,
      branch: c.branch,
      subscribers: subscribersByCustomerId.get(c.customer_id) ?? [],
    }))

    return {
      contact: {
        name: primaryContact.name,
        salutation: primaryContact.salutation,
        phone,
      },
      customers: customerList,
    }
  }
}
