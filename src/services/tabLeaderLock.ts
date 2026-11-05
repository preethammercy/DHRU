// DHRU.AI - Multi-Tab Leader Lock Service (Phase 4.5)
// Ensures only ONE browser tab executes trade orders or coordinates
// with the backend engine. Other tabs operate in read-only observation mode.

const LEASE_KEY = 'dhru_tab_leader_lease';
const LEASE_DURATION_MS = 5000; // 5-second lease
const HEARTBEAT_INTERVAL_MS = 2000;

export class TabLeaderLock {
  private tabId: string;
  private channel: BroadcastChannel | null = null;
  private isLeaderTab: boolean = false;
  private heartbeatTimer: any = null;
  private listeners: Set<(isLeader: boolean) => void> = new Set();

  constructor() {
    this.tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('dhru_tab_leader');
        this.channel.onmessage = this.handleChannelMessage.bind(this);
      } catch {
        this.channel = null;
      }
    }
  }

  public start() {
    if (typeof window === 'undefined') return;
    this.tryClaimLeadership();
    this.heartbeatTimer = setInterval(() => {
      if (this.isLeaderTab) {
        this.renewLease();
      } else {
        this.tryClaimLeadership();
      }
    }, HEARTBEAT_INTERVAL_MS);

    window.addEventListener('beforeunload', () => {
      if (this.isLeaderTab) {
        this.releaseLeadership();
      }
    });
  }

  public stop() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.isLeaderTab) this.releaseLeadership();
    this.channel?.close();
  }

  public isLeader(): boolean {
    return this.isLeaderTab;
  }

  public onLeadershipChange(cb: (isLeader: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(this.isLeaderTab);
    return () => this.listeners.delete(cb);
  }

  private tryClaimLeadership() {
    try {
      const current = localStorage.getItem(LEASE_KEY);
      const now = Date.now();
      if (!current) {
        this.claimLeadership();
        return;
      }

      const parsed = JSON.parse(current);
      if (parsed.tabId === this.tabId) {
        this.renewLease();
        return;
      }

      if (now > parsed.expiresAt) {
        // Expired lease, claim it
        this.claimLeadership();
      } else {
        // Another tab holds valid lease
        this.setLeadership(false);
      }
    } catch {
      this.claimLeadership();
    }
  }

  private claimLeadership() {
    const expiresAt = Date.now() + LEASE_DURATION_MS;
    localStorage.setItem(LEASE_KEY, JSON.stringify({ tabId: this.tabId, expiresAt }));
    this.setLeadership(true);
    this.channel?.postMessage({ type: 'LEADER_CLAIMED', tabId: this.tabId });
  }

  private renewLease() {
    const expiresAt = Date.now() + LEASE_DURATION_MS;
    localStorage.setItem(LEASE_KEY, JSON.stringify({ tabId: this.tabId, expiresAt }));
  }

  private releaseLeadership() {
    localStorage.removeItem(LEASE_KEY);
    this.channel?.postMessage({ type: 'LEADER_RELEASED', tabId: this.tabId });
    this.setLeadership(false);
  }

  private setLeadership(status: boolean) {
    if (this.isLeaderTab !== status) {
      this.isLeaderTab = status;
      for (const listener of this.listeners) {
        try {
          listener(status);
        } catch {}
      }
    }
  }

  private handleChannelMessage(event: MessageEvent) {
    const data = event.data;
    if (!data) return;
    if (data.type === 'LEADER_CLAIMED' && data.tabId !== this.tabId) {
      this.setLeadership(false);
    } else if (data.type === 'LEADER_RELEASED') {
      this.tryClaimLeadership();
    }
  }
}

export const tabLeaderLock = new TabLeaderLock();
if (typeof window !== 'undefined') {
  tabLeaderLock.start();
}
