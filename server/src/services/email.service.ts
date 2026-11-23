
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error("RESEND_API_KEY is missing from server environment.");
}

const resend = new Resend(apiKey);

interface InvitationEmailInput {
  name: string;
  email: string;
  token: string;
  role: "teamLeader" | "employee";
}

export async function sendInvitationEmail(
  input: InvitationEmailInput,
) {
  const appBaseUrl = process.env.APP_BASE_URL;

  if (!appBaseUrl) {
    throw new Error("APP_BASE_URL is missing from server environment.");
  }

  const invitationUrl = new URL(
    "/accept-invitation",
    appBaseUrl,
  );

  invitationUrl.searchParams.set("token", input.token);

  const roleLabel =
    input.role === "teamLeader" ? "Team Leader" : "Employee";

  const { data, error } = await resend.emails.send({
    from: "TeamFlow <onboarding@resend.dev>",
    to: [input.email],
    subject: "You're invited to join TeamFlow",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #202124;">
        <h1 style="font-size: 24px;">You're invited to TeamFlow!</h1>
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>You've been invited to join a TeamFlow workspace as a <strong>${roleLabel}</strong>.</p>
        <p>Click the button below to accept your invitation and create your account.</p>
        <p style="margin: 28px 0;">
          <a href="${escapeHtml(invitationUrl.toString())}"
             style="background: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept invitation
          </a>
        </p>
        <p>This invitation expires in 48 hours.</p>
        <p style="font-size: 12px; color: #666;">If you weren't expecting this invitation, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend invitation email failed:", error.message);
    throw new Error("INVITATION_EMAIL_FAILED");
  }

  return data;
}


function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (character: string): string => {
    return entities[character] ?? character;
  });
}

