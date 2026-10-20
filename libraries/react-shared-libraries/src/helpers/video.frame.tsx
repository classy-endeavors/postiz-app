'use client';

import { FC, useEffect, useRef, useState } from 'react';

const mediaBasePath = (url: string) => url.split('?')[0].split('#')[0];

export const VideoFrame: FC<{
  url: string;
  autoplay?: boolean;
  poster?: string;
}> = (props) => {
  const { url, autoplay, poster } = props;
  // Hold the rendered src separately so a re-signed S3 URL (same object, new
  // query string) cannot blank the tile while metadata loads again.
  const [displayUrl, setDisplayUrl] = useState(url);
  const loadedBaseRef = useRef(mediaBasePath(url));

  useEffect(() => {
    const nextBase = mediaBasePath(url);
    if (nextBase !== loadedBaseRef.current) {
      loadedBaseRef.current = nextBase;
      setDisplayUrl(url);
      return;
    }
    if (url === displayUrl) {
      return;
    }

    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.muted = true;
    probe.src = url + '#t=0.1';
    const swap = () => setDisplayUrl(url);
    probe.addEventListener('loadeddata', swap);
    probe.addEventListener('error', swap);
    return () => {
      probe.removeEventListener('loadeddata', swap);
      probe.removeEventListener('error', swap);
      probe.removeAttribute('src');
      probe.load();
    };
  }, [url, displayUrl]);

  return (
    <video
      className="w-full h-full object-cover rounded-[4px]"
      src={displayUrl + '#t=0.1'}
      poster={poster}
      preload="metadata"
      muted
      playsInline
      autoPlay={!!autoplay}
    />
  );
};
