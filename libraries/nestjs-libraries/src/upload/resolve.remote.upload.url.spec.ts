import {
  googleDriveFileId,
  resolveRemoteUploadUrl,
} from '@gitroom/nestjs-libraries/upload/custom.upload.validation';

describe('resolveRemoteUploadUrl', () => {
  it('rewrites a Drive share/view link to the direct-download endpoint', () => {
    const id = '1bgIsNN7cfh5DRAuFstZKrZBSRLQ58Aqr';
    expect(
      resolveRemoteUploadUrl(
        `https://drive.google.com/file/d/${id}/view?usp=sharing`
      )
    ).toBe(`https://drive.google.com/uc?export=download&id=${id}&confirm=t`);
  });

  it('rewrites drive.google.com/open?id= links', () => {
    const id = 'abc123';
    expect(
      resolveRemoteUploadUrl(`https://drive.google.com/open?id=${id}`)
    ).toBe(`https://drive.google.com/uc?export=download&id=${id}&confirm=t`);
  });

  it('leaves non-Drive URLs unchanged', () => {
    const url = 'https://example.com/video.mp4';
    expect(resolveRemoteUploadUrl(url)).toBe(url);
  });

  it('extracts the file id from common Drive URL shapes', () => {
    expect(
      googleDriveFileId(
        'https://drive.google.com/file/d/fileId123/view?usp=sharing'
      )
    ).toBe('fileId123');
    expect(
      googleDriveFileId(
        'https://docs.google.com/uc?id=fileId123&export=download'
      )
    ).toBe('fileId123');
    expect(googleDriveFileId('https://example.com/x')).toBeNull();
  });
});
