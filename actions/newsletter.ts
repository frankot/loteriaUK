"use server";

import resend from "@/lib/resend";

export async function subscribeToNewsletter(
  _prevState: { success?: boolean; error?: string },
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address" };
  }

  const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID;

  try {
    // Resend SDK v4+ returns { data, error } — does NOT throw
    const { data, error } = await resend.contacts.create({
      email,
      unsubscribed: false,
      ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
    });

    if (error) {
      // 409 = contact already exists — treat as success
      if (error.statusCode === 409) {
        return { success: true };
      }
      console.error("Newsletter subscribe error:", error);
      return { error: "Something went wrong. Please try again." };
    }

    console.log(`Newsletter subscriber added: ${email} (contact: ${data?.id})`);
    return { success: true };
  } catch (err) {
    // Network errors still throw
    console.error("Newsletter subscribe network error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}
