import '@testing-library/jest-dom'

// Polyfill Request for API route tests in jsdom environment
if (typeof Request === 'undefined') {
  // @ts-expect-error - polyfill for test environment
  global.Request = class Request {
    url: string
    method: string
    headers: Map<string, string>
    body: string | null

    constructor(url: string, init?: RequestInit) {
      this.url = url
      this.method = init?.method || 'GET'
      this.headers = new Map(Object.entries(init?.headers || {}))
      this.body = init?.body as string || null
    }

    async json() {
      return JSON.parse(this.body || '{}')
    }
  }
}

// Polyfill Response with static json method for NextResponse compatibility
if (typeof Response === 'undefined') {
  class MockResponse {
    body: unknown
    statusCode: number
    headers: Map<string, string>

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.body = body
      this.statusCode = init?.status || 200
      this.headers = new Map(Object.entries(init?.headers || {}))
    }

    get status() {
      return this.statusCode
    }

    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body)
      }
      return this.body
    }

    // Static json method that NextResponse.json() relies on
    static json(data: unknown, init?: ResponseInit) {
      const response = new MockResponse(JSON.stringify(data), init)
      response.body = data // Store parsed data for easy access in tests
      return response
    }
  }

  // @ts-expect-error - polyfill for test environment
  global.Response = MockResponse
}

// Mock TextEncoder if not available (needed by some Next.js internals)
if (typeof TextEncoder === 'undefined') {
  // @ts-expect-error - polyfill for test environment
  global.TextEncoder = class TextEncoder {
    encode(str: string) {
      const arr: number[] = []
      for (let i = 0; i < str.length; i++) {
        arr.push(str.charCodeAt(i))
      }
      return new Uint8Array(arr)
    }
  }
}
