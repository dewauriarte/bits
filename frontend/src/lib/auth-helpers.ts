/**
 * Helper functions for authentication
 */

/**
 * Get the authentication token from localStorage
 * Handles both teacher (uses 'token') and student (uses 'auth_token') cases
 */
export function getAuthToken(): string | null {
  // Try teacher token first (from authStore)
  const teacherToken = localStorage.getItem('token');
  if (teacherToken) return teacherToken;
  
  // Try student token
  const studentToken = localStorage.getItem('auth_token');
  if (studentToken) return studentToken;
  
  return null;
}

/**
 * Get authorization headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  
  if (!token) {
    console.warn('No authentication token found');
    return {};
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Get session type (teacher, student, anonymous)
 */
export function getSessionType(): string | null {
  return localStorage.getItem('session_type');
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('session_type');
  localStorage.removeItem('user');
}
