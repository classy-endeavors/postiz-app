import React from 'react';
import { BrandMark } from '@gitroom/frontend/components/new-layout/logo';

export const LogoTextComponent = () => {
  return (
    <div className="flex items-center gap-[10px]">
      <BrandMark size={33} />
      <span className="text-[24px] font-[700] tracking-[-0.02em]">
        AI Zyntra
      </span>
    </div>
  );
};
