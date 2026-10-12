'use client';

import { Tooltip } from 'react-tooltip';
export const ToolTip = () => {
  return (
    <Tooltip
      className="z-[200] phone:!hidden"
      id="tooltip"
      openOnClick={false}
    />
  );
};
