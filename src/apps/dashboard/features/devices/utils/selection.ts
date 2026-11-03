import type { DeviceInfoDto } from '@jellyfin/sdk/lib/generated-client/models/device-info-dto';

/** IDs to bulk-delete: drops rows without an ID and the current session (which has its own delete action). */
export const getDeletableDeviceIds = (
    devices: Pick<DeviceInfoDto, 'Id'>[],
    currentDeviceId?: string
): string[] => devices
    .map(device => device.Id)
    .filter((id): id is string => !!id && id !== currentDeviceId);
