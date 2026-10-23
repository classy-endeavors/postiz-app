'use client';
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import Link from 'next/link';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { useMemo, useState } from 'react';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { ForgotReturnPasswordDto } from '@gitroom/nestjs-libraries/dtos/auth/forgot-return.password.dto';
import { useT } from '@gitroom/react/translation/get.transation.service.client';

type Inputs = {
  password: string;
  repeatPassword: string;
  token: string;
};

function PasswordEyeButton({
  show,
  onToggle,
  hideLabel,
  showLabel,
}: {
  show: boolean;
  onToggle: () => void;
  hideLabel: string;
  showLabel: string;
}) {
  return (
    <button
      type="button"
      className="text-textItemBlur hover:text-newTextColor p-[2px]"
      aria-label={show ? hideLabel : showLabel}
      onClick={onToggle}
    >
      {show ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

export function ForgotReturn({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const t = useT();
  const [state, setState] = useState(false);
  const resolver = useMemo(() => {
    return classValidatorResolver(ForgotReturnPasswordDto);
  }, []);
  const form = useForm<Inputs>({
    resolver,
    mode: 'onChange',
    defaultValues: {
      token,
    },
  });
  const fetchData = useFetch();
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setLoading(true);
    const { reset } = await (
      await fetchData('/auth/forgot-return', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
        }),
      })
    ).json();
    setState(true);
    if (!reset) {
      form.setError('password', {
        type: 'manual',
        message: t(
          'password_reset_link_expired',
          'Your password reset link has expired. Please try again.'
        ),
      });
      return false;
    }
    setLoading(false);
  };
  return (
    <FormProvider {...form}>
      <form className="w-full min-w-0" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <h1 className="text-3xl font-bold text-start mb-4 cursor-pointer">
            {t('forgot_password_1', 'Forgot Password')}
          </h1>
        </div>
        {!state ? (
          <>
            <div className="space-y-4 text-textColor w-full min-w-0">
              <Input
                label="New Password"
                translationKey="label_new_password"
                {...form.register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder={t('label_password', 'Password')}
                autoComplete="new-password"
                suffix={
                  <PasswordEyeButton
                    show={showPassword}
                    onToggle={() => setShowPassword((v) => !v)}
                    hideLabel={t('hide_password', 'Hide password')}
                    showLabel={t('show_password', 'Show password')}
                  />
                }
              />
              <Input
                label="Repeat Password"
                translationKey="label_repeat_password"
                {...form.register('repeatPassword')}
                type={showRepeatPassword ? 'text' : 'password'}
                placeholder={t('label_repeat_password', 'Repeat Password')}
                autoComplete="new-password"
                suffix={
                  <PasswordEyeButton
                    show={showRepeatPassword}
                    onToggle={() => setShowRepeatPassword((v) => !v)}
                    hideLabel={t('hide_password', 'Hide password')}
                    showLabel={t('show_password', 'Show password')}
                  />
                }
              />
            </div>
            <div className="text-center mt-6">
              <div className="w-full flex">
                <Button type="submit" className="flex-1" loading={loading}>
                  {t('change_password', 'Change Password')}
                </Button>
              </div>
              <p className="mt-4 text-sm">
                <Link href="/auth/login" className="underline cursor-pointer">
                  {t('go_back_to_login', 'Go back to login')}
                </Link>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-start mt-6">
              {t(
                'we_successfully_reset_your_password_you_can_now_login_with_your',
                'We successfully reset your password. You can now login with your'
              )}
            </div>
            <p className="mt-4 text-sm">
              <Link href="/auth/login" className="underline cursor-pointer">
                {t('go_back_to_login', 'Go back to login')}
              </Link>
            </p>
          </>
        )}
      </form>
    </FormProvider>
  );
}
