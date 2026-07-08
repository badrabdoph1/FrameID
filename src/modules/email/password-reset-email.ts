export function buildPasswordResetEmailHtml(input: {
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): string {
  const expiresInHours = Math.floor(input.expiresInMinutes / 60);
  const expiresText = expiresInHours > 0
    ? `${expiresInHours} ساعة`
    : `${input.expiresInMinutes} دقيقة`;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>استعادة كلمة السر</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Tajawal',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);max-width:560px;width:100%;direction:rtl;">
          <tr>
            <td style="padding:40px 40px 0 40px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <span style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#1c1c1e;letter-spacing:-0.5px;">FrameID</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#1c1c1e;text-align:center;line-height:1.4;">
                استعادة كلمة السر
              </h1>
              <p style="margin:12px 0 0 0;font-size:15px;color:#6b7280;text-align:center;line-height:1.6;">
                أهلاً ${input.userName}،
              </p>
              <p style="margin:8px 0 0 0;font-size:15px;color:#6b7280;text-align:center;line-height:1.6;">
                استلمنا طلب استعادة كلمة السر لحسابك في FrameID.
                تقدر تعين كلمة سر جديدة من الزر تحت.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:12px;background-color:#1c1c1e;padding:0;">
                    <a href="${input.resetUrl}" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;background-color:#1c1c1e;border-radius:12px;text-decoration:none;transition:background-color 0.2s;">
                      عين كلمة سر جديدة
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
                أو انسخ الرابط ده وحطه في المتصفح:
              </p>
              <p style="margin:6px 0 0 0;font-size:12px;color:#6b7280;text-align:center;line-height:1.6;word-break:break-all;direction:ltr;unicode-bidi:embed;">
                ${input.resetUrl}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fefce8;border-radius:10px;border:1px solid #fde68a;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#92400e;text-align:center;line-height:1.6;">
                      ⚠️ الرابط ده شغال لمدة <strong>${expiresText}</strong> بس.
                      لو ما طلبتش استعادة كلمة السر، تجاهل البريد ده.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 8px 40px;">
              <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
                للأمان، ما تشاركش الرابط دا مع أي حد.
                فريق FrameID مش هيطلب منك كلمة السر أبداً.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px 40px;border-top:1px solid #f3f4f6;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0;font-size:12px;color:#d1d5db;line-height:1.6;">
                      FrameID © ${new Date().getFullYear()} - منصة المصورين المحترفين
                    </p>
                    <p style="margin:4px 0 0 0;font-size:12px;color:#d1d5db;line-height:1.6;">
                      ده بريد تلقائي، من فضلك ما تردش عليه.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}
