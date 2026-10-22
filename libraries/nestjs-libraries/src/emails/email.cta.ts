/**
 * Shared CTA button markup for transactional emails (table-based for clients).
 */
export function emailCtaButton(label: string, href: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px 0;">
  <tr>
    <td align="left" bgcolor="#FF5227" style="border-radius:8px;background-color:#FF5227;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;line-height:1;">
        ${label}
      </a>
    </td>
  </tr>
</table>`.trim();
}
