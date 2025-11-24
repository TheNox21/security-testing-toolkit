/**
 * Test script to verify the server can start without MongoDB
 */

// Mock MongoDB connection for testing
jest.mock('mongoose', () => {
  return {
    connect: jest.fn().mockResolvedValue(),
    connection: {
      on: jest.fn(),
      once: (event, callback) => {
        if (event === 'open') {
          // Simulate successful connection
          setTimeout(callback, 100);
        }
      }
    },
    Schema: class MockSchema {
      constructor(definition) {
        this.definition = definition;
      }
    },
    model: jest.fn().mockImplementation((name, schema) => {
      return class MockModel {
        constructor(data) {
          Object.assign(this, data);
        }
        save() {
          return Promise.resolve(this);
        }
        static find() {
          return Promise.resolve([]);
        }
        static findById() {
          return Promise.resolve(null);
        }
        static findByIdAndDelete() {
          return Promise.resolve(null);
        }
        static findByIdAndUpdate() {
          return Promise.resolve(null);
        }
        static countDocuments() {
          return Promise.resolve(0);
        }
      };
    })
  };
});

// Mock winston logger
jest.mock('winston', () => {
  return {
    createLogger: () => {
      return {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      };
    },
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      json: jest.fn(),
      simple: jest.fn()
    },
    transports: {
      File: class MockFileTransport {},
      Console: class MockConsoleTransport {}
    }
  };
});

// Test that the server can be imported without errors
test('Server should import without errors', () => {
  expect(() => {
    require('./index.js');
  }).not.toThrow();
});

test('CLI should import without errors', () => {
  expect(() => {
    require('./cli.js');
  }).not.toThrow();
});