export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CREATE_USER' 
  | 'UPDATE_USER' 
  | 'DELETE_USER' 
  | 'UPDATE_CONFIG' 
  | 'UPDATE_RATE' 
  | 'VALIDATE_ACTIVITY' 
  | 'REJECT_ACTIVITY' 
  | 'GENERATE_STATES' 
  | 'VALIDATE_PAYMENT' 
  | 'SEED_DATA'
  | 'RESET_DATABASE';

export async function logAction(action: AuditAction, details: string, targetId?: string) {
  try {
    const savedUser = localStorage.getItem('ghe_user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    
    await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        details,
        targetId: targetId || null,
        userId: user?.id || 'system',
        userEmail: user?.email || 'system',
        timestamp: new Date().toISOString(),
        ip: 'internal'
      })
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
}
