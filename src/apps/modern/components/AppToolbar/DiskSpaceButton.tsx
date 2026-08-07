import React, { type FC } from 'react';

import { useSystemStorage } from 'apps/dashboard/features/storage/api/useSystemStorage';
import { useApi } from 'hooks/useApi';

import DiskSpaceGauge from './DiskSpaceGauge';
import { aggregateLibraryStorage } from './utils/aggregateLibraryStorage';

const REFETCH_INTERVAL = 5 * 60 * 1000;

const DiskSpaceButton: FC = () => {
    const { user } = useApi();
    const isAdmin = Boolean(user?.Policy?.IsAdministrator);

    const { data: systemStorage, isLoading } = useSystemStorage({
        enabled: isAdmin,
        refetchInterval: REFETCH_INTERVAL
    });

    if (!isAdmin) return null;

    const aggregate = aggregateLibraryStorage(systemStorage?.Libraries);

    return (
        <DiskSpaceGauge
            {...aggregate}
            isLoading={isLoading}
        />
    );
};

export default DiskSpaceButton;
