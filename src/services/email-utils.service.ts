import { Injectable } from '@nestjs/common';
import { EmailUserAddress } from '../types/emails.types';

@Injectable()
export class EmailUtilsService {
  formatAddress(address: EmailUserAddress) {
    address.address = address.address.toLowerCase().trim();
    address.name = address.name ? address.name.trim() : undefined;
    return address;
  }

  formatAddresses(addresses: EmailUserAddress[]) {
    addresses = addresses.map((address) => this.formatAddress(address));

    addresses = addresses.filter(
      (address, index, self) => index === self.findIndex((t) => t.address === address.address),
    );

    return addresses;
  }
}
