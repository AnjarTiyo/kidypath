import { pgClient } from './db';

export interface DbHealthCheck {
  isConnected: boolean;
  error?: string;
  timestamp: Date;
}

/**
 * Check database connection health
 * @returns Promise<DbHealthCheck> - Connection status with optional error
 */
export async function checkDatabaseConnection(): Promise<DbHealthCheck> {
  try {
    // Simple query to test connection using raw postgres client
    await pgClient`SELECT 1 as health_check`;
    
    return {
      isConnected: true,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Database connection error:', error);
    
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date(),
    };
  }
}

/**
 * Check database connection and throw if not connected
 * Use this in Server Components or API routes
 */
export async function ensureDatabaseConnection(): Promise<void> {
  const health = await checkDatabaseConnection();
  
  if (!health.isConnected) {
    throw new Error(`Database connection failed: ${health.error}`);
  }
}
