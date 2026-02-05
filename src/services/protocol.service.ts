import { BaseService } from './base.service';
import { ProtocolMtto, CreateProtocolDto, UpdateProtocolDto } from '@/types/protocol.types';

class ProtocolService extends BaseService<ProtocolMtto, CreateProtocolDto, UpdateProtocolDto> {
  constructor() {
    super('/protocolo-mtto');
  }
  // protocol-specific actions
}

export const protocolService = new ProtocolService();
