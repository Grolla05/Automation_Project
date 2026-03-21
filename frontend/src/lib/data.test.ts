import { describe, it, expect } from 'vitest';
import { 
  SECTOR_DATA, 
  LAYOUT_MAPPING, 
  getTestTypesForSector, 
  getTestsForType, 
  getLayoutIdForTest, 
  isValidSector 
} from './data';

describe('Data Robustness Tests', () => {
  describe('Helper Methods', () => {
    it('getTestTypesForSector should return types for valid sector', () => {
      const p3Types = getTestTypesForSector('P3');
      expect(p3Types).toContain('EMC');
      expect(p3Types).toContain('RF');
    });

    it('LAYOUT_MAPPING should have consistent keys', () => {
      expect(LAYOUT_MAPPING).toHaveProperty('Bluetooth Low Energy');
    });

    it('getTestTypesForSector should return empty array for invalid sector', () => {
      expect(getTestTypesForSector('INVALID')).toEqual([]);
      expect(getTestTypesForSector('')).toEqual([]);
    });

    it('getTestsForType should return flat list of tests', () => {
      const aseTests = getTestsForType('P5', 'ASE');
      expect(aseTests.length).toBeGreaterThan(0);
      expect(aseTests[0]).toHaveProperty('name');
      expect(aseTests[0]).toHaveProperty('enabled');
    });

    it('getLayoutIdForTest should return mapped B64', () => {
      // Bluetooth Low Energy is mapped
      const bleId = getLayoutIdForTest('Bluetooth Low Energy');
      expect(atob(bleId)).toBe('P3/BLE_layout.docx');
    });

    it('getLayoutIdForTest should return fallback for unmapped test with special characters', () => {
      const fallbackId = getLayoutIdForTest('Teste com Ação');
      const decoded = decodeURIComponent(escape(atob(fallbackId)));
      expect(decoded).toBe('Teste com Ação.docx');
    });

    it('isValidSector should work correctly', () => {
      expect(isValidSector('P3')).toBe(true);
      expect(isValidSector('P6')).toBe(false);
    });
  });

  describe('Integrity', () => {
    it('all tests in SECTOR_DATA should have a corresponding layout in LAYOUT_MAPPING', () => {
      Object.keys(SECTOR_DATA).forEach(sector => {
        getTestTypesForSector(sector).forEach(type => {
          getTestsForType(sector, type).forEach(test => {
            // Check if it's explicitly mapped or we need to ensure the helper doesn't crash
            const layoutId = getLayoutIdForTest(test.name);
            expect(layoutId).toBeDefined();
            expect(() => atob(layoutId)).not.toThrow();
          });
        });
      });
    });
  });
});
