import type {
  SubscriberIpLookupResult,
  SubscriberLookupResult,
  SubscriberNetworkResult,
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

  async getFttxHomepasses(page: number, pageSize: number, operatorId: string) {
    return await this.subscriberRepository.getHomepassesPaginated(
      page,
      pageSize,
      operatorId,
    )
  }

  async getSubscriberNetworks(
    subscriberIds: string[],
  ): Promise<SubscriberNetworkResult[]> {
    return await this.subscriberRepository.findNetworksBySubscriberIds(
      subscriberIds,
    )
  }

  async getFttxTargets(operatorId: string, branches: string[]) {
    return await this.subscriberRepository.findFttxTargets(operatorId, branches)
  }

  async searchByIps(ips: string[]): Promise<SubscriberIpLookupResult[]> {
    return await this.subscriberRepository.findByIps(ips)
  }
}
