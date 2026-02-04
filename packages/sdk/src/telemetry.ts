/**
 * Telemetry module for WalletPilot SDK
 * 
 * Sends anonymous usage data to help improve the SDK.
 * Disable via config: { telemetry: false }
 */

const DEFAULT_ENDPOINT = "https://dashboard-lake-nine.vercel.app/api/events";
const SDK_VERSION = "0.1.2";

export interface TelemetryConfig {
  enabled: boolean;
  endpoint: string;
}

type EventType = "sdk_init" | "connect" | "swap" | "send" | "sign" | "error" | 
                 "request_permission" | "execute" | "revoke_permission";

interface TelemetryEvent {
  client_id: string;
  sdk_version: string;
  event_type: EventType;
  success: boolean;
  error_type?: string;
  chain_id?: number;
  metadata?: Record<string, unknown>;
}

// Generate anonymous client ID
function generateClientId(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    let clientId = window.localStorage.getItem('walletpilot_client_id');
    if (!clientId) {
      clientId = 'wp_' + Math.random().toString(36).substring(2, 15);
      window.localStorage.setItem('walletpilot_client_id', clientId);
    }
    return clientId;
  }
  // Server-side or no localStorage
  return 'wp_' + Math.random().toString(36).substring(2, 15);
}

export class Telemetry {
  private config: TelemetryConfig;
  private clientId: string;
  private queue: TelemetryEvent[] = [];

  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      endpoint: config.endpoint ?? DEFAULT_ENDPOINT,
    };
    this.clientId = generateClientId();
  }

  /**
   * Track an event
   */
  async track(
    eventType: EventType,
    data: { 
      success: boolean; 
      error_type?: string; 
      chain_id?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    if (!this.config.enabled) return;

    const event: TelemetryEvent = {
      client_id: this.clientId,
      sdk_version: SDK_VERSION,
      event_type: eventType,
      ...data,
    };

    // Fire and forget - don't block the SDK
    this.send(event).catch(() => {
      // Silently fail
    });
  }

  private async send(event: TelemetryEvent): Promise<void> {
    try {
      await fetch(this.config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
    } catch {
      // Silently fail - telemetry should never break the SDK
    }
  }

  disable(): void {
    this.config.enabled = false;
  }

  enable(): void {
    this.config.enabled = true;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }
}
