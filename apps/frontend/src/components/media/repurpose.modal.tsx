'use client';

import { FC, useEffect, useMemo, useState } from 'react';
import { Media } from '@prisma/client';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';
import {
  useClippingActions,
  useClippingStatus,
} from '@gitroom/frontend/components/media/use.clipping';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';

function formatSeconds(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const RepurposeModal: FC<{ media: Media }> = ({ media }) => {
  const t = useT();
  const toaster = useToaster();
  const modals = useModals();
  const { data: integrations } = useIntegrationList();
  const { suggest, confirm, cancel } = useClippingActions();

  const [step, setStep] = useState<'setup' | 'working' | 'review' | 'rendering'>(
    'setup'
  );
  const [clippingId, setClippingId] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [fit, setFit] = useState<'blur' | 'crop'>('blur');
  const [maxClips, setMaxClips] = useState(5);
  const [selectedClips, setSelectedClips] = useState<string[]>([]);
  const [captions, setCaptions] = useState<
    Record<string, Record<string, string>>
  >({});
  const [busy, setBusy] = useState(false);

  const { data: status, mutate } = useClippingStatus(clippingId);

  useEffect(() => {
    if (integrations?.length && !selectedChannels.length) {
      setSelectedChannels(integrations.slice(0, 3).map((i: any) => i.id));
    }
  }, [integrations]);

  useEffect(() => {
    if (!status) {
      return;
    }
    if (status.status === 'suggestions_ready') {
      setStep('review');
      const suggested = status.clips.filter((c) => c.status === 'suggested');
      setSelectedClips(suggested.map((c) => c.id));
      const next: Record<string, Record<string, string>> = {};
      for (const clip of suggested) {
        next[clip.id] = {};
        for (const channelId of selectedChannels) {
          next[clip.id][channelId] =
            (clip.channelContents && clip.channelContents[channelId]) ||
            clip.content;
        }
      }
      setCaptions(next);
    }
    if (status.status === 'failed') {
      toaster.show(status.error || 'Repurpose failed', 'warning');
      setStep('setup');
    }
    if (status.status === 'completed') {
      setStep('rendering');
      toaster.show(
        t('repurpose_done', 'Clips are ready as drafts in your calendar'),
        'success'
      );
    }
    if (['rendering'].includes(status.status)) {
      setStep('rendering');
    }
  }, [status?.status]);

  const billable = status?.billableMinutes ?? status?.estimatedMinutes;

  const channels = useMemo(
    () =>
      (integrations || []).filter((i: any) =>
        selectedChannels.includes(i.id)
      ),
    [integrations, selectedChannels]
  );

  const start = async () => {
    if (!selectedChannels.length) {
      toaster.show(
        t('select_channel_repurpose', 'Select at least one channel'),
        'warning'
      );
      return;
    }
    setBusy(true);
    try {
      const res = await suggest({
        mediaId: media.id,
        integrations: selectedChannels,
        clips: maxClips,
        fit,
      });
      setClippingId(res.id);
      setStep('working');
    } catch (err: any) {
      const message = err.message || 'Could not start';
      toaster.show(
        message === 'Clipping is not available'
          ? t(
              'clipping_not_configured',
              'Clipping is not configured on this server. It needs cloud storage (S3/R2), RunPod ingest/clipper endpoints, Deepgram, and OpenAI.'
            )
          : message,
        'warning'
      );
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    if (!clippingId || !selectedClips.length) {
      return;
    }
    if (billable == null) {
      toaster.show(
        t(
          'wait_for_duration',
          'Wait until the video duration is known before confirming'
        ),
        'warning'
      );
      return;
    }
    setBusy(true);
    try {
      const captionList = selectedClips.flatMap((clipId) =>
        Object.entries(captions[clipId] || {}).map(
          ([integrationId, content]) => ({
            clipId,
            integrationId,
            content,
          })
        )
      );
      await confirm(clippingId, {
        clipIds: selectedClips,
        captions: captionList,
      });
      await mutate();
      setStep('rendering');
    } catch (err: any) {
      toaster.show(err.message || 'Could not confirm', 'warning');
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    if (!clippingId) {
      modals.closeAll();
      return;
    }
    setBusy(true);
    try {
      await cancel(clippingId);
      modals.closeAll();
    } catch (err: any) {
      toaster.show(err.message || 'Could not cancel', 'warning');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-[16px] p-[4px] min-w-[320px] max-w-[640px]">
      <div className="text-[16px] font-[600] text-newTextColor">
        {t('repurpose_title', 'Repurpose video')}
      </div>
      <div className="text-[13px] text-newTextColor/70">
        {media.originalName || media.name}
      </div>

      {step === 'setup' && (
        <>
          <div className="flex flex-col gap-[8px]">
            <div className="text-[13px] font-[500]">
              {t('channels', 'Channels')}
            </div>
            <div className="flex flex-wrap gap-[8px]">
              {(integrations || []).map((integration: any) => {
                const on = selectedChannels.includes(integration.id);
                const platformIcon =
                  integration.identifier === 'youtube'
                    ? '/icons/platforms/youtube.svg'
                    : `/icons/platforms/${integration.identifier}.png`;
                return (
                  <button
                    key={integration.id}
                    type="button"
                    onClick={() =>
                      setSelectedChannels((prev) =>
                        on
                          ? prev.filter((id) => id !== integration.id)
                          : [...prev, integration.id]
                      )
                    }
                    className={`h-[36px] px-[10px] rounded-[8px] text-[12px] flex items-center gap-[8px] ${
                      on
                        ? 'bg-btnPrimary text-white'
                        : 'bg-newTextColor/10 text-newTextColor'
                    }`}
                  >
                    <span className="relative w-[22px] h-[22px] shrink-0">
                      <img
                        src={integration.picture || '/no-picture.jpg'}
                        alt=""
                        className="w-[22px] h-[22px] rounded-full object-cover"
                      />
                      <img
                        src={platformIcon}
                        alt={integration.identifier || ''}
                        className="absolute -bottom-[2px] -end-[2px] w-[12px] h-[12px] rounded-full bg-white"
                      />
                    </span>
                    <span className="truncate max-w-[120px]">
                      {integration.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-[12px]">
            <label className="flex flex-col gap-[4px] text-[13px] flex-1">
              {t('max_clips', 'Max clips')}
              <input
                type="number"
                min={1}
                max={10}
                value={maxClips}
                onChange={(e) => setMaxClips(Number(e.target.value) || 5)}
                className="h-[36px] px-[10px] rounded-[6px] bg-newBgColorInner border border-newTextColor/10"
              />
            </label>
            <label className="flex flex-col gap-[4px] text-[13px] flex-1">
              {t('fit', 'Vertical fit')}
              <select
                value={fit}
                onChange={(e) => setFit(e.target.value as 'blur' | 'crop')}
                className="h-[36px] px-[10px] rounded-[6px] bg-newBgColorInner border border-newTextColor/10"
              >
                <option value="blur">
                  {t('fit_blur', 'Blur (keep full frame)')}
                </option>
                <option value="crop">
                  {t('fit_crop', 'Crop (fill vertical, cut sides)')}
                </option>
              </select>
            </label>
          </div>

          <div className="text-[12px] text-newTextColor/60 space-y-[4px]">
            <p>
              {fit === 'blur'
                ? t(
                    'fit_blur_help',
                    'Blur: scales the whole landscape video into 9:16 and fills the empty top/bottom with a blurred copy. Safer when the speaker is not centered.'
                  )
                : t(
                    'fit_crop_help',
                    'Crop: zooms to fill 9:16 and cuts the left/right edges. No face tracking — off-center speakers can be cut out.'
                  )}
            </p>
            <p>
              {t(
                'repurpose_cost_note',
                'Clipping minutes are charged only when you confirm suggestions. A ~10 minute source uses about 10 minutes of your plan quota.'
              )}
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={start}
            className="h-[40px] rounded-[8px] bg-btnPrimary text-white font-[500]"
          >
            {t('get_suggestions', 'Get suggestions')}
          </button>
        </>
      )}

      {step === 'working' && (
        <div className="text-[13px] text-newTextColor/80 py-[24px]">
          {t(
            'repurpose_analysing',
            'Analysing the video and picking clips… No minutes charged yet.'
          )}
          <div className="mt-[8px] text-[12px] opacity-70">
            {status?.status || 'starting'}
          </div>
        </div>
      )}

      {step === 'review' && status && (
        <>
          <div className="text-[13px] font-[500]">
            {billable == null
              ? t('duration_pending', 'Duration pending…')
              : t('billable_minutes', 'Will use {{minutes}} clipping minutes', {
                  minutes: billable,
                })}
          </div>

          <div className="flex flex-col gap-[12px] max-h-[420px] overflow-auto">
            {status.clips
              .filter((c) => c.status === 'suggested')
              .map((clip) => {
                const on = selectedClips.includes(clip.id);
                return (
                  <div
                    key={clip.id}
                    className="rounded-[8px] border border-newTextColor/10 p-[12px] flex flex-col gap-[8px]"
                  >
                    <label className="flex items-center gap-[8px] text-[13px] font-[500]">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          setSelectedClips((prev) =>
                            on
                              ? prev.filter((id) => id !== clip.id)
                              : [...prev, clip.id]
                          )
                        }
                      />
                      {clip.title} ({formatSeconds(clip.start)}–
                      {formatSeconds(clip.end)})
                    </label>
                    {on &&
                      channels.map((channel: any) => (
                        <label
                          key={channel.id}
                          className="flex flex-col gap-[4px] text-[12px]"
                        >
                          {channel.name}
                          <textarea
                            value={captions[clip.id]?.[channel.id] || ''}
                            onChange={(e) =>
                              setCaptions((prev) => ({
                                ...prev,
                                [clip.id]: {
                                  ...(prev[clip.id] || {}),
                                  [channel.id]: e.target.value,
                                },
                              }))
                            }
                            className="min-h-[64px] p-[8px] rounded-[6px] bg-newBgColorInner border border-newTextColor/10"
                          />
                        </label>
                      ))}
                  </div>
                );
              })}
          </div>

          <div className="flex gap-[8px]">
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="h-[40px] flex-1 rounded-[8px] bg-newTextColor/10 text-newTextColor"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="button"
              disabled={busy || !selectedClips.length || billable == null}
              onClick={onConfirm}
              className="h-[40px] flex-1 rounded-[8px] bg-btnPrimary text-white font-[500] disabled:opacity-50"
            >
              {t('confirm_render', 'Confirm & render')}
            </button>
          </div>
        </>
      )}

      {step === 'rendering' && (
        <div className="flex flex-col gap-[12px] py-[16px]">
          <div className="text-[13px]">
            {status?.status === 'completed'
              ? t('repurpose_complete', 'Done. Drafts are in your calendar.')
              : t(
                  'repurpose_rendering',
                  'Rendering selected clips and creating drafts…'
                )}
          </div>
          <button
            type="button"
            onClick={() => modals.closeAll()}
            className="h-[40px] rounded-[8px] bg-btnPrimary text-white"
          >
            {t('close', 'Close')}
          </button>
        </div>
      )}
    </div>
  );
};
