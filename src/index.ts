import RestAPI from "./RestAPI";
import ServerIndex from "./modules/ServerIndex";
import Config from "./Config"

Config();


new ServerIndex();

RestAPI.getInstance().start();