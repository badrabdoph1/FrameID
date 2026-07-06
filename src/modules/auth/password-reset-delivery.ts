export async function sendPasswordResetLink(input: {
  email: string;
  resetUrl: string;
}): Promise<void> {
  if (process.env.PASSWORD_RESET_DELIVERY_MODE === "console") {
    console.info(`FrameID password reset for ${input.email}: ${input.resetUrl}`);
  }
}
