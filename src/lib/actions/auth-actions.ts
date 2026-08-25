'use server';

import { db } from '@/lib/db';
import { signJWT, setSessionCookie, clearSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const remember = formData.get('remember') === 'true';

  if (!email || !password) {
    return { error: 'Please fill in all fields' };
  }

  try {
    // Find user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || user.status === 'INACTIVE') {
      return { error: 'Invalid credentials or inactive account' };
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { error: 'Invalid credentials' };
    }

    // Sign JWT
    const sessionPayload = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
      employeeId: user.employeeId,
    };

    const token = await signJWT(sessionPayload, remember);

    // Set cookie
    await setSessionCookie(token, remember);

    return { success: true, role: user.role };
  } catch (error) {
    console.error('Login action error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  return { success: true };
}

export async function forgotPasswordAction(email: string) {
  if (!email) {
    return { error: 'Email is required' };
  }

  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return { error: 'No account found with this email' };
    }

    // In a real app, send password reset link here
    console.log(`Password reset link requested for: ${email}`);
    return { success: 'Reset instructions have been sent to your email.' };
  } catch (error) {
    return { error: 'Failed to process request.' };
  }
}
