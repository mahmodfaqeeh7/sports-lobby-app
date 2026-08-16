import { AppTabName } from './types';

export function tabRoutesForRoles(roles: string[]): AppTabName[] {
  const routes: AppTabName[] = [];

  if (roles.includes('PLAYER')) {
    routes.push('Explore', 'Bookings');
  }
  if (roles.includes('VENDOR')) {
    routes.push('Vendor');
  }
  if (roles.includes('ADMIN')) {
    routes.push('Admin');
  }

  routes.push('Profile');
  return routes;
}
