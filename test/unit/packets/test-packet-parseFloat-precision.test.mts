import { Buffer } from 'node:buffer';
import { describe, it, strict } from 'poku';
import Packet from '../../../lib/packets/packet.js';

/**
 * Unit tests for Packet.parseFloat() precision issues
 * 
 * Tests for:
 * - Issue #3690: DECIMAL(36,18) precision loss (50000.0 → 49999.999...)
 * - Issue #2928: MAX_VALUE doubles precision corruption
 * - Strategic edge cases around precision boundaries
 */

describe('Packet.parseFloat() precision', () => {
  
  // Helper to create a packet and parse a number string
  function parseFloatFromString(str: string): number {
    const buffer = Buffer.from(str, 'ascii');
    const packet = new Packet(0, buffer, 0, buffer.length);
    packet.offset = 0;
    return packet.parseFloat(buffer.length);
  }
  
  describe('Issue #3690: DECIMAL(36,18) precision loss', () => {
    
    it('should parse 50000.000000000000000000 correctly', () => {
      const input = '50000.000000000000000000';
      const result = parseFloatFromString(input);
      const expected = parseFloat(input);
      
      strict.strictEqual(result, expected, 
        `Expected ${expected} but got ${result} for input "${input}"`);
      strict.strictEqual(result, 50000.0);
    });
    
    it('should parse 50000.0 correctly', () => {
      const input = '50000.0';
      const result = parseFloatFromString(input);
      const expected = parseFloat(input);
      
      strict.strictEqual(result, expected);
      strict.strictEqual(result, 50000.0);
    });
    
    it('should parse other DECIMAL(36,18) values correctly', () => {
      const testCases = [
        '50.000000000000000000',
        '500.000000000000000000',
        '5000.000000000000000000',
        '10000.000000000000000000',
        '100000.000000000000000000',
        '999999.999999999999999999',
      ];
      
      for (const input of testCases) {
        const result = parseFloatFromString(input);
        const expected = parseFloat(input);
        
        strict.strictEqual(result, expected,
          `Failed for "${input}": expected ${expected} but got ${result}`);
      }
    });
  });
  
  describe('Issue #2928: MAX_VALUE doubles precision', () => {
    
    it('should parse -1.7976931348623157e308 correctly', () => {
      const input = '-1.7976931348623157e308';
      const result = parseFloatFromString(input);
      const expected = parseFloat(input);
      
      // Should match exactly
      strict.strictEqual(result, expected,
        `Expected ${expected} but got ${result}`);
      strict.strictEqual(result, -1.7976931348623157e308);
    });
    
    it('should parse 1.7976931348623157e308 correctly', () => {
      const input = '1.7976931348623157e308';
      const result = parseFloatFromString(input);
      const expected = parseFloat(input);
      
      strict.strictEqual(result, expected,
        `Expected ${expected} but got ${result}`);
      strict.strictEqual(result, 1.7976931348623157e308);
    });
    
    it('should parse near-MAX_VALUE doubles correctly', () => {
      const testCases = [
        '1.7976931348623157e+308',  // MAX_VALUE
        '-1.7976931348623157e+308', // -MAX_VALUE
        '1.7976931348623157e307',   // MAX_VALUE / 10
        '1.7976931348623157e306',   // MAX_VALUE / 100
      ];
      
      for (const input of testCases) {
        const result = parseFloatFromString(input);
        const expected = parseFloat(input);
        
        strict.strictEqual(result, expected,
          `Failed for "${input}": expected ${expected} but got ${result}`);
      }
    });
  });
  
  describe('Strategic edge cases: precision boundaries', () => {
    
    it('should handle MAX_SAFE_INTEGER correctly', () => {
      const input = '9007199254740991'; // MAX_SAFE_INTEGER
      const result = parseFloatFromString(input);
      const expected = parseFloat(input);
      
      strict.strictEqual(result, expected);
      strict.strictEqual(result, Number.MAX_SAFE_INTEGER);
    });
    
    it('should handle numbers near MAX_SAFE_INTEGER', () => {
      const testCases = [
        '9007199254740990',  // MAX_SAFE_INTEGER - 1
        '9007199254740991',  // MAX_SAFE_INTEGER
        '9007199254740992',  // MAX_SAFE_INTEGER + 1 (loses precision)
      ];
      
      for (const input of testCases) {
        const result = parseFloatFromString(input);
        const expected = parseFloat(input);
        
        strict.strictEqual(result, expected,
          `Failed for "${input}": expected ${expected} but got ${result}`);
      }
    });
    
    it('should handle very long decimal strings', () => {
      const testCases = [
        '123456789012345.123456',     // 15 integer digits
        '1234567890123456.12345',     // 16 integer digits
        '12345678901234567.1234',     // 17 integer digits
        '0.123456789012345678',       // 18 fractional digits
        '123.456789012345678901',     // Mixed
      ];
      
      for (const input of testCases) {
        const result = parseFloatFromString(input);
        const expected = parseFloat(input);
        
        // Use relative tolerance for large numbers
        const relativeError = Math.abs((result - expected) / expected);
        
        strict.ok(relativeError < 1e-14 || result === expected,
          `Failed for "${input}": expected ${expected} but got ${result} (relative error: ${relativeError})`);
      }
    });
    
    it('should handle numbers with many fractional digits', () => {
      const testCases = [
        '1.123456789012345',
        '10.123456789012345',
        '100.123456789012345',
        '1000.123456789012345',
        '10000.123456789012345',
      ];
      
      for (const input of testCases) {
        const result = parseFloatFromString(input);
        const expected = parseFloat(input);
        
        strict.strictEqual(result, expected,
          `Failed for "${input}": expected ${expected} but got ${result}`);
      }
    });
    
    it('should handle scientific notation with large exponents', () => {
      const testCases = [
        '1e100',
        '1e200',
        '1e308',
        '1e-100',
        '1e-200',
        '1e-308',
        '9.999e307',
        '1.234e-307',
      ];
      
      for (const input of testCases) {
        const result = parseFloatFromString(input);
        const expected = parseFloat(input);
        
        strict.strictEqual(result, expected,
          `Failed for "${input}": expected ${expected} but got ${result}`);
      }
    });
    
    it('should handle numbers that accumulate rounding errors', () => {
      // These are the types of numbers that cause issues with repeated *10
      const testCases = [
        '10000000000000.1',       // Large int with small fraction
        '100000000000000.01',     // Even larger
        '999999999999999.999',    // Near boundary
        '50000.000000000000000000', // Issue #3690 specific
      ];
      
      for (const input of testCases) {
        const result = parseFloatFromString(input);
        const expected = parseFloat(input);
        
        const relativeError = Math.abs((result - expected) / expected);
        
        strict.ok(relativeError < 1e-14 || result === expected,
          `Failed for "${input}": expected ${expected} but got ${result} (relative error: ${relativeError})`);
      }
    });
    
    it('should handle mixed precision scenarios', () => {
      const testCases = [
        { input: '0.1', expected: 0.1 },
        { input: '0.2', expected: 0.2 },
        { input: '0.3', expected: 0.3 },
        { input: '0.123456789012345', expected: 0.123456789012345 },
        { input: '123456789.123456789', expected: 123456789.123456789 },
      ];
      
      for (const { input, expected } of testCases) {
        const result = parseFloatFromString(input);
        
        strict.strictEqual(result, expected,
          `Failed for "${input}": expected ${expected} but got ${result}`);
      }
    });
    
    it('should handle negative large values correctly', () => {
      const testCases = [
        '-50000.000000000000000000',
        '-100000.000000000000000000',
        '-999999999999999.999999',
      ];
      
      for (const input of testCases) {
        const result = parseFloatFromString(input);
        const expected = parseFloat(input);
        
        const relativeError = Math.abs((result - expected) / expected);
        
        strict.ok(relativeError < 1e-14 || result === expected,
          `Failed for "${input}": expected ${expected} but got ${result}`);
      }
    });
  });
  
  describe('Regression tests: ensure existing functionality works', () => {
    
    it('should handle simple integers', () => {
      const testCases = ['0', '1', '42', '123', '999999'];
      
      for (const input of testCases) {
        const result = parseFloatFromString(input);
        const expected = parseFloat(input);
        
        strict.strictEqual(result, expected);
      }
    });
    
    it('should handle simple decimals', () => {
      const testCases = ['0.5', '1.5', '12.34', '99.99'];
      
      for (const input of testCases) {
        const result = parseFloatFromString(input);
        const expected = parseFloat(input);
        
        strict.strictEqual(result, expected);
      }
    });
    
    it('should handle negative numbers', () => {
      const testCases = ['-1', '-42', '-123.456'];
      
      for (const input of testCases) {
        const result = parseFloatFromString(input);
        const expected = parseFloat(input);
        
        strict.strictEqual(result, expected);
      }
    });
    
    it('should handle scientific notation', () => {
      const testCases = ['1e10', '1.23e5', '4.56e-3'];
      
      for (const input of testCases) {
        const result = parseFloatFromString(input);
        const expected = parseFloat(input);
        
        strict.strictEqual(result, expected);
      }
    });
  });
});
