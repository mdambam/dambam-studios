// Clean Login Validator for AI Studios

export function validateLogin({ email, password }: { email: string; password: string }) {
  // Check all fields exist
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  // Email must be valid
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.toLowerCase())) {
    throw new Error("Please enter a valid email address.");
  }

  // Password must be at least 6 characters
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  return {
    email: email.toLowerCase(),
    password,
  };
}
