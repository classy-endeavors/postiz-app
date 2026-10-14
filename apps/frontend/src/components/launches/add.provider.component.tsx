'use client';

import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import React, { FC, useCallback, useMemo } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { Input } from '@gitroom/react/form/input';
import { FieldValues, FormProvider, useForm } from 'react-hook-form';
import { Button } from '@gitroom/react/form/button';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { ApiKeyDto } from '@gitroom/nestjs-libraries/dtos/integrations/api.key.dto';
import { useRouter } from 'next/navigation';
import { TopTitle } from '@gitroom/frontend/components/launches/helpers/top.title.component';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { object, string } from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import clsx from 'clsx';
import copy from 'copy-to-clipboard';
const resolver = classValidatorResolver(ApiKeyDto);

export const useAddProvider = (
  update?: () => void,
  invite?: boolean,
  redirectUrl?: string
) => {
  const modal = useModals();
  const fetch = useFetch();
  return useCallback(async () => {
    const data = await (await fetch('/integrations')).json();
    modal.openModal({
      title: 'Add Channel',
      withCloseButton: true,
      children: (
        <AddProviderComponent
          invite={!!invite}
          update={update}
          redirectUrl={redirectUrl}
          {...data}
        />
      ),
    });
  }, []);
};
export const TopBarAddChannel: FC = () => {
  const add = useAddProvider();
  const t = useT();

  return (
    <button
      onClick={add}
      aria-label={t('add_channel', 'Add Channel')}
      className="text-white h-[36px] w-auto mobile:w-[36px] px-[14px] mobile:px-0 rounded-[8px] bg-btnPrimary flex items-center justify-center gap-[6px] text-[14px] font-[600] outline-none shrink-0"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 21 20"
        fill="none"
      >
        <path
          d="M10.5001 4.16699V15.8337M4.66675 10.0003H16.3334"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="mobile:hidden whitespace-nowrap">
        {t('add_channel', 'Add Channel')}
      </span>
    </button>
  );
};
export const AddProviderButton: FC<{
  update?: () => void;
}> = (props) => {
  const { update } = props;
  const add = useAddProvider(update);
  const invite = useAddProvider(update, true);
  const t = useT();

  return (
    <div className="flex group-[.sidebar]:block gap-[8px]">
      <button
        className="flex-1 group-[.sidebar]:w-[100%] group-[.sidebar]:flex-none text-btnText bg-btnSimple h-[44px] pt-[12px] pb-[14px] ps-[16px] pe-[20px] justify-center items-center flex rounded-[8px] gap-[8px]"
        onClick={add}
      >
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M1.66675 10.0417C3.35907 10.2299 4.93698 10.9884 6.14101 12.1924C7.34504 13.3964 8.10353 14.9743 8.29175 16.6667M1.66675 13.4167C2.46749 13.58 3.20253 13.9751 3.7804 14.553C4.35827 15.1309 4.75344 15.8659 4.91675 16.6667M1.66675 16.6667H1.67508M11.6667 17.5H14.3334C15.7335 17.5 16.4336 17.5 16.9684 17.2275C17.4388 16.9878 17.8212 16.6054 18.0609 16.135C18.3334 15.6002 18.3334 14.9001 18.3334 13.5V6.5C18.3334 5.09987 18.3334 4.3998 18.0609 3.86502C17.8212 3.39462 17.4388 3.01217 16.9684 2.77248C16.4336 2.5 15.7335 2.5 14.3334 2.5H5.66675C4.26662 2.5 3.56655 2.5 3.03177 2.77248C2.56137 3.01217 2.17892 3.39462 1.93923 3.86502C1.66675 4.3998 1.66675 5.09987 1.66675 6.5V6.66667"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="text-start text-[14px] group-[.sidebar]:hidden">
          {t('add_channel', 'Add Channel')}
        </div>
      </button>
      <button
        onClick={invite}
        data-tooltip-id="tooltip"
        data-tooltip-content={t(
          'invite_link',
          'Send Invite Link to a customer to add channel'
        )}
        className="group-[.sidebar]:hidden min-h-[44px] min-w-[44px] bg-btnSimple justify-center items-center flex rounded-[8px] cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 16 16"
          fill="none"
        >
          <g clipPath="url(#clip0_2452_193804)">
            <path
              d="M6.6668 8.66599C6.9531 9.04875 7.31837 9.36545 7.73783 9.59462C8.1573 9.82379 8.62114 9.96007 9.0979 9.99422C9.57466 10.0284 10.0532 9.95957 10.501 9.79251C10.9489 9.62546 11.3555 9.36404 11.6935 9.02599L13.6935 7.02599C14.3007 6.39732 14.6366 5.55531 14.629 4.68132C14.6215 3.80733 14.2709 2.97129 13.6529 2.35326C13.0348 1.73524 12.1988 1.38467 11.3248 1.37708C10.4508 1.36948 9.60881 1.70547 8.98013 2.31266L7.83347 3.45266M9.33347 7.33266C9.04716 6.94991 8.68189 6.6332 8.26243 6.40403C7.84297 6.17486 7.37913 6.03858 6.90237 6.00444C6.4256 5.97029 5.94708 6.03908 5.49924 6.20614C5.0514 6.3732 4.64472 6.63461 4.3068 6.97266L2.3068 8.97266C1.69961 9.60133 1.36363 10.4433 1.37122 11.3173C1.37881 12.1913 1.72938 13.0274 2.3474 13.6454C2.96543 14.2634 3.80147 14.614 4.67546 14.6216C5.54945 14.6292 6.39146 14.2932 7.02013 13.686L8.16013 12.546"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </g>
          <defs>
            <clipPath id="clip0_2452_193804">
              <rect width="16" height="16" fill="textColor"></rect>
            </clipPath>
          </defs>
        </svg>
      </button>
    </div>
  );
};

export const UrlModal: FC<{
  gotoUrl(url: string): void;
}> = (props) => {
  const { gotoUrl } = props;
  const methods = useForm({
    mode: 'onChange',
  });

  const t = useT();

  const submit = useCallback(async (data: FieldValues) => {
    gotoUrl(data.url);
  }, []);
  return (
    <div className="rounded-[4px] border border-customColor6 bg-sixth px-[16px] pb-[16px] relative">
      <TopTitle title={`Instance URL`} />
      <button
        onClick={close}
        className="outline-none absolute end-[20px] top-[20px] mantine-UnstyledButton-root mantine-ActionIcon-root hover:bg-tableBorder cursor-pointer mantine-Modal-close mantine-1dcetaa"
        type="button"
      >
        <svg
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
        >
          <path
            d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>
      <FormProvider {...methods}>
        <form
          className="gap-[8px] flex flex-col"
          onSubmit={methods.handleSubmit(submit)}
        >
          <div className="pt-[10px]">
            <Input label="URL" name="url" />
          </div>
          <div>
            <Button type="submit">{t('connect', 'Connect')}</Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
export const CustomVariables: FC<{
  variables: Array<{
    key: string;
    label: string;
    defaultValue?: string;
    validation: string;
    type: 'text' | 'password';
    hint?: string;
  }>;
  close?: () => void;
  identifier: string;
  gotoUrl(url: string): void;
  onboarding?: boolean;
}> = (props) => {
  const { close, gotoUrl, identifier, variables, onboarding } = props;
  const fetch = useFetch();
  const modals = useModals();
  const schema = useMemo(() => {
    return object({
      ...variables.reduce((aIcc, item) => {
        const splitter = item.validation.split('/');
        const regex = new RegExp(
          splitter.slice(1, -1).join('/'),
          splitter.pop()
        );
        return {
          ...aIcc,
          [item.key]: string()
            .matches(regex, `${item.label} is invalid`)
            .required(),
        };
      }, {}),
    });
  }, [variables]);
  const methods = useForm({
    mode: 'onChange',
    resolver: yupResolver(schema),
    values: variables.reduce(
      (acc, item) => ({
        ...acc,
        ...(item.defaultValue
          ? {
              [item.key]: item.defaultValue,
            }
          : {}),
      }),
      {}
    ),
  });
  const submit = useCallback(
    async (data: FieldValues) => {
      const response = await fetch(
        `/integrations/social/${identifier}${
          onboarding ? '?onboarding=true' : ''
        }`
      );
      if (response.status === 402) {
        return;
      }
      const { url } = await response.json();
      modals.closeAll();
      gotoUrl(
        `/integrations/social/${identifier}?state=${url}&code=${Buffer.from(
          JSON.stringify(data)
        ).toString('base64')}${onboarding ? '&onboarding=true' : ''}`
      );
    },
    [variables, onboarding]
  );

  const t = useT();

  return (
    <div className="rounded-[4px] relative">
      <FormProvider {...methods}>
        <form
          className="gap-[8px] flex flex-col pt-[10px]"
          onSubmit={methods.handleSubmit(submit)}
        >
          {variables.map((variable) => (
            <div key={variable.key}>
              {variable.hint ? (
                <div className="flex flex-col gap-[6px]">
                  <div className="text-[14px] flex items-center gap-[6px]">
                    <span>{variable.label}</span>
                    <span
                      data-tooltip-id="tooltip"
                      data-tooltip-content={variable.hint}
                      className="w-[16px] h-[16px] rounded-full border border-textColor/60 text-textColor/60 flex items-center justify-center text-[11px] leading-none cursor-help select-none"
                    >
                      i
                    </span>
                  </div>
                  <Input
                    label=""
                    name={variable.key}
                    type={variable.type == 'text' ? 'text' : 'password'}
                  />
                </div>
              ) : (
                <Input
                  label={variable.label}
                  name={variable.key}
                  type={variable.type == 'text' ? 'text' : 'password'}
                />
              )}
            </div>
          ))}
          <div>
            <Button type="submit">{t('connect', 'Connect')}</Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
export const AddProviderComponent: FC<{
  social: Array<{
    identifier: string;
    name: string;
    toolTip?: string;
    notice?: string;
    isExternal: boolean;
    customFields?: Array<{
      key: string;
      label: string;
      validation: string;
      type: 'text' | 'password';
      hint?: string;
    }>;
  }>;
  article: Array<{
    identifier: string;
    name: string;
  }>;
  invite: boolean;
  update?: () => void;
  onboarding?: boolean;
  isMobile?: boolean;
  redirectUrl?: string;
}> = (props) => {
  const { update, social, article, onboarding, isMobile, redirectUrl } = props;
  const toaster = useToaster();
  const router = useRouter();
  const fetch = useFetch();
  const modal = useModals();
  const providerNotices = useMemo(
    () =>
      social
        .map((item) => item.notice)
        .filter((notice): notice is string => !!notice),
    [social]
  );
  const getSocialLink = useCallback(
    (
        invite: boolean,
        identifier: string,
        isExternal: boolean,
        customFields?: Array<{
          key: string;
          label: string;
          validation: string;
          defaultValue?: string;
          type: 'text' | 'password';
          hint?: string;
        }>
      ) =>
      async () => {
        const onboardingParam = onboarding ? 'onboarding=true' : '';
        const gotoIntegration = async (externalUrl?: string) => {
          // Mobile WebView: reuse the existing `externalUrl` param to
          // carry the `postiz://` deep link so the backend redirects
          // back to the iOS/Android app after OAuth completes, instead
          // of the default web redirect.
          const params = [
            `externalUrl=${encodeURIComponent(externalUrl)}`,
            onboardingParam,
            isMobile
              ? `redirectUrl=${encodeURIComponent('postiz://integrations')}`
              : redirectUrl
              ? `redirectUrl=${encodeURIComponent(redirectUrl)}`
              : '',
          ]
            .filter(Boolean)
            .join('&');
          const response = await fetch(
            `/integrations/social/${identifier}${params ? `?${params}` : ''}`
          );
          if (response.status === 402) {
            return;
          }
          const { url, err } = await response.json();
          if (err) {
            toaster.show(
              t(
                'could_not_connect_to_platform',
                'Could not connect to the platform'
              ),
              'warning'
            );
            return;
          }

          if (invite) {
            toaster.show(
              'Invite link copied to clipboard, link will be available for 1 hour',
              'success'
            );
            modal.closeAll();
            copy(url);
            return;
          }

          if (isMobile) {
            // In the mobile WebView the OAuth provider (Google, Facebook,
            // etc.) typically refuses in-WebView sign-in. Post the URL
            // out to React Native so it can open the system browser;
            // `window.open`/`location.href` aren't reliable here because
            // RN WebView doesn't always route them through the native
            // navigation intercept. The backend redirects back to the
            // app via `postiz://` once OAuth completes.
            const rn = (window as any).ReactNativeWebView;
            if (rn && typeof rn.postMessage === 'function') {
              rn.postMessage(JSON.stringify({ type: 'open-external', url }));
              return;
            }
            window.open(url, '_blank');
            return;
          }

          window.location.href = url;
        };
        if (isExternal) {
          modal.openModal({
            title: 'URL',
            withCloseButton: true,
            ...(isMobile ? { removeLayout: true, fullScreen: true } : {}),
            classNames: {
              modal: 'bg-transparent text-textColor',
            },
            children: <UrlModal gotoUrl={gotoIntegration} />,
          });
          return;
        }
        if (customFields) {
          modal.openModal({
            title: t('add_provider_title', 'Add Provider'),
            withCloseButton: true,
            ...(isMobile ? { removeLayout: true, fullScreen: true } : {}),
            classNames: {
              modal: 'bg-transparent text-textColor',
            },
            children: (
              <div
                {...(isMobile ? { className: 'h-full bg-black p-[20px]' } : {})}
              >
                <CustomVariables
                  identifier={identifier}
                  gotoUrl={(url: string) => router.push(url)}
                  variables={customFields}
                  onboarding={onboarding}
                />
              </div>
            ),
          });
          return;
        }
        await gotoIntegration();
      },
    [onboarding]
  );

  const t = useT();

  return (
    <div className="w-full min-w-0 flex flex-col gap-[20px] rounded-[4px] relative">
      {providerNotices.map((notice) => (
        <div
          key={notice}
          className="bg-tableBorder p-[10px] rounded-[10px] flex gap-[10px] items-start text-[13px] text-balance"
        >
          <div className="shrink-0 mt-[2px]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.201 17.6335L14.0026 3.39569C13.7977 3.04687 13.5052 2.75764 13.1541 2.55668C12.803 2.35572 12.4055 2.25 12.001 2.25C11.5965 2.25 11.199 2.35572 10.8479 2.55668C10.4968 2.75764 10.2043 3.04687 9.99944 3.39569L1.80101 17.6335C1.60388 17.9709 1.5 18.3546 1.5 18.7454C1.5 19.1361 1.60388 19.5199 1.80101 19.8572C2.00325 20.2082 2.29523 20.499 2.64697 20.6998C2.99871 20.9006 3.39755 21.0043 3.80257 21.0001H20.1994C20.6041 21.0039 21.0026 20.9001 21.354 20.6993C21.7054 20.4985 21.997 20.2079 22.1991 19.8572C22.3965 19.52 22.5007 19.1364 22.5011 18.7456C22.5014 18.3549 22.3978 17.9711 22.201 17.6335ZM11.251 9.75006C11.251 9.55115 11.33 9.36038 11.4707 9.21973C11.6113 9.07908 11.8021 9.00006 12.001 9.00006C12.1999 9.00006 12.3907 9.07908 12.5313 9.21973C12.672 9.36038 12.751 9.55115 12.751 9.75006V13.5001C12.751 13.699 12.672 13.8897 12.5313 14.0304C12.3907 14.171 12.1999 14.2501 12.001 14.2501C11.8021 14.2501 11.6113 14.171 11.4707 14.0304C11.33 13.8897 11.251 13.699 11.251 13.5001V9.75006ZM12.001 18.0001C11.7785 18.0001 11.561 17.9341 11.376 17.8105C11.191 17.6868 11.0468 17.5111 10.9616 17.3056C10.8765 17.1 10.8542 16.8738 10.8976 16.6556C10.941 16.4374 11.0482 16.2369 11.2055 16.0796C11.3628 15.9222 11.5633 15.8151 11.7815 15.7717C11.9998 15.7283 12.226 15.7505 12.4315 15.8357C12.6371 15.9208 12.8128 16.065 12.9364 16.25C13.06 16.4351 13.126 16.6526 13.126 16.8751C13.126 17.1734 13.0075 17.4596 12.7965 17.6706C12.5855 17.8815 12.2994 18.0001 12.001 18.0001Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>{notice}</div>
        </div>
      ))}
      <div className="flex flex-col min-w-0">
        <div
          className={clsx(
            isMobile && 'gap-[20px] flex flex-col',
            !isMobile &&
              'grid gap-[10px] justify-items-center justify-center mobile:grid-cols-2',
            !isMobile && (onboarding ? 'grid-cols-9' : 'grid-cols-5')
          )}
        >
          {social
            .filter((item) => {
              if (!props.invite) {
                return true;
              }

              return !item.isExternal && !item.customFields;
            })
            .map((item) => (
              <div
                key={item.identifier}
                onClick={getSocialLink(
                  props.invite,
                  item.identifier,
                  item.isExternal,
                  item.customFields
                )}
                {...(!!item.toolTip
                  ? {
                      'data-tooltip-id': 'tooltip',
                      'data-tooltip-content': item.toolTip,
                    }
                  : {})}
                className={clsx(
                  isMobile
                    ? 'flex-row h-[72px] p-[16px]'
                    : 'flex-col p-[10px] h-[100px] mobile:h-auto mobile:min-h-[88px] mobile:py-[12px] justify-center',
                  'w-full min-w-0 text-[14px] mobile:text-[12px] rounded-[8px] bg-newTableHeader text-textColor relative items-center flex gap-[10px] cursor-pointer'
                )}
              >
                <div className="shrink-0">
                  {item.identifier === 'youtube' ? (
                    <img src={`/icons/platforms/youtube.svg`} />
                  ) : (
                    <img
                      className={clsx(
                        'w-[32px] h-[32px]',
                        item.identifier !== 'google_my_business' &&
                          'rounded-full'
                      )}
                      src={`/icons/platforms/${item.identifier}.png`}
                    />
                  )}
                </div>
                <div
                  className={clsx(
                    isMobile ? '' : 'whitespace-pre-wrap mobile:whitespace-normal',
                    'text-center min-w-0 break-words'
                  )}
                >
                  {item.name}
                  {!!item.toolTip && !isMobile && (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 26 26"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute top-[10px] end-[10px] mobile:hidden"
                    >
                      <path
                        d="M13 0C10.4288 0 7.91543 0.762437 5.77759 2.1909C3.63975 3.61935 1.97351 5.64968 0.989572 8.02512C0.0056327 10.4006 -0.251811 13.0144 0.249797 15.5362C0.751405 18.0579 1.98953 20.3743 3.80762 22.1924C5.6257 24.0105 7.94208 25.2486 10.4638 25.7502C12.9856 26.2518 15.5995 25.9944 17.9749 25.0104C20.3503 24.0265 22.3807 22.3603 23.8091 20.2224C25.2376 18.0846 26 15.5712 26 13C25.9964 9.5533 24.6256 6.24882 22.1884 3.81163C19.7512 1.37445 16.4467 0.00363977 13 0ZM13 21C12.7033 21 12.4133 20.912 12.1667 20.7472C11.92 20.5824 11.7277 20.3481 11.6142 20.074C11.5007 19.7999 11.471 19.4983 11.5288 19.2074C11.5867 18.9164 11.7296 18.6491 11.9393 18.4393C12.1491 18.2296 12.4164 18.0867 12.7074 18.0288C12.9983 17.9709 13.2999 18.0007 13.574 18.1142C13.8481 18.2277 14.0824 18.42 14.2472 18.6666C14.412 18.9133 14.5 19.2033 14.5 19.5C14.5 19.8978 14.342 20.2794 14.0607 20.5607C13.7794 20.842 13.3978 21 13 21ZM14 14.91V15C14 15.2652 13.8946 15.5196 13.7071 15.7071C13.5196 15.8946 13.2652 16 13 16C12.7348 16 12.4804 15.8946 12.2929 15.7071C12.1054 15.5196 12 15.2652 12 15V14C12 13.7348 12.1054 13.4804 12.2929 13.2929C12.4804 13.1054 12.7348 13 13 13C14.6538 13 16 11.875 16 10.5C16 9.125 14.6538 8 13 8C11.3463 8 10 9.125 10 10.5V11C10 11.2652 9.89465 11.5196 9.70711 11.7071C9.51958 11.8946 9.26522 12 9.00001 12C8.73479 12 8.48044 11.8946 8.2929 11.7071C8.10536 11.5196 8.00001 11.2652 8.00001 11V10.5C8.00001 8.01875 10.2425 6 13 6C15.7575 6 18 8.01875 18 10.5C18 12.6725 16.28 14.4913 14 14.91Z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
