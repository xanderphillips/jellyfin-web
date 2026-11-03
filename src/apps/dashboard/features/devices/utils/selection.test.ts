import { describe, expect, it } from 'vitest';

import { getDeletableDeviceIds } from './selection';

describe('getDeletableDeviceIds()', () => {
    it('should return all ids when none is the current device', () => {
        expect(getDeletableDeviceIds([{ Id: 'a' }, { Id: 'b' }], 'c')).toEqual(['a', 'b']);
    });

    it('should exclude the current device', () => {
        expect(getDeletableDeviceIds([{ Id: 'a' }, { Id: 'me' }, { Id: 'b' }], 'me')).toEqual(['a', 'b']);
    });

    it('should drop devices without an id', () => {
        expect(getDeletableDeviceIds([{ Id: 'a' }, {}, { Id: null }, { Id: '' }])).toEqual(['a']);
    });

    it('should return an empty array for no devices', () => {
        expect(getDeletableDeviceIds([], 'me')).toEqual([]);
    });
});
