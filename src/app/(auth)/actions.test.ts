import { login, signup } from './actions'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Mock Dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// Mock Cookies
const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
}
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}))

// Mock Supabase
const mockAuth = {
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  getUser: jest.fn(),
}
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: mockAuth,
  })),
}))

describe('Auth Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default happy path for cookie store
    mockCookieStore.get.mockReturnValue({ value: 'some-cookie' })
  })

  describe('login', () => {
    it('should redirect to dashboard on successful login (buyer)', async () => {
      const formData = new FormData()
      formData.append('email', 'buyer@test.com')
      formData.append('password', 'password123')

      mockAuth.signInWithPassword.mockResolvedValue({ error: null })
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            user_metadata: { role: 'buyer' },
          },
        },
      })

      await login(formData)

      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'buyer@test.com',
        password: 'password123',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/marketplace')
    })

    it('should redirect to farmer dashboard on successful login (farmer)', async () => {
      const formData = new FormData()
      formData.append('email', 'farmer@test.com')
      formData.append('password', 'password123')

      mockAuth.signInWithPassword.mockResolvedValue({ error: null })
      mockAuth.getUser.mockResolvedValue({
        data: {
          user: {
            user_metadata: { role: 'farmer' },
          },
        },
      })

      await login(formData)

      expect(redirect).toHaveBeenCalledWith('/farmer')
    })

    it('should redirect with error on login failure', async () => {
      const formData = new FormData()
      formData.append('email', 'fail@test.com')
      formData.append('password', 'wrong')

      mockAuth.signInWithPassword.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      })

      await login(formData)

      expect(redirect).toHaveBeenCalledWith('/login?error=Could not authenticate user')
    })
  })

  describe('signup', () => {
    it('should redirect to verify-email on successful signup', async () => {
      const formData = new FormData()
      formData.append('email', 'new@test.com')
      formData.append('password', 'password123')
      formData.append('fullName', 'New User')
      formData.append('role', 'buyer')

      mockAuth.signUp.mockResolvedValue({ error: null })

      await signup(formData)

      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'New User',
            role: 'buyer',
          },
        },
      })
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/verify-email')
    })

    it('should redirect with error on signup failure', async () => {
      const formData = new FormData()
      formData.append('email', 'fail@test.com')
      formData.append('password', 'password123')

      mockAuth.signUp.mockResolvedValue({
        error: { message: 'Exists' },
      })

      await signup(formData)

      expect(redirect).toHaveBeenCalledWith('/signup?error=Could not create user')
    })
  })
})
