import { tabRoutesForRoles } from '../src/navigation/roleTabs';

describe('role navigation', () => {
  it('shows player screens only to players', () => {
    expect(tabRoutesForRoles(['PLAYER'])).toEqual([
      'Explore',
      'Bookings',
      'Profile',
    ]);
    expect(tabRoutesForRoles(['VENDOR'])).toEqual(['Vendor', 'Profile']);
    expect(tabRoutesForRoles(['ADMIN'])).toEqual(['Admin', 'Profile']);
  });

  it('combines capabilities for multi-role accounts', () => {
    expect(tabRoutesForRoles(['PLAYER', 'VENDOR', 'ADMIN'])).toEqual([
      'Explore',
      'Bookings',
      'Vendor',
      'Admin',
      'Profile',
    ]);
  });
});
