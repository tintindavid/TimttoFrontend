import { BaseService } from './base.service';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer.types';

class CustomerService extends BaseService<Customer, CreateCustomerDto, UpdateCustomerDto> {
  constructor() {
    super('/customers');
  }

  // extra customer-specific methods here if needed
}

export const customerService = new CustomerService();
