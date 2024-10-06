import { Injectable } from '@nestjs/common';
import { EmailUserAddress } from '../types/emails.types';

@Injectable()
export class EmailUtilsService {
  formatAddress(address: EmailUserAddress): EmailUserAddress {
    if (typeof address === 'string') {
      return address.toLowerCase().trim();
    }

    address.address = address.address.toLowerCase().trim();
    address.name = address.name.trim();
    return address;
  }

  formatAddresses(addresses: EmailUserAddress[]) {
    const values = addresses.map((address) => this.formatAddress(address));

    const uniqValues = values.filter(
      (address, index, self) =>
        index ===
        self.findIndex((t) => {
          const a1 = typeof address === 'string' ? address : address.address;
          const a2 = typeof t === 'string' ? t : t.address;
          return a1 === a2;
        }),
    );

    return uniqValues;
  }
}
