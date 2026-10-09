'use client';

import { useState, useCallback, useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useUser } from '../layout/user.context';
import copy from 'copy-to-clipboard';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useDecisionModal } from '@gitroom/frontend/components/layout/new-modal';
import { DeveloperComponent } from '@gitroom/frontend/components/developer/developer.component';
import { McpClientIcon } from '@gitroom/frontend/components/public-api/mcp.client.icons';
import clsx from 'clsx';

// Remote clients can't set headers, they get a URL to paste (hint = where)
export const remoteMcpClients = {
  Claude:
    'In Claude go to Settings > Connectors > Add custom connector and paste this URL.',
  ChatGPT:
    'In ChatGPT go to Settings > Connectors > Create and paste this URL.',
} as const;

// Official one-click connectors listed in the assistants' directories.
// Only for the hosted AI Zyntra (billingEnabled), they point at the public MCP server.
export const mcpConnectorUrls = {
  Claude: 'https://claude.ai/directory/postiz',
  ChatGPT:
    'https://chatgpt.com/plugins/plugin_asdk_app_6aaaf1a529808191a2a15fde824bb013',
  Cursor: 'https://cursor.com/marketplace/postiz',
  'Grok Bot': 'https://x.ai/bot/plugin/58737848',
} as const;

// Clients with no MCP settings: you paste instructions into the chat
// and the agent asks you for the API key
export const chatOnlyMcpClients = {} as const satisfies Record<string, string>;

export const mcpClients = [
  'OpenClaw',
  'Hermes',
  'NanoClaw',
  'Claude Code',
  'Cursor',
  'Codex',
  'VS Code / Copilot',
  'Windsurf',
  'Amp',
  'Gemini CLI',
  'Warp',
] as const;

export type RemoteMcpClient = keyof typeof remoteMcpClients;
export type ChatOnlyMcpClient = keyof typeof chatOnlyMcpClients;
export type McpClient = (typeof mcpClients)[number];
export type AnyMcpClient = RemoteMcpClient | ChatOnlyMcpClient | McpClient;

// oauth: no API key, the client registers itself (DCR) and the user signs in to AI Zyntra
// apikey: the organization API key, as a Bearer header (or inside the URL for remote clients)
export type McpAuth = 'oauth' | 'apikey';

export const getMcpOauthUrl = (mcpBase: string) =>
  `${mcpBase}/mcp-oauth-dynamic`;

export const isRemoteMcpClient = (client: string): client is RemoteMcpClient =>
  client in remoteMcpClients;

export const isChatOnlyMcpClient = (
  client: string
): client is ChatOnlyMcpClient => client in chatOnlyMcpClients;

export const getMcpConfig = (
  client: AnyMcpClient,
  auth: McpAuth,
  mcpBase: string,
  apiKey: string
): { config: string; hint: string } => {
  if (isChatOnlyMcpClient(client)) {
    return {
      config: chatOnlyMcpClients[client],
      hint: 'Paste this into the chat. The agent will ask you for your API key.',
    };
  }
  if (isRemoteMcpClient(client)) {
    return {
      config:
        auth === 'oauth' ? getMcpOauthUrl(mcpBase) : `${mcpBase}/mcp/${apiKey}`,
      hint: remoteMcpClients[client],
    };
  }

  const oauthUrl = getMcpOauthUrl(mcpBase);
  const urlBase = `${mcpBase}/mcp`;
  const bearer = `Bearer ${apiKey}`;

  const json = (obj: object) => JSON.stringify(obj, null, 2);

  if (auth === 'oauth') {
    switch (client) {
      case 'Claude Code':
        return {
          config: `claude mcp add aizyntra --transport http "${oauthUrl}"`,
          hint: 'Run this command in your terminal.',
        };
      case 'Cursor':
        return {
          config: json({ mcpServers: { aizyntra: { url: oauthUrl } } }),
          hint: 'Add to .cursor/mcp.json in your project root.',
        };
      case 'VS Code / Copilot':
        return {
          config: json({
            servers: { aizyntra: { type: 'http', url: oauthUrl } },
          }),
          hint: 'Add to .vscode/mcp.json in your project root.',
        };
      case 'Windsurf':
        return {
          config: json({
            mcpServers: { aizyntra: { serverUrl: oauthUrl } },
          }),
          hint: 'Add to ~/.codeium/windsurf/mcp_config.json',
        };
      case 'Amp':
        return {
          config: `amp mcp add aizyntra ${oauthUrl}`,
          hint: 'Run this command in your terminal.',
        };
      case 'Codex':
        return {
          config: `# ~/.codex/config.toml\n\n[mcp_servers.aizyntra]\nurl = "${oauthUrl}"`,
          hint: 'Add to ~/.codex/config.toml, then run: codex mcp login aizyntra',
        };
      case 'Gemini CLI':
        return {
          config: json({ mcpServers: { aizyntra: { url: oauthUrl } } }),
          hint: 'Add to ~/.gemini/settings.json',
        };
      case 'Warp':
        return {
          config: json({ aizyntra: { url: oauthUrl } }),
          hint: 'Settings > MCP Servers > + Add, then paste this config.',
        };
      case 'Hermes':
        return {
          config: `# ~/.hermes/config.yaml\n\nmcp_servers:\n  aizyntra:\n    url: "${oauthUrl}"\n    auth: oauth`,
          hint: 'Add to ~/.hermes/config.yaml, then run /reload-mcp in the chat.',
        };
      case 'OpenClaw':
        return {
          config: `openclaw mcp add aizyntra --url ${oauthUrl} --transport streamable-http --auth oauth && openclaw mcp login aizyntra`,
          hint: 'Run this command in your terminal.',
        };
      case 'NanoClaw':
        return {
          config: `ncl groups config add-mcp-server --id <group-id> --name aizyntra --url ${oauthUrl}`,
          hint: 'Run this in your terminal, replace <group-id> with the agent group that should get AI Zyntra.',
        };
    }
  }

  switch (client) {
    case 'Claude Code':
      return {
        config: `claude mcp add --transport http aizyntra ${urlBase} --header "Authorization: ${bearer}"`,
        hint: 'Run this command in your terminal.',
      };
    case 'Cursor':
      return {
        config: json({
          mcpServers: {
            aizyntra: { url: urlBase, headers: { Authorization: bearer } },
          },
        }),
        hint: 'Add to .cursor/mcp.json in your project root.',
      };
    case 'VS Code / Copilot':
      return {
        config: json({
          servers: {
            aizyntra: {
              type: 'http',
              url: urlBase,
              headers: { Authorization: bearer },
            },
          },
        }),
        hint: 'Add to .vscode/mcp.json in your project root.',
      };
    case 'Windsurf':
      return {
        config: json({
          mcpServers: {
            aizyntra: {
              serverUrl: urlBase,
              headers: { Authorization: bearer },
            },
          },
        }),
        hint: 'Add to ~/.codeium/windsurf/mcp_config.json',
      };
    case 'Amp':
      return {
        config: json({
          'amp.mcpServers': {
            aizyntra: { url: urlBase, headers: { Authorization: bearer } },
          },
        }),
        hint: 'Add to your Amp settings.json',
      };
    case 'Codex':
      return {
        config: `# ~/.codex/config.toml\n\n[mcp_servers.aizyntra]\nurl = "${urlBase}"\nhttp_headers = { "Authorization" = "${bearer}" }`,
        hint: 'Add to ~/.codex/config.toml',
      };
    case 'Gemini CLI':
      return {
        config: json({
          mcpServers: {
            aizyntra: { url: urlBase, headers: { Authorization: bearer } },
          },
        }),
        hint: 'Add to ~/.gemini/settings.json',
      };
    case 'Warp':
      return {
        config: json({
          aizyntra: { url: urlBase, headers: { Authorization: bearer } },
        }),
        hint: 'Settings > MCP Servers > + Add, then paste this config.',
      };
    case 'Hermes':
      return {
        config: `# ~/.hermes/config.yaml\n\nmcp_servers:\n  aizyntra:\n    url: "${urlBase}"\n    headers:\n      Authorization: "${bearer}"`,
        hint: 'Add to ~/.hermes/config.yaml, then run /reload-mcp in the chat.',
      };
    case 'OpenClaw':
      return {
        config: json({
          mcp: {
            servers: {
              aizyntra: {
                url: urlBase,
                transport: 'streamable-http',
                headers: { Authorization: bearer },
              },
            },
          },
        }),
        hint: 'Add to ~/.openclaw/openclaw.json',
      };
    case 'NanoClaw':
      // No headers flag, the key travels inside the URL like remote clients
      return {
        config: `ncl groups config add-mcp-server --id <group-id> --name aizyntra --url ${mcpBase}/mcp/${apiKey}`,
        hint: 'Run this in your terminal, replace <group-id> with the agent group that should get AI Zyntra.',
      };
  }
};

export const CopyButton = ({
  text,
  label,
}: {
  text: string;
  label: string;
}) => {
  const toaster = useToaster();
  return (
    <button
      type="button"
      onClick={() => {
        copy(text);
        toaster.show(`${label} copied to clipboard`, 'success');
      }}
      className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600] flex items-center gap-[6px]"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </svg>
      {label}
    </button>
  );
};

const McpSection = ({
  user,
  mcpBase,
}: {
  user: { publicApi: string };
  mcpBase: string;
}) => {
  const t = useT();
  const { billingEnabled } = useVariables();
  const [activeClient, setActiveClient] = useState<AnyMcpClient>('Claude');
  const [auth, setAuth] = useState<McpAuth>('oauth');
  const [revealed, setRevealed] = useState(false);

  const { config, hint } = getMcpConfig(
    activeClient,
    auth,
    mcpBase,
    user.publicApi
  );

  const baseUrl = auth === 'oauth' ? getMcpOauthUrl(mcpBase) : `${mcpBase}/mcp`;

  const chatOnly = isChatOnlyMcpClient(activeClient);

  const maskedConfig =
    revealed || auth === 'oauth' || chatOnly
      ? config
      : config.replace(
          new RegExp(user.publicApi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          '*'.repeat(user.publicApi.length)
        );

  return (
    <div className="bg-newBgColorInnerInner rounded-[12px] border border-newBorder overflow-hidden">
      <div className="bg-newBgColorInner px-[20px] py-[14px] border-b border-newBorder flex items-start justify-between gap-[12px]">
        <div>
          <div className="text-[15px] font-[600]">
            {t('mcp_client_configuration', 'MCP Client Configuration')}
          </div>
          <div className="text-[13px] text-customColor18 mt-[2px]">
            {t(
              'connect_your_mcp_client_to_postiz_to_schedule_your_posts_faster',
              'Connect AI Zyntra MCP server to your client (Http streaming) to schedule your posts faster.'
            )}
          </div>
        </div>
        <div className="flex gap-[6px] shrink-0 pt-[2px]">
          {billingEnabled && (
            <>
              <a
                className="cursor-pointer px-[16px] h-[36px] bg-[#FF5227] hover:bg-[#CB4220] text-white transition-colors rounded-[8px] text-[13px] font-[600] flex items-center gap-[6px]"
                href={mcpConnectorUrls.Claude}
                target="_blank"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                {t('add_to_claude', 'Add to Claude')}
              </a>
              <a
                className="cursor-pointer px-[16px] h-[36px] bg-[#FF5227] hover:bg-[#CB4220] text-white transition-colors rounded-[8px] text-[13px] font-[600] flex items-center gap-[6px]"
                href={mcpConnectorUrls.ChatGPT}
                target="_blank"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                {t('add_to_chatgpt', 'Add to ChatGPT')}
              </a>
            </>
          )}
        </div>
      </div>
      <div className="p-[20px] flex flex-col gap-[16px]">
        {!chatOnly && (
          <div className="flex flex-col gap-[6px]">
            <div className="text-[13px] font-[600] text-customColor18">
              {t('auth_method', 'Authentication')}
            </div>
            <div className="flex gap-[6px]">
              {(['oauth', 'apikey'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={clsx(
                    'cursor-pointer px-[14px] h-[36px] text-[13px] font-[500] rounded-[8px] transition-colors',
                    auth === m
                      ? 'bg-[#FF5227] text-white'
                      : 'bg-btnSimple text-customColor18 hover:bg-boxHover hover:text-textColor'
                  )}
                  onClick={() => setAuth(m)}
                >
                  {m === 'oauth'
                    ? t('sign_in_no_api_key', 'Sign in with AI Zyntra (no API key)')
                    : t('api_key', 'API Key')}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-[6px]">
          <div className="text-[13px] font-[600] text-customColor18">
            {t('mcp_client', 'Client')}
          </div>
          <div className="flex flex-wrap gap-[6px]">
            {[
              ...Object.keys(remoteMcpClients),
              ...mcpClients,
              ...Object.keys(chatOnlyMcpClients),
            ].map((client) => (
              <button
                key={client}
                type="button"
                className={clsx(
                  'cursor-pointer px-[14px] h-[36px] text-[13px] font-[500] rounded-[8px] transition-colors flex items-center gap-[8px]',
                  activeClient === client
                    ? 'bg-[#FF5227] text-white'
                    : 'bg-btnSimple text-customColor18 hover:bg-boxHover hover:text-textColor'
                )}
                onClick={() =>
                  setActiveClient(client as AnyMcpClient)
                }
              >
                <McpClientIcon client={client} />
                {client}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-[8px]">
          <div className="text-[12px] text-customColor18 font-[500]">
            {hint}
            {auth === 'oauth' &&
              !chatOnly &&
              ` ${t(
                'oauth_sign_in_hint',
                'Your agent will open a browser window to sign in to AI Zyntra.'
              )}`}
          </div>
          <pre className="bg-newBgColorInner border border-newBorder rounded-[8px] p-[16px] text-[13px] whitespace-pre-wrap break-all overflow-x-auto leading-[1.6]">
            {maskedConfig}
          </pre>
          <div className="flex gap-[8px]">
            {auth === 'apikey' && !chatOnly && (
              <button
                type="button"
                onClick={() => setRevealed(!revealed)}
                className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600] flex items-center gap-[6px]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {revealed ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
                {revealed ? t('hide', 'Hide') : t('reveal', 'Reveal')}
              </button>
            )}
            <CopyButton text={config} label={t('copy', 'Copy')} />
            {!isRemoteMcpClient(activeClient) && !chatOnly && (
              <CopyButton text={baseUrl} label={t('copy_url', 'Copy URL')} />
            )}
            {activeClient === 'Claude' && billingEnabled && (
              <a
                className="cursor-pointer px-[16px] h-[36px] bg-[#FF5227] hover:bg-[#CB4220] text-white transition-colors rounded-[8px] text-[13px] font-[600] flex items-center gap-[6px]"
                href={mcpConnectorUrls.Claude}
                target="_blank"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                {t('add_to_claude', 'Add to Claude')}
              </a>
            )}
            {activeClient === 'ChatGPT' && billingEnabled && (
              <a
                className="cursor-pointer px-[16px] h-[36px] bg-[#FF5227] hover:bg-[#CB4220] text-white transition-colors rounded-[8px] text-[13px] font-[600] flex items-center gap-[6px]"
                href={mcpConnectorUrls.ChatGPT}
                target="_blank"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                {t('add_to_chatgpt', 'Add to ChatGPT')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PublicApiContent = () => {
  const user = useUser();
  const { frontEndUrl } = useVariables();
  const toaster = useToaster();
  const fetch = useFetch();
  const decision = useDecisionModal();
  const { mutate } = useSWRConfig();
  const [reveal, setReveal] = useState(false);
  const t = useT();

  const rotateKey = useCallback(async () => {
    const approved = await decision.open({
      title: t('rotate_api_key', 'Rotate API Key?'),
      description: t(
        'rotate_api_key_description',
        'This will generate a new API key and invalidate the current one. Any integrations using the old key will stop working.'
      ),
      approveLabel: t('rotate', 'Rotate'),
      cancelLabel: t('cancel', 'Cancel'),
    });
    if (!approved) return;
    await fetch('/user/api-key/rotate', { method: 'POST' });
    await mutate('/user/self');
    setReveal(false);
    toaster.show(
      t('api_key_rotated', 'API Key rotated successfully'),
      'success'
    );
  }, [decision, fetch, mutate, toaster]);

  if (!user || !user.publicApi) {
    return null;
  }

  return (
    <div className="flex flex-col gap-[40px]">
      <div className="text-[14px] text-textColor leading-[1.7]">
        {t(
          'api_auth_note_line1',
          'Use your API Key to automate your own account.'
        )}
        <br />
        {t(
          'api_auth_note_line2',
          'If you are building a product that schedules posts on behalf of other AI Zyntra users,'
        )}
        <br />
        {t(
          'api_auth_note_line3',
          'create an OAuth App under the "Apps" tab. Your users will authorize your app via OAuth2,'
        )}
        <br />
        {t(
          'api_auth_note_line4',
          'and you will receive a pos_ prefixed token that works with the API and MCP — just like an API Key.'
        )}
      </div>
      <div className="bg-newBgColorInnerInner rounded-[12px] border border-newBorder overflow-hidden">
        <div className="bg-newBgColorInner px-[20px] py-[14px] border-b border-newBorder flex items-start justify-between gap-[12px]">
          <div>
            <div className="text-[15px] font-[600]">
              {t('api_key', 'API Key')}
            </div>
            <div className="text-[13px] text-customColor18 mt-[2px]">
              {t(
                'use_postiz_api_to_integrate_with_your_tools',
                'Use AI Zyntra API to integrate with your tools.'
              )}
            </div>
          </div>
        </div>
        <div className="p-[20px] flex flex-col gap-[16px]">
          <div className="bg-newBgColorInner border border-newBorder rounded-[8px] px-[16px] h-[44px] flex items-center overflow-hidden">
            <code className="text-[14px] flex-1 truncate">
              {reveal ? (
                user.publicApi
              ) : (
                <span className="flex items-center">
                  <span className="blur-sm select-none">
                    {user.publicApi.slice(0, -5)}
                  </span>
                  <span>{user.publicApi.slice(-5)}</span>
                </span>
              )}
            </code>
          </div>
          <div className="flex gap-[8px]">
            <button
              type="button"
              onClick={() => setReveal(!reveal)}
              className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600] flex items-center gap-[6px]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {reveal ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
              {reveal ? t('hide', 'Hide') : t('reveal', 'Reveal')}
            </button>
            <CopyButton text={user.publicApi} label={t('copy', 'Copy')} />
            <button
              type="button"
              onClick={rotateKey}
              className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600] flex items-center gap-[6px]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6" />
                <path d="M21.34 15.57a10 10 0 11-.57-8.38L21.5 8" />
              </svg>
              {t('rotate_key', 'Rotate Key')}
            </button>
            <button
              type="button"
              data-tooltip-id="tooltip"
              data-tooltip-content={t(
                'payload_wizard_description',
                'Building a POST request to /posts can be complex. Use the wizard to schedule a post with the UI, then copy the generated payload.'
              )}
              onClick={() =>
                window.open(`${frontEndUrl}/modal/dark/all`, '_blank')
              }
              className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600] flex items-center gap-[6px]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {t('open_wizard', 'Open Wizard')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const McpConnectContent = () => {
  const user = useUser();
  const { backendUrl, mcpUrl } = useVariables();

  if (!user || !user.publicApi) {
    return null;
  }

  return <McpSection user={user} mcpBase={mcpUrl || backendUrl} />;
};

const McpHero = ({ orgName }: { orgName?: string }) => {
  const t = useT();
  const capabilities = [
    t('mcp_cap_schedule', 'Schedule and list posts'),
    t('mcp_cap_media', 'Upload media from a URL'),
    t('mcp_cap_images', 'Generate images'),
    t('mcp_cap_youtube', 'Publish to YouTube directly'),
  ];

  return (
    <div className="relative overflow-hidden rounded-[16px] border border-newBorder bg-newBgColorInner p-[24px]">
      <div className="pointer-events-none absolute -top-[120px] -end-[80px] w-[320px] h-[320px] rounded-full bg-[#FF5227]/20 blur-[70px]" />
      <div className="pointer-events-none absolute -bottom-[140px] start-[30%] w-[260px] h-[260px] rounded-full bg-[#FF8A3D]/10 blur-[70px]" />
      <div className="relative flex items-start gap-[18px]">
        <div className="shrink-0 w-[56px] h-[56px] rounded-[16px] bg-gradient-to-br from-[#FF5227] to-[#FF8A3D] text-white flex items-center justify-center shadow-[0_10px_30px_rgba(255,82,39,0.35)]">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22v-5" />
            <path d="M9 8V2" />
            <path d="M15 8V2" />
            <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
          </svg>
        </div>
        <div className="flex flex-col gap-[6px] min-w-0">
          <div className="flex flex-wrap items-center gap-[10px]">
            <h3 className="text-[24px] font-[700] leading-[1.2]">
              {t('mcp', 'MCP')}
            </h3>
            <span className="text-[12px] font-[600] px-[10px] py-[3px] rounded-full bg-[#FF5227]/15 text-[#FF5227]">
              {t('model_context_protocol', 'Model Context Protocol')}
            </span>
            {!!orgName && (
              <span className="text-[13px] text-textItemBlur">{orgName}</span>
            )}
          </div>
          <div className="text-[14px] text-textItemBlur max-w-[680px] leading-[1.6]">
            {t(
              'mcp_hero_description',
              'Connect Cursor, Claude, ChatGPT and other AI assistants to AI Zyntra, then ask them to plan, create and publish your posts.'
            )}
          </div>
          <div className="flex flex-wrap gap-[8px] mt-[10px]">
            {capabilities.map((capability) => (
              <span
                key={capability}
                className="flex items-center gap-[6px] h-[30px] px-[12px] rounded-full border border-newBorder bg-newBgColorInnerInner text-[13px] font-[500]"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF5227"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {capability}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PublicComponent = () => {
  const t = useT();
  const fetch = useFetch();
  const user = useUser();
  const [subTab, setSubTab] = useState<'mcp' | 'api' | 'developer'>('mcp');
  const loadOrganizations = useCallback(async () => {
    return await (await fetch('/user/organizations')).json();
  }, []);
  const { data: organizations } = useSWR('organizations', loadOrganizations, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
    revalidateOnReconnect: false,
  });
  const currentOrg = useMemo(() => {
    return organizations?.find((org: any) => org?.id === user?.orgId);
  }, [organizations, user?.orgId]);

  return (
    <div className="flex flex-col gap-[24px]">
      <McpHero orgName={currentOrg?.name} />
      <div className="self-start flex gap-[4px] p-[4px] rounded-[12px] border border-newBorder bg-newBgColorInner">
        {(['mcp', 'api', 'developer'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={clsx(
              'cursor-pointer px-[18px] h-[38px] text-[14px] font-[600] rounded-[8px] transition-all',
              subTab === tab
                ? 'bg-[#FF5227] text-white shadow-[0_4px_14px_rgba(255,82,39,0.35)]'
                : 'text-textItemBlur hover:bg-boxHover hover:text-newTextColor'
            )}
            onClick={() => setSubTab(tab)}
          >
            {tab === 'mcp'
              ? t('connect', 'Connect')
              : tab === 'api'
              ? t('api_key', 'API Key')
              : t('apps', 'Apps')}
          </button>
        ))}
      </div>
      {subTab === 'mcp' && <McpConnectContent />}
      {subTab === 'api' && <PublicApiContent />}
      {subTab === 'developer' && <DeveloperComponent />}
    </div>
  );
};
