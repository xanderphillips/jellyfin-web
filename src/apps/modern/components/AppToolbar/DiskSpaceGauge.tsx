import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import React, { type FC } from 'react';

import globalize from 'lib/globalize';
import { getReadableSize } from 'utils/file';

import type { AggregateStorage } from './utils/aggregateLibraryStorage';

interface DiskSpaceGaugeProps extends AggregateStorage {
    isLoading: boolean
}

const getGaugeColor = (percent: number): 'success' | 'warning' | 'error' => {
    if (percent >= 90) return 'error';
    if (percent >= 80) return 'warning';
    return 'success';
};

const DiskSpaceGauge: FC<DiskSpaceGaugeProps> = ({
    freeSpace,
    usedSpace,
    totalSpace,
    usedPercentage,
    hasData,
    isLoading
}) => {
    let tooltipTitle: string;
    if (isLoading) {
        tooltipTitle = globalize.translate('DiskSpaceGaugeLoading');
    } else if (!hasData) {
        tooltipTitle = globalize.translate('DiskSpaceGaugeUnavailable');
    } else {
        tooltipTitle = globalize.translate(
            'DiskSpaceGaugeTooltip',
            getReadableSize(usedSpace),
            getReadableSize(freeSpace),
            getReadableSize(totalSpace)
        );
    }

    return (
        <Tooltip title={tooltipTitle}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    alignSelf: 'center',
                    width: 96,
                    px: 1
                }}
                aria-label={tooltipTitle}
            >
                {isLoading ? (
                    <LinearProgress
                        variant='indeterminate'
                        sx={{
                            width: '100%',
                            height: 6,
                            borderRadius: 3
                        }}
                    />
                ) : (
                    <LinearProgress
                        variant='determinate'
                        color={hasData ? getGaugeColor(usedPercentage) : 'inherit'}
                        value={hasData ? usedPercentage : 100}
                        sx={{
                            width: '100%',
                            height: 6,
                            borderRadius: 3,
                            opacity: hasData ? 1 : 0.35
                        }}
                    />
                )}
            </Box>
        </Tooltip>
    );
};

export default DiskSpaceGauge;
