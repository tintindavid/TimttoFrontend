import { BaseService } from './base.service';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer.types';

class CustomerService extends BaseService<Customer, CreateCustomerDto, UpdateCustomerDto> {
  constructor() {
    super('/customers');
  }

  async downloadInventario(customerId: string, formato: 'excel' | 'pdf'): Promise<void> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');

    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantId) headers['x-tenant-id'] = tenantId;

    const response = await fetch(
      `${API_URL}/customers/${customerId}/inventario?formato=${formato}`,
      { method: 'GET', headers }
    );

    if (!response.ok) {
      let message = `Error ${response.status}`;
      try {
        const data = await response.json();
        message = data.message || message;
      } catch { /* ignore parse error */ }
      throw new Error(message);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = formato === 'excel'
      ? `inventario_cliente_${customerId}.xlsx`
      : `inventario_cliente_${customerId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async exportCSV(search?: string): Promise<void> {
    const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');

    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantId) headers['x-tenant-id'] = tenantId;

    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetch(`${API_URL}/customers/export${params}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let message = `Error ${response.status}`;
      try {
        const data = await response.json();
        message = data.message || message;
      } catch { /* ignore parse error */ }
      throw new Error(message);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    a.download = `clientes_${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const customerService = new CustomerService();
