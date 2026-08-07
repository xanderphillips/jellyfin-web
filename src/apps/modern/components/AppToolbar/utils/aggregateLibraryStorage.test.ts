import type { FolderStorageDto } from '@jellyfin/sdk/lib/generated-client/models/folder-storage-dto';
import type { LibraryStorageDto } from '@jellyfin/sdk/lib/generated-client/models/library-storage-dto';
import { describe, expect, it } from 'vitest';

import { aggregateLibraryStorage } from './aggregateLibraryStorage';

const folder = (overrides: Partial<FolderStorageDto>): FolderStorageDto => ({
    Path: '/media',
    ...overrides
} as FolderStorageDto);

const library = (folders: FolderStorageDto[]): LibraryStorageDto => ({
    Id: 'lib',
    Name: 'Library',
    Folders: folders
} as LibraryStorageDto);

describe('aggregateLibraryStorage()', () => {
    it('should return empty result for undefined, null, or empty libraries', () => {
        const empty = { freeSpace: 0, usedSpace: 0, totalSpace: 0, usedPercentage: 0, hasData: false };
        expect(aggregateLibraryStorage(undefined)).toEqual(empty);
        expect(aggregateLibraryStorage(null)).toEqual(empty);
        expect(aggregateLibraryStorage([])).toEqual(empty);
    });

    it('should aggregate a single folder directly', () => {
        const libraries = [ library([ folder({ Path: '/movies', DeviceId: 'dev1', FreeSpace: 100, UsedSpace: 300 }) ]) ];
        expect(aggregateLibraryStorage(libraries)).toEqual({
            freeSpace: 100,
            usedSpace: 300,
            totalSpace: 400,
            usedPercentage: 75,
            hasData: true
        });
    });

    it('should deduplicate folders with identical free/used space across libraries, even with matching DeviceIds', () => {
        const libraries = [
            library([ folder({ Path: '/movies', DeviceId: 'dev1', FreeSpace: 100, UsedSpace: 300 }) ]),
            library([ folder({ Path: '/tv', DeviceId: 'dev1', FreeSpace: 100, UsedSpace: 300 }) ])
        ];
        expect(aggregateLibraryStorage(libraries)).toMatchObject({
            freeSpace: 100,
            usedSpace: 300,
            totalSpace: 400
        });
    });

    it('should deduplicate folders with identical free/used space even when DeviceId differs between them', () => {
        // Regression: some deployments (e.g. Docker bind-mounts of
        // subdirectories of one host disk into distinct container paths)
        // report inconsistent DeviceId values per mount for the same
        // physical device. DeviceId must not be trusted over the
        // free/used space signal.
        const libraries = [
            library([ folder({ Path: '/movies', DeviceId: 'mount-a', FreeSpace: 100, UsedSpace: 300 }) ]),
            library([ folder({ Path: '/tv', DeviceId: 'mount-b', FreeSpace: 100, UsedSpace: 300 }) ])
        ];
        expect(aggregateLibraryStorage(libraries)).toMatchObject({
            freeSpace: 100,
            usedSpace: 300,
            totalSpace: 400
        });
    });

    it('should sum folders whose free/used space genuinely differs', () => {
        const libraries = [
            library([ folder({ Path: '/movies', FreeSpace: 100, UsedSpace: 300 }) ]),
            library([ folder({ Path: '/tv', FreeSpace: 50, UsedSpace: 150 }) ])
        ];
        expect(aggregateLibraryStorage(libraries)).toMatchObject({
            freeSpace: 150,
            usedSpace: 450,
            totalSpace: 600
        });
    });

    it('should deduplicate via the free/used space fallback when DeviceId is missing on both', () => {
        const libraries = [
            library([ folder({ Path: '/media', FreeSpace: 100, UsedSpace: 300 }) ]),
            library([ folder({ Path: '/media', FreeSpace: 100, UsedSpace: 300 }) ])
        ];
        expect(aggregateLibraryStorage(libraries)).toMatchObject({
            freeSpace: 100,
            usedSpace: 300,
            totalSpace: 400
        });
    });

    it('should not double-count Docker bind-mount libraries sharing one disk under distinct Paths/DeviceIds', () => {
        // Regression test: Movies, TV Shows, and Music are separate bind
        // mounts of subdirectories of the same host disk (distinct Paths,
        // and in practice distinct/inconsistent DeviceIds per mount), so
        // they must be counted once, not three times.
        const sameDiskFolder = (path: string, deviceId: string) =>
            folder({ Path: path, DeviceId: deviceId, FreeSpace: 2_300_000_000_000, UsedSpace: 1_400_000_000_000 });
        const libraries = [
            library([ sameDiskFolder('/data/movies', 'mount-1') ]),
            library([ sameDiskFolder('/data/tvshows', 'mount-2') ]),
            library([ sameDiskFolder('/data/music', 'mount-3') ])
        ];
        expect(aggregateLibraryStorage(libraries)).toMatchObject({
            freeSpace: 2_300_000_000_000,
            usedSpace: 1_400_000_000_000,
            totalSpace: 3_700_000_000_000
        });
    });

    it('should exclude folders with missing or negative UsedSpace without throwing', () => {
        const libraries = [
            library([
                folder({ Path: '/movies', DeviceId: 'dev1', FreeSpace: 100, UsedSpace: 300 }),
                folder({ Path: '/broken', DeviceId: 'dev2', FreeSpace: 10 }),
                folder({ Path: '/negative', DeviceId: 'dev3', FreeSpace: 10, UsedSpace: -1 })
            ])
        ];
        expect(aggregateLibraryStorage(libraries)).toMatchObject({
            freeSpace: 100,
            usedSpace: 300,
            totalSpace: 400
        });
    });

    it('should clamp negative FreeSpace to 0 on an otherwise valid folder', () => {
        const libraries = [ library([ folder({ Path: '/movies', DeviceId: 'dev1', FreeSpace: -5, UsedSpace: 300 }) ]) ];
        expect(aggregateLibraryStorage(libraries)).toMatchObject({
            freeSpace: 0,
            usedSpace: 300,
            totalSpace: 300,
            usedPercentage: 100
        });
    });

    it('should not throw for a library with an empty Folders array', () => {
        const libraries = [ library([]) ];
        expect(aggregateLibraryStorage(libraries)).toEqual({
            freeSpace: 0,
            usedSpace: 0,
            totalSpace: 0,
            usedPercentage: 0,
            hasData: false
        });
    });

    it('should clamp usedPercentage to 100', () => {
        const libraries = [ library([ folder({ Path: '/movies', DeviceId: 'dev1', FreeSpace: 0, UsedSpace: 300 }) ]) ];
        expect(aggregateLibraryStorage(libraries).usedPercentage).toBe(100);
    });
});
