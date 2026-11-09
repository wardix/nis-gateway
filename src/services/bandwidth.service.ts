import type {
  BandwidthInfo,
  BandwidthRepository,
  HeavyUserResult,
} from '../repositories/bandwidth.repository'

export interface GetHeavyUsersOptions {
  startDate?: string
  endDate?: string
  branches?: string
  maxPricePerGb?: number
  limit?: number
}

export interface HeavyUsersResponse {
  period: {
    start_date: string
    end_date: string
  }
  results: HeavyUserResult[]
}

export class BandwidthService {
  constructor(private bandwidthRepository: BandwidthRepository) {}

  async lookupBandwidth(ips: string[]): Promise<BandwidthInfo[]> {
    // Here you can add business logic, like filtering or additional validation
    // or checking the cache (Valkey) before querying the database.
    return await this.bandwidthRepository.findByIps(ips)
  }

  async getHeavyUsers(
    options: GetHeavyUsersOptions = {},
  ): Promise<HeavyUsersResponse> {
    const nowWib = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Jakarta',
    })
    const startOfMonth = `${nowWib.slice(0, 7)}-01`

    const startDate = options.startDate || startOfMonth
    const endDate = options.endDate || nowWib

    const branchList = options.branches
      ? options.branches
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean)
      : ['020', '062', '025', '027', '029']

    const maxPricePerGb = options.maxPricePerGb ?? 200
    const limit = Math.max(options.limit ?? 10, 1)

    const results = await this.bandwidthRepository.findHeavyUsers({
      startDate,
      endDate,
      branches: branchList,
      maxPricePerGb,
      limit,
    })

    return {
      period: {
        start_date: startDate,
        end_date: endDate,
      },
      results,
    }
  }
}
