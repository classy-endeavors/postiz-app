'use client';

import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import Link from 'next/link';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { useMemo, useState } from 'react';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { LoginUserDto } from '@gitroom/nestjs-libraries/dtos/auth/login.user.dto';
import { GithubProvider } from '@gitroom/frontend/components/auth/providers/github.provider';
import { OauthProvider } from '@gitroom/frontend/components/auth/providers/oauth.provider';
import { GoogleProvider } from '@gitroom/frontend/components/auth/providers/google.provider';
import { AppleProvider } from '@gitroom/frontend/components/auth/providers/apple.provider';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { FarcasterProvider } from '@gitroom/frontend/components/auth/providers/farcaster.provider';
import WalletProvider from '@gitroom/frontend/components/auth/providers/wallet.provider';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
type Inputs = {
  email: string;
  password: string;
  providerToken: '';
  provider: 'LOCAL';
};
export function Login() {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [notActivated, setNotActivated] = useState(false);
  const {
    isGeneral,
    neynarClientId,
    appleClientId,
    billingEnabled,
    genericOauth,
  } = useVariables();
  const resolver = useMemo(() => {
    return classValidatorResolver(LoginUserDto);
  }, []);
  const form = useForm<Inputs>({
    resolver,
    defaultValues: {
      providerToken: '',
      provider: 'LOCAL',
    },
  });
  const fetchData = useFetch();
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setLoading(true);
    setNotActivated(false);
    const login = await fetchData('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        provider: 'LOCAL',
      }),
    });
    if (login.status === 400) {
      const errorMessage = await login.text();
      if (errorMessage === 'User is not activated') {
        setNotActivated(true);
      } else {
        form.setError('email', {
          message: errorMessage,
        });
      }
      setLoading(false);
    }
  };
  return (
    <FormProvider {...form}>
      <form className="flex-1 flex" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col flex-1">
          <div>
            <h1 className="text-[32px] -tracking-[0.8px] leading-[1.15] text-start">
              {t('welcome_back', 'Welcome back')}
            </h1>
            <div className="text-[14px] text-textItemBlur mt-[6px]">
              {t(
                'sign_in_subtitle',
                'Sign in to plan, schedule and publish your content.'
              )}
            </div>
          </div>
          <div className="flex flex-col mt-[24px]">
            {isGeneral && genericOauth ? (
              <OauthProvider />
            ) : !isGeneral ? (
              <GithubProvider />
            ) : (
              <div className="gap-[8px] flex">
                <GoogleProvider />
                {!!appleClientId && <AppleProvider />}
                {!!neynarClientId && <FarcasterProvider />}
                {billingEnabled && <WalletProvider />}
              </div>
            )}
            <div className="flex items-center gap-[12px] my-[18px] text-[12px] text-textItemBlur">
              <div className="flex-1 h-[1px] bg-newTableBorder" />
              {t('or', 'or')}
              <div className="flex-1 h-[1px] bg-newTableBorder" />
            </div>
            <div className="flex flex-col gap-[4px]">
              <div className="text-textColor">
                <Input
                  label="Email"
                  translationKey="label_email"
                  {...form.register('email')}
                  type="email"
                  placeholder={t('email_address', 'Email Address')}
                />
                <Input
                  label="Password"
                  translationKey="label_password"
                  {...form.register('password')}
                  autoComplete="off"
                  type="password"
                  placeholder={t('label_password', 'Password')}
                />
              </div>
              {notActivated && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-[10px] p-4 mb-4">
                  <p className="text-amber-400 text-sm mb-2">
                    {t(
                      'account_not_activated',
                      'Your account is not activated yet. Please check your email for the activation link.'
                    )}
                  </p>
                  <Link
                    href="/auth/activate"
                    className="text-amber-400 underline hover:font-bold text-sm"
                  >
                    {t('resend_activation_email', 'Resend Activation Email')}
                  </Link>
                </div>
              )}
              <div className="flex justify-end -mt-[4px]">
                <Link
                  href="/auth/forgot"
                  className="text-[13px] text-textItemBlur hover:text-newTextColor underline"
                >
                  {t('forgot_password', 'Forgot password')}
                </Link>
              </div>
              <div className="w-full flex mt-[12px]">
                <Button
                  type="submit"
                  className="flex-1 rounded-[10px] !h-[46px]"
                  loading={loading}
                >
                  {t('sign_in_1', 'Sign in')}
                </Button>
              </div>
              <p className="mt-[16px] text-[14px] text-center">
                {t('don_t_have_an_account', "Don't Have An Account?")}&nbsp;
                <Link
                  href="/auth"
                  className="font-[600] text-btnPrimary hover:underline"
                >
                  {t('sign_up', 'Sign Up')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
