import { getDestinationForRole } from '@/lib/auth/roles'

describe('getDestinationForRole', () => {
  it('routes farmer to /farmer', () => {
    expect(getDestinationForRole('farmer')).toBe('/farmer')
  })

  it('routes buyer to /marketplace', () => {
    expect(getDestinationForRole('buyer')).toBe('/marketplace')
  })

  it('routes admin to /admin', () => {
    expect(getDestinationForRole('admin')).toBe('/admin')
  })

  it('routes unknown roles to /marketplace by default', () => {
    expect(getDestinationForRole('some-other-role')).toBe('/marketplace')
    expect(getDestinationForRole(undefined)).toBe('/marketplace')
  })
})
