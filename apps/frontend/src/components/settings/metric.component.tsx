'use client';

import { DropdownSelect } from '@gitroom/react/form/dropdown.select';
import React, { useState } from 'react';
import { isUSCitizen } from '@gitroom/frontend/components/launches/helpers/isuscitizen.utils';
const dateMetrics = [
  { label: 'AM:PM', value: 'US' },
  { label: '24 hours', value: 'GLOBAL' },
];

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(timezone);

const MetricComponent = () => {
  const [currentMetric, setCurrentMetric] = useState(isUSCitizen());
  const changeMetric = (value: string) => {
    setCurrentMetric(value === 'US');
    localStorage.setItem('isUS', value);
  };
  return (
    <div className="my-[16px] mt-[16px] bg-sixth border-fifth border rounded-[4px] p-[24px] flex flex-col gap-[24px]">
      <div className="mt-[4px] font-heading font-[700] text-[16px]">Date Metrics</div>
      <DropdownSelect
        name="metric"
        value={currentMetric ? 'US' : 'GLOBAL'}
        onChange={changeMetric}
        options={dateMetrics}
      />
    </div>
  );
};

export default MetricComponent;
