import type {
  BandwidthInfo,
  BandwidthRepository,
} from '../repositories/bandwidth.repository'

export class BandwidthService {
  constructor(private bandwidthRepository: BandwidthRepository) {}

  async lookupBandwidth(ips: string[]): Promise<BandwidthInfo[]> {
    // Here you can add business logic, like filtering or additional validation
    // or checking the cache (Valkey) before querying the database.
    return await this.bandwidthRepository.findByIps(ips)
  }
}
