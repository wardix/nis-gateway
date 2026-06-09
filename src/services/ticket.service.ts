import type {
  IforteTicketResult,
  TicketRepository,
} from '../repositories/ticket.repository'

export class TicketService {
  constructor(private ticketRepository: TicketRepository) {}

  async getActiveIforteTickets(): Promise<IforteTicketResult[]> {
    return await this.ticketRepository.findActiveIforteTickets()
  }
}
