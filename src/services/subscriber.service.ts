import type {
  AllocateNetworkResult,
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

  async getFttxDetailByIp(ip: string) {
    return await this.subscriberRepository.findFttxDetailByIp(ip)
  }

  async getAvailableIp(
    subnet = '10.233.0.0/22',
  ): Promise<{ subnet: string; available_ip: string } | null> {
    const [baseIp, maskStr] = subnet.split('/')
    const prefix = maskStr ? Number.parseInt(maskStr, 10) : 32
    if (!baseIp || Number.isNaN(prefix) || prefix < 16 || prefix > 32) {
      throw new Error(
        'Invalid subnet CIDR format or prefix too wide (allowed: /16 to /32)',
      )
    }

    const startInt = ipToInt(baseIp)
    const totalIps = 2 ** (32 - prefix)
    const endInt = startInt + totalIps - 1

    const startBlock = startInt >>> 8
    const endBlock = endInt >>> 8
    const prefixes: string[] = []
    for (let b = startBlock; b <= endBlock; b++) {
      prefixes.push(`${(b >>> 16) & 255}.${(b >>> 8) & 255}.${b & 255}.%`)
    }

    const records =
      await this.subscriberRepository.findAllocatedNetworksByPrefixes(prefixes)

    const allocated = new Uint8Array(totalIps)

    for (const net of records) {
      if (!net) continue
      const [ipPart, netMaskStr] = net.split('/')
      const netMask = netMaskStr ? Number.parseInt(netMaskStr, 10) : 32
      const netStart = ipToInt(ipPart)
      const count = 2 ** (32 - netMask)
      const netEnd = netStart + count - 1

      const oStart = Math.max(startInt, netStart)
      const oEnd = Math.min(endInt, netEnd)
      for (let i = oStart; i <= oEnd; i++) {
        allocated[i - startInt] = 1
      }
    }

    for (let i = 0; i < totalIps; i++) {
      if (allocated[i] === 0) {
        return {
          subnet,
          available_ip: intToIp(startInt + i),
        }
      }
    }

    return null
  }

  async allocateNetwork(
    subscriberId: string,
    subnet = '10.233.0.0/22',
    network?: string | null,
  ): Promise<AllocateNetworkResult> {
    let targetNetwork = network?.trim() || null

    if (!targetNetwork) {
      const available = await this.getAvailableIp(subnet)
      if (!available) {
        throw new Error(`No available IP address found in subnet ${subnet}`)
      }
      targetNetwork = `${available.available_ip}/32`
    } else if (!targetNetwork.includes('/')) {
      targetNetwork = `${targetNetwork}/32`
    }

    return await this.subscriberRepository.allocateNetwork(
      subscriberId,
      targetNetwork,
    )
  }
}

function ipToInt(ip: string): number {
  return (
    ip
      .split('.')
      .reduce((acc, oct) => (acc << 8) + Number.parseInt(oct, 10), 0) >>> 0
  )
}

function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join('.')
}
