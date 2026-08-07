import type { FolderStorageDto } from '@jellyfin/sdk/lib/generated-client/models/folder-storage-dto';
import type { LibraryStorageDto } from '@jellyfin/sdk/lib/generated-client/models/library-storage-dto';

export interface AggregateStorage {
    freeSpace: number
    usedSpace: number
    totalSpace: number
    usedPercentage: number
    hasData: boolean
}

const EMPTY_RESULT: AggregateStorage = {
    freeSpace: 0,
    usedSpace: 0,
    totalSpace: 0,
    usedPercentage: 0,
    hasData: false
};

/**
 * Produces a de-duplication key identifying a folder's underlying storage
 * device, so folders that share a physical disk (and therefore report
 * identical free/used space) are only counted once.
 *
 * Deliberately NOT keyed on DeviceId or Path: in containerized deployments
 * (e.g. Docker bind-mounts of subdirectories of one host disk into several
 * distinct container paths, as in linuxserver/jellyfin setups) DeviceId is
 * not populated consistently per physical device -- separate bind mounts of
 * the same disk can report different DeviceId values, and Paths are always
 * distinct by definition. Both were tried and both under-deduplicated real
 * multi-library setups on a single disk.
 *
 * Instead this keys purely on the FreeSpace/UsedSpace pair: the API contract
 * guarantees folders on the same device report identical values for both,
 * which holds regardless of how unreliable DeviceId is for a given
 * deployment. The tradeoff is two genuinely distinct disks with byte-for-byte
 * identical free/used space would be wrongly merged, but that's far rarer in
 * practice than the DeviceId/Path inconsistencies this replaces.
 */
const getDedupeKey = (folder: FolderStorageDto): string => {
    const freeSpace = Math.max(0, folder.FreeSpace ?? 0);
    const usedSpace = Math.max(0, folder.UsedSpace ?? 0);
    return `space:${freeSpace}:${usedSpace}`;
};

/**
 * Aggregates free/used space across all folders backing the given libraries,
 * de-duplicating folders that share an underlying physical storage device so
 * libraries sharing a mount point are not double-counted.
 */
export const aggregateLibraryStorage = (
    libraries: LibraryStorageDto[] | undefined | null
): AggregateStorage => {
    if (!libraries || libraries.length === 0) return EMPTY_RESULT;

    const seenKeys = new Set<string>();
    let freeSpace = 0;
    let usedSpace = 0;

    for (const lib of libraries) {
        for (const folder of lib.Folders ?? []) {
            if (typeof folder.UsedSpace !== 'number' || folder.UsedSpace < 0) continue;

            const key = getDedupeKey(folder);
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);

            freeSpace += Math.max(0, folder.FreeSpace ?? 0);
            usedSpace += Math.max(0, folder.UsedSpace);
        }
    }

    const totalSpace = freeSpace + usedSpace;

    return {
        freeSpace,
        usedSpace,
        totalSpace,
        usedPercentage: totalSpace > 0 ? Math.min(100, (usedSpace / totalSpace) * 100) : 0,
        hasData: totalSpace > 0
    };
};
