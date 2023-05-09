import { HttpResponse } from "../RestAPI";
import { generateRandomString } from "../Utils";
import Server, { ServerStatus } from "../servers/Server";
import ApiModule from "./ApiModule";
import Axios from "axios";
import Config, { ConfigTemplate } from "../Config";

export default class ServerIndex extends ApiModule {
    private servers: Server[] = [];
    private config: ConfigTemplate;

    constructor() {
        super("servers");

        this.config = Config();

        this.createRoute("get", "index", async requestInfo => {
            return this.servers.map(server => server.toJson());
        });

        this.createRoute("post", "announce", async requestInfo => {
            const address: string = requestInfo.body.address;
            if (!address || typeof address != "string") {
                throw new HttpResponse(400, `Missing address`);
            }
            const status = await this.getServerStatus(address);
            if (!status) {
                throw new HttpResponse(400, `Server '${address}' could not be reached`);
            }

            const identifier = generateRandomString(20);
            const response = generateRandomString(20);

            setTimeout(async () => {
                try {
                    const { data } = await Axios.post(`http${status.https ? "s" : ""}://${address}/v1/registryconnect`, {
                        identifier
                    });
                    if (!data?.response || typeof data.response != "string" || response != data.response) return;
                    this.registerServer(address);
                } catch {}
            }, 5_000);

            return {
                identifier,
                response,
                checkFrequency: this.config.external_server_check_frequency
            };
        });
    }

    public findServer(address: string) {
        return this.servers.find(server => server.address == address) || null;
    }

    public async registerServer(address: string) {

        const status = await this.getServerStatus(address);
        if (!status) {
            const server = this.findServer(address);
            if (server) {
                server.delete();
            }
            return null;
        };

        const existingServer = this.findServer(status.address);
        if (existingServer) {
            existingServer.setStatus(status);
        } else {
            const server = new Server(status.address, status.name, status.https, this);
            this.servers.push(server);
        }
    }

    public async getServerStatus(address: string): Promise<ServerStatus | null> {
        let serverName: string | null = null;
        let isHttps: boolean = false;

        serverName = await this.pingServer("https://" + address);
        if (serverName) {
            isHttps = true;
        } else {
            serverName = await this.pingServer("http://" + address);
        }

        if (!serverName) return null;

        return {
            address,
            name: serverName,
            https: isHttps
        }
    }

    public async pingServer(url: string) {
        try {
            const { data } = await Axios.get(url + "/v1/identify");
            if (!data.response.pipeBombServer) return null;
            const name: string = data.response.name;
            if (typeof name != "string" || !name) return null;
            return name;
        } catch {
            return null;
        }
    }

    public deleteServer(server: Server) {
        const index = this.servers.indexOf(server);
        if (index < 0) return false;
        this.servers.splice(index, 1);
        return true;
    }
}