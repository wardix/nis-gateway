import type {
  SubscriberLookupResult,
  SubscriberRepository,
  SyncGraphItem,
} from '../repositories/subscriber.repository'

export class SubscriberService {
  constructor(private subscriberRepository: SubscriberRepository) {}

  async searchByPhone(phone: string): Promise<SubscriberLookupResult[]> {
    return await this.subscriberRepository.findByPhone(phone)
  }

  async syncGraphs(
    data: SyncGraphItem[],
    updatedBy: string,
  ): Promise<number | null> {
    return await this.subscriberRepository.syncGraphs(data, updatedBy)
  }

  async getFttxCircuits(page: number, pageSize: number, operatorId: string) {
    return await this.subscriberRepository.getFttxCircuitsPaginated(
      page,
      pageSize,
      operatorId,
    )
  }
}
