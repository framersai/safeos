/**
 * Jest Test Setup
 * 
 * Configuration and global mocks for unit tests.
 */

// Note: @testing-library/jest-dom can be added for enhanced matchers
// import '@testing-library/jest-dom';

// Mock canvas context for ImageData
class MockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorSpace: 'srgb' = 'srgb';

  constructor(data: Uint8ClampedArray | number, widthOrHeight?: number, height?: number) {
    if (typeof data === 'number') {
      this.width = data;
      this.height = widthOrHeight!;
      this.data = new Uint8ClampedArray(data * widthOrHeight! * 4);
    } else {
      this.data = data;
      this.width = widthOrHeight!;
      this.height = height!;
    }
  }
}

// Set up global ImageData for node environment
if (typeof global.ImageData === 'undefined') {
  (global as any).ImageData = MockImageData;
}

// Mock performance.now if not available
if (typeof performance === 'undefined') {
  (global as any).performance = {
    now: () => Date.now(),
  };
}

// Mock localStorage for zustand persist middleware
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => localStorageMock.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  }),
  get length() {
    return Object.keys(localStorageMock.store).length;
  },
  key: jest.fn((index: number) => Object.keys(localStorageMock.store)[index] || null),
};

if (typeof global.localStorage === 'undefined') {
  (global as any).localStorage = localStorageMock;
}

if (typeof global.sessionStorage === 'undefined') {
  (global as any).sessionStorage = localStorageMock;
}

// Create a minimal window object if it doesn't exist
if (typeof global.window === 'undefined') {
  (global as any).window = {
    localStorage: localStorageMock,
    sessionStorage: localStorageMock,
  };
}

// Only setup browser mocks if window is defined with proper DOM (jsdom environment)
if (typeof window !== 'undefined' && typeof HTMLCanvasElement !== 'undefined') {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock HTMLCanvasElement.getContext
  HTMLCanvasElement.prototype.getContext = function(type: string) {
    if (type === '2d') {
      return {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => new MockImageData(10, 10)),
        putImageData: jest.fn(),
        createImageData: jest.fn((w: number, h: number) => new MockImageData(w, h)),
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        scale: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
      } as unknown as CanvasRenderingContext2D;
    }
    return null;
  } as any;
}
