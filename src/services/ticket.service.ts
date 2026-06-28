import type {
  IforteTicketResult,
  TicketRepository,
} from '../repositories/ticket.repository'

export class TicketService {
  constructor(private ticketRepository: TicketRepository) {}

  async getActiveIforteTickets(): Promise<IforteTicketResult[]> {
    return await this.ticketRepository.findActiveIforteTickets()
  }

  async getMonitoringTargets(branches: string[], typeId: number) {
    return await this.ticketRepository.findMonitoringTargets(branches, typeId)
  }

  async getUnassignedTickets(branch: string) {
    return await this.ticketRepository.findUnassignedTickets(branch)
  }

  async getVendorTickets(vendorId: string) {
    return await this.ticketRepository.findVendorTickets(vendorId)
  }
}
