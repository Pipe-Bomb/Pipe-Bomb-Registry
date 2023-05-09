import Express from "express";
import BodyParser from "body-parser";
import ApiModule from "./modules/ApiModule";
import { IncomingHttpHeaders } from "http";
import { ConfigTemplate } from "./Config";
import Config from "./Config";

export class HttpResponse {
    public constructor(
        public readonly statusCode: number,
        public readonly data: string
    ) {}
}


export interface RequestInfo {
    parameters: {
        [key: string]: string;
    };
    body: any,
    endpoint: string,
    headers: IncomingHttpHeaders
}

export default class RestAPI {
    private static instance: RestAPI;

    private app = Express();
    private started = false;
    private config: ConfigTemplate;

    private constructor() {
        this.app.use(BodyParser.json());
        this.config = Config();
    }

    public static getInstance() {
        if (!this.instance) this.instance = new RestAPI();
        return this.instance;
    }

    public start() {
        if (this.started) throw "Rest API has already been started";
        this.started = true;

        this.app.listen(this.config.server_port, () => {
            console.log(`Started Pipe Bomb Registry on http://127.0.0.1:${this.config.server_port}`);
        });
    }

    public registerModule(module: ApiModule) {
        console.log(`*****\n\nRegistered API module '${module.prefix}'`)
    }

    public createRoute(method: "all" | "get" | "post" | "put" | "delete" | "patch" | "options" | "head", route: string, callback: (requestInfo: RequestInfo) => Promise<any>): void {
        this.app[method](route, async (req, res) => {
            const startTime = Date.now();
            try {
                const requestInfo: RequestInfo = {
                    parameters: req.params,
                    body: req.body,
                    endpoint: req.url,
                    headers: req.headers
                };

                const response = await callback(requestInfo);
                if (response instanceof HttpResponse) {
                    res.status(response.statusCode).send({
                        statusCode: response.statusCode,
                        processTime: Date.now() - startTime,
                        data: response.data
                    });
                } else {
                    res.status(200).send({
                        statusCode: 200,
                        processTime: Date.now() - startTime,
                        data: response
                    });
                }
            } catch (response) {
                if (response instanceof HttpResponse) {
                    res.status(response.statusCode).send({
                        statusCode: response.statusCode,
                        processTime: Date.now() - startTime,
                        data: response.data
                    });
                } else {
                    res.status(500).send({
                        statusCode: 200,
                        processTime: Date.now() - startTime,
                        data: "Internal server error"
                    });
                }
            }
        });
    }
}