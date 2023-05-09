import { ConfigTemplate } from "../Config";
import ServerIndex from "../modules/ServerIndex";
import Config from "../Config";

export interface ServerStatus {
    address: string,
    name: string,
    https: boolean
}

export default class Server {
    private deleteTimeout: ReturnType<typeof setTimeout> | null = null;
    private checkTimeout: ReturnType<typeof setTimeout> | null = null;
    private isActive = true;
    private config: ConfigTemplate;
    private dateRegistered: number;
    private deleteTime: number;

    public constructor(
        public readonly address: string,
        public name: string,
        public https: boolean,
        private serverIndex: ServerIndex
    ) {
        this.dateRegistered = Date.now();
        this.config = Config();
        this.deleteTime = this.config.external_server_check_frequency * (this.config.external_server_allowed_fails + 0.5);
        this.setActive();
        this.checkStatus();
    }

    public setActive() {
        if (this.deleteTimeout) clearTimeout(this.deleteTimeout);
        this.deleteTimeout = setTimeout(() => {
            this.delete();
        }, this.deleteTime * 60_000);
    }

    public delete() {
        this.isActive = false;
        if (this.deleteTimeout) clearTimeout(this.deleteTimeout);
        if (this.checkTimeout) clearTimeout(this.checkTimeout);
        console.log("deleting server");
        this.serverIndex.deleteServer(this);
    }

    public setStatus(status: ServerStatus) {
        this.name = status.name;
        this.https = status.https;
        this.setActive();
        this.checkStatus();
    }

    public checkStatus() {
        if (this.checkTimeout) clearTimeout(this.checkTimeout);
        this.checkTimeout = setTimeout(async () => {
            const status = await this.serverIndex.getServerStatus(this.address);
            if (!this.isActive) return;
            if (status) {
                this.setStatus(status);
            }
        }, this.config.external_server_check_frequency * 60_000);
    }

    public toJson() {
        return {
            address: this.address,
            name: this.name,
            https: this.https,
            uptime: Math.floor((Date.now() - this.dateRegistered) / 1000),
            url: `http${this.https ? "s" : ""}://${this.address}`
        }
    }
}