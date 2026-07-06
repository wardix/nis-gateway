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

  async getEmployeeSolvedTicketSummary(
    targetDate?: string,
    excludedEmployeeIds?: string[],
    departmentId?: number,
  ) {
    // Default to yesterday if targetDate is not provided
    let finalTargetDate = targetDate
    if (!finalTargetDate) {
      const target = new Date()
      target.setDate(target.getDate() - 1)
      const yyyy = target.getFullYear()
      const mm = String(target.getMonth() + 1).padStart(2, '0')
      const dd = String(target.getDate()).padStart(2, '0')
      finalTargetDate = `${yyyy}-${mm}-${dd}`
    }

    const finalExcludedEmployeeIds = excludedEmployeeIds ?? []
    const finalDepartmentId = departmentId ?? 34

    return await this.ticketRepository.getEmployeeSolvedTicketSummary(
      finalTargetDate,
      finalExcludedEmployeeIds,
      finalDepartmentId,
    )
  }
}
