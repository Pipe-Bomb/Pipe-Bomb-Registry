import RestAPI, { RequestInfo } from "../RestAPI";

export default class ApiModule {
    protected constructor(
        public readonly prefix: string
    ) {
        RestAPI.getInstance().registerModule(this);
    }

    protected createRoute(method: "all" | "get" | "post" | "put" | "delete" | "patch" | "options" | "head", route: string, callback: (requestInfo: RequestInfo) => Promise<any>): void {
        RestAPI.getInstance().createRoute(method, `/${this.prefix}/${route}`, callback);
    }
}