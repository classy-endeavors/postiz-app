import { readFileSync, existsSync } from 'fs';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

export class ConfigurationChecker {
  cfg: dotenv.DotenvParseOutput;
  issues: string[] = [];

  readEnvFromFile() {
    const envFile = resolve(__dirname, '../../../.env');

    if (!existsSync(envFile)) {
      console.error('Env file not found!: ', envFile);
      return;
    }

    const handle = readFileSync(envFile, 'utf-8');

    this.cfg = dotenv.parse(handle);
  }

  readEnvFromProcess() {
    this.cfg = process.env;
  }

  check() {
    this.checkDatabaseServers();
    this.checkNonEmpty('JWT_SECRET');
    this.checkIsValidUrl('MAIN_URL');
    this.checkIsValidUrl('FRONTEND_URL');
    this.checkIsValidUrl('NEXT_PUBLIC_BACKEND_URL');
    this.checkIsValidUrl('BACKEND_INTERNAL_URL');
    this.checkNonEmpty('STORAGE_PROVIDER', 'Needed to setup storage.');
    this.checkStorageProvider();
  }

  checkStorageProvider() {
    const provider = this.get('STORAGE_PROVIDER');
    if (!provider) {
      return;
    }

    if (provider === 'local') {
      return;
    }

    if (provider !== 'cloudflare') {
      this.issues.push(
        `STORAGE_PROVIDER="${provider}" is invalid. Use "local" or "cloudflare".`
      );
      return;
    }

    // Cloud mode must not silently fall back to local disk
    this.checkNonEmpty(
      'CLOUDFLARE_BUCKETNAME',
      'Required when STORAGE_PROVIDER=cloudflare.'
    );
    this.checkNonEmpty(
      'CLOUDFLARE_REGION',
      'Required when STORAGE_PROVIDER=cloudflare.'
    );
    this.checkNonEmpty(
      'CLOUDFLARE_BUCKET_URL',
      'Required when STORAGE_PROVIDER=cloudflare.'
    );

    const endpoint = this.get('CLOUDFLARE_ENDPOINT');
    const accountId = this.get('CLOUDFLARE_ACCOUNT_ID');
    if (!endpoint?.trim() && !accountId?.trim()) {
      this.issues.push(
        'CLOUDFLARE_ENDPOINT or CLOUDFLARE_ACCOUNT_ID is required when STORAGE_PROVIDER=cloudflare.'
      );
    }

    const accessKey = this.get('CLOUDFLARE_ACCESS_KEY') || '';
    const secretKey = this.get('CLOUDFLARE_SECRET_ACCESS_KEY') || '';
    if ((accessKey && !secretKey) || (!accessKey && secretKey)) {
      this.issues.push(
        'CLOUDFLARE_ACCESS_KEY and CLOUDFLARE_SECRET_ACCESS_KEY must both be set, or both empty for instance-role credentials.'
      );
    }
  }

  checkNonEmpty(key: string, description?: string): boolean {
    const v = this.get(key);

    if (!description) {
      description = '';
    }

    if (!v) {
      this.issues.push(key + ' not set. ' + description);
      return false;
    }

    if (v.length === 0) {
      this.issues.push(key + ' is empty.' + description);
      return false;
    }

    return true;
  }

  get(key: string): string | undefined {
    return this.cfg[key as keyof typeof this.cfg];
  }

  checkDatabaseServers() {
    this.checkRedis();
    this.checkIsValidUrl('DATABASE_URL');
  }

  checkRedis() {
    if (!this.cfg.REDIS_URL) {
      this.issues.push('REDIS_URL not set');
    }

    try {
      const redisUrl = new URL(this.cfg.REDIS_URL);

      if (redisUrl.protocol !== 'redis:') {
        this.issues.push('REDIS_URL must start with redis://');
      }
    } catch (error) {
      this.issues.push('REDIS_URL is not a valid URL');
    }
  }

  checkIsValidUrl(key: string) {
    if (!this.checkNonEmpty(key)) {
      return;
    }

    const urlString = this.get(key);

    try {
      new URL(urlString);
    } catch (error) {
      this.issues.push(key + ' is not a valid URL');
    }

    if (urlString.endsWith('/')) {
      this.issues.push(key + ' should not end with /');
    }
  }

  hasIssues() {
    return this.issues.length > 0;
  }

  getIssues() {
    return this.issues;
  }

  getIssuesCount() {
    return this.issues.length;
  }
}
